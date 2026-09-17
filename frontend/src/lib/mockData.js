/* Mock seed data for Débora.ai MVP — multi-tenant real estate ERP */

export const TENANTS = [
  { id: "t1", name: "Prime Imóveis", city: "São Paulo, SP", logo: "PI", plan: "Business" },
  { id: "t2", name: "Horizonte Realty", city: "Rio de Janeiro, RJ", logo: "HR", plan: "Enterprise" },
  { id: "t3", name: "Terra Nova Corretora", city: "Belo Horizonte, MG", logo: "TN", plan: "Starter" },
];

export const AVATARS = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces&auto=format",
];

export const PROPERTY_IMAGES = [
  "https://images.pexels.com/photos/7031581/pexels-photo-7031581.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "https://images.pexels.com/photos/8135492/pexels-photo-8135492.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "https://images.pexels.com/photos/6585598/pexels-photo-6585598.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
];

export const AGENTS = [
  { id: "a1", tenantId: "t1", name: "Débora Almeida", email: "debora@prime.com", role: "Diretora", team: "Prime Alpha", avatar: AVATARS[1], salesVGV: 4200000, dealsWon: 12, leadsAssigned: 34, active: true },
  { id: "a2", tenantId: "t1", name: "Rafael Torres", email: "rafael@prime.com", role: "Corretor Sênior", team: "Prime Alpha", avatar: AVATARS[0], salesVGV: 3100000, dealsWon: 9, leadsAssigned: 28, active: true },
  { id: "a3", tenantId: "t1", name: "Camila Bastos", email: "camila@prime.com", role: "Corretora", team: "Prime Beta", avatar: AVATARS[2], salesVGV: 2800000, dealsWon: 8, leadsAssigned: 26, active: true },
  { id: "a4", tenantId: "t1", name: "Lucas Mendes", email: "lucas@prime.com", role: "Corretor", team: "Prime Beta", avatar: AVATARS[3], salesVGV: 1900000, dealsWon: 6, leadsAssigned: 22, active: true },
  { id: "a5", tenantId: "t1", name: "Ana Paula Ribeiro", email: "ana@prime.com", role: "Corretora", team: "Prime Alpha", avatar: AVATARS[4], salesVGV: 1650000, dealsWon: 5, leadsAssigned: 19, active: true },
  { id: "a6", tenantId: "t1", name: "Bruno Faria", email: "bruno@prime.com", role: "Corretor", team: "Prime Beta", avatar: AVATARS[5], salesVGV: 1200000, dealsWon: 4, leadsAssigned: 17, active: false },
];

export const TEAMS = [
  { id: "team1", tenantId: "t1", name: "Prime Alpha", lead: "Débora Almeida", members: 3, vgv: 8050000 },
  { id: "team2", tenantId: "t1", name: "Prime Beta", lead: "Camila Bastos", members: 3, vgv: 5900000 },
];

const ORIGINS = ["Instagram", "Facebook Ads", "Google Ads", "Site próprio", "Indicação", "OLX", "Zap Imóveis", "WhatsApp"];
const LEAD_STATUS = ["Novo", "Contatado", "Qualificado", "Sem interesse"];

export const LEADS = Array.from({ length: 24 }).map((_, i) => ({
  id: `l${i + 1}`,
  tenantId: "t1",
  name: [
    "Marina Costa", "Pedro Silva", "Juliana Reis", "Fernando Alves", "Carla Souza",
    "Ricardo Nunes", "Beatriz Lima", "André Rocha", "Patrícia Melo", "Tiago Ferreira",
    "Larissa Duarte", "Henrique Prado", "Vanessa Cardoso", "Gustavo Barros", "Sofia Ramos",
    "Diego Martins", "Amanda Cunha", "Rodrigo Peixoto", "Isadora Neves", "Felipe Ávila",
    "Mariana Xavier", "Vinícius Braga", "Tatiane Sá", "Otávio Guerra",
  ][i],
  phone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
  email: `lead${i + 1}@email.com`,
  origin: ORIGINS[i % ORIGINS.length],
  status: LEAD_STATUS[i % LEAD_STATUS.length],
  interest: ["Apartamento 2 dorms", "Cobertura", "Casa em condomínio", "Sala comercial", "Terreno"][i % 5],
  budget: 300000 + (i * 47000),
  agentId: AGENTS[i % AGENTS.length].id,
  createdAt: new Date(Date.now() - i * 3.6e6 * 8).toISOString(),
  score: Math.floor(30 + Math.random() * 70),
}));

