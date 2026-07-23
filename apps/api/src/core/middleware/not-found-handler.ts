import type { RequestHandler } from "express";

import { NotFoundError } from "../errors/index.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new NotFoundError(request.originalUrl));
};
