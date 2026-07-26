import { type ReactElement } from "react";
import { useUsers } from "../hooks";
import { UsersEmptyState, UsersErrorState, UsersList, UsersLoadingState, UsersPageHeader } from "../components";

const fallbackMessage = "User request failed. Please try again.";

const getUserErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  return fallbackMessage;
};

export function UsersPage(): ReactElement {
  const usersQuery = useUsers();
  const users = usersQuery.data?.users ?? [];

  return (
    <div className="grid gap-6">
      <UsersPageHeader />
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
      {usersQuery.isSuccess && users.length > 0 ? <UsersList users={users} /> : null}
    </div>
  );
}
