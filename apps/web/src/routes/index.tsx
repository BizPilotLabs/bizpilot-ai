import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/app/app-shell";
import { AppLayout } from "@/components/layout";
import { LoginPage, RegisterOrganizationPage, ForgotPasswordPage, ResetPasswordPage } from "@/features/auth";
import { ActivityPage } from "@/features/activity";
import { DashboardPage } from "@/features/dashboard";
import { OrganizationPage } from "@/features/organizations";
import { ProjectsPage } from "@/features/projects";
import { RolesPage } from "@/features/rbac";
import { TasksPage } from "@/features/tasks";
import { TeamsPage } from "@/features/teams";
import { UsersPage } from "@/features/users";
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
                  { path: "dashboard", element: <DashboardPage /> },
                  { path: "projects", element: <ProjectsPage /> },
                  { path: "tasks", element: <TasksPage /> },
                  { path: "teams", element: <TeamsPage /> },
                  { path: "users", element: <UsersPage /> },
                  { path: "roles", element: <RolesPage /> },
                  { path: "organizations", element: <OrganizationPage /> },
                  { path: "activity", element: <ActivityPage /> },
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




