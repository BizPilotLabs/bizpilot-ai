import { httpClient } from "@/services";
import type { AiCopilotRequest, AiCopilotResponse, AiHealthResponse, ApiSuccessResponse } from "../types";

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

export const aiService = {
  async askCopilot(input: AiCopilotRequest): Promise<AiCopilotResponse> {
    return unwrap(await httpClient.post<ApiSuccessResponse<AiCopilotResponse>>("/ai/copilot/query", input));
  },

  async getHealth(): Promise<AiHealthResponse> {
    return unwrap(await httpClient.get<ApiSuccessResponse<AiHealthResponse>>("/ai/copilot/health"));
  }
};
