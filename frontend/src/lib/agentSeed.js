/**
 * Conversas de demonstração do Agente Autônomo.
 * Mostram o módulo já povoado — em produção as conversas nascem dos canais
 * reais (WhatsApp Business, Instagram, formulário do site) ou do rodízio.
 */

import { INITIAL_STATE } from "@/lib/agentEngine";

const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
const inHours = (h) => new Date(Date.now() + h * 3600000).toISOString();
const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

const msg = (role, text, min) => ({ id: uid("m"), role, text, at: ago(min) });
const act = (tipo, resumo, payload, min) => ({ id: uid("act"), tipo, resumo, payload, at: ago(min) });

export const seedConversations = () => [
  {
    id: "conv_seed_1",
    tenantId: "t1",
    leadId: "l1",
    leadName: "Marina Costa",
    leadPhone: "(11) 98812-4477",
    channel: "whatsapp",
    autopilot: true,
    dealId: null,
    unread: 1,
    createdAt: ago(190),
    updatedAt: ago(12),
    messages: [
      msg("agente", "Oi Marina, tudo bem? Aqui é a Débora, da Prime Imóveis 🙂\nVi que você chegou pelo Instagram procurando apartamento de 2 dorms.\nPra eu te mandar só o que faz sentido: é pra morar ou investir?", 190),
      msg("lead", "oi! pra morar mesmo", 170),
      msg("agente", "Entendi. E qual faixa de investimento você tem em mente?", 168),
      msg("lead", "até uns 650 mil, de preferencia em Pinheiros", 150),
      msg("agente", "Marina, separei o que mais combina com o seu perfil:\n• Apartamento em Pinheiros — 2 dorm, 69m², R$ 620.000 (cód. PI-1005)\n• Apartamento em Vila Madalena — 2 dorm, 72m², R$ 645.000 (cód. PI-1012)\nA primeira tem a melhor relação metragem/valor da região. Quer conhecer pessoalmente?", 148),
      msg("lead", "gostei do primeiro! posso visitar?", 14),
      msg("agente", "Ótimo, Marina! Tenho duas janelas: amanhã às 10h ou quinta às 18h. Qual prefere?", 12),
    ],
    actions: [
      act("mover_etapa", "Avançou para Visita", { etapa: "visita" }, 12),
      act("busca_imovel", "Buscou no inventário: 2 opções compatíveis", { filtros: { bairro: "Pinheiros", orcamentoMax: 650000 } }, 148),
      act("qualificacao", "Atualizou a qualificação do lead", { orcamento: 650000, regiao: "Pinheiros", finalidade: "moradia", score: 78 }, 150),
      act("followup_agendado", "Follow-up automático em 6h", { emHoras: 6 }, 12),
      act("mover_etapa", "Iniciou atendimento e abriu qualificação", { etapa: "qualificacao" }, 190),
    ],
    state: {
      ...INITIAL_STATE,
      stage: "visita",
      qualificacao: { finalidade: "moradia", orcamento: 650000, regiao: "Pinheiros", score: 78 },
      imoveisApresentados: ["p5", "p12"],
      proximoFollowup: inHours(6),
    },
  },
  {
    id: "conv_seed_2",
    tenantId: "t1",
    leadId: "l6",
    leadName: "Ricardo Nunes",
    leadPhone: "(11) 99120-8830",
    channel: "site",
    autopilot: true,
    dealId: null,
    unread: 0,
    createdAt: ago(1400),
    updatedAt: ago(52),
    messages: [
      msg("agente", "Oi Ricardo! Aqui é a Débora, da Prime. Vi seu contato pelo site sobre sala comercial.\nÉ pra uso próprio ou investimento?", 1400),
      msg("lead", "investimento, quero rentabilidade boa", 1380),
      msg("agente", "Perfeito. Faixa de investimento?", 1375),
      msg("lead", "até 900 mil", 1370),
      msg("agente", "Montei a proposta, Ricardo:\n• Sala Comercial em Itaim Bibi\n• Valor: R$ 870.000\n• Entrada: R$ 174.000 + financiamento em até 360x\nVálida por 3 dias. Posso reservar a unidade no seu nome?", 120),
      msg("lead", "consegue um desconto? uns 4%", 60),
      msg("agente", "Consegui 4% de abatimento com o proprietário, Ricardo: sai por R$ 835.200.\nEsse é o melhor cenário que tenho autorização pra fazer. Fechamos assim?", 52),
    ],
    actions: [
      act("desconto", "Aplicou 4% de desconto", { percentual: 4 }, 52),
      act("objecao", "Pedido de desconto na negociação", { tipo: "preco" }, 58),
      act("proposta", "Enviou proposta de R$ 870.000", { valor: 870000 }, 120),
      act("qualificacao", "Atualizou a qualificação do lead", { finalidade: "investimento", orcamento: 900000, score: 85 }, 1370),
    ],
    state: {
      ...INITIAL_STATE,
      stage: "negociacao",
      qualificacao: { finalidade: "investimento", orcamento: 900000, score: 85 },
      proposta: { imovelId: "p4", imovelTitulo: "Sala Comercial em Itaim Bibi", valor: 835200, valorOriginal: 870000, entrada: 174000, descontoPct: 4 },
      descontoAplicado: 4,
      proximoFollowup: inHours(12),
    },
  },
  {
    id: "conv_seed_3",
    tenantId: "t1",
    leadId: "l9",
    leadName: "Patrícia Melo",
    leadPhone: "(11) 97744-1120",
    channel: "instagram",
    autopilot: false,
    dealId: null,
    unread: 2,
    createdAt: ago(320),
    updatedAt: ago(30),
    messages: [
      msg("agente", "Oi Patrícia! Aqui é a Débora, da Prime Imóveis. Vi seu comentário no post da cobertura em Moema. Quer que eu te mande os detalhes?", 320),
      msg("lead", "quero sim, mas só fecho com 12% de desconto", 35),
      msg("agente", "Patrícia, 12% está acima do que consigo autorizar sozinha. Consigo garantir 5% agora — e já chamei o gestor pra avaliar o restante. Ele te responde ainda hoje.", 30),
    ],
    actions: [
      act("escalonamento", "Desconto de 12% excede o limite de 5%", { solicitado: 12, limite: 5 }, 30),
      act("objecao", "Pedido de desconto acima do limite", { tipo: "preco" }, 33),
    ],
    state: {
      ...INITIAL_STATE,
      stage: "humano",
      qualificacao: { finalidade: "moradia", score: 72 },
      encerrada: true,
      motivoEncerramento: "handoff",
    },
  },
  {
    id: "conv_seed_4",
    tenantId: "t1",
    leadId: "l3",
    leadName: "Juliana Reis",
    leadPhone: "(11) 98330-7712",
    channel: "whatsapp",
    autopilot: true,
    dealId: null,
    unread: 0,
    createdAt: ago(4300),
    updatedAt: ago(220),
    messages: [
      msg("agente", "Juliana, montei a proposta do apartamento em Moema: R$ 740.000, entrada de R$ 148.000 + financiamento. Posso reservar?", 400),
      msg("lead", "fechado, vamos nessa", 230),
      msg("agente", "Que notícia boa, Juliana! 🎉 Unidade reservada no seu nome por R$ 740.000.\nVou te mandar agora a lista de documentos e o link da assinatura digital.", 220),
    ],
    actions: [
      act("venda", "VENDA FECHADA — R$ 740.000", { valorFinal: 740000, imovelTitulo: "Apartamento em Moema", formaPagamento: "financiamento" }, 220),
      act("proposta", "Enviou proposta de R$ 740.000", { valor: 740000 }, 400),
    ],
    state: {
      ...INITIAL_STATE,
      stage: "fechamento",
      qualificacao: { finalidade: "moradia", orcamento: 750000, score: 92 },
      proposta: { imovelId: "p2", imovelTitulo: "Apartamento em Moema", valor: 740000, valorOriginal: 740000 },
      encerrada: true,
      motivoEncerramento: "venda",
    },
  },
];
