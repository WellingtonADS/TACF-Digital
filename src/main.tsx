/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import AdminRoute from "./components/AdminRoute";
import AutoRedirect from "./components/AutoRedirect";
import PageSkeleton from "./components/PageSkeleton";
import ProtectedRoute from "./components/ProtectedRoute";
import UserRoute from "./components/UserRoute";
import "./index.css";
import type { RouteAccess } from "./types";
import { prefetchCriticalRoutes } from "./utils/prefetchRoutes";
import { getRoutableAppRoutes } from "./utils/routeRegistry";
const ForgotPasswordPage = React.lazy(() => import("./pages/ForgotPassword"));
const Login = React.lazy(() => import("./pages/Login"));
const RegisterPage = React.lazy(() => import("./pages/Register"));
const OperationalDashboard = React.lazy(
  () => import("./pages/OperationalDashboard"),
);

const routeFallback = (
  <div className="p-6">
    <PageSkeleton rows={6} />
  </div>
);

const appRoutableEntries = getRoutableAppRoutes().map((route) => ({
  ...route,
  Component: React.lazy(route.lazyLoader!),
}));

function withAccessGuard(access: RouteAccess, element: React.ReactElement) {
  if (access === "admin") return <AdminRoute>{element}</AdminRoute>;
  if (access === "user") return <UserRoute>{element}</UserRoute>;
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

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
        {appRoutableEntries.map(({ path, access, Component }) => (
          <Route
            key={path}
            path={path}
            element={withAccessGuard(
              access,
              <Suspense fallback={routeFallback}>
                <Component />
              </Suspense>,
            )}
          />
        ))}
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
