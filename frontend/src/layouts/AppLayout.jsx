import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import RequirePermission from "@/components/shared/RequirePermission";

const AppLayout = () => {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto" data-testid="main-content">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px]">
            <RequirePermission>
              <Outlet />
            </RequirePermission>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
