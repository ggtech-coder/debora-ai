/**
 * Cliente do Agente Autônomo (backend FastAPI).
 *
 * O backend usa snake_case/português; o frontend usa o formato das stores.
 * Todo o de-para fica aqui, isolado, para que a tela e o motor local
 * enxerguem exatamente a mesma interface.
 */

import axios from "axios";

const BASE = `${process.env.REACT_APP_BACKEND_URL || ""}/api/agent`;

const http = axios.create({ timeout: 90000 });

/* ---------- de-para ---------- */

const toApiConfig = (c = {}) => ({
  nome: c.nome,
  empresa: c.empresa,
  persona: c.persona,
  tom: c.tom,
  agressividade: c.agressividade,
  autonomia: c.autonomia,
  desconto_max_pct: c.descontoMaxPct,
  ticket_max_autonomo: c.ticketMaxAutonomo,
  horario_inicio: c.horarioInicio,
  horario_fim: c.horarioFim,
  followups_max: c.followupsMax,
  intervalo_followup_horas: c.intervaloFollowupHoras,
  escalar_se: c.escalarSe,
  mensagem_abertura: c.mensagemAbertura,
  conhecimento: c.conhecimento,
});

const toApiLead = (l = {}) => ({
  id: l.id,
  nome: l.name,
  telefone: l.phone,
  email: l.email,
  origem: l.origin,
  interesse: l.interest,
  orcamento: l.budget,
  score: l.score,
  observacoes: l.notes,
});

const toApiProperty = (p = {}) => ({
  id: p.id,
  codigo: p.code,
  titulo: p.title,
  tipo: p.type,
  finalidade: p.purpose,
  bairro: p.neighborhood,
  cidade: p.city,
  quartos: p.bedrooms,
  banheiros: p.bathrooms,
  area: p.area,
  preco: p.price,
  status: p.status,
});

const toApiState = (s = {}) => ({
  stage: s.stage,
  qualificacao: s.qualificacao || {},
  imoveis_apresentados: s.imoveisApresentados || [],
  objecoes: s.objecoes || [],
  proposta: s.proposta,
  visita: s.visita,
  desconto_aplicado: s.descontoAplicado || 0,
  followups: s.followups || 0,
  proximo_followup: s.proximoFollowup,
  encerrada: !!s.encerrada,
  motivo_encerramento: s.motivoEncerramento,
});

const fromApiState = (s = {}) => ({
  stage: s.stage,
  qualificacao: s.qualificacao || {},
  imoveisApresentados: s.imoveis_apresentados || [],
  objecoes: s.objecoes || [],
  proposta: s.proposta || null,
  visita: s.visita || null,
  descontoAplicado: s.desconto_aplicado || 0,
  followups: s.followups || 0,
  proximoFollowup: s.proximo_followup || null,
  encerrada: !!s.encerrada,
  motivoEncerramento: s.motivo_encerramento || null,
});

const fromApiAction = (a = {}) => ({
  id: `act_${Math.random().toString(36).slice(2, 9)}`,
  tipo: a.tipo,
  resumo: a.resumo,
  payload: a.payload || {},
  at: a.at || new Date().toISOString(),
});

const buildPayload = ({ conversationId, config, lead, inventory, history, state }) => ({
  conversation_id: conversationId,
  config: toApiConfig(config),
  lead: toApiLead(lead),
  inventory: (inventory || []).map(toApiProperty),
  history: (history || []).map((m) => ({ role: m.role, text: m.text, at: m.at })),
  state: toApiState(state),
});

/* ---------- chamadas ---------- */

export const agentHealth = async () => {
  const { data } = await http.get(`${BASE}/health`, { timeout: 6000 });
  return data; // { online, model, stages, tools }
};

const call = async (path, ctx) => {
  const { data } = await http.post(`${BASE}/${path}`, buildPayload(ctx));
  return {
    conversationId: data.conversation_id,
    messages: data.messages || [],
    actions: (data.actions || []).map(fromApiAction),
    state: fromApiState(data.state),
    handoff: !!data.handoff,
    handoffReason: data.handoff_reason || null,
  };
};

/** Agente aborda o lead por conta própria. */
export const agentStart = (ctx) => call("start", ctx);

/** Lead respondeu — agente conduz o próximo passo. */
export const agentReply = (ctx) => call("reply", ctx);

/** Cadência automática quando o lead fica em silêncio. */
export const agentFollowup = (ctx) => call("followup", ctx);

/** Lead fictício para testar o agente de ponta a ponta. */
export const simulateLead = async ({ lead, history, perfil, dificuldade = "medio" }) => {
  const { data } = await http.post(`${BASE}/simulate-lead`, {
    lead: toApiLead(lead),
    history: (history || []).map((m) => ({ role: m.role, text: m.text, at: m.at })),
    perfil,
    dificuldade,
  });
  return data.text;
};
