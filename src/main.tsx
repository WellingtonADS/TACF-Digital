/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import AutoRedirect from "./components/AutoRedirect";
import UserRoute from "./components/UserRoute";
import "./index.css";
const ForgotPasswordPage = React.lazy(() => import("./pages/ForgotPassword"));
const Login = React.lazy(() => import("./pages/Login"));
const RegisterPage = React.lazy(() => import("./pages/Register"));
const OperationalDashboard = React.lazy(
  () => import("./pages/OperationalDashboard"),
);
const ResultsHistory = React.lazy(() => import("./pages/ResultsHistory"));
const Scheduling = React.lazy(() => import("./pages/Scheduling"));
const AppointmentConfirmation = React.lazy(
  () => import("./pages/AppointmentConfirmation"),
);
const DigitalTicket = React.lazy(() => import("./pages/DigitalTicket"));
const UserProfilesManagement = React.lazy(
  () => import("./pages/UserProfilesManagement"),
);
const AccessProfilesManagement = React.lazy(
  () => import("./pages/AccessProfilesManagement"),
);
const PersonnelManagement = React.lazy(
  () => import("./pages/PersonnelManagement"),
);
const ScoreEntry = React.lazy(() => import("./pages/ScoreEntry"));
const AnalyticsDashboard = React.lazy(
  () => import("./pages/AnalyticsDashboard"),
);
const SystemSettings = React.lazy(() => import("./pages/SystemSettings"));
const ClassCreationForm = React.lazy(() => import("./pages/ClassCreationForm"));
const OmLocationManager = React.lazy(() => import("./pages/OmLocationManager"));
const OmLocationEditor = React.lazy(() => import("./pages/OmLocationEditor"));
const ReschedulingManagement = React.lazy(
  () => import("./pages/ReschedulingManagement"),
);
const AuditLog = React.lazy(() => import("./pages/AuditLog"));
const Documents = React.lazy(() => import("./pages/Documents"));
const AppealRequest = React.lazy(() => import("./pages/AppealRequest"));

const ReschedulingNotification = React.lazy(
  () => import("./pages/ReschedulingNotification"),
);
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const SessionsManagement = React.lazy(
  () => import("./pages/SessionsManagement"),
);

// Global dev-only handlers to reduce noisy uncaught errors in the console
if (import.meta.env.DEV && typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (e) => {
    // keep noise but still visible; helps identify real regressions

    console.warn(
      "Unhandled promise rejection:",
      (e as PromiseRejectionEvent).reason,
    );
  });

  window.addEventListener("error", (e) => {
    console.warn(
      "Global error caught:",
      (e as ErrorEvent).error ?? (e as ErrorEvent).message,
    );
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <RegisterPage />
            </Suspense>
          }
        />
        <Route
          path="/forgot"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <ForgotPasswordPage />
            </Suspense>
          }
        />
        <Route
          path="/app/resultados"
          element={
            <UserRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <ResultsHistory />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/documentos"
          element={
            <UserRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <Documents />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/recurso"
          element={
            <UserRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <AppealRequest />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/agendamentos"
          element={
            <UserRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <Scheduling />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/agendamentos/confirmacao"
          element={
            <UserRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <AppointmentConfirmation />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/turmas/nova"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <ClassCreationForm />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/ticket"
          element={
            <UserRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <DigitalTicket />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/perfil"
          element={
            <UserRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <UserProfilesManagement />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/efetivo"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <PersonnelManagement />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/reagendamentos"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <ReschedulingManagement />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/reagendamentos/notificacao"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <ReschedulingNotification />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/auditoria"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <AuditLog />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/om-locations"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <OmLocationManager />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/om/:id"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <OmLocationEditor />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/lancamento-indices"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <ScoreEntry />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/analytics"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <AnalyticsDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/configuracoes"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <SystemSettings />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/configuracoes/perfis"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <AccessProfilesManagement />
              </Suspense>
            </AdminRoute>
          }
        />
        {/* admin entry points */}
        <Route
          path="/app/admin"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <AdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/turmas"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <SessionsManagement />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route path="/" element={<AutoRedirect />} />
        <Route
          path="/app/*"
          element={
            <UserRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <OperationalDashboard />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/*"
          element={
            <UserRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <OperationalDashboard />
              </Suspense>
            </UserRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
