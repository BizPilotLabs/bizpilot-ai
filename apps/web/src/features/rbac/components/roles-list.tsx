import { motion } from "framer-motion";
import { type ReactElement } from "react";
import { staggerChildren } from "@/lib";
import type { Role } from "../types";
import { RoleCard } from "./role-card";

export interface RolesListProps {
  roles: Role[];
  canUpdate: boolean;
  canDelete: boolean;
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

export function RolesList({ roles, canUpdate, canDelete, onView, onEdit, onDelete }: RolesListProps): ReactElement {
  return (
    <motion.section variants={staggerChildren} initial="hidden" animate="visible" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Roles list">
      {roles.map((role) => <RoleCard key={role.id} role={role} canUpdate={canUpdate} canDelete={canDelete} onView={onView} onEdit={onEdit} onDelete={onDelete} />)}
    </motion.section>
  );
}
