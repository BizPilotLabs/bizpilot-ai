import { Prisma, type Team, type TeamMember } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type { RequestMetadata, TeamCreateInput, TeamListQuery, TeamMemberCreateInput, TeamMemberRecord, TeamUpdateInput } from "./team.types.js";

const createSearchWhere = (query: TeamListQuery): Prisma.TeamWhereInput => {
  if (query.search === undefined) return {};
  return { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { description: { contains: query.search, mode: "insensitive" } }] };
};

const toCreateData = (input: { organizationId: string; data: TeamCreateInput }): Prisma.TeamUncheckedCreateInput => ({
  organizationId: input.organizationId,
  name: input.data.name,
  description: input.data.description ?? null,
  color: input.data.color ?? null,
  leadId: input.data.leadId ?? null,
  archived: input.data.archived ?? false,
});

const toUpdateData = (input: TeamUpdateInput): Prisma.TeamUncheckedUpdateInput => {
  const data: Prisma.TeamUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.color !== undefined) data.color = input.color;
  if (input.leadId !== undefined) data.leadId = input.leadId;
  if (input.archived !== undefined) data.archived = input.archived;
  return data;
};

const teamMemberUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  status: true,
} satisfies Prisma.UserSelect;

export class TeamRepository {
  public async findUserInOrganization(input: { userId: string; organizationId: string }): Promise<{ id: string } | null> {
    return prisma.user.findFirst({ where: { id: input.userId, organizationId: input.organizationId, deletedAt: null }, select: { id: true } });
  }

  public async findTeams(input: { organizationId: string; query: TeamListQuery }): Promise<{ teams: Team[]; total: number }> {
    const where: Prisma.TeamWhereInput = { organizationId: input.organizationId, deletedAt: null, ...createSearchWhere(input.query) };
    if (input.query.archived !== undefined) where.archived = input.query.archived;

    const [teams, total] = await Promise.all([
      prisma.team.findMany({ where, orderBy: { createdAt: input.query.sort }, skip: (input.query.page - 1) * input.query.limit, take: input.query.limit }),
      prisma.team.count({ where }),
    ]);

    return { teams, total };
  }

  public async findTeamByIdInOrganization(input: { teamId: string; organizationId: string }): Promise<Team | null> {
    return prisma.team.findFirst({ where: { id: input.teamId, organizationId: input.organizationId, deletedAt: null } });
  }

  public async findMembership(input: { teamId: string; userId: string }): Promise<TeamMember | null> {
    return prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: input.teamId, userId: input.userId } } });
  }

  public async findMembers(input: { teamId: string }): Promise<TeamMemberRecord[]> {
    return prisma.teamMember.findMany({
      where: { teamId: input.teamId, user: { deletedAt: null } },
      include: { user: { select: teamMemberUserSelect } },
      orderBy: { createdAt: "asc" },
    });
  }

  public async createTeam(input: { actorUserId: string; organizationId: string; data: TeamCreateInput; metadata: RequestMetadata }): Promise<Team> {
    try {
      return await prisma.$transaction(async (transaction) => {
        const team = await transaction.team.create({ data: toCreateData({ organizationId: input.organizationId, data: input.data }) });
        await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: input.organizationId, action: "team.create", metadata: input.metadata, auditMetadata: { teamId: team.id } }) });
        return team;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("TEAM_NAME_CONFLICT");
      }
      throw error;
    }
  }

  public async updateTeam(input: { teamId: string; actorUserId: string; organizationId: string; data: TeamUpdateInput; metadata: RequestMetadata }): Promise<Team> {
    try {
      return await prisma.$transaction(async (transaction) => {
        const existingTeam = await transaction.team.findUniqueOrThrow({ where: { id: input.teamId } });
        const team = await transaction.team.update({ where: { id: input.teamId }, data: toUpdateData(input.data) });
        await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: input.organizationId, action: "team.update", metadata: input.metadata, auditMetadata: { teamId: team.id, fields: Object.keys(input.data).filter((key) => input.data[key as keyof TeamUpdateInput] !== undefined) } }) });

        if (input.data.leadId !== undefined && existingTeam.leadId !== input.data.leadId) {
          await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: input.organizationId, action: "team.lead.change", metadata: input.metadata, auditMetadata: { teamId: team.id, previousLeadId: existingTeam.leadId, leadId: team.leadId } }) });
        }

        return team;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("TEAM_NAME_CONFLICT");
      }
      throw error;
    }
  }

  public async softDeleteTeam(input: { teamId: string; actorUserId: string; organizationId: string; metadata: RequestMetadata }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      await transaction.team.update({ where: { id: input.teamId }, data: { deletedAt: new Date(), archived: true } });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: input.organizationId, action: "team.delete", metadata: input.metadata, auditMetadata: { teamId: input.teamId } }) });
    });
  }

  public async addMember(input: { teamId: string; actorUserId: string; organizationId: string; data: TeamMemberCreateInput; metadata: RequestMetadata }): Promise<TeamMemberRecord> {
    try {
      return await prisma.$transaction(async (transaction) => {
        const member = await transaction.teamMember.create({ data: { teamId: input.teamId, userId: input.data.userId }, include: { user: { select: teamMemberUserSelect } } });
        await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: input.organizationId, action: "team.member.add", metadata: input.metadata, auditMetadata: { teamId: input.teamId, userId: input.data.userId } }) });
        return member;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("TEAM_MEMBER_CONFLICT");
      }
      throw error;
    }
  }

  public async removeMember(input: { teamId: string; userId: string; actorUserId: string; organizationId: string; metadata: RequestMetadata }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      await transaction.teamMember.delete({ where: { teamId_userId: { teamId: input.teamId, userId: input.userId } } });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: input.organizationId, action: "team.member.remove", metadata: input.metadata, auditMetadata: { teamId: input.teamId, userId: input.userId } }) });
    });
  }

  private createAuditLogData(input: {
    actorUserId: string;
    organizationId: string;
    action: string;
    metadata: RequestMetadata;
    auditMetadata: Prisma.InputJsonValue;
  }): Prisma.AuditLogUncheckedCreateInput {
    return {
      userId: input.actorUserId,
      organizationId: input.organizationId,
      action: input.action,
      resource: "team",
      ipAddress: input.metadata.ipAddress ?? null,
      userAgent: input.metadata.userAgent ?? null,
      metadata: input.auditMetadata,
    };
  }
}

export const teamRepository = new TeamRepository();