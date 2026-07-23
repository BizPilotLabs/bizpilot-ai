import { Router, type RequestHandler, type Response, type Router as ExpressRouter } from "express";

import { rbacController } from "./rbac.controller.js";
import { authenticate, requirePermission } from "./permission.middleware.js";
import type { RbacRequest } from "./rbac.types.js";

const authenticatedAsyncHandler = (handler: (request: RbacRequest, response: Response) => Promise<void>): RequestHandler => {
  return (request, response, next) => {
    void handler(request as RbacRequest, response).catch(next);
  };
};

export const roleRoutes: ExpressRouter = Router();
export const permissionRoutes: ExpressRouter = Router();
export const userRoleRoutes: ExpressRouter = Router();

roleRoutes.get("/", authenticate, requirePermission("roles.read"), authenticatedAsyncHandler((request, response) => rbacController.listRoles(request, response)));
roleRoutes.post("/", authenticate, requirePermission("roles.create"), authenticatedAsyncHandler((request, response) => rbacController.createRole(request, response)));
roleRoutes.get("/:id", authenticate, requirePermission("roles.read"), authenticatedAsyncHandler((request, response) => rbacController.getRole(request, response)));
roleRoutes.patch("/:id", authenticate, requirePermission("roles.update"), authenticatedAsyncHandler((request, response) => rbacController.updateRole(request, response)));
roleRoutes.delete("/:id", authenticate, requirePermission("roles.delete"), authenticatedAsyncHandler((request, response) => rbacController.deleteRole(request, response)));
roleRoutes.patch("/:id/permissions", authenticate, requirePermission("roles.update"), authenticatedAsyncHandler((request, response) => rbacController.updateRolePermissions(request, response)));

permissionRoutes.get("/", authenticate, requirePermission("roles.read"), authenticatedAsyncHandler((request, response) => rbacController.listPermissions(request, response)));

userRoleRoutes.get("/:id/roles", authenticate, requirePermission("roles.read"), authenticatedAsyncHandler((request, response) => rbacController.getUserRoles(request, response)));
userRoleRoutes.patch("/:id/roles", authenticate, requirePermission("roles.update"), authenticatedAsyncHandler((request, response) => rbacController.updateUserRoles(request, response)));