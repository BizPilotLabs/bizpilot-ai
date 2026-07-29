export type RedisHealthStatus = "disabled" | "healthy" | "degraded" | "unavailable";
export type RedisFailureCategory = "disabled" | "not_configured" | "connection_timeout" | "command_timeout" | "connection_failed" | "command_failed";
export type RedisLatencyCategory = "fast" | "normal" | "slow" | "timeout";

export interface RedisHealthState {
  enabled: boolean;
  configured: boolean;
  required: boolean;
  available: boolean;
  status: RedisHealthStatus;
  checkedAt: string;
  latencyCategory: RedisLatencyCategory;
  failureCategory?: RedisFailureCategory | undefined;
}

export interface RedisEvalOptions {
  keys: string[];
  arguments: string[];
}

export interface RedisCommandClient {
  eval(script: string, options: RedisEvalOptions): Promise<unknown>;
  ping(): Promise<string>;
}
