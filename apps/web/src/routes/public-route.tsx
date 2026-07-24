import type { ReactElement } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { routePaths } from "./route-paths";
import { useAuthStore } from "@/store/auth-store";

export const PublicRoute = (): ReactElement => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate replace to={routePaths.app} />;
  }

  return <Outlet />;
};

