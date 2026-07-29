import type { AttachmentExtractionStatus } from "@prisma/client";

export type SupportedExtractionMimeType = "text/plain" | "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ExtractionFailureCode =
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "FILE_MISSING"
  | "UPLOAD_INCOMPLETE"
  | "ATTACHMENT_DELETED"
  | "MIME_MISMATCH"
  | "EXTENSION_MISMATCH"
  | "INVALID_ENCODING"
  | "ENCRYPTED_DOCUMENT"
  | "MALFORMED_DOCUMENT"
  | "EXTRACTION_TIMEOUT"
  | "PARSER_FAILURE"
  | "STORAGE_UNAVAILABLE"
  | "WORKER_UNAVAILABLE";

export interface AttachmentExtractionMetadata {
  attachmentId: string;
  organizationId: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
}

export interface TextExtractionInput {
  attachment: AttachmentExtractionMetadata;
  content: Buffer;
  limits: TextExtractionLimits;
}

export interface TextExtractionLimits {
  maxFileBytes: number;
  maxTextCharacters: number;
  timeoutMs: number;
}

export interface TextExtractionResult {
  text: string;
  characterCount: number;
  truncated: boolean;
  extractorName: string;
  extractorVersion: string;
  warnings: string[];
  metadata: Record<string, string | number | boolean>;
}

export interface TextExtractor {
  readonly name: string;
  readonly version: string;
  readonly supportedMimeTypes: readonly SupportedExtractionMimeType[];
  readonly supportedExtensions: readonly string[];
  readonly maxFileBytes: number;
  supports(input: Pick<AttachmentExtractionMetadata, "mimeType" | "originalName">): boolean;
  extract(input: TextExtractionInput): Promise<TextExtractionResult>;
}

export interface AttachmentExtractionSummary {
  attachmentId: string;
  status: AttachmentExtractionStatus;
  supported: boolean;
  extractorName: string | null;
  extractorVersion: string | null;
  characterCount: number | null;
  truncated: boolean;
  errorCode: string | null;
  requestedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface AttachmentExtractedTextResponse extends AttachmentExtractionSummary {
  text: string | null;
}
