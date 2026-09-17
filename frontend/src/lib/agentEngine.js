/**
 * Motor local do Agente Autônomo de Atendimento.
 *
 * Quando o backend (FastAPI + OpenAI) está online, o agente roda lá — com
 * raciocínio de verdade e function calling. Quando não está, este motor
 * determinístico assume para que o módulo continue demonstrável e testável
 * offline. A INTERFACE é idêntica nos dois casos:
 *
 *    turn({ config, lead, inventory, history, state, mode })
 *      -> { messages: string[], actions: Action[], state: AgentState }
 *
 * Assim a tela de Atendimento não sabe (nem precisa saber) quem respondeu.
 */

import { formatBRL } from "@/lib/format";

/* ---------------- Constantes compartilhadas ---------------- */

export const STAGES = [
  { key: "abordagem", label: "Abordagem", color: "#6B7280" },
  { key: "qualificacao", label: "Qualificação", color: "#3B82F6" },
  { key: "apresentacao", label: "Apresentação", color: "#8B5CF6" },
  { key: "visita", label: "Visita", color: "#06B6D4" },
  { key: "proposta", label: "Proposta", color: "#F59E0B" },
  { key: "negociacao", label: "Negociação", color: "#EC4899" },
  { key: "fechamento", label: "Fechamento", color: "#22C55E" },
  { key: "perdido", label: "Perdido", color: "#EF4444" },
  { key: "humano", label: "Com humano", color: "#0EA5E9" },
];

export const stageMeta = (key) => STAGES.find((s) => s.key === key) || STAGES[0];

export const ACTION_META = {
  mensagem: { label: "Mensagem", icon: "MessageSquare", color: "#6B7280" },
  qualificacao: { label: "Qualificação", icon: "ClipboardCheck", color: "#3B82F6" },
  busca_imovel: { label: "Busca no inventário", icon: "Search", color: "#8B5CF6" },
  agendar_visita: { label: "Visita agendada", icon: "CalendarCheck", color: "#06B6D4" },
  proposta: { label: "Proposta enviada", icon: "FileSignature", color: "#F59E0B" },
  desconto: { label: "Desconto aplicado", icon: "Percent", color: "#EC4899" },
  objecao: { label: "Objeção", icon: "ShieldAlert", color: "#F97316" },
  mover_etapa: { label: "Etapa do funil", icon: "MoveRight", color: "#6366F1" },
  venda: { label: "Venda fechada", icon: "Trophy", color: "#22C55E" },
  followup_agendado: { label: "Follow-up", icon: "Clock", color: "#94A3B8" },
  escalonamento: { label: "Escalonamento", icon: "UserCheck", color: "#0EA5E9" },
  perdido: { label: "Lead perdido", icon: "XCircle", color: "#EF4444" },
};

export const DEFAULT_AGENT_CONFIG = {
  nome: "Débora",
  empresa: "Prime Imóveis",
  persona:
    "Consultora imobiliária sênior, cordial e objetiva. Fala como gente, não como robô.",
  tom: "consultivo",
  agressividade: 3,
  autonomia: "total",
  descontoMaxPct: 5,
  ticketMaxAutonomo: 2000000,
  horarioInicio: 8,
  horarioFim: 21,
  followupsMax: 5,
  intervaloFollowupHoras: 20,
  escalarSe: [
    "cliente pede falar com humano",
    "pedido de desconto acima do limite",
    "reclamação ou risco jurídico",
    "permuta ou condição fora do padrão",
  ],
  mensagemAbertura: "",
  conhecimento:
    "Comissão padrão 6%. Aceitamos FGTS e financiamento Caixa/Itaú. Entrada mínima 20%. Visitas de seg a sáb.",
};

