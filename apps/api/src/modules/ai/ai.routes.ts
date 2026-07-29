import { Router, type RequestHandler, type Response, type Router as ExpressRouter } from "express";
import { authenticate, requirePermission } from "../rbac/index.js";
import { aiController } from "./ai.controller.js";
import { aiRateLimit } from "./ai.middleware.js";
import type { AiRequest } from "./ai.types.js";

const authenticatedAsyncHandler = (handler: (request: AiRequest, response: Response) => Promise<void>): RequestHandler => {
  return (request, response, next) => {
    void handler(request as AiRequest, response).catch(next);
  };
};

export const aiRoutes: ExpressRouter = Router();

aiRoutes.get("/copilot/health", authenticate, requirePermission("ai.use"), authenticatedAsyncHandler((request, response) => aiController.health(request, response)));
aiRoutes.post("/copilot/query", authenticate, requirePermission("ai.use"), aiRateLimit, authenticatedAsyncHandler((request, response) => aiController.askCopilot(request, response)));
