import { type LucideProps } from "lucide-react";
import { type ReactElement } from "react";
import { iconSizes, type AppIcon, type IconSize } from "@/lib";

export interface IconProps extends Omit<LucideProps, "ref"> {
  icon: AppIcon;
  size?: IconSize;
}

export function Icon({ icon: LucideIcon, size = "md", strokeWidth = 2, ...props }: IconProps): ReactElement {
  return <LucideIcon aria-hidden={props["aria-label"] ? undefined : true} size={iconSizes[size]} strokeWidth={strokeWidth} {...props} />;
}

