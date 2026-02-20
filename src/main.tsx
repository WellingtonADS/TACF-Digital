/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AutoRedirect from "./components/AutoRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";
const ForgotPasswordPage = React.lazy(() => import("./pages/ForgotPassword"));
const Login = React.lazy(() => import("./pages/Login"));
const RegisterPage = React.lazy(() => import("./pages/Register"));
const AppointmentConfirmationPreview = React.lazy(
  () => import("./pages/preview/AppointmentConfirmationPreview"),
);
const DigitalTicketPreview = React.lazy(
  () => import("./pages/preview/DigitalTicketPreview"),
);
const ForgotPreview = React.lazy(() => import("./pages/preview/ForgotPreview"));
const LoginPreview = React.lazy(() => import("./pages/preview/LoginPreview"));
const OperationalPreview = React.lazy(
  () => import("./pages/preview/OperationalPreview"),
);
const RegisterPreview = React.lazy(
  () => import("./pages/preview/RegisterPreview"),
);
const ResultsHistoryPreview = React.lazy(
  () => import("./pages/preview/ResultsHistoryPreview"),
);
const ClassCreationFormPreview = React.lazy(
  () => import("./pages/preview/ClassCreationFormPreview"),
);
const SchedulingPreview = React.lazy(
  () => import("./pages/preview/SchedulingPreview"),
);
const UserProfilesManagementPreview = React.lazy(
  () => import("./pages/preview/UserProfilesManagementPreview"),
);
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
const PersonnelManagement = React.lazy(
  () => import("./pages/PersonnelManagement"),
);
const ScoreEntry = React.lazy(() => import("./pages/ScoreEntry"));
const AnalyticsDashboard = React.lazy(
  () => import("./pages/AnalyticsDashboard"),
);
const SystemSettings = React.lazy(() => import("./pages/SystemSettings"));
const ClassCreationForm = React.lazy(() => import("./pages/ClassCreationForm"));
const PreviewIndex = React.lazy(() => import("./pages/PreviewIndex"));
const OmLocationManager = React.lazy(() => import("./pages/OmLocationManager"));
const OmLocationEditor = React.lazy(() => import("./pages/OmLocationEditor"));

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
        {/* Preview routes for quick layout checks (no auth) */}
        <Route
          path="/preview"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <PreviewIndex />
            </Suspense>
          }
        />
        <Route
          path="/preview/login"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <LoginPreview />
            </Suspense>
          }
        />
        <Route
          path="/preview/register"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <RegisterPreview />
            </Suspense>
          }
        />
        <Route
          path="/preview/operational"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <OperationalPreview />
            </Suspense>
          }
        />
        <Route
          path="/preview/appointment-confirmation"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <AppointmentConfirmationPreview />
            </Suspense>
          }
        />
        <Route
          path="/preview/digital-ticket"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <DigitalTicketPreview />
            </Suspense>
          }
        />
        <Route
          path="/preview/perfil"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <UserProfilesManagementPreview />
            </Suspense>
          }
        />
        <Route
          path="/preview/results-history"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <ResultsHistoryPreview />
            </Suspense>
          }
        />
        <Route
          path="/preview/configuracoes"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <SystemSettings />
            </Suspense>
          }
        />
        <Route
          path="/preview/turmas-nova"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <ClassCreationFormPreview />
            </Suspense>
          }
        />
        <Route
          path="/app/resultados"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <ResultsHistory />
            </Suspense>
          }
        />
        <Route
          path="/app/agendamentos"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <Scheduling />
            </Suspense>
          }
        />
        <Route
          path="/app/agendamentos/confirmacao"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <AppointmentConfirmation />
            </Suspense>
          }
        />
        <Route
          path="/app/turmas/nova"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <ClassCreationForm />
            </Suspense>
          }
        />
        <Route
          path="/app/ticket"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <DigitalTicket />
            </Suspense>
          }
        />
        <Route
          path="/app/perfil"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <UserProfilesManagement />
            </Suspense>
          }
        />
        <Route
          path="/app/efetivo"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <PersonnelManagement />
            </Suspense>
          }
        />
        <Route
          path="/app/om-locations"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <OmLocationManager />
            </Suspense>
          }
        />
        <Route
          path="/app/om/:id"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <OmLocationEditor />
            </Suspense>
          }
        />
        <Route
          path="/app/lancamento-indices"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <ScoreEntry />
            </Suspense>
          }
        />
        <Route
          path="/app/analytics"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <AnalyticsDashboard />
            </Suspense>
          }
        />
        <Route
          path="/app/configuracoes"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <SystemSettings />
            </Suspense>
          }
        />
        <Route
          path="/app/perfil"
          element={
            <Suspense fallback={<div className="p-6">Carregando...</div>}>
              <UserProfilesManagement />
            </Suspense>
          }
        />
        <Route path="/preview/scheduling" element={<SchedulingPreview />} />
        <Route path="/preview/forgot" element={<ForgotPreview />} />
        <Route path="/" element={<AutoRedirect />} />
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <OperationalDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="p-6">Carregando...</div>}>
                <OperationalDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
