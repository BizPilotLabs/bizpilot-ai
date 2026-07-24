import type { ReactElement } from "react";

import { Outlet } from "react-router-dom";

import { ErrorBoundary } from "@/components/common/error-boundary";
import { AppProviders } from "@/providers";

export const AppShell = (): ReactElement => {
  return (
    <ErrorBoundary>
      <AppProviders>
        <Outlet />
      </AppProviders>
    </ErrorBoundary>
  );
};