export const INITIAL_STATE = {
  stage: "abordagem",
  qualificacao: {},
  imoveisApresentados: [],
  objecoes: [],
  proposta: null,
  visita: null,
  descontoAplicado: 0,
  followups: 0,
  tentativasQualificacao: 0,
  objecoesPreco: 0,
  semRespostaApresentacao: 0,
  semRespostaNegociacao: 0,
  proximoFollowup: null,
  encerrada: false,
  motivoEncerramento: null,
};

/* ---------------- Utilidades ---------------- */

const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const nowIso = () => new Date().toISOString();

const action = (tipo, resumo, payload = {}) => ({
  id: uid("act"),
  tipo,
  resumo,
  payload,
  at: nowIso(),
});

const norm = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const has = (text, words) => words.some((w) => norm(text).includes(norm(w)));

/** Extrai valores tipo "500 mil", "1.2 milhão", "R$ 480.000" de texto livre. */
export const parseBudget = (text) => {
  const t = norm(text).replace(/\./g, "").replace(/,/g, ".");
  const milhao = t.match(/(\d+(?:\.\d+)?)\s*(milhao|milhoes|mi\b|kk)/);
  if (milhao) return Math.round(parseFloat(milhao[1]) * 1_000_000);
  const mil = t.match(/(\d+(?:\.\d+)?)\s*(mil|k\b)/);
  if (mil) return Math.round(parseFloat(mil[1]) * 1000);
  const cru = t.match(/r?\$?\s*(\d{5,9})/);
  if (cru) return parseInt(cru[1], 10);
  return null;
};

const BAIRROS = [
  "Jardim Paulista", "Vila Madalena", "Moema", "Itaim Bibi",
  "Pinheiros", "Vila Olímpia", "Perdizes", "Vila Mariana",
];

const parseRegion = (text) => BAIRROS.find((b) => norm(text).includes(norm(b))) || null;

const parseRooms = (text) => {
  const m = norm(text).match(/(\d)\s*(quarto|dorm|dormitorio)/);
  return m ? parseInt(m[1], 10) : null;
};

const parseType = (text) => {
  const tipos = ["Apartamento", "Casa", "Cobertura", "Terreno", "Sala Comercial"];
  return tipos.find((t) => norm(text).includes(norm(t))) || null;
};

/** Ranqueia o inventário contra o perfil do lead — mesma lógica do backend. */
export const matchProperties = (inventory, filtros = {}, limite = 2) => {
  const { bairro, tipo, quartosMin, orcamentoMax } = filtros;
  const score = (p) => {
    let s = 0;
    if (bairro && norm(p.neighborhood || "").includes(norm(bairro))) s += 3;
    if (tipo && norm(p.type || "").includes(norm(tipo))) s += 2;
    if (quartosMin && (p.bedrooms || 0) >= quartosMin) s += 1.5;
    if (orcamentoMax && p.price) {
      if (p.price <= orcamentoMax) s += 2.5;
      else if (p.price <= orcamentoMax * 1.12) s += 0.8;
      else s -= 2;
    }
    s += p.status === "Disponível" ? 1 : -3;
    return s;
  };
  return [...inventory]
    .sort((a, b) => score(b) - score(a))
    .filter((p) => score(p) > -1)
    .slice(0, limite);
};

const propLine = (p) =>
  `• ${p.title} — ${p.bedrooms} dorm, ${p.area}m², ${formatBRL(p.price)} (cód. ${p.code})`;

