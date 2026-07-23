import { Router, type NextFunction, type Request, type RequestHandler, type Response, type Router as ExpressRouter } from "express";

import { AppError } from "../../core/errors/index.js";
import { authController } from "./auth.controller.js";
import { authService } from "./auth.service.js";
import type { AuthenticatedRequest } from "./auth.types.js";

const asyncHandler = (handler: (request: Request, response: Response) => Promise<void>): RequestHandler => {
  return (request, response, next) => {
    void handler(request, response).catch(next);
  };
};

const authenticatedAsyncHandler = (
  handler: (request: AuthenticatedRequest, response: Response) => Promise<void>,
): RequestHandler => {
  return (request, response, next) => {
    void handler(request as AuthenticatedRequest, response).catch(next);
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

export const authRoutes: ExpressRouter = Router();

authRoutes.post("/register", asyncHandler((request, response) => authController.register(request, response)));
authRoutes.post("/login", asyncHandler((request, response) => authController.login(request, response)));
authRoutes.post("/logout", asyncHandler((request, response) => authController.logout(request, response)));
authRoutes.post("/refresh", asyncHandler((request, response) => authController.refresh(request, response)));
authRoutes.get("/me", authenticate, authenticatedAsyncHandler((request, response) => authController.me(request, response)));