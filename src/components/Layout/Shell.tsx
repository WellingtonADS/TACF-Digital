import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "../ui/Sidebar";
import { SidebarItem } from "../ui/SidebarItem";
import Content from "./Content";
import TopNav from "./TopNav";

interface Profile {
  role?: string;
  rank?: string;
  full_name?: string;
}

export default function Shell({
  children,
  profile,
  adminEnabled,
}: {
  children: React.ReactNode;
  profile?: Profile | null;
  adminEnabled: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="min-h-screen bg-background-light font-inter">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} isCollapsed={sidebarCollapsed}>
        {/* Header da Sidebar */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">TACF Digital</h1>
            <button
              onClick={toggleCollapse}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title={sidebarCollapsed ? "Expandir" : "Recolher"}
            >
              <MenuIcon className="text-white" />
            </button>
          </div>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          <SidebarItem
            href="/dashboard"
            active={location.pathname === "/dashboard"}
            icon={<DashboardIcon />}
          >
            {!sidebarCollapsed && "Dashboard"}
          </SidebarItem>
          <SidebarItem
            href="/profile"
            active={location.pathname === "/profile"}
            icon={<PersonIcon />}
          >
            {!sidebarCollapsed && "Meu Perfil"}
          </SidebarItem>
        </nav>

        {/* Profile Card no Rodapé */}
        {!sidebarCollapsed && (
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-military-gold/20 flex items-center justify-center">
                <PersonIcon className="text-military-gold" fontSize="small" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || "Usuário"}
                </p>
                <p className="text-xs text-white/70 truncate">
                  {profile?.rank || "Militar"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Sidebar>

      {/* Main Content */}
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: sidebarOpen ? (sidebarCollapsed ? "80px" : "256px") : "0",
        }}
      >
        <TopNav profile={profile} adminEnabled={adminEnabled} />

        {/* Toggle Sidebar Button (Mobile) */}
        <div className="md:hidden p-4 bg-white border-b border-slate-100">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-slate-100 rounded transition-colors"
          >
            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        <Content>{children}</Content>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-slate-100 mt-auto bg-white">
          <p className="text-xs text-slate-400">
            © 2026 Hospital da Força Aérea • Divisão de Tecnologia
          </p>
        </footer>
      </div>
    </div>
  );
}
