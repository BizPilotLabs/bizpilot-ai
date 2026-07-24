import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services";
import type { AuthResult, ForgotPasswordInput, LoginCredentials, RegisterOrganizationInput, ResetPasswordInput } from "../types";
import { authQueryKeys } from "./use-current-user";
import { useAuthStore } from "@/store";

const applyAuthenticatedSession = (result: AuthResult): void => {
  useAuthStore.getState().setSession({
    accessToken: result.accessToken,
    user: result.user,
    organization: result.organization,
    roles: result.roles,
    permissions: result.permissions
  });
};

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (result) => {
      applyAuthenticatedSession(result);
      queryClient.setQueryData(authQueryKeys.me, {
        user: result.user,
        organization: result.organization,
        roles: result.roles,
        permissions: result.permissions
      });
    }
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterOrganizationInput) => authService.register(input),
    onSuccess: (result) => {
      applyAuthenticatedSession(result);
      queryClient.setQueryData(authQueryKeys.me, {
        user: result.user,
        organization: result.organization,
        roles: result.roles,
        permissions: result.permissions
      });
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearSession();
      queryClient.clear();
    }
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => authService.forgotPassword(input)
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => authService.resetPassword(input)
  });
}

