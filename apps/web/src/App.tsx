import type { ReactElement } from "react";

import { RouterProvider } from "react-router-dom";

import { appRouter } from "@/routes";

export const App = (): ReactElement => {
  return <RouterProvider router={appRouter} />;
};

