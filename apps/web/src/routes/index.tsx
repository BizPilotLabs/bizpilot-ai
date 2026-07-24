import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppShell } from "@/app/app-shell";
import { GlobalLayout } from "@/layouts";

import { NotFoundRoute } from "./not-found";
import { ProtectedRoute } from "./protected-route";
import { PublicRoute } from "./public-route";
import { ProtectedEntryRoute, PublicEntryRoute } from "./route-placeholders";
import { routePaths } from "./route-paths";

export const appRouter = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        element: <GlobalLayout />,
        children: [
          { index: true, element: <Navigate replace to={routePaths.app} /> },
          {
            element: <PublicRoute />,
            children: [{ path: routePaths.auth, element: <PublicEntryRoute /> }]
          },
          {
            element: <ProtectedRoute />,
            children: [{ path: routePaths.app, element: <ProtectedEntryRoute /> }]
          },
          { path: routePaths.notFound, element: <NotFoundRoute /> }
        ]
      }
    ]
  }
]);

export { routePaths } from "./route-paths";

