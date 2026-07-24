import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { staggerChildren } from "@/lib";
import { TaskCard } from "./task-card";
import type { Task } from "../types";

export interface TasksListProps {
  tasks: Task[];
}

export function TasksList({ tasks }: TasksListProps): ReactElement {
  return (
    <motion.section aria-label="Tasks" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" variants={staggerChildren} initial="hidden" animate="visible">
      {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
    </motion.section>
  );
}

