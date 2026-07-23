import type { Response } from "express";

import { activityIdParamsSchema, listActivitiesQuerySchema } from "./activity.schema.js";
import { activityService } from "./activity.service.js";
import type { ActivityRequest } from "./activity.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const sendSuccess = <T>(response: Response, statusCode: number, data: T): void => {
  const body: SuccessResponse<T> = { success: true, data };
  response.status(statusCode).json(body);
};

export class ActivityController {
  public async listActivities(request: ActivityRequest, response: Response): Promise<void> {
    const query = listActivitiesQuerySchema.parse(request.query);
    const result = await activityService.listActivities({ organizationId: request.auth.organizationId, query });
    sendSuccess(response, 200, result);
  }

  public async getActivity(request: ActivityRequest, response: Response): Promise<void> {
    const params = activityIdParamsSchema.parse(request.params);
    const activity = await activityService.getActivity({ organizationId: request.auth.organizationId, activityId: params.id });
    sendSuccess(response, 200, { activity });
  }
}

export const activityController = new ActivityController();