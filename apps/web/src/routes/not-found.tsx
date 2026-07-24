import type { ReactElement } from "react";

export const NotFoundRoute = (): ReactElement => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-md space-y-3 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">The requested route is not available.</p>
      </section>
    </main>
  );
};

