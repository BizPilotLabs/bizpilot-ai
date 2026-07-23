import { Router, type RequestHandler, type Response, type Router as ExpressRouter } from "express";

import { authenticate, requirePermission } from "../rbac/index.js";
import { taskController } from "./task.controller.js";
import type { TaskRequest } from "./task.types.js";

const authenticatedAsyncHandler = (handler: (request: TaskRequest, response: Response) => Promise<void>): RequestHandler => {
  return (request, response, next) => {
    void handler(request as TaskRequest, response).catch(next);
  };
};

export const taskRoutes: ExpressRouter = Router();

taskRoutes.get("/", authenticate, requirePermission("tasks.read"), authenticatedAsyncHandler((request, response) => taskController.listTasks(request, response)));
taskRoutes.post("/", authenticate, requirePermission("tasks.create"), authenticatedAsyncHandler((request, response) => taskController.createTask(request, response)));
taskRoutes.get("/:id", authenticate, requirePermission("tasks.read"), authenticatedAsyncHandler((request, response) => taskController.getTask(request, response)));
taskRoutes.patch("/:id", authenticate, requirePermission("tasks.update"), authenticatedAsyncHandler((request, response) => taskController.updateTask(request, response)));
taskRoutes.delete("/:id", authenticate, requirePermission("tasks.delete"), authenticatedAsyncHandler((request, response) => taskController.deleteTask(request, response)));
taskRoutes.patch("/:id/status", authenticate, requirePermission("tasks.update"), authenticatedAsyncHandler((request, response) => taskController.updateTaskStatus(request, response)));
taskRoutes.patch("/:id/assignee", authenticate, requirePermission("tasks.update"), authenticatedAsyncHandler((request, response) => taskController.updateTaskAssignee(request, response)));