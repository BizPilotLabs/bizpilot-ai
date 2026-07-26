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
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <section className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit" className="grid gap-8">
          <div className="grid gap-7">
            <Link to={routePaths.root} className="inline-flex w-fit items-center gap-2.5 text-sm font-semibold text-foreground" aria-label="BizPilot AI home">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background shadow-[0_14px_34px_hsl(var(--shadow-color)/0.20)]">B</span>
              <span>BizPilot AI</span>
            </Link>
            <div className="grid gap-3">
              <h1 className="text-h2">{title}</h1>
              <p className="text-small text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/88 p-5 shadow-[0_18px_55px_hsl(var(--shadow-color)/0.10)] backdrop-blur-sm">
            {children}
          </div>
          {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
        </motion.div>
      </section>
      <aside className="hidden border-l border-border/70 bg-surface-raised/70 lg:block" aria-hidden="true">
        <div className="flex h-full items-center justify-center p-12">
          <div className="w-full max-w-xl rounded-3xl border border-border/70 bg-surface/75 p-8 shadow-[0_24px_80px_hsl(var(--shadow-color)/0.14)] backdrop-blur-xl">
            <div className="grid gap-8">
              <div className="grid gap-3">
                <p className="text-caption text-primary">Operating system for modern teams</p>
                <p className="text-h2">Plan, coordinate, and ship with clarity.</p>
                <p className="text-small text-muted-foreground">BizPilot AI gives your workspace a quiet command center for projects, tasks, teams, and activity.</p>
              </div>
              <div className="grid gap-3">
                {["Unified workspace", "Role-aware collaboration", "Real-time operational context"].map((item) => (
                  <div key={item} className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3 text-sm font-medium">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
