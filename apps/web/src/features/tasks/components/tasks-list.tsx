import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { staggerChildren } from "@/lib";
import type { UserProfile } from "@/features/users";
import { TaskCard } from "./task-card";
import type { Task } from "../types";

export interface TasksListProps {
  canDeleteTask?: boolean;
  canUpdateTask?: boolean;
  hasUsersError?: boolean;
  isLoadingUsers?: boolean;
  tasks: Task[];
  users: UserProfile[];
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onViewAttachments: (task: Task) => void;
  onViewTask: (task: Task) => void;
}

export function TasksList({ canDeleteTask = true, canUpdateTask = true, hasUsersError = false, isLoadingUsers = false, tasks, users, onDeleteTask, onEditTask, onViewAttachments, onViewTask }: TasksListProps): ReactElement {
  return (
    <motion.div animate="show" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" initial="hidden" variants={staggerChildren}>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          canDeleteTask={canDeleteTask}
          canUpdateTask={canUpdateTask}
          hasUsersError={hasUsersError}
          isLoadingUsers={isLoadingUsers}
          task={task}
          users={users}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onViewAttachments={onViewAttachments}
          onViewTask={onViewTask}
        />
      ))}
    </motion.div>
  );
}