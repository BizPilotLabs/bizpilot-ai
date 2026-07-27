import { useMemo, useState, type ReactElement } from "react";
import { Alert } from "@/components/ui";
import { useAuthStore } from "@/store";
import { getRbacErrorMessage, useRoles } from "../hooks";
import type { Role, RoleSort } from "../types";
import { DeleteRoleDialog, RoleDetailsDialog, RoleFormDialog, RolesEmptyState, RolesErrorState, RolesList, RolesLoadingState, RolesPageHeader, RolesToolbar } from "../components";

const hasElevatedRole = (roleNames: string[]): boolean => roleNames.includes("Owner") || roleNames.includes("Admin");
const hasPermission = (permissionKeys: string[], permissionKey: string): boolean => permissionKeys.includes(permissionKey);

const sortRoles = (roles: Role[], sort: RoleSort): Role[] => {
  const sorted = [...roles];
  if (sort === "name") sorted.sort((left, right) => left.name.localeCompare(right.name));
  if (sort === "createdAt") sorted.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  if (sort === "updatedAt") sorted.sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  if (sort === "permissions") sorted.sort((left, right) => right.permissions.length - left.permissions.length);
  if (sort === "users") sorted.sort((left, right) => right.userCount - left.userCount);
  return sorted;
};

const filterRoles = (roles: Role[], search: string): Role[] => {
  const trimmed = search.trim().toLowerCase();
  if (trimmed.length === 0) return roles;
  return roles.filter((role) => {
    const haystack = [role.name, role.description ?? "", role.isSystem ? "system" : "custom", ...role.permissions.map((permission) => permission.key)].join(" ").toLowerCase();
    return haystack.includes(trimmed);
  });
};

export function RolesPage(): ReactElement {
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const roleNames = useMemo(() => roles.map((role) => role.name), [roles]);
  const permissionKeys = useMemo(() => permissions.map((permission) => permission.key), [permissions]);
  const elevated = hasElevatedRole(roleNames);
  const canRead = elevated || hasPermission(permissionKeys, "roles.read");
  const canCreate = elevated || hasPermission(permissionKeys, "roles.create");
  const canUpdate = elevated || hasPermission(permissionKeys, "roles.update");
  const canDelete = elevated || hasPermission(permissionKeys, "roles.delete");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<RoleSort>("name");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsRole, setDetailsRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const rolesQuery = useRoles();
  const visibleRoles = sortRoles(filterRoles(rolesQuery.data ?? [], search), sort);

  if (!canRead) {
    return <Alert variant="danger" title="Access denied">You do not have permission to view roles.</Alert>;
  }

  return (
    <div className="grid gap-6">
      <RolesPageHeader canCreate={canCreate} onCreate={() => setCreateOpen(true)} />
      {!canUpdate ? <Alert variant="warning" title="Read-only access">You can view roles, but permission changes require role update access.</Alert> : null}
      <RolesToolbar search={search} sort={sort} onSearchChange={setSearch} onSortChange={setSort} />
      {rolesQuery.isLoading ? <RolesLoadingState /> : null}
      {rolesQuery.isError ? <RolesErrorState message={getRbacErrorMessage(rolesQuery.error)} isRetrying={rolesQuery.isFetching} onRetry={() => void rolesQuery.refetch()} /> : null}
      {rolesQuery.isSuccess && visibleRoles.length === 0 ? <RolesEmptyState /> : null}
      {rolesQuery.isSuccess && visibleRoles.length > 0 ? <RolesList roles={visibleRoles} canUpdate={canUpdate} canDelete={canDelete} onView={setDetailsRole} onEdit={setEditingRole} onDelete={setDeletingRole} /> : null}
      <RoleFormDialog mode="create" role={null} open={createOpen} onOpenChange={setCreateOpen} />
      <RoleFormDialog mode="edit" role={editingRole} open={editingRole !== null} onOpenChange={(open) => !open && setEditingRole(null)} />
      <RoleDetailsDialog role={detailsRole} open={detailsRole !== null} onOpenChange={(open) => !open && setDetailsRole(null)} />
      <DeleteRoleDialog role={deletingRole} open={deletingRole !== null} onOpenChange={(open) => !open && setDeletingRole(null)} />
    </div>
  );
}
