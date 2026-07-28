import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { type ReactElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui";
import { useAuthStore } from "@/store";
import { authPermission, authRole, authUser, organization } from "./factories";

export interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  initialRoute?: string;
  authenticated?: boolean;
  permissions?: string[];
  roleNames?: string[];
}

const createTestQueryClient = (): QueryClient => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: false
    }
  }
});

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}): RenderResult & { queryClient: QueryClient } {
  const queryClient = createTestQueryClient();
  const permissions = options.permissions ?? ["users.read", "users.create", "users.update", "users.delete", "roles.read", "roles.create", "roles.update", "roles.delete", "organizations.read", "organizations.update"];
  const roleNames = options.roleNames ?? ["Owner"];

  if (options.authenticated ?? true) {
    useAuthStore.getState().setSession({
      accessToken: "test-access-token",
      user: authUser(),
      organization: organization(),
      roles: roleNames.map((name) => authRole({ name, isSystem: name === "Owner" || name === "Admin" || name === "Manager" || name === "Member" })),
      permissions: permissions.map((permissionKey) => authPermission(permissionKey))
    });
  }

  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <MemoryRouter initialEntries={[options.initialRoute ?? "/app"]}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return { ...render(ui, { ...options, wrapper: Wrapper }), queryClient };
}
