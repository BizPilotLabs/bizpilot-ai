import { useMutation, useQuery } from "@tanstack/react-query";
import { aiService } from "../services";
import type { AiCopilotRequest, AiCopilotResponse, AiHealthResponse } from "../types";
import { aiQueryKeys } from "./ai-query-keys";

export const useAiHealth = () => useQuery<AiHealthResponse>({
  queryKey: aiQueryKeys.health(),
  queryFn: () => aiService.getHealth(),
  staleTime: 60_000,
  retry: false
});

export const useAskCopilot = () => useMutation<AiCopilotResponse, Error, AiCopilotRequest>({
  mutationFn: (input) => aiService.askCopilot(input)
});