export const CLIENTS = Array.from({ length: 12 }).map((_, i) => ({
  id: `c${i + 1}`,
  tenantId: "t1",
  name: [
    "Roberto Cavalcanti", "Helena Vasconcelos", "Marcos Aurélio", "Cíntia Batista",
    "Eduardo Prado", "Renata Cordeiro", "Alexandre Pires", "Lorena Amorim",
    "Sérgio Bittencourt", "Priscila Assis", "Wagner Salomão", "Bianca Toledo",
  ][i],
  document: `${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}-${Math.floor(10 + Math.random() * 89)}`,
  phone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
  email: `cliente${i + 1}@email.com`,
  type: i % 3 === 0 ? "Investidor" : i % 3 === 1 ? "Comprador" : "Locatário",
  agentId: AGENTS[i % AGENTS.length].id,
  totalValue: 400000 + i * 120000,
  properties: 1 + (i % 3),
  createdAt: new Date(Date.now() - i * 3.6e6 * 24 * 5).toISOString(),
}));

const PROPERTY_TYPES = ["Apartamento", "Casa", "Cobertura", "Terreno", "Sala Comercial", "Casa em Condomínio"];
const NEIGHBORHOODS = ["Jardim Paulista", "Vila Madalena", "Moema", "Itaim Bibi", "Pinheiros", "Vila Olímpia", "Perdizes", "Vila Mariana"];

export const PROPERTIES = Array.from({ length: 18 }).map((_, i) => ({
  id: `p${i + 1}`,
  tenantId: "t1",
  code: `PI-${String(1001 + i).padStart(4, "0")}`,
  title: `${PROPERTY_TYPES[i % PROPERTY_TYPES.length]} em ${NEIGHBORHOODS[i % NEIGHBORHOODS.length]}`,
  type: PROPERTY_TYPES[i % PROPERTY_TYPES.length],
  purpose: i % 3 === 0 ? "Locação" : "Venda",
  neighborhood: NEIGHBORHOODS[i % NEIGHBORHOODS.length],
  city: "São Paulo",
  bedrooms: 1 + (i % 4),
  bathrooms: 1 + (i % 3),
  area: 45 + i * 12,
  price: 380000 + i * 145000,
  status: ["Disponível", "Reservado", "Vendido", "Disponível", "Disponível"][i % 5],
  image: PROPERTY_IMAGES[i % PROPERTY_IMAGES.length],
  agentId: AGENTS[i % AGENTS.length].id,
  developer: i % 4 === 0 ? "Cyrela" : i % 4 === 1 ? "MRV" : i % 4 === 2 ? "Even" : "Independente",
  createdAt: new Date(Date.now() - i * 3.6e6 * 24 * 3).toISOString(),
}));

export const FUNNEL_STAGES = [
  { id: "s1", name: "Prospecção", color: "#6B7280", order: 1 },
  { id: "s2", name: "Contato", color: "#3B82F6", order: 2 },
  { id: "s3", name: "Visita agendada", color: "#8B5CF6", order: 3 },
  { id: "s4", name: "Proposta", color: "#F59E0B", order: 4 },
  { id: "s5", name: "Negociação", color: "#EC4899", order: 5 },
  { id: "s6", name: "Fechamento", color: "#22C55E", order: 6 },
  { id: "s7", name: "Perdido", color: "#EF4444", order: 7 },
];

export const FUNNELS = [
  { id: "f1", tenantId: "t1", name: "Funil de Vendas", stages: FUNNEL_STAGES.slice(0, 6), isDefault: true },
  { id: "f2", tenantId: "t1", name: "Funil de Locação", stages: FUNNEL_STAGES.slice(0, 5), isDefault: false },
];

