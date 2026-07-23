import { Router, type RequestHandler, type Response, type Router as ExpressRouter } from "express";

import { authenticate, requirePermission } from "../rbac/index.js";
import { projectController } from "./project.controller.js";
import type { ProjectRequest } from "./project.types.js";

const authenticatedAsyncHandler = (handler: (request: ProjectRequest, response: Response) => Promise<void>): RequestHandler => {
  return (request, response, next) => {
    void handler(request as ProjectRequest, response).catch(next);
  };
};

export const projectRoutes: ExpressRouter = Router();

projectRoutes.get("/", authenticate, requirePermission("projects.read"), authenticatedAsyncHandler((request, response) => projectController.listProjects(request, response)));
projectRoutes.post("/", authenticate, requirePermission("projects.create"), authenticatedAsyncHandler((request, response) => projectController.createProject(request, response)));
projectRoutes.get("/:id", authenticate, requirePermission("projects.read"), authenticatedAsyncHandler((request, response) => projectController.getProject(request, response)));
projectRoutes.patch("/:id", authenticate, requirePermission("projects.update"), authenticatedAsyncHandler((request, response) => projectController.updateProject(request, response)));
projectRoutes.delete("/:id", authenticate, requirePermission("projects.delete"), authenticatedAsyncHandler((request, response) => projectController.deleteProject(request, response)));