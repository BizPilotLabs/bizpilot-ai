import type { Response } from "express";
import { aiCopilotRequestSchema } from "./ai.schema.js";
import { aiService } from "./ai.service.js";
import type { AiRequest } from "./ai.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const sendSuccess = <T>(response: Response, statusCode: number, data: T): void => {
  const body: SuccessResponse<T> = { success: true, data };
  response.status(statusCode).json(body);
};

export class AiController {
  public async askCopilot(request: AiRequest, response: Response): Promise<void> {
    const input = aiCopilotRequestSchema.parse(request.body);
    const result = await aiService.ask({
      userId: request.auth.userId,
      organizationId: request.auth.organizationId,
      request: input,
      metadata: { ipAddress: request.ip, userAgent: request.get("user-agent"), requestId: request.get("x-request-id") }
    });
    sendSuccess(response, 200, result);
  }

  public async health(_request: AiRequest, response: Response): Promise<void> {
    sendSuccess(response, 200, await aiService.health());
  }
}

export const aiController = new AiController();
