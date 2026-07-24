import { LoaderCircle } from "lucide-react";
import { type ReactElement } from "react";
import { cn } from "@/utils";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-8 w-8" } as const;

export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps): ReactElement {
  return <LoaderCircle role="status" aria-label={label} className={cn("animate-spin text-primary", sizes[size], className)} />;
}

