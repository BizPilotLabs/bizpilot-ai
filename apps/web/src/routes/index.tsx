import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/app/app-shell";
import { LoginPage, RegisterOrganizationPage, ForgotPasswordPage, ResetPasswordPage } from "@/features/auth";
import { GlobalLayout } from "@/layouts";
import { NotFoundRoute } from "./not-found";
import { ProtectedRoute } from "./protected-route";
import { PublicRoute } from "./public-route";
import { ProtectedEntryRoute } from "./route-placeholders";
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
            path: routePaths.auth,
            element: <PublicRoute />,
            children: [
              { index: true, element: <Navigate replace to={routePaths.login} /> },
              { path: "login", element: <LoginPage /> },
              { path: "register", element: <RegisterOrganizationPage /> },
              { path: "forgot-password", element: <ForgotPasswordPage /> },
              { path: "reset-password", element: <ResetPasswordPage /> }
            ]
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

