export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}

export interface ApiErrorResponse {
  success: false;
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
}

export type ActivitySortDirection = "asc" | "desc";
export type ActivityMetadata = string | number | boolean | null | ActivityMetadata[] | { [key: string]: ActivityMetadata };

export interface ActivityActor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export interface Activity {
  id: string;
  organizationId: string | null;
  userId: string | null;
  action: string;
  type: string;
  resource: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: ActivityMetadata;
  createdAt: string;
  updatedAt: string;
  actor: ActivityActor | null;
}

export interface ActivityPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ActivityListQuery {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  resource?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  sort?: ActivitySortDirection;
}

export interface ActivityListResult {
  activities: Activity[];
  pagination: ActivityPagination;
}

export interface ActivityDetailResponse {
  activity: Activity;
}
