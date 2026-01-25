import React, { Suspense } from "react";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "sonner";

// Páginas
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import UserDashboard from "./pages/UserDashboard";

// Lazy Loads
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const AdminSessions = React.lazy(() => import("./pages/AdminSessions"));
const AdminSwapRequests = React.lazy(() => import("./pages/AdminSwapRequests"));
const AdminUsers = React.lazy(() => import("./pages/AdminUsers"));

// Componentes de Rota
import AdminRoute from "./components/Admin/AdminRoute";

function App() {
  const { user, profile, loading } = useAuth();
  const adminEnabled = import.meta.env.VITE_ENABLE_ADMIN === "true";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Fluxo de Autenticação: Tela Cheia, sem container limitador
  if (!user) return <Login />;

  // 2. Fluxo de Onboarding: Tela Cheia para capturar dados obrigatórios
  if (!profile || !profile.saram) return <ProfileSetup />;

  // 3. Fluxo Autenticado: Aqui entra o Layout do Sistema (Navbar + Container)
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-canvas">
        {/* Navbar Institucional */}
        <header className="bg-primary text-white shadow-md">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold tracking-wider">TACF DIGITAL</span>
              <nav className="flex gap-6 ml-8">
                <Link to="/" className="text-sm font-medium hover:text-blue-200 transition-colors">
                  Dashboard
                </Link>
                {profile?.role === "admin" && adminEnabled && (
                  <Link to="/admin" className="text-sm font-medium hover:text-red-300 text-red-200">
                    Painel Admin
                  </Link>
                )}
              </nav>
            </div>
            <div className="text-xs opacity-70">
              {profile.rank} {profile.full_name}
            </div>
          </div>
        </header>

        {/* Área de Conteúdo */}
        <main className="container mx-auto p-6">
          <Suspense fallback={<div className="p-8 text-center">Carregando módulo...</div>}>
            <Routes>
              <Route path="/" element={<UserDashboard />} />
              
              {adminEnabled && (
                <Route path="/admin">
                  <Route index element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="sessions" element={<AdminRoute><AdminSessions /></AdminRoute>} />
                  <Route path="swaps" element={<AdminRoute><AdminSwapRequests /></AdminRoute>} />
                  <Route path="users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                </Route>
              )}
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default function AppWithProvider() {
  return (
    <AuthProvider>
      <App />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}