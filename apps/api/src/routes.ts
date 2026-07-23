import { Router, type Router as ExpressRouter } from "express";

import { authRoutes } from "./modules/auth/index.js";
import { commentRoutes } from "./modules/comments/index.js";
import { organizationRoutes } from "./modules/organizations/index.js";
import { projectRoutes } from "./modules/projects/index.js";
import { permissionRoutes, roleRoutes, userRoleRoutes } from "./modules/rbac/index.js";
import { taskRoutes } from "./modules/tasks/index.js";
import { teamRoutes } from "./modules/teams/index.js";
import { userRoutes } from "./modules/users/index.js";

export const routes: ExpressRouter = Router();

routes.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    status: "ok",
  });
});

routes.use("/auth", authRoutes);
routes.use("/", commentRoutes);
routes.use("/organizations", organizationRoutes);
routes.use("/roles", roleRoutes);
routes.use("/permissions", permissionRoutes);
routes.use("/projects", projectRoutes);
routes.use("/tasks", taskRoutes);
routes.use("/teams", teamRoutes);
routes.use("/users", userRoleRoutes);
routes.use("/users", userRoutes);
