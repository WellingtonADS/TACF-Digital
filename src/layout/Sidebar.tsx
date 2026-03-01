import useAuth from "@/hooks/useAuth";
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
  User,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const userNav = [
  { icon: LayoutDashboard, label: "Dashboard (Visão Geral)", path: "/app" },
  {
    icon: Calendar,
    label: "Agendamentos / Avaliações",
    path: "/app/agendamentos",
  },
  { icon: FileText, label: "Documentos / Relatórios", path: "/app/documentos" },
  { icon: ClipboardList, label: "Histórico", path: "/app/resultados" },
  { icon: User, label: "Meu Perfil", path: "/app/perfil" },
];

/** Nav do contexto admin — espelha o design do stitch */
const adminNav = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/app/admin" },
  { icon: Users, label: "Gerenciar Turmas", path: "/app/turmas" },
  { icon: Users, label: "Efetivo", path: "/app/efetivo" },
  { icon: MapPin, label: "OMs / Locais", path: "/app/om-locations" },
  {
    icon: ClipboardPen,
    label: "Lançar Índices",
    path: "/app/lancamento-indices",
  },
  { icon: BarChart2, label: "Relatórios", path: "/app/analytics" },
  { icon: Settings, label: "Configurações", path: "/app/configuracoes" },
  { icon: Shield, label: "Logs de Auditoria", path: "/app/auditoria" },
];

export const Sidebar = () => {
  const location = useLocation();
  const { profile } = useAuth();

  const isAdmin = profile?.role === "admin" || profile?.role === "coordinator";
  const navItems = isAdmin ? adminNav : userNav;

  const isActive = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app" || location.pathname === "/app/";
    }
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <aside className="w-72 bg-primary text-white flex flex-col fixed h-full z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center">
          <Shield className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none">TACF-Digital</h1>
          <p className="text-[10px] text-white/60 font-medium tracking-widest mt-1">
            FORÇA AÉREA BRASILEIRA
          </p>
        </div>
      </div>

      <nav className="flex-1 mt-2 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onMouseEnter={() => {
              if (item.path === "/app/resultados")
                import("../pages/ResultsHistory");
              if (item.path === "/app/agendamentos")
                import("../pages/Scheduling");
              if (item.path === "/app/turmas")
                import("../pages/AdminDashboard");
              if (item.path === "/app/admin") import("../pages/AdminDashboard");
              if (item.path === "/app/efetivo")
                import("../pages/PersonnelManagement");
              if (item.path === "/app/lancamento-indices")
                import("../pages/ScoreEntry");
              if (item.path === "/app/analytics")
                import("../pages/AnalyticsDashboard");
              if (item.path === "/app/configuracoes")
                import("../pages/SystemSettings");
              if (item.path === "/app/perfil")
                import("../pages/UserProfilesManagement");
              if (item.path === "/app/om-locations")
                import("../pages/OmLocationManager");
              if (item.path === "/app/reagendamentos")
                import("../pages/ReschedulingManagement");
              if (item.path === "/app/auditoria") import("../pages/AuditLog");
            }}
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
