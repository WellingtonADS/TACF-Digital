// original implementation moved from src/layout/Layout.tsx
import { useResponsive } from "@/hooks/useResponsive";
import type { ReactNode } from "react";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type Props = { children?: ReactNode };

export const Layout = ({ children }: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const isSmallScreen = isMobile || isTablet;

  // Fecha sidebar automaticamente ao redimensionar para desktop
  const handleClose = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background-light flex">
      {/* Overlay mobile */}
      {isSmallScreen && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleClose}
        isDesktop={isDesktop}
      />

      <div
        className={`flex flex-col flex-1 min-h-screen ${isDesktop ? "md:ml-64 lg:ml-72" : ""}`}
      >
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-10 bg-[#F4F7F9]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
