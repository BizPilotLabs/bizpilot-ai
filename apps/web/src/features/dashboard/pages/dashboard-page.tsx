import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { useCurrentUser } from "@/features/auth";
import { pageTransition } from "@/lib";
import { DashboardSummaryGrid, DashboardWelcome, RecentProjectsPanel, RecentTasksPanel } from "../components";
import { useDashboardData } from "../hooks";

export function DashboardPage(): ReactElement {
  const currentUserQuery = useCurrentUser();
  const { metrics, recentProjectsQuery, recentTasksQuery } = useDashboardData();

  return (
    <motion.div className="grid gap-7" variants={pageTransition} initial="hidden" animate="visible">
      <DashboardWelcome organization={currentUserQuery.data?.organization} user={currentUserQuery.data?.user} />
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr] xl:items-start" aria-label="Dashboard overview">
        <div className="xl:sticky xl:top-24">
          <DashboardSummaryGrid metrics={metrics} />
        </div>
        <div className="grid gap-6">
          <RecentProjectsPanel
            error={recentProjectsQuery.error}
            isError={recentProjectsQuery.isError}
            isLoading={recentProjectsQuery.isLoading}
            isRetrying={recentProjectsQuery.isFetching}
            projects={recentProjectsQuery.data?.projects ?? []}
            onRetry={() => {
              void recentProjectsQuery.refetch();
            }}
          />
          <RecentTasksPanel
            error={recentTasksQuery.error}
            isError={recentTasksQuery.isError}
            isLoading={recentTasksQuery.isLoading}
            isRetrying={recentTasksQuery.isFetching}
            tasks={recentTasksQuery.data?.tasks ?? []}
            onRetry={() => {
              void recentTasksQuery.refetch();
            }}
          />
        </div>
      </section>
    </motion.div>
  );
}
