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

export type AiHealthStatus = "disabled" | "healthy" | "degraded" | "unavailable";
export type AiLatencyCategory = "fast" | "normal" | "slow" | "timeout";

export interface AiResponseMetadata {
  requestId: string;
  resultCategory: string;
  durationCategory: AiLatencyCategory;
  sourceCount: number;
  rateLimit?: {
    remaining: number;
    resetAt: string;
    retryAfterSeconds: number;
  } | undefined;
}

export interface AiCopilotResponse {
  requestId: string;
  answer: string;
  sources: AiSourceReference[];
  provider: AiProviderMetadata;
  usage?: AiUsageMetadata | undefined;
  metadata: AiResponseMetadata;
  scope: AiScopeInput;
  limitations: string[];
}

export interface AiHealthResponse {
  enabled: boolean;
  configured: boolean;
  available: boolean;
  status: AiHealthStatus;
  provider: string;
  model: string;
  checkedAt: string;
  latencyCategory: AiLatencyCategory;
  degradedReasonCode?: string | undefined;
  reason?: string | undefined;
  rateLimit: {
    store: "memory";
    distributed: false;
    windowMs: number;
    userLimit: number;
    organizationLimit: number;
  };
  persistence: {
    promptsStored: false;
    responsesStored: false;
    conversationHistoryStored: false;
  };
  mode: "read_only";
}

export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}
