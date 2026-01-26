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
  profile: Profile;
  adminEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-0">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-bold tracking-wider text-lg">
              TACF DIGITAL
            </Link>
            <nav
              className="hidden md:flex gap-6 ml-6"
              aria-label="Main navigation"
            >
              <Link
                to="/"
                className="text-sm font-medium hover:text-blue-200 transition-colors"
              >
                Dashboard
              </Link>
              {profile?.role === "admin" && adminEnabled && (
                <Link
                  to="/admin"
                  className="text-sm font-medium hover:text-red-300 text-red-200"
                >
                  Painel Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-xs opacity-80">
              {profile?.rank} {profile?.full_name}
            </div>

            {/* Mobile menu button */}
            <button
              aria-label="Abrir menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {open ? (
                  <path
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {open && (
          <div className="md:hidden border-t border-white/10 bg-primary/95">
            <div className="px-4 py-3 flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="py-2 px-2 rounded hover:bg-white/10"
              >
                Dashboard
              </Link>
              {profile?.role === "admin" && adminEnabled && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="py-2 px-2 rounded hover:bg-white/10"
                >
                  Painel Admin
                </Link>
              )}
              <div className="pt-2 text-sm opacity-80">
                {profile?.rank} {profile?.full_name}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
