import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/Admin/AdminRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSessions from "./pages/AdminSessions";
import AdminSwapRequests from "./pages/AdminSwapRequests";
import AdminUsers from "./pages/AdminUsers";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import UserDashboard from "./pages/UserDashboard";

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">TACF Digital (Dev)</h1>
        <AuthArea />
      </div>
    </div>
  );
}

function AuthArea() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Login />;

  if (!profile || !profile.saram) return <ProfileSetup />;

  // render dashboard for authenticated user with routing
  return (
    <BrowserRouter>
      <nav className="flex gap-4 mb-4">
        <a href="/" className="text-sm font-medium">
          Dashboard
        </a>
        {profile?.role === "admin" && (
          <a href="/admin" className="text-sm font-medium text-red-600">
            Admin
          </a>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<UserDashboard />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/sessions"
          element={
            <AdminRoute>
              <React.Suspense fallback={<div>Carregando...</div>}>
                <AdminSessions />
              </React.Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/swaps"
          element={
            <AdminRoute>
              <React.Suspense fallback={<div>Carregando...</div>}>
                <AdminSwapRequests />
              </React.Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <React.Suspense fallback={<div>Carregando...</div>}>
                <AdminUsers />
              </React.Suspense>
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

import ReloadPrompt from "@/components/PWA/ReloadPrompt";
import { Toaster } from "sonner";

export default function AppWithProvider() {
  return (
    <AuthProvider>
      <App />
      <Toaster position="top-right" />
      <ReloadPrompt />
    </AuthProvider>
  );
}
