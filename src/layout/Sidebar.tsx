import useAuth from "@/hooks/useAuth";
import {
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
    { icon: Calendar, label: "Agendamentos", path: "/app/agendamentos" },
    { icon: User, label: "Perfil", path: "/app/perfil" },
    { icon: FileText, label: "Resultados", path: "/app/resultados" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-primary text-white flex flex-col fixed h-full z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
          <Shield className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight uppercase leading-none">
            TACF-Digital
          </h1>
          <p className="text-[10px] text-white/60 font-medium tracking-widest mt-1">
            FORÇA AÉREA BRASILEIRA
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onMouseEnter={() => {
              if (item.path === "/app/resultados")
                import("../pages/ResultsHistory");
              if (item.path === "/app/agendamentos")
                import("../pages/Scheduling");
              if (item.path === "/app/perfil")
                import("../pages/UserProfilesManagement");
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive(item.path)
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <item.icon size={20} />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto">
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
