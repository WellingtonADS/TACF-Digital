import React from "react";
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
  profile: Profile;
  adminEnabled: boolean;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      <TopNav profile={profile} adminEnabled={adminEnabled} />
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
