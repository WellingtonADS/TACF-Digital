/**
 * @page Topbar
 * @description Barra superior com navegação e ações rápidas.
 * @path src/components/layout/Topbar.tsx
 */



// implementation moved from src/layout/Topbar.tsx
import AppIcon from "@/components/atomic/AppIcon";
import { Menu } from "@/icons";

type TopbarProps = {
  onToggleSidebar?: () => void;
};

export const Topbar = ({ onToggleSidebar }: TopbarProps) => (
  <header className="w-full h-14 border-b border-border-default/80 flex items-center px-4 bg-bg-card/90 backdrop-blur-sm gap-3 lg:hidden">
    <button
      onClick={onToggleSidebar}
      className="p-2 rounded-lg text-text-muted hover:text-text-body hover:bg-bg-default transition-colors focus-ring"
      aria-label="Abrir menu"
      type="button"
    >
      <AppIcon icon={Menu} size="lg" tone="muted" />
    </button>
    <div className="font-semibold text-text-body tracking-tight">
      TACF Digital
    </div>
  </header>
);

export default Topbar;
