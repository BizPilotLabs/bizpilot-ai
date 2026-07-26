import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { staggerChildren } from "@/lib";
import { UserCard } from "./user-card";
import type { UserProfile } from "../types";

export interface UsersListProps {
  users: UserProfile[];
}

export function UsersList({ users }: UsersListProps): ReactElement {
  return (
    <motion.section aria-label="Users" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" variants={staggerChildren} initial="hidden" animate="visible">
      {users.map((user) => <UserCard key={user.id} user={user} />)}
    </motion.section>
  );
}
