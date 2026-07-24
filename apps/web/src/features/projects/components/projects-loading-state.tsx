import { type ReactElement } from "react";
import { Card, CardContent, CardHeader, Skeleton } from "@/components/ui";

export function ProjectsLoadingState(): ReactElement {
  return (
    <div aria-label="Loading projects" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} className="min-h-64">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="grid gap-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

