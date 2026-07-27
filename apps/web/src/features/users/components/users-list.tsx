import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { staggerChildren } from "@/lib";
import type { UserProfile } from "../types";
import { UserCard } from "./user-card";

export interface UsersListProps {
  users: UserProfile[];
  currentUserId: string | null;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  onViewUser: (user: UserProfile) => void;
  onEditUser: (user: UserProfile) => void;
  onDeleteUser: (user: UserProfile) => void;
}

const isOwner = (user: UserProfile): boolean => user.roles.some((role) => role.name === "Owner");

export function UsersList({ users, currentUserId, canEditUsers, canDeleteUsers, onViewUser, onEditUser, onDeleteUser }: UsersListProps): ReactElement {
  return (
    <motion.section variants={staggerChildren} initial="hidden" animate="visible" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Users list">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          canEdit={canEditUsers || user.id === currentUserId}
          canDelete={canDeleteUsers && user.id !== currentUserId && !isOwner(user)}
          onView={onViewUser}
          onEdit={onEditUser}
          onDelete={onDeleteUser}
        />
      ))}
    </motion.section>
  );
}
