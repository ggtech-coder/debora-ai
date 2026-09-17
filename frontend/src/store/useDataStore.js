import { create } from "zustand";
import {
  LEADS, CLIENTS, PROPERTIES, DEALS, EVENTS, TRANSACTIONS,
  NOTIFICATIONS, AGENTS, TEAMS, FUNNELS, FUNNEL_STAGES,
  AUTOMATIONS, AUTOMATION_LOG,
} from "@/lib/mockData";
import { COLLECTIONS } from "@/lib/firebase";
import { getCollection, saveDocument, patchDocument, removeDocument, seedCollection } from "@/lib/firestore";

const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const persist = (collection, data) => saveDocument(collection, data).catch((e) => console.error(`Firebase ${collection}:`, e));
const patch = (collection, id, data) => patchDocument(collection, id, data).catch((e) => console.error(`Firebase ${collection}:`, e));
const remove = (collection, id) => removeDocument(collection, id).catch((e) => console.error(`Firebase ${collection}:`, e));

const INITIAL = {
  leads: LEADS, clients: CLIENTS, properties: PROPERTIES, deals: DEALS, events: EVENTS,
  transactions: TRANSACTIONS, notifications: NOTIFICATIONS, agents: AGENTS, teams: TEAMS,
  funnels: FUNNELS, stages: FUNNEL_STAGES, automations: AUTOMATIONS, automationLog: AUTOMATION_LOG,
};

const COLLECTION_FOR = {
  leads: COLLECTIONS.leads, clients: COLLECTIONS.clients, properties: COLLECTIONS.properties,
  deals: COLLECTIONS.deals, events: COLLECTIONS.events, transactions: COLLECTIONS.transactions,
  notifications: COLLECTIONS.notifications, agents: COLLECTIONS.agents, teams: COLLECTIONS.teams,
  funnels: COLLECTIONS.funnels, automations: COLLECTIONS.automations, automationLog: COLLECTIONS.automationLog,
};

