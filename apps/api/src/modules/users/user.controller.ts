import type { Response } from "express";

import { listUsersQuerySchema, updateUserSchema, userIdParamsSchema } from "./user.schema.js";
import { userService } from "./user.service.js";
import type { RequestMetadata, UserRequest } from "./user.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const toMetadata = (request: UserRequest): RequestMetadata => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

const sendSuccess = <T>(response: Response, statusCode: number, data: T): void => {
  const body: SuccessResponse<T> = {
    success: true,
    data,
  };

  response.status(statusCode).json(body);
};

export class UserController {
  public async listUsers(request: UserRequest, response: Response): Promise<void> {
    const query = listUsersQuerySchema.parse(request.query);
    const result = await userService.listUsers({
      organizationId: request.auth.organizationId,
      query,
    });

    sendSuccess(response, 200, result);
  }

  public async getUser(request: UserRequest, response: Response): Promise<void> {
    const params = userIdParamsSchema.parse(request.params);
    const user = await userService.getUser({
      requesterUserId: request.auth.userId,
      organizationId: request.auth.organizationId,
      targetUserId: params.id,
    });

    sendSuccess(response, 200, { user });
  }

  public async updateUser(request: UserRequest, response: Response): Promise<void> {
    const params = userIdParamsSchema.parse(request.params);
    const input = updateUserSchema.parse(request.body);
    const user = await userService.updateUser({
      requesterUserId: request.auth.userId,
      organizationId: request.auth.organizationId,
      targetUserId: params.id,
      data: input,
      metadata: toMetadata(request),
    });

    sendSuccess(response, 200, { user });
  }

  public async deleteUser(request: UserRequest, response: Response): Promise<void> {
    const params = userIdParamsSchema.parse(request.params);
    await userService.deleteUser({
      requesterUserId: request.auth.userId,
      organizationId: request.auth.organizationId,
      targetUserId: params.id,
      metadata: toMetadata(request),
    });

    sendSuccess(response, 200, { deleted: true });
  }
}

export const userController = new UserController();