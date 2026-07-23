import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AppError } from "../../core/errors/index.js";
import { authService } from "../auth/auth.service.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { rbacRepository } from "./rbac.repository.js";

export const authenticate: RequestHandler = (request: Request, _response: Response, next: NextFunction): void => {
  const authorizationHeader = request.get("authorization");

  if (authorizationHeader === undefined || !authorizationHeader.startsWith("Bearer ")) {
    next(new AppError({ statusCode: 401, message: "Access token is required.", code: "AUTH_TOKEN_REQUIRED" }));
    return;
  }

  const accessToken = authorizationHeader.slice("Bearer ".length).trim();

  if (accessToken.length === 0) {
    next(new AppError({ statusCode: 401, message: "Access token is required.", code: "AUTH_TOKEN_REQUIRED" }));
    return;
  }

  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.auth = authService.verifyAccessToken(accessToken);
  next();
};

export const requirePermission = (permissionKey: string): RequestHandler => {
  return (request: Request, _response: Response, next: NextFunction): void => {
    void (async (): Promise<void> => {
      const authenticatedRequest = request as AuthenticatedRequest;
      const user = await rbacRepository.findUserByIdInOrganization({
        userId: authenticatedRequest.auth.userId,
        organizationId: authenticatedRequest.auth.organizationId,
      });

      if (user === null || user.status !== "ACTIVE") {
        next(new AppError({ statusCode: 403, message: "Permission denied.", code: "RBAC_PERMISSION_DENIED" }));
        return;
      }

      const hasPermission = user.roles.some(({ role }) => {
        if (role.deletedAt !== null) {
          return false;
        }

        if (role.name === "Owner" || role.name === "Admin") {
          return true;
        }

        return role.permissions.some(({ permission }) => permission.deletedAt === null && permission.key === permissionKey);
      });

      if (!hasPermission) {
        next(new AppError({ statusCode: 403, message: "Permission denied.", code: "RBAC_PERMISSION_DENIED" }));
        return;
      }

      next();
    })().catch(next);
  };
};