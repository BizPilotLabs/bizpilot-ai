import type { Response } from "express";

import {
  createRoleSchema,
  roleIdParamsSchema,
  updateRolePermissionsSchema,
  updateRoleSchema,
  updateUserRolesSchema,
  userIdParamsSchema,
} from "./rbac.schema.js";
import { rbacService } from "./rbac.service.js";
import type { RbacRequest, RequestMetadata } from "./rbac.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const toMetadata = (request: RbacRequest): RequestMetadata => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

const sendSuccess = <T>(response: Response, statusCode: number, data: T): void => {
  const body: SuccessResponse<T> = { success: true, data };
  response.status(statusCode).json(body);
};

export class RbacController {
  public async listRoles(request: RbacRequest, response: Response): Promise<void> {
    const roles = await rbacService.listRoles({ actorUserId: request.auth.userId, organizationId: request.auth.organizationId });
    sendSuccess(response, 200, { roles });
  }

  public async createRole(request: RbacRequest, response: Response): Promise<void> {
    const input = createRoleSchema.parse(request.body);
    const role = await rbacService.createRole({
      actorUserId: request.auth.userId,
      organizationId: request.auth.organizationId,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 201, { role });
  }

  public async getRole(request: RbacRequest, response: Response): Promise<void> {
    const params = roleIdParamsSchema.parse(request.params);
    const role = await rbacService.getRole({ actorUserId: request.auth.userId, organizationId: request.auth.organizationId, roleId: params.id });
    sendSuccess(response, 200, { role });
  }

  public async updateRole(request: RbacRequest, response: Response): Promise<void> {
    const params = roleIdParamsSchema.parse(request.params);
    const input = updateRoleSchema.parse(request.body);
    const role = await rbacService.updateRole({
      actorUserId: request.auth.userId,
      organizationId: request.auth.organizationId,
      roleId: params.id,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { role });
  }

  public async deleteRole(request: RbacRequest, response: Response): Promise<void> {
    const params = roleIdParamsSchema.parse(request.params);
    await rbacService.deleteRole({
      actorUserId: request.auth.userId,
      organizationId: request.auth.organizationId,
      roleId: params.id,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { deleted: true });
  }

  public async listPermissions(_request: RbacRequest, response: Response): Promise<void> {
    const permissions = await rbacService.listPermissions();
    sendSuccess(response, 200, { permissions });
  }

  public async updateRolePermissions(request: RbacRequest, response: Response): Promise<void> {
    const params = roleIdParamsSchema.parse(request.params);
    const input = updateRolePermissionsSchema.parse(request.body);
    const role = await rbacService.updateRolePermissions({
      actorUserId: request.auth.userId,
      organizationId: request.auth.organizationId,
      roleId: params.id,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { role });
  }

  public async getUserRoles(request: RbacRequest, response: Response): Promise<void> {
    const params = userIdParamsSchema.parse(request.params);
    const result = await rbacService.getUserRoles({
      actorUserId: request.auth.userId,
      organizationId: request.auth.organizationId,
      targetUserId: params.id,
    });
    sendSuccess(response, 200, result);
  }

  public async updateUserRoles(request: RbacRequest, response: Response): Promise<void> {
    const params = userIdParamsSchema.parse(request.params);
    const input = updateUserRolesSchema.parse(request.body);
    const result = await rbacService.updateUserRoles({
      actorUserId: request.auth.userId,
      organizationId: request.auth.organizationId,
      targetUserId: params.id,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, result);
  }
}

export const rbacController = new RbacController();