export const DEALS = Array.from({ length: 18 }).map((_, i) => ({
  id: `d${i + 1}`,
  tenantId: "t1",
  funnelId: "f1",
  title: `${["Cobertura", "Apto", "Casa", "Sala"][i % 4]} — ${["Marina Costa", "Pedro Silva", "Juliana Reis", "Fernando Alves", "Carla Souza", "Ricardo Nunes"][i % 6]}`,
  clientName: ["Marina Costa", "Pedro Silva", "Juliana Reis", "Fernando Alves", "Carla Souza", "Ricardo Nunes"][i % 6],
  propertyId: PROPERTIES[i % PROPERTIES.length].id,
  propertyTitle: PROPERTIES[i % PROPERTIES.length].title,
  value: 500000 + i * 180000,
  stageId: FUNNEL_STAGES[i % 6].id,
  agentId: AGENTS[i % AGENTS.length].id,
  temperature: ["quente", "morno", "frio"][i % 3],
  daysInStage: Math.floor(1 + Math.random() * 14),
  probability: [15, 30, 50, 70, 85, 95, 0][i % 6],
  createdAt: new Date(Date.now() - i * 3.6e6 * 24 * 2).toISOString(),
  expectedClose: new Date(Date.now() + (10 + i) * 3.6e6 * 24).toISOString(),
}));

export const EVENTS = Array.from({ length: 8 }).map((_, i) => ({
  id: `e${i + 1}`,
  tenantId: "t1",
  title: ["Visita Cobertura Moema", "Reunião cliente Prime", "Assinatura de contrato", "Vistoria", "Ligação follow-up", "Almoço com investidor", "Apresentação empreendimento", "Fechamento negociação"][i],
  type: ["Visita", "Reunião", "Contrato", "Vistoria", "Ligação", "Reunião", "Reunião", "Fechamento"][i],
  agentId: AGENTS[i % AGENTS.length].id,
  clientName: CLIENTS[i % CLIENTS.length].name,
  date: new Date(Date.now() + (i - 2) * 3.6e6 * 24).toISOString(),
  duration: 60,
  location: NEIGHBORHOODS[i % NEIGHBORHOODS.length],
  status: i < 2 ? "concluído" : i < 4 ? "hoje" : "agendado",
}));

export const TRANSACTIONS = Array.from({ length: 20 }).map((_, i) => ({
  id: `tx${i + 1}`,
  tenantId: "t1",
  type: i % 2 === 0 ? "receita" : "despesa",
  category: i % 2 === 0
    ? ["Comissão venda", "Comissão locação", "Taxa administração", "Adiantamento"][i % 4]
    : ["Marketing", "Salários", "Aluguel escritório", "Impostos", "Fornecedores"][i % 5],
  description: i % 2 === 0 ? `Comissão negócio D-${i + 1}` : `Despesa operacional ${i + 1}`,
  amount: i % 2 === 0 ? 15000 + i * 3200 : -(2500 + i * 780),
  status: ["pago", "pendente", "atrasado"][i % 3],
  dueDate: new Date(Date.now() + (i - 8) * 3.6e6 * 24).toISOString(),
  agentId: AGENTS[i % AGENTS.length].id,
}));

export const NOTIFICATIONS = [
  { id: "n1", type: "lead", title: "Novo lead atribuído", desc: "Marina Costa foi atribuída a você via rodízio.", read: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: "n2", type: "deal", title: "Negócio parado há 7 dias", desc: "Cobertura Moema — Pedro Silva não teve movimentações.", read: false, createdAt: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: "n3", type: "event", title: "Visita em 30 minutos", desc: "Cliente Fernando Alves — Vila Olímpia.", read: false, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "n4", type: "finance", title: "Comissão paga", desc: "R$ 22.400 creditados na sua conta.", read: true, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: "n5", type: "system", title: "Backup diário concluído", desc: "Todos os dados foram sincronizados.", read: true, createdAt: new Date(Date.now() - 48 * 3600000).toISOString() },
];

/* Charts data */
export const SALES_TIMELINE = [
  { month: "Ago", vgv: 2100000, deals: 6, leads: 42 },
  { month: "Set", vgv: 2800000, deals: 8, leads: 55 },
  { month: "Out", vgv: 3200000, deals: 9, leads: 61 },
  { month: "Nov", vgv: 4100000, deals: 12, leads: 78 },
  { month: "Dez", vgv: 3900000, deals: 11, leads: 72 },
  { month: "Jan", vgv: 4700000, deals: 14, leads: 89 },
  { month: "Fev", vgv: 5250000, deals: 16, leads: 103 },
];

export const LEAD_SOURCES = [
  { name: "Instagram", value: 32 },
  { name: "Google Ads", value: 24 },
  { name: "Indicação", value: 18 },
  { name: "Facebook", value: 14 },
  { name: "Site próprio", value: 12 },
];

