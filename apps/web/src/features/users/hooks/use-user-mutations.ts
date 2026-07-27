import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services";
import type { CreateUserInput, UpdateUserRolesVariables, UpdateUserVariables, UserListResult, UserProfile } from "../types";
import { userQueryKeys } from "./user-query-keys";

const replaceUserInList = (current: UserListResult | undefined, user: UserProfile): UserListResult | undefined => {
  if (current === undefined) {
    return current;
  }

  return {
    ...current,
    users: current.users.map((currentUser) => (currentUser.id === user.id ? user : currentUser))
  };
};

const removeUserFromList = (current: UserListResult | undefined, userId: string): UserListResult | undefined => {
  if (current === undefined || !current.users.some((user) => user.id === userId)) {
    return current;
  }

  const nextTotal = Math.max(0, current.pagination.total - 1);
  const nextTotalPages = nextTotal === 0 ? 0 : Math.ceil(nextTotal / current.pagination.limit);

  return {
    ...current,
    users: current.users.filter((user) => user.id !== userId),
    pagination: {
      ...current.pagination,
      total: nextTotal,
      totalPages: nextTotalPages
    }
  };
};

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => userService.createUser(input),
    onSuccess: (user) => {
      queryClient.setQueryData(userQueryKeys.detail(user.id), user);
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    }
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: UpdateUserVariables) => userService.updateUser(userId, data),
    onSuccess: (user) => {
      queryClient.setQueryData(userQueryKeys.detail(user.id), user);
      queryClient.setQueriesData<UserListResult>({ queryKey: userQueryKeys.lists() }, (current) => replaceUserInList(current, user));
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: userQueryKeys.all });
      const previousLists = queryClient.getQueriesData<UserListResult>({ queryKey: userQueryKeys.lists() });
      queryClient.removeQueries({ queryKey: userQueryKeys.detail(userId) });
      queryClient.setQueriesData<UserListResult>({ queryKey: userQueryKeys.lists() }, (current) => removeUserFromList(current, userId));
      return { previousLists };
    },
    onError: (_error, _userId, context) => {
      for (const [queryKey, data] of context?.previousLists ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: (_result, userId) => {
      queryClient.removeQueries({ queryKey: userQueryKeys.detail(userId) });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    }
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleIds }: UpdateUserRolesVariables) => userService.updateUserRoles(userId, roleIds),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(userQueryKeys.userRoles(variables.userId), result);
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(variables.userId) });
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    }
  });
}
