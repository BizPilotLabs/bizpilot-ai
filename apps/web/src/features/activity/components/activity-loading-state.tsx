import { type ReactElement } from "react";
import { Card, Skeleton } from "@/components/ui";

export function ActivityLoadingState(): ReactElement {
  return (
    <div aria-label="Loading activities" className="grid gap-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="p-5">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="grid flex-1 gap-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
