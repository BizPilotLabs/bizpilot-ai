import { Router, type RequestHandler, type Response, type Router as ExpressRouter } from "express";

import { authenticate, requirePermission } from "../rbac/index.js";
import { commentController } from "./comment.controller.js";
import type { CommentRequest } from "./comment.types.js";

const authenticatedAsyncHandler = (handler: (request: CommentRequest, response: Response) => Promise<void>): RequestHandler => {
  return (request, response, next) => {
    void handler(request as CommentRequest, response).catch(next);
  };
};

export const commentRoutes: ExpressRouter = Router();

commentRoutes.get("/tasks/:taskId/comments", authenticate, requirePermission("comments.read"), authenticatedAsyncHandler((request, response) => commentController.listComments(request, response)));
commentRoutes.post("/tasks/:taskId/comments", authenticate, requirePermission("comments.create"), authenticatedAsyncHandler((request, response) => commentController.createComment(request, response)));
commentRoutes.patch("/comments/:id", authenticate, requirePermission("comments.update"), authenticatedAsyncHandler((request, response) => commentController.updateComment(request, response)));
commentRoutes.delete("/comments/:id", authenticate, requirePermission("comments.delete"), authenticatedAsyncHandler((request, response) => commentController.deleteComment(request, response)));