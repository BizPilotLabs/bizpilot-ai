import { Router, type Router as ExpressRouter } from "express";

import { authRoutes } from "./modules/auth/index.js";

export const routes: ExpressRouter = Router();

routes.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    status: "ok",
  });
});

routes.use("/auth", authRoutes);