export const useDataStore = create((set, get) => ({
  ...INITIAL,
  stages: FUNNEL_STAGES,
  firebaseReady: false,
  loadingData: false,

  hydrateFromFirebase: async () => {
    if (get().firebaseReady || get().loadingData) return;
    set({ loadingData: true });
    try {
      const entries = await Promise.all(Object.entries(COLLECTION_FOR).map(async ([stateKey, collection]) => {
        const records = await getCollection(collection);
        return [stateKey, records];
      }));
      const updates = {};
      for (const [stateKey, records] of entries) {
        if (records.length) updates[stateKey] = records;
        else await seedCollection(COLLECTION_FOR[stateKey], INITIAL[stateKey]);
      }
      set({ ...updates, firebaseReady: true });
    } catch (e) {
      console.error("Falha ao carregar Firestore; mantendo dados demo locais:", e);
    } finally {
      set({ loadingData: false });
    }
  },

  addAutomation: (data) => {
    const item = { id: uid("auto"), active: true, conditions: [], actions: [], stats: { runs: 0, success: 0, lastRunAt: null }, createdAt: new Date().toISOString(), ...data };
    set((s) => ({ automations: [item, ...s.automations] })); persist(COLLECTIONS.automations, item);
  },
  updateAutomation: (id, patchData) => { set((s) => ({ automations: s.automations.map((a) => a.id === id ? { ...a, ...patchData } : a) })); patch(COLLECTIONS.automations, id, patchData); },
  toggleAutomation: (id) => { const a = get().automations.find((x) => x.id === id); if (!a) return; const p = { active: !a.active }; set((s) => ({ automations: s.automations.map((x) => x.id === id ? { ...x, ...p } : x) })); patch(COLLECTIONS.automations, id, p); },
  deleteAutomation: (id) => { set((s) => ({ automations: s.automations.filter((a) => a.id !== id) })); remove(COLLECTIONS.automations, id); },
  runAutomation: (id) => {
    const auto = get().automations.find((a) => a.id === id); if (!auto) return;
    const stats = { ...auto.stats, runs: (auto.stats?.runs || 0) + 1, success: (auto.stats?.success || 0) + 1, lastRunAt: new Date().toISOString() };
    const log = { id: uid("log"), automationId: auto.id, automationName: auto.name, triggeredBy: "Execução manual", status: "sucesso", detail: "Rodou manualmente pelo painel", at: new Date().toISOString() };
    set((s) => ({ automations: s.automations.map((a) => a.id === id ? { ...a, stats } : a), automationLog: [log, ...s.automationLog].slice(0, 200) }));
    patch(COLLECTIONS.automations, id, { stats }); persist(COLLECTIONS.automationLog, log);
  },

  byTenant: (collectionName, tenantId) => (get()[collectionName] || []).filter((item) => item.tenantId === tenantId),

  addLead: (data) => { const item = { id: uid("l"), createdAt: new Date().toISOString(), score: 50, ...data }; set((s) => ({ leads: [item, ...s.leads] })); persist(COLLECTIONS.leads, item); },
  updateLead: (id, p) => { set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, ...p } : l) })); patch(COLLECTIONS.leads, id, p); },
  deleteLead: (id) => { set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })); remove(COLLECTIONS.leads, id); },
  rotateLeads: (tenantId) => {
    const activeAgents = get().agents.filter((a) => a.tenantId === tenantId && a.active); if (!activeAgents.length) return 0; let assigned = 0; const changed = [];
    set((s) => ({ leads: s.leads.map((lead) => { if (lead.tenantId !== tenantId || lead.status !== "Novo") return lead; const next = { ...lead, agentId: activeAgents[assigned % activeAgents.length].id, status: "Contatado" }; changed.push(next); assigned++; return next; }) }));
    changed.forEach((x) => persist(COLLECTIONS.leads, x)); return assigned;
  },

  addClient: (data) => { const item = { id: uid("c"), createdAt: new Date().toISOString(), ...data }; set((s) => ({ clients: [item, ...s.clients] })); persist(COLLECTIONS.clients, item); },
  updateClient: (id, p) => { set((s) => ({ clients: s.clients.map((c) => c.id === id ? { ...c, ...p } : c) })); patch(COLLECTIONS.clients, id, p); },
  deleteClient: (id) => { set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })); remove(COLLECTIONS.clients, id); },

  addProperty: (data) => { const item = { id: uid("p"), createdAt: new Date().toISOString(), ...data }; set((s) => ({ properties: [item, ...s.properties] })); persist(COLLECTIONS.properties, item); },
  updateProperty: (id, p) => { set((s) => ({ properties: s.properties.map((x) => x.id === id ? { ...x, ...p } : x) })); patch(COLLECTIONS.properties, id, p); },
  deleteProperty: (id) => { set((s) => ({ properties: s.properties.filter((x) => x.id !== id) })); remove(COLLECTIONS.properties, id); },

  addDeal: (data) => { const item = { id: uid("d"), createdAt: new Date().toISOString(), ...data }; set((s) => ({ deals: [item, ...s.deals] })); persist(COLLECTIONS.deals, item); },
  updateDeal: (id, p) => { set((s) => ({ deals: s.deals.map((d) => d.id === id ? { ...d, ...p } : d) })); patch(COLLECTIONS.deals, id, p); },
  moveDeal: (id, stageId) => { const p = { stageId, daysInStage: 0 }; set((s) => ({ deals: s.deals.map((d) => d.id === id ? { ...d, ...p } : d) })); patch(COLLECTIONS.deals, id, p); },
  deleteDeal: (id) => { set((s) => ({ deals: s.deals.filter((d) => d.id !== id) })); remove(COLLECTIONS.deals, id); },

  addEvent: (data) => { const item = { id: uid("e"), ...data }; set((s) => ({ events: [item, ...s.events] })); persist(COLLECTIONS.events, item); },
  deleteEvent: (id) => { set((s) => ({ events: s.events.filter((e) => e.id !== id) })); remove(COLLECTIONS.events, id); },
  addTransaction: (data) => { const item = { id: uid("tx"), ...data }; set((s) => ({ transactions: [item, ...s.transactions] })); persist(COLLECTIONS.transactions, item); },
  deleteTransaction: (id) => { set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })); remove(COLLECTIONS.transactions, id); },

  markAllRead: () => { const items = get().notifications; set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })); items.forEach((n) => patch(COLLECTIONS.notifications, n.id, { read: true })); },
  markRead: (id) => { set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })); patch(COLLECTIONS.notifications, id, { read: true }); },

  addStage: (funnelId, name) => {
    const funnel = get().funnels.find((f) => f.id === funnelId); if (!funnel) return;
    const stages = [...funnel.stages, { id: uid("s"), name, color: "#6B7280", order: funnel.stages.length + 1 }];
    set((s) => ({ funnels: s.funnels.map((f) => f.id === funnelId ? { ...f, stages } : f) })); patch(COLLECTIONS.funnels, funnelId, { stages });
  },
  reorderStages: (funnelId, stages) => { set((s) => ({ funnels: s.funnels.map((f) => f.id === funnelId ? { ...f, stages } : f) })); patch(COLLECTIONS.funnels, funnelId, { stages }); },
}));
