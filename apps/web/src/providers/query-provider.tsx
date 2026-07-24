import type { ReactElement } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

import { queryClient } from "@/lib/query-client";

export const AppQueryProvider = ({ children }: PropsWithChildren): ReactElement => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

