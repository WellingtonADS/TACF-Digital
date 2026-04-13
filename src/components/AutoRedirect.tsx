/**
 * @page AutoRedirect
 * @description Redirecionamento automático baseado em estado ou papel.
 * @path src/components/AutoRedirect.tsx
 */

import useAuth from "@/hooks/useAuth";
import { getDefaultHomeByRole } from "@/router/routeAccess";
import { Navigate } from "react-router-dom";
import FullPageLoading from "./FullPageLoading";

export default function AutoRedirect() {
  const {
    user,
    profile,
    loading: autenticacaoCarregando,
  } = useAuth();

  if (autenticacaoCarregando) {
    return <FullPageLoading />;
  }

  if (user) {
    return <Navigate to={getDefaultHomeByRole(profile?.role)} replace />;
  }

  return <Navigate to="/login" replace />;
}
