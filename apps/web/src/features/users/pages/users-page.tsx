import { useMemo, useState, type ReactElement } from "react";
import { Pagination } from "@/components/ui";
import { useAuthStore } from "@/store";
import { useUsers } from "../hooks";
import type { UserListQuery, UserProfile, UserSortDirection } from "../types";
import {
  CreateUserDialog,
  DeleteUserDialog,
  EditUserDialog,
  UserDetailsDialog,
  UsersEmptyState,
  UsersErrorState,
  UsersList,
  UsersLoadingState,
  UsersPageHeader,
  UsersToolbar
} from "../components";
import { getUserErrorMessage } from "../hooks";

const hasPermission = (permissionKeys: string[], permissionKey: string): boolean => permissionKeys.includes(permissionKey);
const hasElevatedRole = (roleNames: string[]): boolean => roleNames.includes("Owner") || roleNames.includes("Admin");

export function UsersPage(): ReactElement {
  const currentUser = useAuthStore((state) => state.user);
  const currentRoles = useAuthStore((state) => state.roles);
  const currentPermissions = useAuthStore((state) => state.permissions);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [sort, setSort] = useState<UserSortDirection>("desc");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const permissionKeys = useMemo(() => currentPermissions.map((permission) => permission.key), [currentPermissions]);
  const roleNames = useMemo(() => currentRoles.map((role) => role.name), [currentRoles]);
  const elevated = hasElevatedRole(roleNames);
  const canCreateUser = elevated || hasPermission(permissionKeys, "users.create");
  const canEditUsers = elevated || hasPermission(permissionKeys, "users.update");
  const canDeleteUsers = elevated || hasPermission(permissionKeys, "users.delete");
  const canManageRoles = elevated || hasPermission(permissionKeys, "roles.update");
  const userListQuery: UserListQuery = search === undefined ? { page, limit, sort } : { page, limit, sort, search };
  const usersQuery = useUsers(userListQuery);
  const users = usersQuery.data?.users ?? [];
  const pagination = usersQuery.data?.pagination;

  const handleSearchSubmit = (): void => {
    const trimmed = searchInput.trim();
    setSearch(trimmed.length > 0 ? trimmed : undefined);
    setPage(1);
  };

  const handleSortChange = (nextSort: UserSortDirection): void => {
    setSort(nextSort);
    setPage(1);
  };

  const handleLimitChange = (nextLimit: number): void => {
    setLimit(nextLimit);
    setPage(1);
  };

  return (
    <div className="grid gap-6">
      <UsersPageHeader canCreateUser={canCreateUser} onCreateUser={() => setCreateOpen(true)} />
      <UsersToolbar
        search={searchInput}
        sort={sort}
        limit={limit}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        onSortChange={handleSortChange}
        onLimitChange={handleLimitChange}
      />
      {usersQuery.isLoading ? <UsersLoadingState /> : null}
      {usersQuery.isError ? (
        <UsersErrorState
          isRetrying={usersQuery.isFetching}
          message={getUserErrorMessage(usersQuery.error)}
          onRetry={() => {
            void usersQuery.refetch();
          }}
        />
      ) : null}
      {usersQuery.isSuccess && users.length === 0 ? <UsersEmptyState /> : null}
      {usersQuery.isSuccess && users.length > 0 ? (
        <>
          <UsersList
            users={users}
            currentUserId={currentUser?.id ?? null}
            canEditUsers={canEditUsers}
            canDeleteUsers={canDeleteUsers}
            onViewUser={setDetailsUser}
            onEditUser={setEditingUser}
            onDeleteUser={setDeletingUser}
          />
          {pagination && pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-surface/75 p-3">
              <p className="text-sm text-muted-foreground">
                Showing page {pagination.page} of {pagination.totalPages} for {pagination.total.toLocaleString()} users.
              </p>
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          ) : null}
        </>
      ) : null}
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <UserDetailsDialog user={detailsUser} open={detailsUser !== null} onOpenChange={(open) => !open && setDetailsUser(null)} />
      <EditUserDialog user={editingUser} open={editingUser !== null} canManageRoles={canManageRoles} onOpenChange={(open) => !open && setEditingUser(null)} />
      <DeleteUserDialog user={deletingUser} open={deletingUser !== null} onOpenChange={(open) => !open && setDeletingUser(null)} />
    </div>
  );
}

