import { LoaderCircle } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { buttonVariants } from "./button.variants";
import { cn } from "@/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "neutral" | "ghost" | "subtle" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || isLoading} {...props}>
    {isLoading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : leftIcon}
    {children}
    {rightIcon}
  </button>
));

Button.displayName = "Button";

