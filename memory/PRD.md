# Débora.ai — ERP SaaS para Corretoras de Imóveis

## Problem Statement (Original)
MVP moderno de ERP SaaS multi-tenant para corretoras de imóveis com Dashboard, Relatórios, Modo TV, Leads, Rodízio, CRM (Kanban + Lista), Clientes, Inventário, Agenda, Financeiro, Configurações, Personalizações, Notificações, Meu Plano, Minha Conta, Admin Master, Pipeline de Documentos + placeholders para Atendimento, WhatsApp, Instagram, Marketing, Automações, IA, Sites, Chatbot.

## Architecture
- **Frontend**: React 19 (CRA) + Tailwind CSS + shadcn/ui + Lucide + Recharts + dnd-kit + Zustand + React Router 7
- **Data layer**: Zustand stores (`useAppStore`, `useDataStore`) com dados mockados (rich Brazilian real estate seed) persistidos em localStorage
- **Multi-tenant**: `activeTenantId` no `useAppStore`, todo `filter(item.tenantId === activeTenantId)`
- **Themes**: light (verde floresta/dourado) + dark, controlado por `next-themes`-style classe `dark`
- **Firebase**: estrutura preparada em `lib/firebase.js` com `firebaseConfig` + `COLLECTIONS` — precisa das credenciais do usuário para ativar
- **Backend**: FastAPI + MongoDB permanece disponível (não usado ainda no MVP)

## User Personas
1. **Diretor/Gestor da corretora** — visão consolidada em dashboards, ranking, metas
2. **Corretor** — CRM Kanban, leads atribuídos, agenda, comissões
3. **Financeiro** — fluxo de caixa, contas, comissões
4. **Admin da plataforma (SaaS)** — Admin Master, MRR, churn, empresas

## Implemented (Fev/2026)
- Layout: Sidebar recolhível (agrupada em 6 seções), Topbar com glassmorphism, breadcrumbs, busca global, seletor de período, notificações, user menu, seletor de tenant
- **Dashboard**: 4 KPIs bento, gráficos VGV/Origem leads/Funil, ranking corretores, meta, alertas prioritários, ações rápidas
- **Relatórios**: Executivo/Comercial/Financeiro/Marketing/CRM/Imóveis/Corretores + export PDF/Excel + IA
- **Modo TV**: 4 slides fullscreen com rotação automática (8s), dark forçado, botão voltar
- **Leads**: cadastro, filtros (status/origem/busca), tabela completa, score, rodízio 1-click
- **Rodízio**: pesos por corretor, regras, limite diário, horário, histórico
- **CRM**: Kanban drag-and-drop funcional (dnd-kit) + Lista, múltiplos funis, toast em movimentação
- **Clientes**: cards, tipos, corretor responsável, total investido
- **Inventário**: grid de cards com imagens, filtros de tipo/finalidade, status coloridos
- **Agenda**: calendário shadcn + lista de eventos com tipo, cliente, corretor
- **Financeiro**: 4 KPIs, fluxo de caixa (Recharts), tabelas por tipo (Todas/Receber/Pagar/Comissões)
- **Configurações**: 10 abas (Gerais, Usuários, Equipes, Permissões, Segurança, API, Integrações, Webhooks, Auditoria, Notificações)
- **Personalizações**: campos, origens, funis, interface, dashboard, TV
- **Notificações**: central com abas todas/não lidas/lidas
- **Meu Plano**: plano atual, upgrade, faturas
- **Minha Conta**: perfil, 2FA, sessões, logout
- **Admin Master**: KPIs SaaS (MRR/Churn/LTV), listagem de tenants com "assumir empresa"
- **Documentos**: pipeline de upload, status por documento, organização por cliente
- **Atendimento**: agente autônomo (SDR + closer) — conduz lead até a venda, com tool-calling, guardrails de desconto/ticket, cadência de follow-up, escalonamento e simulador
- **Placeholders (rotas + UI prontas)**: WhatsApp, Instagram, Chatbot, Marketing, Automações, IA, Sites

## P0/P1/P2 Backlog
- **P0** — Integração real com validar Firebase Auth/Firestore/Storage após preencher as credenciais
- **P0** — Testing subagent completo em todos os fluxos
- **P1** — Detalhe (drawer) de Lead/Cliente/Deal/Imóvel com timeline e histórico completo
- **P1** — Criar/editar/reordenar funis e etapas com dnd-kit
- **P1** — Conectar o agente autônomo aos webhooks reais do WhatsApp Business/Instagram e persistir conversas no Firestore
- **P2** — IA (Débora Copilot) via OpenAI API: sugestões, follow-ups, movimentações
- **P2** — Sites/portais próprios sincronizados
- **P2** — Assinatura eletrônica de contratos

## Credentials (Demo)
- Email: `debora@prime.com`
- Senha: `demo1234`
- Qualquer email/senha faz login (auth mockada)
