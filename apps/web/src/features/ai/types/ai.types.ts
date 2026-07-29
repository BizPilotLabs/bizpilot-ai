export type AiScopeType = "organization" | "project" | "task";

export interface AiScopeInput {
  type: AiScopeType;
  entityId?: string | undefined;
}

export interface AiConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiCopilotRequest {
  question: string;
  scope: AiScopeInput;
  history?: AiConversationMessage[] | undefined;
}

export interface AiSourceReference {
  marker: string;
  type: "organization" | "project" | "task" | "comment" | "attachment" | "activity" | "user" | "role";
  id: string;
  label: string;
  appRoute?: string | undefined;
  updatedAt?: string | undefined;
}

export interface AiProviderMetadata {
  provider: string;
  model: string;
}

export interface AiUsageMetadata {
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  totalTokens?: number | undefined;
}

export interface AiCopilotResponse {
  requestId: string;
  answer: string;
  sources: AiSourceReference[];
  provider: AiProviderMetadata;
  usage?: AiUsageMetadata | undefined;
  scope: AiScopeInput;
  limitations: string[];
}

export interface AiHealthResponse {
  available: boolean;
  provider: string;
  model: string;
  reason?: string | undefined;
}

export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}

