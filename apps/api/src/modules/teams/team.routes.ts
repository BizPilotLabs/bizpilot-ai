import { Router, type RequestHandler, type Response, type Router as ExpressRouter } from "express";

import { authenticate, requirePermission } from "../rbac/index.js";
import { teamController } from "./team.controller.js";
import type { TeamRequest } from "./team.types.js";

const authenticatedAsyncHandler = (handler: (request: TeamRequest, response: Response) => Promise<void>): RequestHandler => {
  return (request, response, next) => {
    void handler(request as TeamRequest, response).catch(next);
  };
};

export const teamRoutes: ExpressRouter = Router();

teamRoutes.get("/", authenticate, requirePermission("teams.read"), authenticatedAsyncHandler((request, response) => teamController.listTeams(request, response)));
teamRoutes.post("/", authenticate, requirePermission("teams.create"), authenticatedAsyncHandler((request, response) => teamController.createTeam(request, response)));
teamRoutes.get("/:id/members", authenticate, requirePermission("teams.read"), authenticatedAsyncHandler((request, response) => teamController.listMembers(request, response)));
teamRoutes.post("/:id/members", authenticate, requirePermission("teams.update"), authenticatedAsyncHandler((request, response) => teamController.addMember(request, response)));
teamRoutes.delete("/:id/members/:userId", authenticate, requirePermission("teams.update"), authenticatedAsyncHandler((request, response) => teamController.removeMember(request, response)));
teamRoutes.get("/:id", authenticate, requirePermission("teams.read"), authenticatedAsyncHandler((request, response) => teamController.getTeam(request, response)));
teamRoutes.patch("/:id", authenticate, requirePermission("teams.update"), authenticatedAsyncHandler((request, response) => teamController.updateTeam(request, response)));
teamRoutes.delete("/:id", authenticate, requirePermission("teams.delete"), authenticatedAsyncHandler((request, response) => teamController.deleteTeam(request, response)));