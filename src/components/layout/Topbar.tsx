// implementation moved from src/layout/Topbar.tsx
import { Menu } from "lucide-react";

type TopbarProps = {
  onToggleSidebar?: () => void;
};

export const Topbar = ({ onToggleSidebar }: TopbarProps) => (
  <header className="w-full h-14 border-b flex items-center px-4 bg-white gap-3 lg:hidden">
    <button
      onClick={onToggleSidebar}
      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="Abrir menu"
      type="button"
    >
      <Menu size={20} className="text-gray-600" />
    </button>
    <div className="font-semibold text-gray-800">TACF Digital</div>
  </header>
);

export default Topbar;
