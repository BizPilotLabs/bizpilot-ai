import { Router, type NextFunction, type Request, type RequestHandler, type Response, type Router as ExpressRouter } from "express";

import { AppError } from "../../core/errors/index.js";
import { authService } from "../auth/auth.service.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { organizationController } from "./organization.controller.js";
import type { OrganizationRequest } from "./organization.types.js";

const authenticatedAsyncHandler = (
  handler: (request: OrganizationRequest, response: Response) => Promise<void>,
): RequestHandler => {
  return (request, response, next) => {
    void handler(request as OrganizationRequest, response).catch(next);
  };
};

const authenticate: RequestHandler = (request: Request, _response: Response, next: NextFunction): void => {
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

export const organizationRoutes: ExpressRouter = Router();

organizationRoutes.get(
  "/me",
  authenticate,
  authenticatedAsyncHandler((request, response) => organizationController.getCurrentOrganization(request, response)),
);

organizationRoutes.put(
  "/me",
  authenticate,
  authenticatedAsyncHandler((request, response) => organizationController.updateCurrentOrganization(request, response)),
);

organizationRoutes.patch(
  "/me/settings",
  authenticate,
  authenticatedAsyncHandler((request, response) => organizationController.updateCurrentOrganizationSettings(request, response)),
);