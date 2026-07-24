import { motion } from "framer-motion";
import { type ReactElement, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { pageTransition } from "@/lib";
import { routePaths } from "@/routes";

export interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps): ReactElement {
  return (
    <main className="flex min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit" className="grid gap-8">
          <div className="grid gap-6">
            <Link to={routePaths.root} className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-foreground" aria-label="BizPilot AI home">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">B</span>
              <span>BizPilot AI</span>
            </Link>
            <div className="grid gap-2">
              <h1 className="text-h2">{title}</h1>
              <p className="text-small text-muted-foreground">{description}</p>
            </div>
          </div>
          {children}
          {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
        </motion.div>
      </section>
      <aside className="hidden flex-1 border-l border-border bg-surface-raised lg:block" aria-hidden="true">
        <div className="h-full bg-[radial-gradient(circle_at_28%_20%,hsl(var(--primary)/0.18),transparent_32%),radial-gradient(circle_at_70%_62%,hsl(var(--accent)/0.14),transparent_36%)]" />
      </aside>
    </main>
  );
}

