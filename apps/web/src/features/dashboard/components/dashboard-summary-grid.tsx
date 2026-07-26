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
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      {metrics.map((metric, index) => (
        <motion.div key={metric.id} variants={slideUp} className={index === 0 ? "sm:col-span-2 xl:col-span-1" : undefined}>
          <DashboardSummaryCard metric={metric} featured={index === 0} />
        </motion.div>
      ))}
    </motion.section>
  );
}
