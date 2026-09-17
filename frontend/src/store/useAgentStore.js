/**
 * useAgentStore — orquestra o Agente Autônomo de Atendimento.
 *
 * Responsabilidades:
 *  1. Guardar conversas, mensagens e o log de ações do agente.
 *  2. Decidir quem executa o turno: backend (OpenAI + function calling) ou
 *     motor local determinístico, quando o backend estiver offline.
 *  3. Aplicar no CRM as ações que o agente tomou — é isso que faz o agente
 *     "operar sozinho" de verdade: ele agenda na Agenda, move no Kanban,
 *     cria o negócio, lança a comissão no Financeiro e marca o imóvel como
 *     vendido no Inventário.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useDataStore } from "@/store/useDataStore";
import { useAppStore } from "@/store/useAppStore";
import {
  DEFAULT_AGENT_CONFIG,
  INITIAL_STATE,
  localTurn,
  localSimulatedLead,
} from "@/lib/agentEngine";
import { agentHealth, agentStart, agentReply, agentFollowup, simulateLead } from "@/lib/agentApi";
import { seedConversations } from "@/lib/agentSeed";

const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const nowIso = () => new Date().toISOString();

/** Etapa do agente -> etapa do funil do CRM (FUNNEL_STAGES). */
const STAGE_TO_FUNNEL = {
  abordagem: "s1",
  qualificacao: "s2",
  apresentacao: "s2",
  visita: "s3",
  proposta: "s4",
  negociacao: "s5",
  fechamento: "s6",
  perdido: "s7",
  humano: "s5",
};

