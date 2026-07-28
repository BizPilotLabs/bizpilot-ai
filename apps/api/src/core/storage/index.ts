import { env } from "../../config/index.js";
import { DisabledStorageProvider } from "./disabled-storage-provider.js";
import { R2StorageProvider } from "./r2-storage-provider.js";

export type { StorageObjectMetadata, StorageProvider } from "./storage.types.js";

export const storageProvider = env.STORAGE_PROVIDER === "r2" ? new R2StorageProvider() : new DisabledStorageProvider();
