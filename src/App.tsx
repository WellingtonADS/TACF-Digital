import React, { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Páginas
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import UserProfile from "./pages/UserProfile";

// Lazy Loads
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const AdminSessions = React.lazy(() => import("./pages/AdminSessions"));
const AdminSwapRequests = React.lazy(() => import("./pages/AdminSwapRequests"));
const AdminUsers = React.lazy(() => import("./pages/AdminUsers"));
const AdminPersonnelManagement = React.lazy(
  () => import("./pages/AdminPersonnelManagement"),
);
const AdminAnalyticsDashboard = React.lazy(
  () => import("./pages/AdminAnalyticsDashboard"),
);
const AdminAuditLog = React.lazy(() => import("./pages/AdminAuditLog"));
const SystemSettings = React.lazy(() => import("./pages/SystemSettings"));
const AccessProfilesManagement = React.lazy(
  () => import("./pages/AccessProfilesManagement"),
);
const ScoreEntryScreen = React.lazy(() => import("./pages/ScoreEntryScreen"));

// Componentes de Rota
import AdminRoute from "./components/Admin/AdminRoute";
import Shell from "./components/Layout/Shell";

function App() {
  const { user, profile, loading, profileResolved } = useAuth();
  const adminEnabled = import.meta.env.VITE_ENABLE_ADMIN === "true";

  if (loading || !profileResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Fluxo de Autenticação: Tela Cheia, sem container limitador
  if (!user) return <Login />;

  // 2. Fluxo de Onboarding: Agora não bloqueamos o acesso ao sistema —
  // o Dashboard exibirá um alerta quando o perfil estiver incompleto e o usuário poderá editar em /profile.

  // 3. Fluxo Autenticado: Aqui entra o Layout do Sistema (Navbar + Container)
  return (
    <BrowserRouter>
      <Shell profile={profile} adminEnabled={adminEnabled}>
        <Suspense
          fallback={<div className="p-8 text-center">Carregando módulo...</div>}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/profile" element={<UserProfile />} />

            {adminEnabled && (
              <Route path="/admin">
                <Route
                  index
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="sessions"
                  element={
                    <AdminRoute>
                      <AdminSessions />
                    </AdminRoute>
                  }
                />
                <Route
                  path="swaps"
                  element={
                    <AdminRoute>
                      <AdminSwapRequests />
                    </AdminRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  }
                />
                <Route
                  path="personnel"
                  element={
                    <AdminRoute>
                      <AdminPersonnelManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="analytics"
                  element={
                    <AdminRoute>
                      <AdminAnalyticsDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="audit-logs"
                  element={
                    <AdminRoute>
                      <AdminAuditLog />
                    </AdminRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <AdminRoute>
                      <SystemSettings />
                    </AdminRoute>
                  }
                />
                <Route
                  path="access-profiles"
                  element={
                    <AdminRoute>
                      <AccessProfilesManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="score-entry"
                  element={
                    <AdminRoute>
                      <ScoreEntryScreen />
                    </AdminRoute>
                  }
                />
              </Route>
            )}
          </Routes>
        </Suspense>
      </Shell>
    </BrowserRouter>
  );
}

import ErrorBoundary from "./components/ErrorBoundary";

export default function AppWithProvider() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ErrorBoundary>
  );
}
