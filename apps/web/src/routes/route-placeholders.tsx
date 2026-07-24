import type { ReactElement } from "react";

export const PublicEntryRoute = (): ReactElement => {
  return <main className="min-h-screen bg-background" aria-label="Public application entry" />;
};

export const ProtectedEntryRoute = (): ReactElement => {
  return <main className="min-h-screen bg-background" aria-label="Protected application entry" />;
};

