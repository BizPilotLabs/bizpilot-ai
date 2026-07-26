import { type ReactElement } from "react";
import type { AuthOrganization, AuthUser } from "@/features/auth";

export interface DashboardWelcomeProps {
  organization: AuthOrganization | undefined;
  user: AuthUser | undefined;
}

const getName = (user: AuthUser | undefined): string => {
  if (user === undefined) {
    return "there";
  }

  const name = `${user.firstName} ${user.lastName}`.trim();
  return name.length > 0 ? name : user.email;
};

export function DashboardWelcome({ organization, user }: DashboardWelcomeProps): ReactElement {
  return (
    <section className="grid gap-2">
      <p className="text-sm font-medium text-primary">{organization?.name ?? "BizPilot AI"}</p>
      <div className="grid gap-2 lg:max-w-3xl">
        <h1 className="text-h1">Welcome back, {getName(user)}</h1>
        <p className="text-body-large text-muted-foreground">A live overview of your projects, tasks, and team activity from the current workspace.</p>
      </div>
    </section>
  );
}
