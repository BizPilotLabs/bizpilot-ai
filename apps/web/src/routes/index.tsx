import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/app/app-shell";
import { AppLayout } from "@/components/layout";
import { LoginPage, RegisterOrganizationPage, ForgotPasswordPage, ResetPasswordPage } from "@/features/auth";
import { GlobalLayout } from "@/layouts";
import { NotFoundRoute } from "./not-found";
import { ProtectedRoute } from "./protected-route";
import { PublicRoute } from "./public-route";
import { AppPlaceholderRoute } from "./route-placeholders";
import { routePaths } from "./route-paths";

export const appRouter = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        element: <GlobalLayout />,
        children: [
          { index: true, element: <Navigate replace to={routePaths.dashboard} /> },
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
            children: [
              {
                path: routePaths.app,
                element: <AppLayout />,
                children: [
                  { index: true, element: <Navigate replace to={routePaths.dashboard} /> },
                  { path: "dashboard", element: <AppPlaceholderRoute title="Dashboard" /> },
                  { path: "projects", element: <AppPlaceholderRoute title="Projects" /> },
                  { path: "tasks", element: <AppPlaceholderRoute title="Tasks" /> },
                  { path: "teams", element: <AppPlaceholderRoute title="Teams" /> },
                  { path: "users", element: <AppPlaceholderRoute title="Users" /> },
                  { path: "organizations", element: <AppPlaceholderRoute title="Organizations" /> },
                  { path: "activity", element: <AppPlaceholderRoute title="Activity" /> },
                  { path: "settings", element: <AppPlaceholderRoute title="Settings" /> }
                ]
              }
            ]
          },
          { path: routePaths.notFound, element: <NotFoundRoute /> }
        ]
      }
    ]
  }
]);

export { routePaths } from "./route-paths";

