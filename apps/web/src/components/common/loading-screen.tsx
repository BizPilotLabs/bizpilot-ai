import type { ReactElement } from "react";

import { LoaderCircle } from "lucide-react";

import { env } from "@/lib/env";

export const LoadingScreen = (): ReactElement => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        <span>{env.appName}</span>
      </div>
    </main>
  );
};

