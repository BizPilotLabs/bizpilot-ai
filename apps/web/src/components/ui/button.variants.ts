import { cva } from "class-variance-authority";

export const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 ease-premium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      primary: "bg-foreground text-background shadow-[0_1px_0_hsl(var(--background)/0.18)_inset,0_12px_28px_hsl(var(--shadow-color)/0.18)] hover:-translate-y-0.5 hover:bg-foreground/92",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/90",
      neutral: "border border-border/80 bg-surface/80 text-foreground shadow-xs hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-surface",
      ghost: "text-foreground hover:bg-muted/80",
      subtle: "bg-muted/80 text-foreground hover:bg-muted",
      danger: "bg-danger text-danger-foreground shadow-sm hover:-translate-y-0.5 hover:bg-danger/90",
      success: "bg-success text-success-foreground shadow-sm hover:-translate-y-0.5 hover:bg-success/90",
      warning: "bg-warning text-warning-foreground shadow-sm hover:-translate-y-0.5 hover:bg-warning/90"
    },
    size: {
      sm: "h-8 px-3",
      md: "h-10 px-4",
      lg: "h-11 px-5 text-base",
      icon: "h-10 w-10"
    }
  },
  defaultVariants: { variant: "primary", size: "md" }
});