export const CASH_FLOW = [
  { month: "Ago", entradas: 180000, saidas: 92000 },
  { month: "Set", entradas: 210000, saidas: 105000 },
  { month: "Out", entradas: 245000, saidas: 118000 },
  { month: "Nov", entradas: 290000, saidas: 132000 },
  { month: "Dez", entradas: 268000, saidas: 128000 },
  { month: "Jan", entradas: 315000, saidas: 145000 },
  { month: "Fev", entradas: 358000, saidas: 156000 },
];

export const FUNNEL_CONVERSION = [
  { stage: "Prospecção", count: 320 },
  { stage: "Contato", count: 210 },
  { stage: "Visita", count: 128 },
  { stage: "Proposta", count: 72 },
  { stage: "Negociação", count: 41 },
  { stage: "Fechamento", count: 22 },
];

/* ---------- Automations ---------- */
export const TRIGGER_TYPES = [
  { key: "lead_created", label: "Novo lead criado", icon: "UserPlus", desc: "Quando um novo lead entra na base" },
  { key: "deal_stale", label: "Negócio parado", icon: "Clock", desc: "Quando um negócio fica X dias sem movimentação" },
  { key: "stage_changed", label: "Etapa do CRM alterada", icon: "MoveRight", desc: "Ao mover para uma etapa específica" },
  { key: "visit_scheduled", label: "Visita agendada", icon: "CalendarPlus", desc: "Quando uma nova visita é criada" },
  { key: "proposal_sent", label: "Proposta enviada", icon: "Send", desc: "Ao enviar uma proposta ao cliente" },
  { key: "birthday", label: "Aniversário do cliente", icon: "Cake", desc: "Todo ano na data de aniversário" },
  { key: "contract_expiring", label: "Contrato próximo do vencimento", icon: "AlertTriangle", desc: "N dias antes de expirar" },
];

export const ACTION_TYPES = [
  { key: "send_whatsapp", label: "Enviar WhatsApp", icon: "MessageSquare", color: "#22C55E" },
  { key: "send_email", label: "Enviar e-mail", icon: "Mail", color: "#3B82F6" },
  { key: "assign_agent", label: "Atribuir a corretor", icon: "UserCheck", color: "#8B5CF6" },
  { key: "move_stage", label: "Mover no funil", icon: "Kanban", color: "#EC4899" },
  { key: "create_task", label: "Criar tarefa na agenda", icon: "CalendarCheck", color: "#F59E0B" },
  { key: "notify_team", label: "Notificar equipe", icon: "Bell", color: "#06B6D4" },
  { key: "ai_message", label: "Gerar mensagem com IA", icon: "Sparkles", color: "#0F4C3A" },
  { key: "add_tag", label: "Adicionar tag", icon: "Tag", color: "#6B7280" },
];

