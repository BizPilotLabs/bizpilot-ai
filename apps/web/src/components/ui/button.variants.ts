import { cva } from "class-variance-authority";

export const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-premium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90",
      neutral: "border border-border bg-surface text-foreground hover:bg-muted",
      ghost: "text-foreground hover:bg-muted",
      subtle: "bg-muted text-foreground hover:bg-muted/80",
      danger: "bg-danger text-danger-foreground shadow-sm hover:bg-danger/90",
      success: "bg-success text-success-foreground shadow-sm hover:bg-success/90",
      warning: "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90"
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

