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

export type TeamSortDirection = "asc" | "desc";
export type TeamMemberStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED";

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string | null;
  leadId: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  status: TeamMemberStatus;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: TeamMemberUser;
}

export interface TeamPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TeamListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: TeamSortDirection;
  archived?: boolean;
}

export interface TeamListResult {
  teams: Team[];
  pagination: TeamPagination;
}

export interface TeamMutationResponse {
  team: Team;
}

export interface TeamDeleteResponse {
  deleted: boolean;
}

export interface TeamMembersResponse {
  members: TeamMember[];
}

export interface TeamMemberMutationResponse {
  member: TeamMember;
}

export interface TeamMemberRemoveResponse {
  removed: boolean;
}

export interface CreateTeamInput {
  name: string;
  description?: string | null;
  color?: string | null;
  leadId?: string | null;
  archived?: boolean;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  leadId?: string | null;
  archived?: boolean;
}

export interface UpdateTeamVariables {
  teamId: string;
  data: UpdateTeamInput;
}

export interface AddTeamMemberInput {
  userId: string;
}

export interface AddTeamMemberVariables {
  teamId: string;
  data: AddTeamMemberInput;
  optimisticMember?: TeamMember;
}

export interface RemoveTeamMemberVariables {
  teamId: string;
  userId: string;
}

