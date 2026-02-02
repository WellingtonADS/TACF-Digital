import React from "react";
import { Link } from "react-router-dom";
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
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      <TopNav profile={profile} adminEnabled={adminEnabled} />

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-4 py-2">
            <Link
              to="/dashboard"
              className="text-sm text-slate-700 hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              to="/profile"
              className="text-sm text-slate-700 hover:text-primary"
            >
              Meu Perfil
            </Link>
          </nav>
        </div>
      </div>

      <Content>{children}</Content>

      {/* Footer Simples (Opcional, mas completa o Shell) */}
      <footer className="py-6 text-center border-t border-slate-100 mt-auto">
        <p className="text-xs text-slate-400">
          © 2026 Hospital da Força Aérea • Divisão de Tecnologia
        </p>
      </footer>
    </div>
  );
}
