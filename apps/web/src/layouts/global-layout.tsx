import type { ReactElement } from "react";

import { Outlet } from "react-router-dom";

export const GlobalLayout = (): ReactElement => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  );
};

