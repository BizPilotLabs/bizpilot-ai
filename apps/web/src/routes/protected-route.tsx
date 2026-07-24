import type { ReactElement } from "react";

import { Navigate, Outlet, useLocation } from "react-router-dom";

import { routePaths } from "./route-paths";
import { useAuthStore } from "@/store/auth-store";

export const ProtectedRoute = (): ReactElement => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace to={routePaths.auth} state={{ from: location }} />;
  }

  return <Outlet />;
};

