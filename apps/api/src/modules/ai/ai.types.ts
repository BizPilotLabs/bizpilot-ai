import type { AuthenticatedRequest } from "../auth/auth.types.js";

export type AiScopeType = "organization" | "project" | "task";

export interface AiScopeInput {
  type: AiScopeType;
  entityId?: string | undefined;
}

export interface AiConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiCopilotRequestInput {
  question: string;
  scope: AiScopeInput;
  history?: AiConversationMessage[] | undefined;
}

export interface AiRequestMetadata {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  requestId?: string | undefined;
}

export interface AiProviderMetadata {
  provider: string;
  model: string;
}

export interface AiProviderUsage {
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  totalTokens?: number | undefined;
}

export interface AiProviderRequest {
  prompt: string;
  maxOutputCharacters: number;
}

export interface AiProviderResponse {
  answer: string;
  metadata: AiProviderMetadata;
  usage?: AiProviderUsage | undefined;
}

export type AiProviderHealthStatus = "disabled" | "healthy" | "degraded" | "unavailable";
export type AiLatencyCategory = "fast" | "normal" | "slow" | "timeout";

export interface AiProviderHealth {
  enabled: boolean;
  configured: boolean;
  available: boolean;
  status: AiProviderHealthStatus;
  provider: string;
  model: string;
  checkedAt: string;
  latencyCategory: AiLatencyCategory;
  degradedReasonCode?: string | undefined;
  reason?: string | undefined;
  rateLimit: {
    store: "memory" | "redis";
    distributed: boolean;
    windowMs: number;
    userLimit: number;
    organizationLimit: number;
    available: boolean;
    detail: string;
  };
  persistence: {
    promptsStored: false;
    responsesStored: false;
    conversationHistoryStored: false;
  };
  mode: "read_only";
}

export interface AiProvider {
  readonly metadata: AiProviderMetadata;
  generate(input: AiProviderRequest): Promise<AiProviderResponse>;
  health(): Promise<{ available: boolean; reason?: string | undefined }>;
}

export type AiSourceType = "organization" | "project" | "task" | "comment" | "attachment" | "activity" | "user" | "role";

export interface AiSourceReference {
  marker: string;
  type: AiSourceType;
  id: string;
  label: string;
  appRoute?: string | undefined;
  updatedAt?: string | undefined;
}

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
  usage?: AiProviderUsage | undefined;
  metadata: AiResponseMetadata;
  scope: AiScopeInput;
  limitations: string[];
}

export interface PermissionContext {
  isElevated: boolean;
  permissionKeys: Set<string>;
}

export interface AiOrganizationContext {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  country: string | null;
  currency: string;
  plan: string;
  updatedAt: Date;
}

export interface AiProjectContext {
  id: string;
  name: string;
  description: string | null;
  status: string;
  archived: boolean;
  startDate: Date | null;
  endDate: Date | null;
  updatedAt: Date;
}

export interface AiTaskContext {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  archived: boolean;
  updatedAt: Date;
  projectName?: string | undefined;
  assigneeName?: string | undefined;
}

export interface AiCommentContext {
  id: string;
  taskId: string;
  authorName: string;
  content: string;
  edited: boolean;
  updatedAt: Date;
}

export interface AiAttachmentContext {
  id: string;
  taskId: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
}

export interface AiActivityContext {
  id: string;
  action: string;
  resource: string;
  actorName: string | null;
  createdAt: Date;
}

export interface AiUserContext {
  id: string;
  displayName: string;
  status: string;
  roleNames: string[];
  createdAt: Date;
}

export interface AiContextBundle {
  organization: AiOrganizationContext;
  projects: AiProjectContext[];
  tasks: AiTaskContext[];
  comments: AiCommentContext[];
  attachments: AiAttachmentContext[];
  activities: AiActivityContext[];
  users: AiUserContext[];
  sources: AiSourceReference[];
  truncationNotes: string[];
}

export type AiRequest = AuthenticatedRequest;

