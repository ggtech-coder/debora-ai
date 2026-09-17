# Débora.ai — projeto independente

Este projeto foi preparado para rodar sem a plataforma Emergent.

## Removido
- infraestrutura e scripts `.emergent`
- integração `@emergentbase/visual-edits`
- `emergentintegrations`
- scripts/telemetria hospedados em `emergent.sh`
- branding da plataforma no HTML

## IA
O Copilot agora usa a API oficial da OpenAI diretamente pelo backend FastAPI.

Configure em `backend/.env`:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (padrão: `gpt-5.6-luna`)

A chave da OpenAI não deve ser colocada no frontend.

## Rodar o backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

## Rodar o frontend

Use Yarn (o projeto já vem travado nessa ferramenta via `packageManager`/`resolutions` — `npm install` quebra o build por conflito de versão do `ajv`):

```bash
cd frontend
corepack enable
yarn install
yarn start
```

Para gerar os arquivos estáticos prontos para hospedar (ex: GitHub Pages):

```bash
yarn build
```

Os arquivos ficam em `frontend/build/` — é essa pasta que deve ser enviada para o GitHub Pages.

Crie `frontend/.env` a partir de `.env.example`.

## Próxima etapa recomendada

O MVP ainda usa MongoDB/localStorage em partes do sistema. Para transformar o projeto em SaaS comercial, a próxima migração recomendada é:

- Supabase/PostgreSQL para dados persistentes
- Supabase Auth para autenticação
- Row Level Security para isolamento por empresa (multi-tenant)
- Supabase Storage para documentos
- OpenAI API para o Copilot

Esta versão limpa não migra automaticamente os dados para Supabase para evitar alterar a lógica funcional do MVP sem uma migração de esquema planejada.

## Configuração do Firebase

1. Crie um projeto no Firebase Console e adicione um Web App.
2. Ative Authentication (Email/Password), Firestore Database e Storage.
3. Copie `frontend/.env.example` para `frontend/.env` e preencha os valores do Web App.
4. Rode `npm install` e `npm start` dentro de `frontend/`.

Sem credenciais reais, o aplicativo permanece em modo demo/local para facilitar testes. Com Firebase configurado, as coleções de dados passam a ser carregadas e persistidas no Firestore.

## Atendimento — Agente Autônomo (novo)

O módulo `/inbox` deixou de ser placeholder. Ele agora roda um agente que conduz o lead
do primeiro contato até a venda **sem corretor no meio**:

`abordagem → qualificação → apresentação → visita → proposta → negociação → fechamento`

O agente não só responde: ele **opera o sistema**. Cada ação altera dados reais —

| Ação do agente | Efeito no ERP |
|---|---|
| Qualificar | Atualiza o lead (score, orçamento, status "Qualificado") |
| Buscar imóvel | Consulta e ranqueia o Inventário real do tenant |
| Agendar visita | Cria o evento na Agenda com corretor, imóvel e horário |
| Enviar proposta | Cria/atualiza o negócio no CRM e move para "Proposta" |
| Aplicar desconto | Só dentro do limite; acima disso bloqueia e escala |
| Fechar venda | Move para "Fechamento", converte o lead em Cliente, marca o imóvel como Vendido e lança a comissão no Financeiro |
| Escalar | Devolve para um humano com briefing do caso |

### Guardrails (tela Atendimento → "Configurar agente")
- Desconto máximo (%) e ticket máximo que o agente pode fechar sozinho
- Nível de autonomia: só sugerir · responder sem fechar · total até a venda
- Agressividade comercial (1 a 5), tom e persona
- Horário de atendimento, número e intervalo dos follow-ups
- Lista de condições que obrigam escalonamento para humano

### Como funciona por baixo
- **Com backend ligado**: `backend/agent.py` usa a OpenAI com *function calling*. O modelo
  decide qual ferramenta chamar; o servidor executa de forma determinística e aplica os
  guardrails (o modelo não consegue furar o limite de desconto nem o teto de ticket).
- **Sem backend/chave**: `frontend/src/lib/agentEngine.js` assume com uma máquina de estados
  equivalente, para que o módulo continue demonstrável e testável offline. A tela mostra
  qual motor está ativo ("IA conectada" x "Motor local").

### Endpoints
```
GET  /api/agent/health          # status, modelo e ferramentas disponíveis
POST /api/agent/start           # agente aborda o lead sozinho
POST /api/agent/reply           # lead respondeu -> próximo passo
POST /api/agent/followup        # cadência automática (lead em silêncio)
POST /api/agent/simulate-lead   # lead fictício para testes ponta a ponta
```

Variáveis novas em `backend/.env`: `OPENAI_AGENT_MODEL` (opcional, cai em `OPENAI_MODEL`).

### Testando
Na tela Atendimento: **Novo atendimento** → escolha um lead → o agente manda a primeira
mensagem sozinho. Depois use **"Rodar sozinho até a venda"** com perfil de lead fácil,
médio ou difícil. Com lead difícil o agente corretamente recusa o desconto de 12% e
escala para um humano.

### Para produção (o que falta plugar)
1. Webhook do WhatsApp Business/Instagram chamando `POST /api/agent/reply`.
2. Persistir conversas no Firestore (`agentConversations`) em vez de localStorage.
3. Um worker (cron) chamando a cadência de follow-up em vez do botão "Rodar cadência".
