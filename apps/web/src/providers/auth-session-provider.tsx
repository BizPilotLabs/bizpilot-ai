import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { LoadingScreen } from "@/components/common";
import { authService } from "@/features/auth/services";
import { useAuthStore } from "@/store";

export interface AuthSessionProviderProps {
  children: ReactNode;
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps): ReactElement {
  const [hasBootstrapped, setHasBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;

    const restoreSession = async (): Promise<void> => {
      const store = useAuthStore.getState();
      store.setStatus("checking");

      try {
        if (store.accessToken === null) {
          const refreshed = await authService.refresh();
          store.setAccessToken(refreshed.accessToken);
        }

        const principal = await authService.me();
        if (active) {
          useAuthStore.getState().setPrincipal(principal);
        }
      } catch {
        if (active) {
          useAuthStore.getState().clearSession();
        }
      } finally {
        if (active) {
          setHasBootstrapped(true);
        }
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  if (!hasBootstrapped) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

