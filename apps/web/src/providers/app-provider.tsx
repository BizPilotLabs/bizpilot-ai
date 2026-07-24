import type { ReactElement } from "react";

import type { PropsWithChildren } from "react";

import { AppQueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export const AppProviders = ({ children }: PropsWithChildren): ReactElement => {
  return (
    <ThemeProvider>
      <AppQueryProvider>{children}</AppQueryProvider>
    </ThemeProvider>
  );
};

