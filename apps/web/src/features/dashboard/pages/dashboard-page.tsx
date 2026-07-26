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
    <motion.div className="grid gap-8" variants={pageTransition} initial="hidden" animate="visible">
      <DashboardWelcome organization={currentUserQuery.data?.organization} user={currentUserQuery.data?.user} />
      <DashboardSummaryGrid metrics={metrics} />
      <section className="grid gap-6 xl:grid-cols-2" aria-label="Recent work">
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
      </section>
    </motion.div>
  );
}
