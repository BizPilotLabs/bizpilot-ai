import { type ReactElement } from "react";
import { Card, CardContent, CardHeader, Skeleton } from "@/components/ui";

export function RolesLoadingState(): ReactElement {
  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading roles">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index}>
          <CardHeader><Skeleton className="h-5 w-36" /><Skeleton className="h-4 w-full" /></CardHeader>
          <CardContent className="grid gap-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-8 w-32" /></CardContent>
        </Card>
      ))}
    </section>
  );
}
