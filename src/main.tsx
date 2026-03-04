/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import AdminRoute from "./components/AdminRoute";
import AutoRedirect from "./components/AutoRedirect";
import PageSkeleton from "./components/PageSkeleton";
import UserRoute from "./components/UserRoute";
import "./index.css";
import { prefetchCriticalRoutes } from "./utils/prefetchRoutes";
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
const PersonnelEditor = React.lazy(() => import("./pages/PersonnelEditor"));
const ScoreEntry = React.lazy(() => import("./pages/ScoreEntry"));
const AnalyticsDashboard = React.lazy(
  () => import("./pages/AnalyticsDashboard"),
);
const SystemSettings = React.lazy(() => import("./pages/SystemSettings"));
const ClassCreationForm = React.lazy(() => import("./pages/ClassCreationForm"));
const OmLocationManager = React.lazy(() => import("./pages/OmLocationManager"));
const OmLocationEditor = React.lazy(() => import("./pages/OmLocationEditor"));
const OmScheduleEditor = React.lazy(() => import("./pages/OmScheduleEditor"));
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
const SessionBookingsManagement = React.lazy(
  () => import("./pages/SessionBookingsManagement"),
);
const SessionEditor = React.lazy(() => import("./pages/SessionEditor"));

const routeFallback = (
  <div className="p-6">
    <PageSkeleton rows={6} />
  </div>
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

if (typeof window !== "undefined") {
  prefetchCriticalRoutes();
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={routeFallback}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={routeFallback}>
              <RegisterPage />
            </Suspense>
          }
        />
        <Route
          path="/forgot"
          element={
            <Suspense fallback={routeFallback}>
              <ForgotPasswordPage />
            </Suspense>
          }
        />
        <Route
          path="/app/resultados"
          element={
            <UserRoute>
              <Suspense fallback={routeFallback}>
                <ResultsHistory />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/documentos"
          element={
            <UserRoute>
              <Suspense fallback={routeFallback}>
                <Documents />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/recurso"
          element={
            <UserRoute>
              <Suspense fallback={routeFallback}>
                <AppealRequest />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/agendamentos"
          element={
            <UserRoute>
              <Suspense fallback={routeFallback}>
                <Scheduling />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/agendamentos/confirmacao"
          element={
            <UserRoute>
              <Suspense fallback={routeFallback}>
                <AppointmentConfirmation />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/turmas/nova"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <ClassCreationForm />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/ticket"
          element={
            <UserRoute>
              <Suspense fallback={routeFallback}>
                <DigitalTicket />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/perfil"
          element={
            <UserRoute>
              <Suspense fallback={routeFallback}>
                <UserProfilesManagement />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/app/efetivo"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <PersonnelManagement />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/efetivo/:userId/editar"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <PersonnelEditor />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/reagendamentos"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <ReschedulingManagement />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/reagendamentos/notificacao"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <ReschedulingNotification />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/auditoria"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <AuditLog />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/om-locations"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <OmLocationManager />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/om/:id"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <OmLocationEditor />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/om/:id/schedules"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <OmScheduleEditor />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/lancamento-indices"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <ScoreEntry />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/analytics"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <AnalyticsDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/configuracoes"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <SystemSettings />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/configuracoes/perfis"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
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
              <Suspense fallback={routeFallback}>
                <AdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/turmas"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <SessionsManagement />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/turmas/:sessionId/agendamentos"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <SessionBookingsManagement />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/app/turmas/:sessionId/editar"
          element={
            <AdminRoute>
              <Suspense fallback={routeFallback}>
                <SessionEditor />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route path="/" element={<AutoRedirect />} />
        <Route
          path="/app/*"
          element={
            <UserRoute>
              <Suspense fallback={routeFallback}>
                <OperationalDashboard />
              </Suspense>
            </UserRoute>
          }
        />
        <Route
          path="/*"
          element={
            <UserRoute>
              <Suspense fallback={routeFallback}>
                <OperationalDashboard />
              </Suspense>
            </UserRoute>
          }
        />
      </Routes>
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand
        duration={4500}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
