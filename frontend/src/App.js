import React, { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import "@/App.css";

import AppLayout from "@/layouts/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Reports from "@/pages/Reports";
import TVMode from "@/pages/TVMode";
import Leads from "@/pages/Leads";
import LeadRotation from "@/pages/LeadRotation";
import CRM from "@/pages/CRM";
import Clients from "@/pages/Clients";
import Inventory from "@/pages/Inventory";
import Calendar from "@/pages/Calendar";
import Finance from "@/pages/Finance";
import Settings from "@/pages/Settings";
import Customization from "@/pages/Customization";
import Notifications from "@/pages/Notifications";
import MyPlan from "@/pages/MyPlan";
import MyAccount from "@/pages/MyAccount";
import AdminMaster from "@/pages/AdminMaster";
import Documents from "@/pages/Documents";
import Automations from "@/pages/Automations";
import Atendimento from "@/pages/Atendimento";
import Placeholder from "@/pages/Placeholder";

function App() {
  const { theme, initializeAuthListener } = useAppStore();
  const hydrateFromFirebase = useDataStore((state) => state.hydrateFromFirebase);

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    hydrateFromFirebase();
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.title = "Débora.ai — ERP para Corretoras";
    return typeof unsubscribe === "function" ? unsubscribe : undefined;
  }, [theme, initializeAuthListener, hydrateFromFirebase]);

  return (
    <div className="App">
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tv" element={<TVMode />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/lead-rotation" element={<LeadRotation />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/inbox" element={<Atendimento />} />
            <Route path="/whatsapp" element={<Placeholder moduleKey="whatsapp" />} />
            <Route path="/instagram" element={<Placeholder moduleKey="instagram" />} />
            <Route path="/chatbot" element={<Placeholder moduleKey="chatbot" />} />
            <Route path="/marketing" element={<Placeholder moduleKey="marketing" />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/ai" element={<Placeholder moduleKey="ai" />} />
            <Route path="/sites" element={<Placeholder moduleKey="sites" />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/customization" element={<Customization />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/plan" element={<MyPlan />} />
            <Route path="/account" element={<MyAccount />} />
            <Route path="/admin-master" element={<AdminMaster />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default App;
