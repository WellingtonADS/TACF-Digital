import Button from "@/components/ui/Button";
import { LogOut, Menu, Plane, Shield, User, X } from "@/components/ui/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Link } from "react-router-dom";

interface Profile {
  role?: string;
  rank?: string;
  full_name?: string;
}

export default function TopNav({
  profile,
  adminEnabled,
}: {
  profile?: Profile | null;
  adminEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();

  return (
    <header className="bg-[#1B365D] text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LOGO & BRAND */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-lg">
              <Plane className="w-5 h-5 transform -rotate-45 text-blue-200" />
            </div>
            <Link
              to="/"
              className="font-bold tracking-tight text-lg flex flex-col leading-tight"
            >
              <span>TACF DIGITAL</span>
              <span className="text-[10px] font-medium text-blue-200 uppercase tracking-widest">
                SGCF • HACO
              </span>
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center ml-8 gap-1">
              <Link
                to="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className="px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                Meu Perfil
              </Link>
              {profile?.role === "admin" && adminEnabled && (
                <Link
                  to="/admin"
                  className="px-3 py-2 rounded-md text-sm font-medium text-red-200 hover:text-red-100 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                >
                  <Shield size={14} />
                  Painel Admin
                </Link>
              )}
            </nav>
          </div>

          {/* USER ACTIONS (DESKTOP) */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right hidden lg:block">
              <div className="text-sm font-semibold text-white">
                {profile?.rank} {profile?.full_name}
              </div>
              <div className="text-xs text-blue-200">Militar Ativo</div>
            </div>

            <div className="h-8 w-[1px] bg-white/20 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-white hover:bg-white/10 hover:text-white border border-white/20"
            >
              <LogOut size={16} />
              <span className="ml-2">Sair</span>
            </Button>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-md text-blue-200 hover:text-white hover:bg-white/10"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU PANEL */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#1B365D]">
          <div className="px-4 pt-4 pb-6 space-y-4">
            {/* User Info Mobile */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <User className="text-blue-200" />
              </div>
              <div>
                <div className="font-semibold text-white">
                  {profile?.full_name}
                </div>
                <div className="text-xs text-blue-300">{profile?.rank}</div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10"
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10"
              >
                Meu Perfil
              </Link>
              {profile?.role === "admin" && adminEnabled && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-red-200 hover:bg-red-500/10"
                >
                  Painel Administrativo
                </Link>
              )}
            </div>

            <Button
              variant="outline"
              block
              onClick={() => signOut()}
              className="mt-4 border-white/20 text-blue-100 hover:bg-white/10 hover:text-white bg-transparent"
            >
              <LogOut size={16} />
              <span className="ml-2">Encerrar Sessão</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
