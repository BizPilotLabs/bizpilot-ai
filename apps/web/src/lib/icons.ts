import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export const iconSizes = { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 } as const;
export type IconSize = keyof typeof iconSizes;
export type AppIcon = ComponentType<LucideProps>;

