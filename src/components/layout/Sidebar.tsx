// implementation previously located in src/layout/Sidebar.tsx
import useAuth from "@/hooks/useAuth";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { getSidebarRoutesForRole } from "@/utils/routeRegistry";
import {
  BarChart2,
  Calendar,
  ClipboardList,
  ClipboardPen,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Settings,
  Shield,
  Ticket,
  User,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const sidebarIconMap = {
  "layout-dashboard": LayoutDashboard,
  calendar: Calendar,
  "file-text": FileText,
  ticket: Ticket,
  "clipboard-list": ClipboardList,
  user: User,
  users: Users,
  "map-pin": MapPin,
  "clipboard-pen": ClipboardPen,
  "bar-chart-2": BarChart2,
  settings: Settings,
  shield: Shield,
} as const;

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  isDesktop?: boolean;
};

export const Sidebar = ({
  isOpen = false,
  onClose,
  isDesktop = false,
}: SidebarProps) => {
  const location = useLocation();
  const { profile } = useAuth();
  const navItems = getSidebarRoutesForRole(profile?.role).map((route) => ({
    icon: sidebarIconMap[route.sidebarIcon!],
    label: route.sidebarLabel!,
    path: route.path,
  }));

  const isActive = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app" || location.pathname === "/app/";
    }
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const translateClass = isDesktop
    ? "translate-x-0"
    : isOpen
      ? "translate-x-0"
      : "-translate-x-full";

  return (
    <aside
      className={`w-64 lg:w-72 bg-primary text-white flex flex-col fixed h-full z-50 transition-transform duration-300 shadow-lg md:shadow-none ${translateClass}`}
    >
      <div className="p-8 flex items-center gap-3">
        <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center">
          <Shield className="text-white" size={24} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-none">TACF-Digital</h1>
          <p className="text-[10px] text-white/60 font-medium tracking-widest mt-1">
            FORÇA AÉREA BRASILEIRA
          </p>
        </div>
        {/* Botão fechar — visível apenas no mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Fechar menu"
          type="button"
        >
          <X size={20} className="text-white/70" />
        </button>
      </div>

      <nav className="flex-1 mt-2 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            onMouseEnter={() => prefetchRoute(item.path)}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
              isActive(item.path)
                ? "bg-white/10 text-white border-l-4 border-white pl-3"
                : "text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent pl-3"
            }`}
          >
            <item.icon size={20} />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10 space-y-3">
        {profile && (
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {(profile.war_name ?? profile.full_name ?? "?")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">
                {profile.war_name ?? profile.full_name ?? "—"}
              </p>
              <p className="text-xs text-white/50 truncate capitalize">
                {profile.role === "admin"
                  ? "Administrador"
                  : profile.role === "coordinator"
                    ? "Coordenador"
                    : "Usuário"}
              </p>
            </div>
          </div>
        )}
        <LogoutButton />
      </div>
    </aside>
  );
};

export default Sidebar;

function LogoutButton() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handle = async () => {
    try {
      await signOut();
    } finally {
      // ensure user lands on login regardless of signOut outcome
      navigate("/login");
    }
  };

  return (
    <button
      onClick={handle}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-bold uppercase tracking-wider border border-red-500/20"
      type="button"
    >
      <LogOut size={20} />
      Sair
    </button>
  );
}
