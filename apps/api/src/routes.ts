import { Router, type Router as ExpressRouter } from "express";

import { authRoutes } from "./modules/auth/index.js";
import { organizationRoutes } from "./modules/organizations/index.js";
import { userRoutes } from "./modules/users/index.js";

export const routes: ExpressRouter = Router();

routes.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    status: "ok",
  });
});

routes.use("/auth", authRoutes);
routes.use("/organizations", organizationRoutes);
routes.use("/users", userRoutes);