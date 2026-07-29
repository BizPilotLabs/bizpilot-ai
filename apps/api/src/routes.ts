import { Router, type Router as ExpressRouter } from "express";

import { activityRoutes } from "./modules/activities/index.js";
import { aiRoutes } from "./modules/ai/index.js";
import { attachmentRoutes } from "./modules/attachments/index.js";
import { authRoutes } from "./modules/auth/index.js";
import { commentRoutes } from "./modules/comments/index.js";
import { organizationRoutes } from "./modules/organizations/index.js";
import { projectRoutes } from "./modules/projects/index.js";
import { permissionRoutes, roleRoutes, userRoleRoutes } from "./modules/rbac/index.js";
import { taskRoutes } from "./modules/tasks/index.js";
import { teamRoutes } from "./modules/teams/index.js";
import { userRoutes } from "./modules/users/index.js";
import { metricsClient } from "./core/metrics/index.js";
import { redisConnection } from "./core/redis/index.js";

export const routes: ExpressRouter = Router();

routes.get("/health", async (_request, response) => {
  const redis = await redisConnection.health();
  const degraded = redis.required && !redis.available;
  metricsClient.setDependencyState("application", degraded ? "degraded" : "healthy", 1);
  metricsClient.setDependencyState("redis", redis.status, 1);

  response.status(degraded ? 503 : 200).json({
    success: true,
    status: degraded ? "degraded" : "ok",
    dependencies: {
      redis: {
        enabled: redis.enabled,
        required: redis.required,
        available: redis.available,
        status: redis.status,
        failureCategory: redis.failureCategory ?? null
      }
    }
  });
});

routes.use("/auth", authRoutes);
routes.use("/ai", aiRoutes);
routes.use("/activities", activityRoutes);
routes.use("/", commentRoutes);
routes.use("/", attachmentRoutes);
routes.use("/organizations", organizationRoutes);
routes.use("/roles", roleRoutes);
routes.use("/permissions", permissionRoutes);
routes.use("/projects", projectRoutes);
routes.use("/tasks", taskRoutes);
routes.use("/teams", teamRoutes);
routes.use("/users", userRoleRoutes);
routes.use("/users", userRoutes);


