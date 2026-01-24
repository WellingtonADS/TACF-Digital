import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import React from "react";

export interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 p-4">
          <div className="text-lg font-semibold">TACF Digital</div>
          <div className="flex items-center gap-4">
            {profile && (
              <div className="text-sm text-slate-700">{profile.full_name}</div>
            )}
            <Button variant="outline" onClick={() => signOut()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">{children}</main>
    </div>
  );
}
