import { create } from "zustand";
import { persist } from "zustand/middleware";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { TENANTS } from "@/lib/mockData";
import { auth, db, isFirebaseConfigured, COLLECTIONS } from "@/lib/firebase";

export const useAppStore = create(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: "light",
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setTheme: (theme) => { document.documentElement.classList.toggle("dark", theme === "dark"); set({ theme }); },
      toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),

      user: null,
      isAuthenticated: false,
      authLoading: false,
      authError: null,

      login: async (email, password) => {
        set({ authLoading: true, authError: null });
        try {
          if (!isFirebaseConfigured || !auth) {
            // Demo fallback until Firebase credentials are supplied.
            set({ user: { id: "u1", name: "Débora Almeida", email, roleId: "admin", originalRoleId: "admin", agentId: "a1", originalAgentId: "a1", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces&auto=format" }, isAuthenticated: true, activeTenantId: get().activeTenantId || "t1", authLoading: false });
            return;
          }
          const credential = await signInWithEmailAndPassword(auth, email, password);
          let profile = {};
          if (db) {
            const snap = await getDoc(doc(db, COLLECTIONS.users, credential.user.uid));
            if (snap.exists()) profile = snap.data();
            else await setDoc(doc(db, COLLECTIONS.users, credential.user.uid), { name: credential.user.displayName || email.split("@")[0], email, roleId: "corretor", tenantId: get().activeTenantId || "t1", createdAt: new Date().toISOString() }, { merge: true });
          }
          set({ user: { id: credential.user.uid, name: profile.name || credential.user.displayName || email.split("@")[0], email: credential.user.email || email, roleId: profile.roleId || "corretor", originalRoleId: profile.roleId || "corretor", agentId: profile.agentId || null, originalAgentId: profile.agentId || null, avatar: profile.avatar || credential.user.photoURL || null, ...profile }, isAuthenticated: true, activeTenantId: profile.tenantId || get().activeTenantId || "t1", authLoading: false });
        } catch (e) {
          const message = e?.code === "auth/invalid-credential" ? "E-mail ou senha inválidos." : (e?.message || "Não foi possível entrar.");
          set({ authLoading: false, authError: message });
          throw e;
        }
      },
      logout: async () => {
        if (isFirebaseConfigured && auth) await signOut(auth).catch(() => {});
        set({ user: null, isAuthenticated: false });
      },
      initializeAuthListener: () => {
        if (!isFirebaseConfigured || !auth) return () => {};
        return onAuthStateChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) { set({ user: null, isAuthenticated: false, authLoading: false }); return; }
          let profile = {};
          if (db) { const snap = await getDoc(doc(db, COLLECTIONS.users, firebaseUser.uid)); if (snap.exists()) profile = snap.data(); }
          set({ user: { id: firebaseUser.uid, name: profile.name || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuário", email: firebaseUser.email || "", roleId: profile.roleId || "corretor", originalRoleId: profile.roleId || "corretor", agentId: profile.agentId || null, originalAgentId: profile.agentId || null, avatar: profile.avatar || firebaseUser.photoURL || null, ...profile }, isAuthenticated: true, activeTenantId: profile.tenantId || get().activeTenantId || "t1", authLoading: false });
        });
      },
      setUserRole: (roleId) => set((state) => ({ user: state.user ? { ...state.user, roleId } : state.user })),
      setUserAgent: (agentId) => set((state) => ({ user: state.user ? { ...state.user, agentId } : state.user })),
      stopImpersonation: () => set((state) => ({ user: state.user ? { ...state.user, roleId: state.user.originalRoleId || "admin", agentId: state.user.originalAgentId || "a1" } : state.user })),

      tenants: TENANTS,
      activeTenantId: "t1",
      setActiveTenant: (id) => set({ activeTenantId: id }),
      globalPeriod: "30d",
      setGlobalPeriod: (p) => set({ globalPeriod: p }),
    }),
    { name: "debora-ai-app", partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, theme: state.theme, user: state.user, isAuthenticated: state.isAuthenticated, activeTenantId: state.activeTenantId, globalPeriod: state.globalPeriod }) }
  )
);
