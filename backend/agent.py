"""
Débora.ai — Agente Autônomo de Atendimento (SDR + Closer)

Este módulo implementa um agente que conduz o lead do primeiro contato até a venda
SEM intervenção humana:

  abordagem -> qualificacao -> apresentacao -> visita -> proposta -> negociacao -> fechamento

O agente decide sozinho o que fazer usando function calling da OpenAI. Ele não só
responde mensagens: ele OPERA o sistema (busca imóvel no inventário, agenda visita,
cria/avança negócio no CRM, envia proposta, aplica desconto dentro do limite,
registra objeção, agenda follow-up e escala para humano quando precisa).

Arquitetura: o backend é stateless em relação ao CRM. O frontend envia um snapshot
(lead + inventário + conversa) e recebe de volta { mensagens, acoes, estado }.
As ações são então aplicadas nas stores do frontend / Firestore. Isso evita
duplicar a base de dados aqui e mantém o agente plugável em qualquer canal
(WhatsApp, Instagram, site, telefone).
"""

from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel, ConfigDict, Field

logger = logging.getLogger("debora.agent")

router = APIRouter(prefix="/agent", tags=["agente-autonomo"])

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL = os.environ.get("OPENAI_AGENT_MODEL") or os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

# Quantas rodadas de ferramenta o agente pode encadear em um único turno antes
# de ser obrigado a falar com o lead. Evita loop infinito e custo descontrolado.
MAX_TOOL_ROUNDS = 6


# =============================================================================
# Modelos
# =============================================================================

STAGES = [
    "abordagem",
    "qualificacao",
    "apresentacao",
    "visita",
    "proposta",
    "negociacao",
    "fechamento",
    "perdido",
    "humano",
]

Stage = Literal[
    "abordagem", "qualificacao", "apresentacao", "visita",
    "proposta", "negociacao", "fechamento", "perdido", "humano",
]


class AgentConfig(BaseModel):
    """Configuração comercial do agente — controlada pelo gestor na tela de Atendimento."""
    model_config = ConfigDict(extra="ignore")

    nome: str = "Débora"
    empresa: str = "Prime Imóveis"
    persona: str = (
        "Consultora imobiliária sênior, cordial e objetiva. Fala como gente, "
        "não como robô. Usa português do Brasil informal-profissional."
    )
    tom: Literal["cordial", "consultivo", "direto", "premium"] = "consultivo"
    agressividade: int = 3  # 1 = paciente ... 5 = pressiona fechamento
    autonomia: Literal["sugerir", "semi", "total"] = "total"
    desconto_max_pct: float = 5.0
    ticket_max_autonomo: float = 2_000_000.0
    horario_inicio: int = 8
    horario_fim: int = 21
    followups_max: int = 5
    intervalo_followup_horas: int = 20
    escalar_se: List[str] = Field(
        default_factory=lambda: [
            "cliente pede falar com humano",
            "pedido de desconto acima do limite",
            "reclamação ou risco jurídico",
            "permuta ou condição fora do padrão",
        ]
    )
    mensagem_abertura: str = ""
    conhecimento: str = ""  # base de conhecimento livre: condições, comissões, diferenciais


