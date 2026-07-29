import { AppError } from "../../../core/errors/index.js";
import type { ExtractionFailureCode } from "./attachment-text-extraction.types.js";

const statusByCode: Record<ExtractionFailureCode, number> = {
  UNSUPPORTED_FILE_TYPE: 422,
  FILE_TOO_LARGE: 413,
  FILE_MISSING: 409,
  UPLOAD_INCOMPLETE: 409,
  ATTACHMENT_DELETED: 404,
  MIME_MISMATCH: 409,
  EXTENSION_MISMATCH: 422,
  INVALID_ENCODING: 422,
  ENCRYPTED_DOCUMENT: 422,
  MALFORMED_DOCUMENT: 422,
  EXTRACTION_TIMEOUT: 504,
  PARSER_FAILURE: 422,
  STORAGE_UNAVAILABLE: 503,
  WORKER_UNAVAILABLE: 503
};

const messageByCode: Record<ExtractionFailureCode, string> = {
  UNSUPPORTED_FILE_TYPE: "This attachment type is not supported for text extraction.",
  FILE_TOO_LARGE: "This attachment is too large for text extraction.",
  FILE_MISSING: "The stored attachment file could not be found.",
  UPLOAD_INCOMPLETE: "Attachment upload must be completed before text extraction.",
  ATTACHMENT_DELETED: "Attachment not found.",
  MIME_MISMATCH: "Stored object type does not match the attachment metadata.",
  EXTENSION_MISMATCH: "Attachment filename does not match the supported type.",
  INVALID_ENCODING: "The text file is not valid UTF-8.",
  ENCRYPTED_DOCUMENT: "Password-protected documents are not supported for text extraction.",
  MALFORMED_DOCUMENT: "The document could not be safely parsed.",
  EXTRACTION_TIMEOUT: "Text extraction timed out.",
  PARSER_FAILURE: "The document parser could not extract text safely.",
  STORAGE_UNAVAILABLE: "Attachment storage is unavailable.",
  WORKER_UNAVAILABLE: "Text extraction worker is unavailable."
};

export class AttachmentExtractionError extends AppError {
  public readonly extractionCode: ExtractionFailureCode;

  public constructor(code: ExtractionFailureCode) {
    super({ statusCode: statusByCode[code], message: messageByCode[code], code: `ATTACHMENT_EXTRACTION_${code}` });
    this.extractionCode = code;
  }
}

export const toExtractionFailureCode = (error: unknown): ExtractionFailureCode => {
  if (error instanceof AttachmentExtractionError) return error.extractionCode;
  if (error instanceof AppError) {
    if (error.code === "STORAGE_NOT_CONFIGURED" || error.code === "STORAGE_RETRIEVAL_TIMEOUT") return "STORAGE_UNAVAILABLE";
    if (error.code === "STORAGE_OBJECT_TOO_LARGE") return "FILE_TOO_LARGE";
  }
  return "PARSER_FAILURE";
};
