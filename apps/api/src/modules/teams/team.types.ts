import type { Team, TeamMember, User } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export interface TeamResponse {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string | null;
  leadId: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMemberResponse {
  id: string;
  teamId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    status: User["status"];
  };
}

export interface TeamListQuery {
  page: number;
  limit: number;
  search?: string | undefined;
  sort: "asc" | "desc";
  archived?: boolean | undefined;
}

export interface TeamListResult {
  teams: TeamResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TeamCreateInput {
  name: string;
  description?: string | null | undefined;
  color?: string | null | undefined;
  leadId?: string | null | undefined;
  archived?: boolean | undefined;
}

export interface TeamUpdateInput {
  name?: string | undefined;
  description?: string | null | undefined;
  color?: string | null | undefined;
  leadId?: string | null | undefined;
  archived?: boolean | undefined;
}

export interface TeamMemberCreateInput {
  userId: string;
}

export interface RequestMetadata {
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export type TeamRecord = Team;
export type TeamMemberRecord = TeamMember & { user: Pick<User, "id" | "email" | "firstName" | "lastName" | "avatar" | "status"> };
export type TeamRequest = AuthenticatedRequest;