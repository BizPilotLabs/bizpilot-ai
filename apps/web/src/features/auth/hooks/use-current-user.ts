import { useQuery } from "@tanstack/react-query";
import { authService } from "../services";
import { useAuthStore } from "@/store";

export const authQueryKeys = {
  me: ["auth", "me"] as const
};

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setPrincipal = useAuthStore((state) => state.setPrincipal);
  const clearSession = useAuthStore((state) => state.clearSession);

  return useQuery({
    queryKey: authQueryKeys.me,
    queryFn: async () => {
      const principal = await authService.me();
      setPrincipal(principal);
      return principal;
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 60_000,
    throwOnError: false,
    meta: {
      onError: () => clearSession()
    }
  });
}

