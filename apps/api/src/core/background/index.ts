import { env } from "../../config/index.js";
import { InProcessBackgroundJobDispatcher } from "./in-process-background-job-dispatcher.js";

export type { BackgroundJob, BackgroundJobDispatcher, BackgroundJobDispatchResult, BackgroundJobStatus } from "./background.types.js";
export { InProcessBackgroundJobDispatcher } from "./in-process-background-job-dispatcher.js";

export const backgroundJobDispatcher = new InProcessBackgroundJobDispatcher({
  concurrency: env.ATTACHMENT_EXTRACTION_WORKER_CONCURRENCY,
  queueSize: env.ATTACHMENT_EXTRACTION_WORKER_QUEUE_SIZE
});
