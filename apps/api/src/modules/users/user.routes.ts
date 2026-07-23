import { Router, type NextFunction, type Request, type RequestHandler, type Response, type Router as ExpressRouter } from "express";

import { AppError } from "../../core/errors/index.js";
import { authService } from "../auth/auth.service.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { userController } from "./user.controller.js";
import type { UserRequest } from "./user.types.js";

const authenticatedAsyncHandler = (handler: (request: UserRequest, response: Response) => Promise<void>): RequestHandler => {
  return (request, response, next) => {
    void handler(request as UserRequest, response).catch(next);
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

export const userRoutes: ExpressRouter = Router();

userRoutes.get("/", authenticate, authenticatedAsyncHandler((request, response) => userController.listUsers(request, response)));
userRoutes.get("/:id", authenticate, authenticatedAsyncHandler((request, response) => userController.getUser(request, response)));
userRoutes.patch("/:id", authenticate, authenticatedAsyncHandler((request, response) => userController.updateUser(request, response)));
userRoutes.delete("/:id", authenticate, authenticatedAsyncHandler((request, response) => userController.deleteUser(request, response)));