import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthOrganization, AuthPermission, AuthPrincipal, AuthRole, AuthUser } from "@/features/auth/types";

export type AuthenticationStatus = "idle" | "checking" | "authenticated" | "unauthenticated";

interface SetSessionInput extends AuthPrincipal {
  accessToken: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  organization: AuthOrganization | null;
  roles: AuthRole[];
  permissions: AuthPermission[];
  status: AuthenticationStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (session: SetSessionInput) => void;
  setAccessToken: (accessToken: string) => void;
  setPrincipal: (principal: AuthPrincipal) => void;
  setStatus: (status: AuthenticationStatus) => void;
  clearSession: () => void;
}

const toIsLoading = (status: AuthenticationStatus): boolean => status === "checking";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      organization: null,
      roles: [],
      permissions: [],
      status: "idle",
      isLoading: false,
      isAuthenticated: false,
      setSession: ({ accessToken, user, organization, roles, permissions }) => {
        set({ accessToken, user, organization, roles, permissions, status: "authenticated", isAuthenticated: true, isLoading: false });
      },
      setAccessToken: (accessToken) => {
        set({ accessToken });
      },
      setPrincipal: ({ user, organization, roles, permissions }) => {
        set({ user, organization, roles, permissions, status: "authenticated", isAuthenticated: true, isLoading: false });
      },
      setStatus: (status) => {
        set({ status, isLoading: toIsLoading(status), isAuthenticated: status === "authenticated" });
      },
      clearSession: () => {
        set({ accessToken: null, user: null, organization: null, roles: [], permissions: [], status: "unauthenticated", isAuthenticated: false, isLoading: false });
      }
    }),
    {
      name: "bizpilot-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        organization: state.organization,
        roles: state.roles,
        permissions: state.permissions,
        status: state.status,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

