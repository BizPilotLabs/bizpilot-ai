import { Router, type RequestHandler, type Response, type Router as ExpressRouter } from "express";

import { authenticate, requirePermission } from "../rbac/index.js";
import { activityController } from "./activity.controller.js";
import type { ActivityRequest } from "./activity.types.js";

const authenticatedAsyncHandler = (handler: (request: ActivityRequest, response: Response) => Promise<void>): RequestHandler => {
  return (request, response, next) => {
    void handler(request as ActivityRequest, response).catch(next);
  };
};

export const activityRoutes: ExpressRouter = Router();

activityRoutes.get("/", authenticate, requirePermission("activities.read"), authenticatedAsyncHandler((request, response) => activityController.listActivities(request, response)));
activityRoutes.get("/:id", authenticate, requirePermission("activities.read"), authenticatedAsyncHandler((request, response) => activityController.getActivity(request, response)));