export const useAgentStore = create(
  persist(
    (set, get) => ({
      config: DEFAULT_AGENT_CONFIG,
      conversations: seedConversations(),
      activeId: null,
      backendOnline: false,
      backendChecked: false,
      thinking: {}, // { [conversationId]: boolean }

      /* ------------------------------------------------------------------ */
      /* Infra                                                               */
      /* ------------------------------------------------------------------ */

      checkBackend: async () => {
        try {
          const h = await agentHealth();
          set({ backendOnline: !!h.online, backendChecked: true });
          return !!h.online;
        } catch {
          set({ backendOnline: false, backendChecked: true });
          return false;
        }
      },

      updateConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
      resetConfig: () => set({ config: DEFAULT_AGENT_CONFIG }),
      setActive: (id) =>
        set((s) => ({
          activeId: id,
          conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
        })),

      _setThinking: (id, v) => set((s) => ({ thinking: { ...s.thinking, [id]: v } })),

      _patchConv: (id, patch) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, ...(typeof patch === "function" ? patch(c) : patch), updatedAt: nowIso() } : c
          ),
        })),

      /* ------------------------------------------------------------------ */
      /* Ciclo de vida da conversa                                           */
      /* ------------------------------------------------------------------ */

      /** Cria a conversa e faz o agente abordar o lead sozinho. */
      startConversation: async (lead, { channel = "whatsapp" } = {}) => {
        const id = uid("conv");
        const conv = {
          id,
          tenantId: lead.tenantId || "t1",
          leadId: lead.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          channel,
          autopilot: true,
          messages: [],
          actions: [],
          state: { ...INITIAL_STATE },
          dealId: null,
          unread: 0,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((s) => ({ conversations: [conv, ...s.conversations], activeId: id }));
        await get()._runTurn(id, "outbound");
        return id;
      },

      /** Mensagem recebida do lead (canal real ou simulador). */
      receiveLeadMessage: async (id, text) => {
        get()._patchConv(id, (c) => ({
          messages: [...c.messages, { id: uid("m"), role: "lead", text, at: nowIso() }],
        }));
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv?.autopilot || conv?.state?.encerrada) return;
        await get()._runTurn(id, "inbound");
      },

      /** Cadência automática — o lead ficou em silêncio. */
      runFollowup: async (id) => {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv || conv.state.encerrada) return;
        if ((conv.state.followups || 0) >= get().config.followupsMax) return;
        await get()._runTurn(id, "followup");
      },

      /** Dispara follow-up em todas as conversas cujo horário venceu. */
      tickFollowups: async () => {
        const due = get().conversations.filter(
          (c) =>
            c.autopilot &&
            !c.state.encerrada &&
            c.state.proximoFollowup &&
            new Date(c.state.proximoFollowup) <= new Date()
        );
        for (const c of due) await get().runFollowup(c.id);
        return due.length;
      },

      /** Mensagem escrita por um humano dentro da conversa (assume o controle). */
      sendHumanMessage: (id, text) => {
        get()._patchConv(id, (c) => ({
          autopilot: false,
          messages: [...c.messages, { id: uid("m"), role: "agente", text, at: nowIso(), human: true }],
          actions: [
            { id: uid("act"), tipo: "mensagem", resumo: "Mensagem enviada por humano", payload: { text }, at: nowIso() },
            ...c.actions,
          ],
        }));
      },

      toggleAutopilot: (id) =>
        get()._patchConv(id, (c) => ({ autopilot: !c.autopilot })),

      takeOver: (id) =>
        get()._patchConv(id, (c) => ({
          autopilot: false,
          state: { ...c.state, stage: "humano" },
          actions: [
            { id: uid("act"), tipo: "escalonamento", resumo: "Corretor assumiu manualmente", payload: {}, at: nowIso() },
            ...c.actions,
          ],
        })),

      deleteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
        })),

      /* ------------------------------------------------------------------ */
      /* Núcleo: executa um turno do agente                                  */
      /* ------------------------------------------------------------------ */

      _runTurn: async (id, mode) => {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv) return;
        const { config, backendOnline, backendChecked } = get();
        if (!backendChecked) await get().checkBackend();

        const data = useDataStore.getState();
        const tenantId = useAppStore.getState().activeTenantId || conv.tenantId;
        const lead =
          data.leads.find((l) => l.id === conv.leadId) || {
            id: conv.leadId,
            name: conv.leadName,
            phone: conv.leadPhone,
          };
        const inventory = data.properties.filter((p) => p.tenantId === tenantId);

        get()._setThinking(id, true);
        try {
          const ctx = {
            conversationId: id,
            config,
            lead,
            inventory,
            history: conv.messages,
            state: conv.state,
          };

          let result;
          if (get().backendOnline) {
            const fn = mode === "outbound" ? agentStart : mode === "followup" ? agentFollowup : agentReply;
            try {
              result = await fn(ctx);
            } catch (e) {
              console.warn("Agente backend indisponível, usando motor local:", e?.message);
              set({ backendOnline: false });
              result = localTurn({ ...ctx, mode });
            }
          } else {
            // Latência simulada só para a conversa não aparecer instantânea demais.
            await new Promise((r) => setTimeout(r, 450));
            result = localTurn({ ...ctx, mode });
          }

          const newMessages = (result.messages || []).map((text) => ({
            id: uid("m"),
            role: "agente",
            text,
            at: nowIso(),
          }));
          const nonMessageActions = (result.actions || []).filter((a) => a.tipo !== "mensagem");

          get()._patchConv(id, (c) => ({
            messages: [...c.messages, ...newMessages],
            actions: [...nonMessageActions.reverse(), ...c.actions],
            state: result.state,
          }));

          get()._applyToCrm(id, nonMessageActions, result.state);
          return result;
        } finally {
          get()._setThinking(id, false);
        }
      },

      /* ------------------------------------------------------------------ */
      /* Efeitos no CRM — o agente operando o sistema sozinho                */
      /* ------------------------------------------------------------------ */

      _applyToCrm: (id, actions, state) => {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv) return;
        const data = useDataStore.getState();
        const tenantId = useAppStore.getState().activeTenantId || conv.tenantId;
        const lead = data.leads.find((l) => l.id === conv.leadId);
        const agentId = lead?.agentId || data.agents.find((a) => a.tenantId === tenantId && a.active)?.id;

        const ensureDeal = (extra = {}) => {
          const current = get().conversations.find((c) => c.id === id);
          if (current?.dealId) {
            data.updateDeal(current.dealId, extra);
            return current.dealId;
          }
          const dealId = uid("d");
          data.addDeal({
            id: dealId,
            tenantId,
            funnelId: "f1",
            title: `${state.proposta?.imovelTitulo || state.qualificacao?.tipoImovel || "Oportunidade"} — ${conv.leadName}`,
            clientName: conv.leadName,
            propertyId: state.proposta?.imovelId || state.imoveisApresentados?.[0] || null,
            propertyTitle: state.proposta?.imovelTitulo || null,
            value: state.proposta?.valor || state.qualificacao?.orcamento || lead?.budget || 0,
            stageId: STAGE_TO_FUNNEL[state.stage] || "s1",
            agentId,
            temperature: "quente",
            daysInStage: 0,
            probability: 30,
            origem: "Agente IA",
            createdAt: nowIso(),
            ...extra,
          });
          get()._patchConv(id, { dealId });
          return dealId;
        };

        actions.forEach((a) => {
          switch (a.tipo) {
            case "qualificacao": {
              if (!lead) break;
              data.updateLead(lead.id, {
                status: "Qualificado",
                score: state.qualificacao?.score || lead.score,
                budget: state.qualificacao?.orcamento || lead.budget,
                interest: state.qualificacao?.tipoImovel || lead.interest,
                qualifiedByAI: true,
              });
              ensureDeal({ stageId: STAGE_TO_FUNNEL[state.stage] });
              break;
            }

            case "mover_etapa": {
              const dealId = ensureDeal();
              data.moveDeal(dealId, STAGE_TO_FUNNEL[a.payload?.etapa || state.stage] || "s1");
              break;
            }

            case "agendar_visita": {
              const when = a.payload?.data || state.visita?.data;
              data.addEvent({
                tenantId,
                title: `Visita — ${state.visita?.imovelTitulo || conv.leadName}`,
                type: "Visita",
                agentId,
                clientName: conv.leadName,
                date: when,
                duration: a.payload?.duracao || 60,
                location: state.visita?.imovelTitulo || "—",
                status: "agendado",
                createdByAI: true,
              });
              const dealId = ensureDeal();
              data.moveDeal(dealId, "s3");
              break;
            }

            case "proposta": {
              const dealId = ensureDeal({
                value: a.payload?.valor,
                propertyId: a.payload?.imovelId,
                propertyTitle: a.payload?.imovelTitulo,
                probability: 70,
              });
              data.moveDeal(dealId, "s4");
              break;
            }

            case "desconto": {
              const dealId = ensureDeal({ value: a.payload?.proposta?.valor, probability: 80 });
              data.moveDeal(dealId, "s5");
              break;
            }

            case "venda": {
              const valor = a.payload?.valorFinal || a.payload?.valor_final || 0;
              const dealId = ensureDeal({ value: valor, probability: 100 });
              data.moveDeal(dealId, "s6");

              if (a.payload?.imovelId) {
                data.updateProperty(a.payload.imovelId, { status: "Vendido" });
              }
              if (lead) data.updateLead(lead.id, { status: "Convertido" });

              data.addClient({
                tenantId,
                name: conv.leadName,
                phone: conv.leadPhone,
                email: lead?.email,
                type: state.qualificacao?.finalidade === "investimento" ? "Investidor" : "Comprador",
                agentId,
                totalValue: valor,
                properties: 1,
                origem: "Agente IA",
              });

              data.addTransaction({
                tenantId,
                type: "receita",
                category: "Comissão venda",
                description: `Comissão — venda fechada pelo Agente IA (${conv.leadName})`,
                amount: Math.round(valor * 0.06),
                status: "pendente",
                dueDate: new Date(Date.now() + 30 * 864e5).toISOString(),
                agentId,
              });
              break;
            }

            case "escalonamento": {
              get()._patchConv(id, { autopilot: false });
              break;
            }

            case "perdido": {
              const dealId = ensureDeal();
              data.moveDeal(dealId, "s7");
              if (lead) data.updateLead(lead.id, { status: "Sem interesse" });
              break;
            }

            default:
              break;
          }
        });
      },

      /* ------------------------------------------------------------------ */
      /* Simulador — testa o agente de ponta a ponta sem cliente real         */
      /* ------------------------------------------------------------------ */

      simulateNextLeadReply: async (id, dificuldade = "medio") => {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv || conv.state.encerrada) return null;
        const lastAgent = [...conv.messages].reverse().find((m) => m.role === "agente")?.text || "";
        let text;
        if (get().backendOnline) {
          try {
            const lead = useDataStore.getState().leads.find((l) => l.id === conv.leadId) || {
              id: conv.leadId,
              name: conv.leadName,
            };
            text = await simulateLead({ lead, history: conv.messages, dificuldade });
          } catch {
            text = localSimulatedLead(conv.state, dificuldade, lastAgent);
          }
        } else {
          text = localSimulatedLead(conv.state, dificuldade, lastAgent);
        }
        await get().receiveLeadMessage(id, text);
        return text;
      },

      /** Roda a conversa inteira sozinha: agente <-> lead simulado até venda/handoff. */
      autoRun: async (id, { dificuldade = "medio", maxTurnos = 10 } = {}) => {
        for (let i = 0; i < maxTurnos; i += 1) {
          const conv = get().conversations.find((c) => c.id === id);
          if (!conv || conv.state.encerrada || !conv.autopilot) break;
          await get().simulateNextLeadReply(id, dificuldade);
          await new Promise((r) => setTimeout(r, 350));
        }
        return get().conversations.find((c) => c.id === id)?.state;
      },

      /* ------------------------------------------------------------------ */
      /* Métricas                                                            */
      /* ------------------------------------------------------------------ */

      metrics: () => {
        const cs = get().conversations;
        const vendas = cs.filter((c) => c.state.stage === "fechamento");
        const receita = vendas.reduce(
          (sum, c) => sum + (c.actions.find((a) => a.tipo === "venda")?.payload?.valorFinal || c.state.proposta?.valor || 0),
          0
        );
        const visitas = cs.filter((c) => c.actions.some((a) => a.tipo === "agendar_visita")).length;
        const ativas = cs.filter((c) => !c.state.encerrada).length;
        const escalados = cs.filter((c) => c.state.stage === "humano").length;
        const acoes = cs.reduce((n, c) => n + c.actions.length, 0);
        return {
          ativas,
          total: cs.length,
          visitas,
          vendas: vendas.length,
          receita,
          escalados,
          acoes,
          conversao: cs.length ? Math.round((vendas.length / cs.length) * 100) : 0,
          ticketMedio: vendas.length ? Math.round(receita / vendas.length) : 0,
        };
      },
    }),
    {
      name: "debora-agent",
      partialize: (s) => ({ config: s.config, conversations: s.conversations }),
    }
  )
);
