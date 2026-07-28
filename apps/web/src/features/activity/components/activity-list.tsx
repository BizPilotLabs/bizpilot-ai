import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { staggerChildren } from "@/lib";
import { ActivityCard } from "./activity-card";
import type { Activity } from "../types";

export interface ActivityListProps {
  activities: Activity[];
  onViewDetails: (activity: Activity) => void;
}

export function ActivityList({ activities, onViewDetails }: ActivityListProps): ReactElement {
  return (
    <motion.div aria-label="Activity feed" className="grid gap-4" initial="hidden" animate="show" variants={staggerChildren}>
      {activities.map((activity) => <ActivityCard key={activity.id} activity={activity} onViewDetails={onViewDetails} />)}
    </motion.div>
  );
}

