import { type ImgHTMLAttributes, type ReactElement } from "react";
import { cn } from "@/utils";

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  name: string;
  src?: string | undefined;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" } as const;

export function Avatar({ className, name, src, size = "md", alt, ...props }: AvatarProps): ReactElement {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";

  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-medium text-muted-foreground", sizes[size], className)}>
      {src ? <img src={src} alt={alt ?? name} className="h-full w-full object-cover" {...props} /> : initials}
    </span>
  );
}

