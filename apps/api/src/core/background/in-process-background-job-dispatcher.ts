import { logger } from "../logger/index.js";
import { metricsClient } from "../metrics/index.js";
import type { BackgroundJob, BackgroundJobDispatcher, BackgroundJobDispatchResult } from "./background.types.js";

export interface InProcessBackgroundJobDispatcherOptions {
  concurrency: number;
  queueSize: number;
}

export class InProcessBackgroundJobDispatcher implements BackgroundJobDispatcher {
  public readonly workerType = "in_process" as const;

  private readonly concurrency: number;
  private readonly queueSize: number;
  private readonly queue: BackgroundJob[] = [];
  private readonly keys = new Set<string>();
  private activeCount = 0;
  private shuttingDown = false;
  private drainResolvers: (() => void)[] = [];

  public constructor(options: InProcessBackgroundJobDispatcherOptions) {
    this.concurrency = options.concurrency;
    this.queueSize = options.queueSize;
    this.publishStats();
  }

  public dispatch(job: BackgroundJob): BackgroundJobDispatchResult {
    if (this.shuttingDown) {
      metricsClient.recordBackgroundJob?.({ workerType: this.workerType, jobName: job.name, result: "shutting_down" });
      return this.result("shutting_down");
    }

    if (this.keys.has(job.key)) {
      metricsClient.recordBackgroundJob?.({ workerType: this.workerType, jobName: job.name, result: "duplicate" });
      return this.result("duplicate");
    }

    if (this.activeCount + this.queue.length >= this.queueSize) {
      metricsClient.recordBackgroundJob?.({ workerType: this.workerType, jobName: job.name, result: "rejected" });
      return this.result("rejected");
    }

    this.keys.add(job.key);
    this.queue.push(job);
    metricsClient.recordBackgroundJob?.({ workerType: this.workerType, jobName: job.name, result: "accepted" });
    this.pump();
    return this.result("accepted");
  }

  public stats(): { activeCount: number; queuedCount: number; capacity: number; concurrency: number; shuttingDown: boolean } {
    return { activeCount: this.activeCount, queuedCount: this.queue.length, capacity: this.queueSize, concurrency: this.concurrency, shuttingDown: this.shuttingDown };
  }

  public async shutdown(timeoutMs: number): Promise<void> {
    this.shuttingDown = true;
    this.publishStats();

    if (this.activeCount === 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, timeoutMs);
      this.drainResolvers.push(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  private pump(): void {
    while (!this.shuttingDown && this.activeCount < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (job === undefined) return;

      this.activeCount += 1;
      this.publishStats();
      void this.run(job);
    }
  }

  private async run(job: BackgroundJob): Promise<void> {
    try {
      await job.run();
    } catch (error) {
      logger.error({ err: error, jobName: job.name }, "Background job failed");
      metricsClient.recordBackgroundJob?.({ workerType: this.workerType, jobName: job.name, result: "failed" });
    } finally {
      this.activeCount -= 1;
      this.keys.delete(job.key);
      this.publishStats();
      this.resolveDrainIfIdle();
      this.pump();
    }
  }

  private result(status: BackgroundJobDispatchResult["status"]): BackgroundJobDispatchResult {
    this.publishStats();
    return { status, activeCount: this.activeCount, queuedCount: this.queue.length };
  }

  private publishStats(): void {
    metricsClient.setBackgroundWorkerState?.({ workerType: this.workerType, activeCount: this.activeCount, queuedCount: this.queue.length });
  }

  private resolveDrainIfIdle(): void {
    if (this.activeCount !== 0) return;
    const resolvers = this.drainResolvers.splice(0);
    for (const resolve of resolvers) resolve();
  }
}
