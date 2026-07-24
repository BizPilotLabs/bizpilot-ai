import type { ReactElement } from "react";
import type { PropsWithChildren } from "react";
import { ToastProvider } from "@/components/ui";
import { AppQueryProvider } from "./query-provider";
import { AuthSessionProvider } from "./auth-session-provider";
import { ThemeProvider } from "./theme-provider";

export const AppProviders = ({ children }: PropsWithChildren): ReactElement => {
  return (
    <ThemeProvider>
      <AppQueryProvider>
        <ToastProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </ToastProvider>
      </AppQueryProvider>
    </ThemeProvider>
  );
};

