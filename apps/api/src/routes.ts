import { Router, type Router as ExpressRouter } from "express";

export const routes: ExpressRouter = Router();

routes.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    status: "ok",
  });
});