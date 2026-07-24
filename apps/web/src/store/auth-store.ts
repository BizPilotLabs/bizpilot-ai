import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  organizationId: string | null;
  isAuthenticated: boolean;
  setSession: (session: { accessToken: string; userId: string; organizationId: string }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      userId: null,
      organizationId: null,
      isAuthenticated: false,
      setSession: (session) => {
        set({ ...session, isAuthenticated: true });
      },
      clearSession: () => {
        set({ accessToken: null, userId: null, organizationId: null, isAuthenticated: false });
      }
    }),
    {
      name: "bizpilot-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        userId: state.userId,
        organizationId: state.organizationId,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

