import { httpClient } from "@/services";
import type { ApiSuccessResponse, UserListQuery, UserListResult } from "../types";

const toQueryParams = (query: UserListQuery = {}): URLSearchParams => {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.search !== undefined) params.set("search", query.search);
  if (query.sort !== undefined) params.set("sort", query.sort);

  return params;
};

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

export const userService = {
  async getUsers(query: UserListQuery = {}): Promise<UserListResult> {
    const params = toQueryParams(query);
    return unwrap(await httpClient.get<ApiSuccessResponse<UserListResult>>("/users", { params }));
  }
};