/** Duas janelas de visita concretas, sempre em dias úteis futuros. */
const visitSlots = () => {
  const mk = (addDays, hour) => {
    const d = new Date();
    d.setDate(d.getDate() + addDays);
    while (d.getDay() === 0) d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const a = mk(1, 10);
  const b = mk(2, 18);
  const fmt = (d) =>
    d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" }) +
    ` às ${d.getHours()}h`;
  return [
    { date: a, label: fmt(a) },
    { date: b, label: fmt(b) },
  ];
};

/* ---------------- Motor ---------------- */

/**
 * Executa um turno do agente.
 * @returns {{messages: string[], actions: object[], state: object}}
 */
export function localTurn({ config, lead, inventory = [], history = [], state, mode = "inbound" }) {
  const cfg = { ...DEFAULT_AGENT_CONFIG, ...config };
  const st = JSON.parse(JSON.stringify({ ...INITIAL_STATE, ...state }));
  const actions = [];
  const messages = [];
  const say = (t) => messages.push(t);

  const lastLead = [...history].reverse().find((m) => m.role === "lead")?.text || "";
  const firstName = (lead.name || "").split(" ")[0];

  const scheduleFollowup = (horas, objetivo) => {
    st.proximoFollowup = new Date(Date.now() + horas * 3600000).toISOString();
    actions.push(
      action("followup_agendado", `Follow-up automático em ${horas}h`, {
        emHoras: horas,
        quando: st.proximoFollowup,
        objetivo,
      })
    );
  };

  const escalate = (motivo) => {
    st.stage = "humano";
    st.encerrada = true;
    st.motivoEncerramento = "handoff";
    actions.push(
      action("escalonamento", `Transferiu para humano: ${motivo}`, {
        motivo,
        urgencia: "alta",
        resumo: `Lead ${lead.name} · etapa ${st.stage} · ${st.objecoes.length} objeção(ões) registradas.`,
      })
    );
    say(`Perfeito, ${firstName}. Já estou passando para um dos nossos especialistas — ele te chama aqui mesmo em instantes.`);
  };

  /* --- Interceptações que valem em qualquer etapa --- */

  if (mode !== "outbound") {
    if (has(lastLead, ["falar com humano", "falar com alguem", "corretor de verdade", "atendente", "pessoa real", "gerente"])) {
      escalate("Cliente pediu atendimento humano");
      return finish();
    }
    if (has(lastLead, ["nao tenho interesse", "sem interesse", "para de mandar", "nao quero mais", "descadastrar", "pare"])) {
      st.stage = "perdido";
      st.encerrada = true;
      st.motivoEncerramento = "opt-out";
      actions.push(action("perdido", "Lead pediu para encerrar o contato", { motivo: "opt-out" }));
      say(`Sem problema, ${firstName}. Vou encerrar por aqui. Se mudar de ideia, é só me chamar. Boa semana!`);
      return finish();
    }
    if (has(lastLead, ["permuta", "processo", "advogado", "reclamacao", "procon"])) {
      escalate("Condição fora do padrão / risco jurídico");
      return finish();
    }
  }

  /* --- Modo follow-up --- */

  if (mode === "followup") {
    st.followups += 1;
    const ultima = st.followups >= cfg.followupsMax;
    if (ultima) {
      say(`${firstName}, não quero insistir. Vou deixar seu cadastro salvo e, se aparecer algo no seu perfil, te aviso. Combinado?`);
      st.proximoFollowup = null;
      actions.push(action("mover_etapa", "Encerrou a cadência de follow-up", { etapa: st.stage }));
    } else {
      const angulos = [
        `${firstName}, consegui condição nova de entrada nesse perfil de imóvel. Faz sentido eu te mandar?`,
        `Oi ${firstName}! Entrou uma unidade parecida com o que você procura. Te mando os detalhes?`,
        `${firstName}, só pra não te deixar sem resposta: prefere que eu te chame por aqui ou por ligação?`,
        `Passando rápido, ${firstName} — ainda está procurando ou já resolveu?`,
      ];
      say(angulos[(st.followups - 1) % angulos.length]);
      scheduleFollowup(cfg.intervaloFollowupHoras, "Retomar conversa");
    }
    return finish();
  }

  /* --- Abordagem (agente inicia sozinho) --- */

  if (mode === "outbound") {
    st.stage = "qualificacao";
    const origem = lead.origin ? ` pelo ${lead.origin}` : "";
    say(
      cfg.mensagemAbertura?.trim()
        ? cfg.mensagemAbertura.replace(/\{nome\}/g, firstName)
        : `Oi ${firstName}, tudo bem? Aqui é a ${cfg.nome}, da ${cfg.empresa} 🙂\nVi que você chegou até a gente${origem} procurando ${lead.interest || "um imóvel"}.\nPra eu te mandar só o que faz sentido: é pra morar ou investir?`
    );
    actions.push(action("mover_etapa", "Iniciou atendimento e abriu qualificação", { etapa: "qualificacao" }));
    scheduleFollowup(cfg.intervaloFollowupHoras, "Lead ainda não respondeu a abordagem");
    return finish();
  }

  /* --- Captura contínua de qualificação --- */

  const capt = {};
  const b = parseBudget(lastLead);
  if (b) capt.orcamento = b;
  const r = parseRegion(lastLead);
  if (r) capt.regiao = r;
  const q = parseRooms(lastLead);
  if (q) capt.quartos = q;
  const tp = parseType(lastLead);
  if (tp) capt.tipoImovel = tp;
  if (has(lastLead, ["investir", "investimento", "renda", "alugar depois"])) capt.finalidade = "investimento";
  else if (has(lastLead, ["morar", "moradia", "familia", "mudar"])) capt.finalidade = "moradia";
  if (has(lastLead, ["financi", "caixa", "banco", "fgts"])) capt.pagamento = "financiamento";
  else if (has(lastLead, ["a vista", "avista", "dinheiro"])) capt.pagamento = "à vista";

  if (Object.keys(capt).length) {
    Object.assign(st.qualificacao, capt);
    st.qualificacao.score = Math.min(100, 40 + Object.keys(st.qualificacao).length * 10);
    actions.push(action("qualificacao", "Atualizou a qualificação do lead", { ...capt }));
  }

  const Q = st.qualificacao;
  const positivo = has(lastLead, ["sim", "pode", "claro", "quero", "bora", "manda", "vamos", "isso", "topo", "beleza", "ok", "perfeito"]);
  const temOrcamento = Q.orcamento || lead.budget;
  const orcamento = Q.orcamento || lead.budget || null;

  /* --- Máquina de estados --- */

  switch (st.stage) {
    case "abordagem":
    case "qualificacao": {
      // Lead evasivo: se não trouxe informação nova, o agente insiste no máximo
      // duas vezes e então avança com o que tem, em vez de repetir a pergunta.
      if (!Object.keys(capt).length) st.tentativasQualificacao = (st.tentativasQualificacao || 0) + 1;
      else st.tentativasQualificacao = 0;

      const insistiuDemais = (st.tentativasQualificacao || 0) >= 2;

      if (insistiuDemais) {
        if (!temOrcamento && !Q.regiao) {
          // Sem nada concreto: para de perguntar e puxa a decisão com opções prontas.
          st.qualificacao.finalidade = Q.finalidade || "moradia";
          actions.push(action("qualificacao", "Assumiu perfil padrão após lead evasivo", { finalidade: st.qualificacao.finalidade }));
          say(`Sem problema, ${firstName} — deixa comigo. Vou te mandar as duas melhores oportunidades que temos hoje e você me diz se o caminho é esse.`);
          return present();
        }
        return present();
      }

      if (!Q.finalidade) {
        say(`Entendi, ${firstName}. É pra morar ou pra investir?`);
        break;
      }
      if (!temOrcamento) {
        say(`Boa. E qual faixa de investimento você tem em mente? Assim eu filtro só o que cabe no seu orçamento.`);
        break;
      }
      if (!Q.regiao) {
        say(`Show. Tem alguma região de preferência? Trabalhamos forte em ${BAIRROS.slice(0, 4).join(", ")}.`);
        break;
      }
      // Qualificado o bastante: busca no inventário e apresenta
      return present();
    }

    case "apresentacao": {
      if (has(lastLead, ["visitar", "visita", "conhecer", "ver o imovel", "ver pessoalmente"]) || positivo) {
        return offerVisit();
      }
      if (has(lastLead, ["caro", "acima", "fora do orcamento", "nao cabe", "muito alto", "outra imobiliaria", "melhor", "comparar"])) {
        st.objecoes.push({ tipo: "preco", detalhe: lastLead, at: nowIso() });
        actions.push(action("objecao", "Objeção de preço na apresentação", { tipo: "preco" }));
        st.objecoesPreco = (st.objecoesPreco || 0) + 1;

        // Segunda objeção: para de rebuscar e puxa a visita — imóvel se vende no local.
        if (st.objecoesPreco === 2) {
          say(`Entendo, ${firstName}. Preço a gente negocia depois que você vê o imóvel — o proprietário costuma flexibilizar com proposta na mão.\nTe levo pra conhecer sem compromisso?`);
          return offerVisit();
        }
        // Terceira: não há fit, chama um humano em vez de insistir.
        if (st.objecoesPreco >= 3) {
          escalate("Lead com três objeções de preço — sem fit no inventário atual");
          return finish();
        }

        const maisBaratos = matchProperties(inventory, {
          bairro: Q.regiao,
          tipo: Q.tipoImovel,
          orcamentoMax: (orcamento || 600000) * 0.85,
        }, 2);
        actions.push(action("busca_imovel", `Rebuscou no inventário: ${maisBaratos.length} opção(ões) mais enxuta(s)`, {
          filtros: { orcamentoMax: (orcamento || 600000) * 0.85 },
          resultados: maisBaratos.map((p) => p.id),
        }));
        st.imoveisApresentados = [...new Set([...st.imoveisApresentados, ...maisBaratos.map((p) => p.id)])];
        say(`Faz sentido, ${firstName}. Separei duas opções dentro de uma faixa mais confortável:\n${maisBaratos.map(propLine).join("\n")}\nAlguma dessas te interessa mais?`);
        break;
      }
      // Lead sem resposta clara: o agente não fica repetindo a mesma pergunta.
      st.semRespostaApresentacao = (st.semRespostaApresentacao || 0) + 1;
      if (st.semRespostaApresentacao >= 3) {
        escalate("Lead sem engajamento após várias tentativas na apresentação");
        return finish();
      }
      if (st.semRespostaApresentacao === 2) {
        say(`${firstName}, o jeito mais rápido de decidir é vendo de perto — em 20 minutos você sente se é o seu lugar.`);
        return offerVisit();
      }
      say(`Qual das duas te chamou mais atenção, ${firstName}? Posso te mandar fotos e a planta da que preferir.`);
      scheduleFollowup(cfg.intervaloFollowupHoras, "Definir imóvel de interesse");
      break;
    }

    case "visita": {
      // Aguardando confirmação de horário
      if (st.visita?.confirmada) return proposeDeal();
      const slots = visitSlots();
      const escolhido =
        has(lastLead, ["primeir", "amanha", "10", "manha"]) ? slots[0] :
        has(lastLead, ["segund", "depois", "18", "tarde", "noite"]) ? slots[1] :
        positivo ? slots[0] : null;

      if (escolhido) {
        const imovel = inventory.find((p) => p.id === st.imoveisApresentados[0]) || inventory[0];
        st.visita = {
          confirmada: true,
          imovelId: imovel?.id,
          imovelTitulo: imovel?.title,
          data: escolhido.date.toISOString(),
          duracao: 60,
        };
        actions.push(action("agendar_visita", `Agendou visita — ${escolhido.label}`, st.visita));
        say(`Fechado, ${firstName}! Visita confirmada ${escolhido.label}, em ${imovel?.title}.\nVou te mandar o endereço e um lembrete no dia. Qualquer imprevisto me avisa que a gente remarca.`);
        st.stage = "proposta";
        actions.push(action("mover_etapa", "Avançou para Proposta", { etapa: "proposta" }));
      } else {
        say(`Consigo te levar ${slots[0].label} ou ${slots[1].label}. Qual fica melhor?`);
        scheduleFollowup(6, "Confirmar horário da visita");
      }
      break;
    }

    case "proposta": {
      if (has(lastLead, ["gostei", "gostamos", "amei", "quero esse", "fechar", "proposta", "sim"]) || positivo) {
        return sendProposal();
      }
      if (has(lastLead, ["nao gostei", "nao curti", "outro", "diferente"])) {
        st.stage = "apresentacao";
        actions.push(action("mover_etapa", "Voltou para Apresentação — buscar novas opções", { etapa: "apresentacao" }));
        return present();
      }
      say(`E aí, ${firstName}, o que achou do imóvel? Se fizer sentido eu já monto a proposta com as condições.`);
      scheduleFollowup(cfg.intervaloFollowupHoras, "Feedback pós-visita");
      break;
    }

    case "negociacao": {
      if (has(lastLead, ["fechado", "fechar", "aceito", "pode fazer", "vamos nessa", "topo", "quero comprar"]) || positivo) {
        return closeDeal();
      }
      if (has(lastLead, ["desconto", "abate", "melhor preco", "caro", "baixar"])) {
        st.objecoes.push({ tipo: "preco", detalhe: lastLead, at: nowIso() });
        actions.push(action("objecao", "Pedido de desconto na negociação", { tipo: "preco" }));

        const pedido = (lastLead.match(/(\d{1,2})\s*%/) || [])[1];
        const pct = pedido ? parseFloat(pedido) : cfg.descontoMaxPct;

        if (pct > cfg.descontoMaxPct) {
          actions.push(
            action("escalonamento", `Desconto de ${pct}% excede o limite de ${cfg.descontoMaxPct}%`, {
              solicitado: pct,
              limite: cfg.descontoMaxPct,
            })
          );
          st.stage = "humano";
          st.encerrada = true;
          st.motivoEncerramento = "handoff";
          say(`${firstName}, ${pct}% está acima do que consigo autorizar sozinha. Consigo garantir ${cfg.descontoMaxPct}% agora — e já chamei o gestor pra avaliar o restante. Ele te responde ainda hoje.`);
          break;
        }

        st.descontoAplicado = cfg.descontoMaxPct;
        if (st.proposta) {
          st.proposta.valor = Math.round(st.proposta.valorOriginal * (1 - cfg.descontoMaxPct / 100));
          st.proposta.descontoPct = cfg.descontoMaxPct;
        }
        actions.push(
          action("desconto", `Aplicou ${cfg.descontoMaxPct}% de desconto`, {
            percentual: cfg.descontoMaxPct,
            proposta: st.proposta,
          })
        );
        say(`Consegui ${cfg.descontoMaxPct}% de abatimento com o proprietário, ${firstName}: sai por ${formatBRL(st.proposta?.valor || 0)}.\nEsse é o melhor cenário que tenho autorização pra fazer. Fechamos assim?`);
        break;
      }
      st.semRespostaNegociacao = (st.semRespostaNegociacao || 0) + 1;
      if (st.semRespostaNegociacao >= 3) {
        escalate("Negociação travada — lead indeciso após três tentativas");
        return finish();
      }
      if (st.semRespostaNegociacao === 2) {
        say(`${firstName}, vou ser direta: consigo segurar essa condição até amanhã. Depois disso a unidade volta pra tabela.\nQuer que eu reserve no seu nome?`);
        scheduleFollowup(6, "Última chamada antes de escalar");
        break;
      }
      say(`${firstName}, alguma dúvida travando a decisão? Se for documentação ou financiamento, eu resolvo pra você.`);
      scheduleFollowup(cfg.intervaloFollowupHoras, "Destravar negociação");
      break;
    }

    case "fechamento":
    case "perdido":
    case "humano":
    default:
      say(`Estou por aqui se precisar, ${firstName}.`);
      break;
  }

  return finish();

  /* ---------- sub-rotinas ---------- */

  function present() {
    const filtros = {
      bairro: Q.regiao,
      tipo: Q.tipoImovel,
      quartosMin: Q.quartos,
      orcamentoMax: orcamento,
    };
    const opcoes = matchProperties(inventory, filtros, 2);
    actions.push(
      action("busca_imovel", `Buscou no inventário: ${opcoes.length} opção(ões) compatível(is)`, {
        filtros,
        resultados: opcoes.map((p) => ({ id: p.id, title: p.title, price: p.price })),
      })
    );

    if (!opcoes.length) {
      say(`${firstName}, nesse recorte exato não tenho nada disponível agora. Se eu ampliar um pouco a região ou a faixa de valor, você olharia?`);
      st.stage = "qualificacao";
      return finish();
    }

    st.imoveisApresentados = [...new Set([...st.imoveisApresentados, ...opcoes.map((p) => p.id)])];
    st.stage = "apresentacao";
    actions.push(action("mover_etapa", "Avançou para Apresentação", { etapa: "apresentacao" }));
    say(
      `${firstName}, separei o que mais combina com o seu perfil:\n${opcoes.map(propLine).join("\n")}\n` +
        `A primeira tem a melhor relação metragem/valor da região. Quer conhecer pessoalmente?`
    );
    scheduleFollowup(cfg.intervaloFollowupHoras, "Converter apresentação em visita");
    return finish();
  }

  function offerVisit() {
    const slots = visitSlots();
    st.stage = "visita";
    actions.push(action("mover_etapa", "Avançou para Visita", { etapa: "visita" }));
    say(`Ótimo, ${firstName}! Tenho duas janelas: ${slots[0].label} ou ${slots[1].label}. Qual prefere?`);
    scheduleFollowup(6, "Confirmar horário da visita");
    return finish();
  }

  function proposeDeal() {
    say(`${firstName}, e aí — o que achou do imóvel na visita?`);
    return finish();
  }

  function sendProposal() {
    const imovel =
      inventory.find((p) => p.id === (st.visita?.imovelId || st.imoveisApresentados[0])) || inventory[0];
    const valor = imovel?.price || orcamento || 500000;

    if (valor > cfg.ticketMaxAutonomo) {
      actions.push(
        action("escalonamento", "Ticket acima do teto autônomo", {
          valor,
          teto: cfg.ticketMaxAutonomo,
        })
      );
      st.stage = "humano";
      st.encerrada = true;
      st.motivoEncerramento = "handoff";
      say(`${firstName}, por se tratar de um ticket alto, nosso diretor comercial assume a proposta com você. Ele te chama já já.`);
      return finish();
    }

    st.proposta = {
      imovelId: imovel?.id,
      imovelTitulo: imovel?.title,
      valor,
      valorOriginal: valor,
      entrada: Math.round(valor * 0.2),
      condicoes: "Entrada de 20% + financiamento em até 360 meses. Proposta válida por 3 dias.",
      enviadaEm: nowIso(),
    };
    st.stage = "negociacao";
    actions.push(action("proposta", `Enviou proposta de ${formatBRL(valor)}`, st.proposta));
    actions.push(action("mover_etapa", "Avançou para Negociação", { etapa: "negociacao" }));
    say(
      `Montei a proposta, ${firstName}:\n• ${imovel?.title}\n• Valor: ${formatBRL(valor)}\n• Entrada: ${formatBRL(
        st.proposta.entrada
      )} + financiamento em até 360x\nVálida por 3 dias. Posso reservar a unidade no seu nome?`
    );
    scheduleFollowup(12, "Resposta da proposta");
    return finish();
  }

  function closeDeal() {
    const valor = st.proposta?.valor || orcamento || 500000;
    st.stage = "fechamento";
    st.encerrada = true;
    st.motivoEncerramento = "venda";
    actions.push(
      action("venda", `VENDA FECHADA — ${formatBRL(valor)}`, {
        imovelId: st.proposta?.imovelId,
        imovelTitulo: st.proposta?.imovelTitulo,
        valorFinal: valor,
        formaPagamento: Q.pagamento || "financiamento",
        proximoPasso: "Envio de documentos e assinatura digital",
      })
    );
    say(
      `Que notícia boa, ${firstName}! 🎉 Unidade reservada no seu nome por ${formatBRL(valor)}.\n` +
        `Vou te mandar agora a lista de documentos e o link da assinatura digital. Qualquer dúvida na papelada, é comigo.`
    );
    return finish();
  }

  function finish() {
    messages.forEach((text) =>
      actions.push(action("mensagem", "Mensagem enviada ao lead", { text }))
    );
    return { messages, actions, state: st };
  }
}

/* ---------------- Lead simulado (para testar o agente sem cliente real) ---------------- */

const PERFIS = {
  facil: {
    finalidade: "pra morar mesmo",
    orcamento: "uns 650 mil",
    regiao: "gosto de Pinheiros",
    apresentacao: "gostei do primeiro! posso visitar?",
    visita: "pode ser o primeiro horário",
    posVisita: "gostei muito, manda a proposta",
    proposta: "fechado, vamos nessa",
    desconto: "combinado, pode reservar",
    generico: "beleza, pode seguir",
  },
  medio: {
    finalidade: "é pra morar",
    orcamento: "uns 550 mil, no máximo 600",
    regiao: "de preferência Moema",
    apresentacao: "achei um pouco caro pra ser sincero",
    visita: "amanhã de manhã dá certo",
    posVisita: "gostei sim, manda a proposta",
    proposta: "consegue um desconto? uns 4%",
    desconto: "fechado então, vamos nessa",
    generico: "deixa eu pensar... mas pode continuar",
  },
  dificil: {
    finalidade: "ainda tô só pesquisando",
    orcamento: "depende do preço",
    regiao: "não tenho região definida ainda",
    apresentacao: "tô vendo com outra imobiliária também, tem algo melhor?",
    visita: "pode ser quinta à tarde",
    posVisita: "gostei, mas queria entender as condições antes",
    proposta: "só fecho com 12% de desconto",
    desconto: "vou analisar e te falo",
    generico: "hmm, não sei ainda",
  },
};

/**
 * Lead fictício do simulador (fallback offline).
 * Responde à ÚLTIMA pergunta do agente, não a um script fixo — por isso a
 * conversa avança de verdade em vez de repetir a mesma frase.
 */
export function localSimulatedLead(state, dificuldade = "medio", lastAgentText = "") {
  const p = PERFIS[dificuldade] || PERFIS.medio;
  const q = state?.qualificacao || {};
  const t = lastAgentText || "";

  if (has(t, ["montei a proposta", "posso reservar"])) return p.proposta;
  if (has(t, ["abatimento", "melhor cenario", "fechamos assim"])) return p.desconto;
  if (has(t, ["morar ou", "investir", "uso proprio"])) return p.finalidade;
  if (has(t, ["faixa de investimento", "quanto pretende", "qual orcamento"]) && !q.orcamento) return p.orcamento;
  if (has(t, ["regiao", "bairro", "onde"])) return p.regiao;
  if (has(t, ["separei", "opcoes", "combina com o seu perfil", "melhores oportunidades", "qual das duas", "chamou mais atencao", "fotos e a planta"])) return p.apresentacao;
  if (has(t, ["janelas", "qual prefere", "qual fica melhor", "conhecer pessoalmente", "te levo"])) return p.visita;
  if (has(t, ["o que achou", "visita confirmada", "como foi"])) return p.posVisita;
  if (has(t, ["documentos", "assinatura", "reservada no seu nome"])) return "perfeito, obrigado!";

  // Fallback: só volta a falar de qualificação se ainda estiver nessa etapa.
  if (!["abordagem", "qualificacao"].includes(state?.stage)) return p.generico;
  if (!q.finalidade) return p.finalidade;
  if (!q.orcamento) return p.orcamento;
  if (!q.regiao) return p.regiao;
  return p.generico;
}
