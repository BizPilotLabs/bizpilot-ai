import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: { xs: "480px", sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" },
    spacing: {
      0: "0", 1: "0.25rem", 2: "0.5rem", 3: "0.75rem", 4: "1rem", 5: "1.25rem", 6: "1.5rem",
      8: "2rem", 10: "2.5rem", 12: "3rem", 16: "4rem", 20: "5rem", 24: "6rem", 32: "8rem", 40: "10rem", 48: "12rem", 64: "16rem"
    },
    extend: {
      colors: {
        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
        text: { DEFAULT: "hsl(var(--text))", subtle: "hsl(var(--text-subtle))" },
        surface: { DEFAULT: "hsl(var(--surface))", raised: "hsl(var(--surface-raised))", overlay: "hsl(var(--surface-overlay))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        danger: { DEFAULT: "hsl(var(--danger))", foreground: "hsl(var(--danger-foreground))" },
        destructive: { DEFAULT: "hsl(var(--danger))", foreground: "hsl(var(--danger-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" }
      },
      borderRadius: { xs: "0.25rem", sm: "0.375rem", md: "0.5rem", lg: "var(--radius)", xl: "0.875rem", "2xl": "1.25rem", full: "9999px" },
      boxShadow: {
        xs: "0 1px 2px hsl(var(--shadow-color) / 0.05)",
        sm: "0 1px 3px hsl(var(--shadow-color) / 0.08), 0 1px 2px hsl(var(--shadow-color) / 0.05)",
        md: "0 8px 24px hsl(var(--shadow-color) / 0.10)",
        lg: "0 16px 48px hsl(var(--shadow-color) / 0.14)",
        xl: "0 24px 72px hsl(var(--shadow-color) / 0.18)",
        glow: "0 0 0 1px hsl(var(--primary) / 0.12), 0 12px 40px hsl(var(--primary) / 0.16)"
      },
      transitionTimingFunction: { premium: "cubic-bezier(0.16, 1, 0.3, 1)" }
    }
  },
  plugins: [animate]
} satisfies Config;

export default config;

