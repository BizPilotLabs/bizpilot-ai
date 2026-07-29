export type BackgroundJobStatus = "accepted" | "duplicate" | "rejected" | "shutting_down";

export interface BackgroundJob {
  key: string;
  name: string;
  run(): Promise<void>;
}

export interface BackgroundJobDispatchResult {
  status: BackgroundJobStatus;
  activeCount: number;
  queuedCount: number;
}

export interface BackgroundJobDispatcher {
  readonly workerType: "in_process";
  dispatch(job: BackgroundJob): BackgroundJobDispatchResult;
  stats(): { activeCount: number; queuedCount: number; capacity: number; concurrency: number; shuttingDown: boolean };
  shutdown(timeoutMs: number): Promise<void>;
}
