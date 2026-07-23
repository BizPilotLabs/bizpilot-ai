import { Router, type RequestHandler, type Response, type Router as ExpressRouter } from "express";

import { authenticate, requirePermission } from "../rbac/index.js";
import { attachmentController } from "./attachment.controller.js";
import type { AttachmentRequest } from "./attachment.types.js";

const authenticatedAsyncHandler = (handler: (request: AttachmentRequest, response: Response) => Promise<void>): RequestHandler => {
  return (request, response, next) => {
    void handler(request as AttachmentRequest, response).catch(next);
  };
};

export const attachmentRoutes: ExpressRouter = Router();

attachmentRoutes.get("/tasks/:taskId/attachments", authenticate, requirePermission("attachments.read"), authenticatedAsyncHandler((request, response) => attachmentController.listAttachments(request, response)));
attachmentRoutes.post("/tasks/:taskId/attachments", authenticate, requirePermission("attachments.create"), authenticatedAsyncHandler((request, response) => attachmentController.createAttachment(request, response)));
attachmentRoutes.get("/attachments/:id", authenticate, requirePermission("attachments.read"), authenticatedAsyncHandler((request, response) => attachmentController.getAttachment(request, response)));
attachmentRoutes.delete("/attachments/:id", authenticate, requirePermission("attachments.delete"), authenticatedAsyncHandler((request, response) => attachmentController.deleteAttachment(request, response)));