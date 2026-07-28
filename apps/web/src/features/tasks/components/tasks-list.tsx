import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { staggerChildren } from "@/lib";
import type { UserProfile } from "@/features/users";
import { TaskCard } from "./task-card";
import type { Task } from "../types";

export interface TasksListProps {
  hasUsersError?: boolean;
  isLoadingUsers?: boolean;
  tasks: Task[];
  users: UserProfile[];
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onViewAttachments: (task: Task) => void;
}

export function TasksList({ hasUsersError = false, isLoadingUsers = false, tasks, users, onDeleteTask, onEditTask, onViewAttachments }: TasksListProps): ReactElement {
  return (
    <motion.section aria-label="Tasks" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" variants={staggerChildren} initial="hidden" animate="visible">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          hasUsersError={hasUsersError}
          isLoadingUsers={isLoadingUsers}
          task={task}
          users={users}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onViewAttachments={onViewAttachments}
        />
      ))}
    </motion.section>
  );
}