export const AUTOMATIONS = [
  {
    id: "auto1",
    tenantId: "t1",
    name: "Boas-vindas ao lead novo",
    description: "Envia WhatsApp automático assim que um lead entra pela primeira vez.",
    active: true,
    trigger: { type: "lead_created", config: { origins: ["Instagram", "Google Ads"] } },
    conditions: [],
    actions: [
      { type: "send_whatsapp", config: { template: "Olá {nome}! Obrigada pelo contato via {origem}. Sou a Débora e vou te ajudar a encontrar o imóvel ideal.", delayMin: 0 } },
      { type: "assign_agent", config: { mode: "round_robin" } },
    ],
    stats: { runs: 128, success: 124, lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    createdAt: new Date(Date.now() - 45 * 3.6e6 * 24).toISOString(),
  },
  {
    id: "auto2",
    tenantId: "t1",
    name: "Alerta de negócio parado",
    description: "Avisa o corretor quando um negócio fica 7 dias sem movimentação.",
    active: true,
    trigger: { type: "deal_stale", config: { days: 7 } },
    conditions: [{ field: "temperature", op: "not_eq", value: "frio" }],
    actions: [
      { type: "notify_team", config: {} },
      { type: "ai_message", config: { channel: "whatsapp", tone: "cordial" } },
      { type: "create_task", config: { title: "Fazer follow-up urgente", dueInHours: 24 } },
    ],
    stats: { runs: 42, success: 41, lastRunAt: new Date(Date.now() - 6 * 3600000).toISOString() },
    createdAt: new Date(Date.now() - 30 * 3.6e6 * 24).toISOString(),
  },
  {
    id: "auto3",
    tenantId: "t1",
    name: "Parabenização de aniversário",
    description: "Envia mensagem personalizada no aniversário do cliente às 9h.",
    active: true,
    trigger: { type: "birthday", config: { time: "09:00" } },
    conditions: [],
    actions: [
      { type: "ai_message", config: { channel: "whatsapp", tone: "cordial" } },
      { type: "add_tag", config: { tag: "aniversariante" } },
    ],
    stats: { runs: 18, success: 18, lastRunAt: new Date(Date.now() - 24 * 3600000).toISOString() },
    createdAt: new Date(Date.now() - 90 * 3.6e6 * 24).toISOString(),
  },
  {
    id: "auto4",
    tenantId: "t1",
    name: "Follow-up após visita",
    description: "24h depois de uma visita, envia mensagem pedindo feedback e propondo proposta.",
    active: false,
    trigger: { type: "visit_scheduled", config: {} },
    conditions: [{ field: "status", op: "eq", value: "concluído" }],
    actions: [
      { type: "send_whatsapp", config: { template: "Oi {nome}, e aí, o que achou do imóvel? Posso preparar uma proposta?", delayMin: 1440 } },
    ],
    stats: { runs: 34, success: 30, lastRunAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString() },
    createdAt: new Date(Date.now() - 15 * 3.6e6 * 24).toISOString(),
  },
  {
    id: "auto5",
    tenantId: "t1",
    name: "Alerta de contrato vencendo",
    description: "45 dias antes do vencimento, notifica financeiro e cliente sobre renovação.",
    active: true,
    trigger: { type: "contract_expiring", config: { daysBefore: 45 } },
    conditions: [],
    actions: [
      { type: "send_email", config: { template: "renovacao_contrato" } },
      { type: "notify_team", config: {} },
      { type: "create_task", config: { title: "Preparar proposta de renovação", dueInHours: 168 } },
    ],
    stats: { runs: 6, success: 6, lastRunAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString() },
    createdAt: new Date(Date.now() - 60 * 3.6e6 * 24).toISOString(),
  },
];

export const AUTOMATION_TEMPLATES = [
  { id: "tpl1", name: "Boas-vindas WhatsApp", trigger: "lead_created", actions: ["send_whatsapp", "assign_agent"], category: "Captação", desc: "Recebe todo lead novo com mensagem instantânea + atribui via rodízio." },
  { id: "tpl2", name: "Resgate de negócio parado", trigger: "deal_stale", actions: ["ai_message", "notify_team"], category: "CRM", desc: "IA sugere follow-up e alerta o corretor após X dias sem interação." },
  { id: "tpl3", name: "Aniversário do cliente", trigger: "birthday", actions: ["ai_message"], category: "Relacionamento", desc: "Mensagem personalizada em cada aniversário, sem esquecer ninguém." },
  { id: "tpl4", name: "Pós-visita 24h", trigger: "visit_scheduled", actions: ["send_whatsapp"], category: "Vendas", desc: "Coleta feedback um dia após a visita e sugere próximo passo." },
  { id: "tpl5", name: "Renovação de aluguel", trigger: "contract_expiring", actions: ["send_email", "create_task"], category: "Locação", desc: "Aviso automático 45 dias antes do vencimento." },
  { id: "tpl6", name: "Ativação lead frio", trigger: "deal_stale", actions: ["send_whatsapp", "add_tag"], category: "CRM", desc: "Retoma contato com leads sem resposta há 30 dias com oferta." },
];

export const AUTOMATION_LOG = Array.from({ length: 12 }).map((_, i) => ({
  id: `log${i + 1}`,
  automationId: AUTOMATIONS[i % AUTOMATIONS.length].id,
  automationName: AUTOMATIONS[i % AUTOMATIONS.length].name,
  triggeredBy: ["Marina Costa", "Pedro Silva", "Juliana Reis", "Fernando Alves"][i % 4],
  status: i % 8 === 0 ? "falhou" : "sucesso",
  detail: i % 8 === 0 ? "Cliente sem telefone cadastrado" : "Executado com sucesso",
  at: new Date(Date.now() - i * 3600000 * 2).toISOString(),
}));
