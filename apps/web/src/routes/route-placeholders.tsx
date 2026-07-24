import type { ReactElement } from "react";

export interface AppPlaceholderRouteProps {
  title: string;
}

export const PublicEntryRoute = (): ReactElement => {
  return <main className="min-h-screen bg-background" aria-label="Public application entry" />;
};

export function AppPlaceholderRoute({ title }: AppPlaceholderRouteProps): ReactElement {
  return (
    <section aria-labelledby="page-title" className="min-h-[calc(100dvh-8rem)] rounded-xl border border-dashed border-border bg-surface/40 p-6">
      <h2 id="page-title" className="text-h3">{title}</h2>
    </section>
  );
}