class LeadCtx(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nome: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    origem: Optional[str] = None
    interesse: Optional[str] = None
    orcamento: Optional[float] = None
    score: Optional[int] = None
    observacoes: Optional[str] = None


class PropertyCtx(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    codigo: Optional[str] = None
    titulo: str
    tipo: Optional[str] = None
    finalidade: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    quartos: Optional[int] = None
    banheiros: Optional[int] = None
    area: Optional[float] = None
    preco: Optional[float] = None
    status: Optional[str] = None


class Msg(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: Literal["lead", "agente", "sistema"]
    text: str
    at: Optional[str] = None


class AgentState(BaseModel):
    """Memória de trabalho do agente para uma conversa."""
    model_config = ConfigDict(extra="ignore")
    stage: Stage = "abordagem"
    qualificacao: Dict[str, Any] = Field(default_factory=dict)
    imoveis_apresentados: List[str] = Field(default_factory=list)
    objecoes: List[Dict[str, Any]] = Field(default_factory=list)
    proposta: Optional[Dict[str, Any]] = None
    visita: Optional[Dict[str, Any]] = None
    desconto_aplicado: float = 0.0
    followups: int = 0
    proximo_followup: Optional[str] = None
    encerrada: bool = False
    motivo_encerramento: Optional[str] = None


class TurnRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    conversation_id: Optional[str] = None
    config: AgentConfig = Field(default_factory=AgentConfig)
    lead: LeadCtx
    inventory: List[PropertyCtx] = Field(default_factory=list)
    history: List[Msg] = Field(default_factory=list)
    state: AgentState = Field(default_factory=AgentState)
    # "inbound"  -> o lead mandou mensagem (última de history)
    # "outbound" -> o agente inicia o contato sozinho
    # "followup" -> cadência automática, o lead ficou em silêncio
    mode: Literal["inbound", "outbound", "followup"] = "inbound"


class AgentAction(BaseModel):
    """Ação executada pelo agente — o frontend aplica no CRM."""
    tipo: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    resumo: str
    at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TurnResponse(BaseModel):
    conversation_id: str
    messages: List[str]
    actions: List[AgentAction]
    state: AgentState
    handoff: bool = False
    handoff_reason: Optional[str] = None


# =============================================================================
# Ferramentas expostas ao modelo
# =============================================================================

TOOLS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "buscar_imoveis",
            "description": (
                "Busca imóveis no inventário da corretora que casem com o perfil do lead. "
                "Use ANTES de apresentar qualquer opção — nunca invente imóvel."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "bairro": {"type": "string", "description": "Bairro ou região desejada"},
                    "tipo": {"type": "string", "description": "Apartamento, Casa, Cobertura, Terreno, Sala Comercial"},
                    "quartos_min": {"type": "integer"},
                    "orcamento_max": {"type": "number"},
                    "finalidade": {"type": "string", "enum": ["Venda", "Locação"]},
                    "limite": {"type": "integer", "default": 3},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "salvar_qualificacao",
            "description": "Registra os dados de qualificação coletados do lead (BANT adaptado ao imobiliário).",
            "parameters": {
                "type": "object",
                "properties": {
                    "orcamento": {"type": "number"},
                    "finalidade": {"type": "string", "description": "moradia, investimento ou locação"},
                    "regiao": {"type": "string"},
                    "tipo_imovel": {"type": "string"},
                    "quartos": {"type": "integer"},
                    "prazo": {"type": "string", "description": "Ex.: imediato, 3 meses, 1 ano"},
                    "pagamento": {"type": "string", "description": "à vista, financiamento, FGTS, permuta"},
                    "decisor": {"type": "boolean", "description": "O lead decide sozinho?"},
                    "urgencia": {"type": "string", "enum": ["baixa", "media", "alta"]},
                    "score": {"type": "integer", "description": "0 a 100, quão pronto para comprar"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "agendar_visita",
            "description": "Agenda visita ao imóvel na agenda da corretora. Só use com data e horário confirmados pelo lead.",
            "parameters": {
                "type": "object",
                "properties": {
                    "imovel_id": {"type": "string"},
                    "data_iso": {"type": "string", "description": "Data e hora ISO 8601"},
                    "duracao_min": {"type": "integer", "default": 60},
                    "observacao": {"type": "string"},
                },
                "required": ["imovel_id", "data_iso"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "enviar_proposta",
            "description": "Registra e envia uma proposta comercial formal para o lead.",
            "parameters": {
                "type": "object",
                "properties": {
                    "imovel_id": {"type": "string"},
                    "valor": {"type": "number"},
                    "entrada": {"type": "number"},
                    "condicoes": {"type": "string"},
                    "validade_dias": {"type": "integer", "default": 3},
                },
                "required": ["imovel_id", "valor"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "aplicar_desconto",
            "description": (
                "Concede desconto na negociação. O sistema bloqueia automaticamente "
                "se passar do limite autorizado e escala para um humano."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "percentual": {"type": "number"},
                    "justificativa": {"type": "string"},
                },
                "required": ["percentual", "justificativa"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "registrar_objecao",
            "description": "Registra uma objeção do lead para análise posterior e ajuste de abordagem.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo": {
                        "type": "string",
                        "enum": ["preco", "localizacao", "timing", "financiamento", "concorrencia", "confianca", "outro"],
                    },
                    "detalhe": {"type": "string"},
                },
                "required": ["tipo", "detalhe"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "mover_etapa",
            "description": "Move a negociação para outra etapa do funil do CRM.",
            "parameters": {
                "type": "object",
                "properties": {
                    "etapa": {"type": "string", "enum": STAGES},
                    "motivo": {"type": "string"},
                },
                "required": ["etapa"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fechar_venda",
            "description": "Fecha a venda. Use somente quando o lead confirmou explicitamente que quer comprar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "imovel_id": {"type": "string"},
                    "valor_final": {"type": "number"},
                    "forma_pagamento": {"type": "string"},
                    "proximo_passo": {"type": "string", "description": "Documentação, assinatura, sinal etc."},
                },
                "required": ["imovel_id", "valor_final"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "agendar_followup",
            "description": "Programa um retorno automático caso o lead não responda.",
            "parameters": {
                "type": "object",
                "properties": {
                    "em_horas": {"type": "number"},
                    "objetivo": {"type": "string"},
                },
                "required": ["em_horas"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "escalar_humano",
            "description": "Transfere a conversa para um corretor humano e para de responder automaticamente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "motivo": {"type": "string"},
                    "urgencia": {"type": "string", "enum": ["baixa", "media", "alta"]},
                    "resumo": {"type": "string", "description": "Briefing do que já aconteceu, para o humano assumir sem ler tudo"},
                },
                "required": ["motivo"],
            },
        },
    },
]


# =============================================================================
# Execução das ferramentas (lado servidor, determinístico)
# =============================================================================

def _match_properties(inventory: List[PropertyCtx], args: Dict[str, Any]) -> List[Dict[str, Any]]:
    bairro = (args.get("bairro") or "").strip().lower()
    tipo = (args.get("tipo") or "").strip().lower()
    quartos_min = args.get("quartos_min")
    teto = args.get("orcamento_max")
    finalidade = (args.get("finalidade") or "").strip().lower()
    limite = int(args.get("limite") or 3)

    def score(p: PropertyCtx) -> float:
        s = 0.0
        if bairro and p.bairro and bairro in p.bairro.lower():
            s += 3
        if tipo and p.tipo and tipo in p.tipo.lower():
            s += 2
        if finalidade and p.finalidade and finalidade in p.finalidade.lower():
            s += 1.5
        if quartos_min and (p.quartos or 0) >= quartos_min:
            s += 1.5
        if teto and p.preco:
            if p.preco <= teto:
                s += 2.5
            elif p.preco <= teto * 1.12:  # esticou um pouco, ainda vale mostrar
                s += 0.8
            else:
                s -= 2
        if (p.status or "").lower() == "disponível":
            s += 1
        else:
            s -= 3
        return s

    ranked = sorted(inventory, key=score, reverse=True)
    out = []
    for p in ranked[: max(1, limite)]:
        if score(p) <= -1:
            continue
        out.append({
            "id": p.id,
            "codigo": p.codigo,
            "titulo": p.titulo,
            "tipo": p.tipo,
            "bairro": p.bairro,
            "quartos": p.quartos,
            "area": p.area,
            "preco": p.preco,
            "status": p.status,
        })
    return out


def _run_tool(name: str, args: Dict[str, Any], req: TurnRequest, state: AgentState,
              actions: List[AgentAction]) -> Dict[str, Any]:
    """Executa a ferramenta, aplica guardrails e devolve o resultado ao modelo."""
    cfg = req.config
    now = datetime.now(timezone.utc)

    def act(tipo: str, resumo: str, payload: Dict[str, Any]) -> None:
        actions.append(AgentAction(tipo=tipo, resumo=resumo, payload=payload))

    if name == "buscar_imoveis":
        found = _match_properties(req.inventory, args)
        act("busca_imovel", f"Buscou no inventário: {len(found)} opção(ões) compatível(is)",
            {"filtros": args, "resultados": found})
        if not found:
            return {"ok": False, "imoveis": [], "aviso": "Nenhum imóvel compatível. Amplie região ou orçamento com o lead."}
        state.imoveis_apresentados = list({*state.imoveis_apresentados, *[f["id"] for f in found]})
        return {"ok": True, "imoveis": found}

    if name == "salvar_qualificacao":
        state.qualificacao.update({k: v for k, v in args.items() if v is not None})
        if state.stage in ("abordagem", "qualificacao"):
            state.stage = "apresentacao" if len(state.qualificacao) >= 3 else "qualificacao"
        act("qualificacao", "Qualificou o lead e atualizou o cadastro", dict(state.qualificacao))
        return {"ok": True, "qualificacao": state.qualificacao, "etapa": state.stage}

    if name == "agendar_visita":
        state.visita = {"imovel_id": args["imovel_id"], "data": args["data_iso"],
                        "duracao": args.get("duracao_min", 60), "observacao": args.get("observacao")}
        state.stage = "visita"
        act("agendar_visita", f"Agendou visita para {args['data_iso']}", state.visita)
        return {"ok": True, "confirmado": True, "visita": state.visita}

    if name == "enviar_proposta":
        valor = float(args["valor"])
        if valor > cfg.ticket_max_autonomo:
            state.stage = "humano"
            act("escalonamento", "Proposta acima do teto autônomo — transferida para humano",
                {"valor": valor, "teto": cfg.ticket_max_autonomo})
            return {"ok": False, "bloqueado": True,
                    "motivo": f"Valor acima do teto autônomo (R$ {cfg.ticket_max_autonomo:,.0f}). Escale para um corretor."}
        state.proposta = {"imovel_id": args["imovel_id"], "valor": valor,
                          "entrada": args.get("entrada"), "condicoes": args.get("condicoes"),
                          "validade_dias": args.get("validade_dias", 3),
                          "enviada_em": now.isoformat()}
        state.stage = "proposta"
        act("proposta", f"Enviou proposta de R$ {valor:,.0f}", state.proposta)
        return {"ok": True, "proposta": state.proposta}

    if name == "aplicar_desconto":
        pct = float(args["percentual"])
        if pct > cfg.desconto_max_pct:
            state.stage = "humano"
            act("escalonamento", f"Desconto de {pct}% excede o limite de {cfg.desconto_max_pct}%",
                {"solicitado": pct, "limite": cfg.desconto_max_pct, "justificativa": args.get("justificativa")})
            return {"ok": False, "bloqueado": True,
                    "motivo": f"Desconto máximo autorizado é {cfg.desconto_max_pct}%. "
                              f"Não prometa {pct}%. Ofereça o limite ou escale para o gestor."}
        state.desconto_aplicado = pct
        if state.proposta:
            base = state.proposta["valor"]
            state.proposta["valor"] = round(base * (1 - pct / 100), 2)
            state.proposta["desconto_pct"] = pct
        state.stage = "negociacao"
        act("desconto", f"Aplicou {pct}% de desconto", {"percentual": pct, "justificativa": args.get("justificativa"),
                                                        "proposta": state.proposta})
        return {"ok": True, "desconto_pct": pct, "proposta": state.proposta}

    if name == "registrar_objecao":
        obj = {"tipo": args["tipo"], "detalhe": args["detalhe"], "at": now.isoformat()}
        state.objecoes.append(obj)
        act("objecao", f"Objeção registrada ({args['tipo']})", obj)
        return {"ok": True}

    if name == "mover_etapa":
        etapa = args["etapa"]
        if etapa not in STAGES:
            return {"ok": False, "motivo": "Etapa inválida"}
        state.stage = etapa
        act("mover_etapa", f"Moveu o negócio para '{etapa}'", {"etapa": etapa, "motivo": args.get("motivo")})
        return {"ok": True, "etapa": etapa}

    if name == "fechar_venda":
        valor = float(args["valor_final"])
        if valor > cfg.ticket_max_autonomo:
            state.stage = "humano"
            act("escalonamento", "Fechamento acima do teto autônomo", {"valor": valor})
            return {"ok": False, "bloqueado": True, "motivo": "Fechamento acima do teto. Escale para um corretor."}
        state.stage = "fechamento"
        state.encerrada = True
        state.motivo_encerramento = "venda"
        payload = {"imovel_id": args["imovel_id"], "valor_final": valor,
                   "forma_pagamento": args.get("forma_pagamento"),
                   "proximo_passo": args.get("proximo_passo"), "fechada_em": now.isoformat()}
        act("venda", f"VENDA FECHADA — R$ {valor:,.0f}", payload)
        return {"ok": True, "venda": payload}

    if name == "agendar_followup":
        horas = float(args["em_horas"])
        state.proximo_followup = (now + timedelta(hours=horas)).isoformat()
        act("followup_agendado", f"Follow-up automático em {horas:g}h",
            {"em_horas": horas, "quando": state.proximo_followup, "objetivo": args.get("objetivo")})
        return {"ok": True, "quando": state.proximo_followup}

    if name == "escalar_humano":
        state.stage = "humano"
        state.encerrada = True
        state.motivo_encerramento = "handoff"
        payload = {"motivo": args["motivo"], "urgencia": args.get("urgencia", "media"),
                   "resumo": args.get("resumo", "")}
        act("escalonamento", f"Transferiu para humano: {args['motivo']}", payload)
        return {"ok": True, "transferido": True}

    return {"ok": False, "motivo": f"Ferramenta desconhecida: {name}"}


# =============================================================================
# Prompt
# =============================================================================

def _system_prompt(req: TurnRequest) -> str:
    cfg, lead, st = req.config, req.lead, req.state
    tom = {
        "cordial": "caloroso e acolhedor",
        "consultivo": "consultivo — pergunta antes de oferecer, mostra domínio técnico",
        "direto": "direto ao ponto, sem rodeios",
        "premium": "sofisticado e discreto, padrão alto padrão",
    }[cfg.tom]
    pressao = {
        1: "Seja paciente. Nunca pressione. Respeite o tempo do lead.",
        2: "Conduza com calma, mas sempre proponha um próximo passo.",
        3: "Conduza a conversa. Sempre termine com uma pergunta ou convite de avanço.",
        4: "Busque o avanço ativamente. Crie senso de oportunidade real (não invente escassez falsa).",
        5: "Vá para o fechamento rápido. Proponha visita/proposta logo nas primeiras trocas.",
    }[max(1, min(5, cfg.agressividade))]

    inv = f"{len(req.inventory)} imóveis disponíveis no inventário (use buscar_imoveis para consultar)"

    return f"""Você é {cfg.nome}, consultora de vendas da {cfg.empresa}. {cfg.persona}

Você atende sozinha, do primeiro contato até o fechamento. Não existe humano te supervisionando
em tempo real — você decide e executa. Você tem ferramentas que mexem de verdade no sistema
da corretora (inventário, agenda, CRM, propostas). Use-as; não descreva a ação, EXECUTE.

## Tom e condução
- Tom: {tom}.
- {pressao}
- Português do Brasil. Mensagens curtas, de 1 a 4 linhas, como WhatsApp real.
- Uma pergunta por vez. Nunca mande questionário.
- No máximo 1 emoji, e só quando couber.
- Nunca diga que é uma IA, a menos que perguntem diretamente — aí seja honesta e siga ajudando.

## Playbook (etapa atual: {st.stage})
1. abordagem — quebre o gelo, cite a origem do lead, gere contexto e faça 1 pergunta aberta.
2. qualificacao — descubra orçamento, região, tipo, prazo, forma de pagamento e se ele decide.
   Chame salvar_qualificacao assim que tiver as informações.
3. apresentacao — chame buscar_imoveis e apresente no MÁXIMO 2 opções, com o porquê de cada uma.
4. visita — o objetivo real dessa etapa é marcar visita. Ofereça 2 janelas concretas de horário.
   Confirmou? chame agendar_visita.
5. proposta — chame enviar_proposta com valor e condições.
6. negociacao — trate objeção com pergunta, não com desconto. Desconto é o último recurso e no
   máximo {cfg.desconto_max_pct}% (aplicar_desconto bloqueia acima disso).
7. fechamento — confirmação explícita do lead => chame fechar_venda.

## Regras invioláveis
- NUNCA invente imóvel, preço, metragem ou disponibilidade. Só o que vier de buscar_imoveis.
- NUNCA prometa desconto, condição ou prazo que as ferramentas recusarem.
- Se a ferramenta devolver bloqueado=true, NÃO prometa aquilo ao lead. Ofereça o que é permitido
  ou chame escalar_humano.
- Escale para humano quando: {", ".join(cfg.escalar_se)}.
- Se o lead pedir para parar de receber mensagens, encerre educadamente e chame mover_etapa("perdido").
- Horário de contato permitido: {cfg.horario_inicio}h às {cfg.horario_fim}h.
- Sempre que o lead não responder, chame agendar_followup (limite de {cfg.followups_max} tentativas).

## Contexto do lead
Nome: {lead.nome} | Origem: {lead.origem or "—"} | Interesse declarado: {lead.interesse or "—"}
Orçamento informado: {f"R$ {lead.orcamento:,.0f}" if lead.orcamento else "não informado"} | Score: {lead.score or "—"}
Observações: {lead.observacoes or "—"}
Qualificação já coletada: {json.dumps(st.qualificacao, ensure_ascii=False) or "{}"}
Objeções já registradas: {json.dumps(st.objecoes, ensure_ascii=False)}
Proposta ativa: {json.dumps(st.proposta, ensure_ascii=False) if st.proposta else "nenhuma"}
Visita agendada: {json.dumps(st.visita, ensure_ascii=False) if st.visita else "nenhuma"}
Tentativas de follow-up já feitas: {st.followups}/{cfg.followups_max}

## Inventário
{inv}

## Conhecimento da empresa
{cfg.conhecimento or "— sem observações adicionais —"}

Responda SEMPRE com a mensagem final destinada ao lead (texto puro, sem markdown, sem aspas).
"""


def _mode_instruction(req: TurnRequest) -> str:
    if req.mode == "outbound":
        base = (f"Inicie o contato do zero com {req.lead.nome}. O lead chegou via "
                f"{req.lead.origem or 'formulário'} e demonstrou interesse em "
                f"{req.lead.interesse or 'imóveis'}. Escreva a primeira mensagem e já agende um "
                f"follow-up automático caso ele não responda.")
        if req.config.mensagem_abertura:
            base += f"\nModelo de abertura preferido da empresa (adapte, não copie ao pé da letra):\n{req.config.mensagem_abertura}"
        return base
    if req.mode == "followup":
        return (f"O lead não respondeu sua última mensagem. Esta é a tentativa "
                f"{req.state.followups + 1} de {req.config.followups_max}. Mande um follow-up curto, "
                f"com ângulo NOVO (não repita a mensagem anterior) e uma pergunta fácil de responder. "
                f"Se já estiver na última tentativa, faça um encerramento elegante deixando a porta aberta.")
    return "Responda à última mensagem do lead conduzindo para a próxima etapa do playbook."


# =============================================================================
# Loop do agente
# =============================================================================

def _client() -> AsyncOpenAI:
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503,
                            detail="OPENAI_API_KEY não configurada — o agente autônomo está desligado.")
    return AsyncOpenAI(api_key=OPENAI_API_KEY)


async def run_agent_turn(req: TurnRequest) -> TurnResponse:
    client = _client()
    state = req.state.model_copy(deep=True)
    actions: List[AgentAction] = []
    messages_out: List[str] = []

    role_map = {"lead": "user", "agente": "assistant", "sistema": "system"}
    convo: List[Dict[str, Any]] = [{"role": "system", "content": _system_prompt(req)}]
    for m in req.history[-30:]:
        convo.append({"role": role_map.get(m.role, "user"), "content": m.text})
    convo.append({"role": "system", "content": _mode_instruction(req)})

    for _ in range(MAX_TOOL_ROUNDS):
        try:
            completion = await client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=convo,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.6,
            )
        except Exception as e:  # noqa: BLE001
            logger.exception("Falha na chamada do agente")
            raise HTTPException(status_code=502, detail=f"Falha no agente: {e}") from e

        choice = completion.choices[0].message
        calls = choice.tool_calls or []

        if not calls:
            if choice.content:
                messages_out.append(choice.content.strip())
            break

        convo.append({
            "role": "assistant",
            "content": choice.content or "",
            "tool_calls": [
                {"id": c.id, "type": "function",
                 "function": {"name": c.function.name, "arguments": c.function.arguments}}
                for c in calls
            ],
        })

        for call in calls:
            try:
                args = json.loads(call.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}
            result = _run_tool(call.function.name, args, req, state, actions)
            convo.append({"role": "tool", "tool_call_id": call.id,
                          "content": json.dumps(result, ensure_ascii=False, default=str)})

        if state.encerrada and state.motivo_encerramento == "handoff":
            # Ainda deixamos o modelo escrever a mensagem de despedida/transferência.
            convo.append({"role": "system",
                          "content": "Avise o lead, em uma frase, que um especialista assume a conversa agora."})

    if not messages_out:
        # O modelo gastou todas as rodadas em ferramentas: força uma resposta ao lead.
        convo.append({"role": "system", "content": "Agora escreva APENAS a mensagem para o lead."})
        final = await client.chat.completions.create(model=OPENAI_MODEL, messages=convo, temperature=0.6)
        content = final.choices[0].message.content
        if content:
            messages_out.append(content.strip())

    if req.mode == "followup":
        state.followups += 1

    for text in messages_out:
        actions.append(AgentAction(tipo="mensagem", resumo="Mensagem enviada ao lead", payload={"text": text}))

    return TurnResponse(
        conversation_id=req.conversation_id or f"conv_{uuid.uuid4().hex[:8]}",
        messages=messages_out,
        actions=actions,
        state=state,
        handoff=state.stage == "humano",
        handoff_reason=next((a.payload.get("motivo") for a in actions if a.tipo == "escalonamento"), None),
    )


# =============================================================================
# Simulador de lead — permite testar o agente ponta a ponta sem cliente real
# =============================================================================

class SimulateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    perfil: str = "Comprador interessado, orçamento apertado, faz objeção de preço mas fecha se for bem conduzido."
    dificuldade: Literal["facil", "medio", "dificil"] = "medio"
    history: List[Msg] = Field(default_factory=list)
    lead: LeadCtx


@router.post("/simulate-lead")
async def simulate_lead(req: SimulateRequest):
    """Gera a próxima resposta de um lead fictício. Usado no simulador da tela de Atendimento."""
    client = _client()
    nivel = {
        "facil": "Você é receptivo, responde rápido e avança fácil no funil.",
        "medio": "Você tem interesse real, mas faz de 1 a 2 objeções antes de avançar.",
        "dificil": "Você é cético, evasivo, compara com concorrentes e só avança com muito valor percebido.",
    }[req.dificuldade]

    system = (
        f"Você está interpretando {req.lead.nome}, um lead de uma corretora de imóveis no Brasil. "
        f"Perfil: {req.perfil} {nivel} "
        "Responda como pessoa real no WhatsApp: mensagens curtas, informais, às vezes com erro de digitação. "
        "Nunca saia do personagem e nunca escreva como vendedor. Só a mensagem, sem aspas."
    )
    convo = [{"role": "system", "content": system}]
    for m in req.history[-20:]:
        convo.append({"role": "assistant" if m.role == "lead" else "user", "content": m.text})

    try:
        out = await client.chat.completions.create(model=OPENAI_MODEL, messages=convo, temperature=0.9)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Falha no simulador: {e}") from e
    return {"text": (out.choices[0].message.content or "").strip()}


# =============================================================================
# Endpoints
# =============================================================================

@router.get("/health")
async def agent_health():
    return {"online": bool(OPENAI_API_KEY), "model": OPENAI_MODEL, "stages": STAGES,
            "tools": [t["function"]["name"] for t in TOOLS]}


@router.post("/turn", response_model=TurnResponse)
async def agent_turn(req: TurnRequest):
    """Turno genérico do agente (inbound, outbound ou followup)."""
    return await run_agent_turn(req)


@router.post("/start", response_model=TurnResponse)
async def agent_start(req: TurnRequest):
    """O agente aborda o lead por conta própria (primeiro contato)."""
    req.mode = "outbound"
    return await run_agent_turn(req)


@router.post("/reply", response_model=TurnResponse)
async def agent_reply(req: TurnRequest):
    """O lead respondeu — o agente conduz o próximo passo."""
    req.mode = "inbound"
    return await run_agent_turn(req)


@router.post("/followup", response_model=TurnResponse)
async def agent_followup(req: TurnRequest):
    """Cadência automática: o lead ficou em silêncio."""
    if req.state.followups >= req.config.followups_max:
        raise HTTPException(status_code=409, detail="Limite de follow-ups atingido para esta conversa.")
    req.mode = "followup"
    return await run_agent_turn(req)
