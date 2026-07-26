import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { staggerChildren, slideUp } from "@/lib";
import { DashboardSummaryCard } from "./dashboard-summary-card";
import type { DashboardMetric } from "../types";

export interface DashboardSummaryGridProps {
  metrics: DashboardMetric[];
}

export function DashboardSummaryGrid({ metrics }: DashboardSummaryGridProps): ReactElement {
  return (
    <motion.section
      aria-label="Dashboard summary"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      {metrics.map((metric) => (
        <motion.div key={metric.id} variants={slideUp}>
          <DashboardSummaryCard metric={metric} />
        </motion.div>
      ))}
    </motion.section>
  );
}
