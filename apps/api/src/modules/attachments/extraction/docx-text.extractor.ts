import mammoth from "mammoth";

import type { TextExtractionInput, TextExtractionResult, TextExtractor } from "./attachment-text-extraction.types.js";
import { AttachmentExtractionError } from "./extraction-errors.js";
import { assertMaxBytes, boundExtractedText, getExtension, normalizeDocumentText } from "./text-normalization.js";

const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const isZipContainer = (content: Buffer): boolean => content.subarray(0, 4).equals(zipHeader);

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new AttachmentExtractionError("EXTRACTION_TIMEOUT")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
};

export class DocxTextExtractor implements TextExtractor {
  public readonly name = "mammoth";
  public readonly version = "1";
  public readonly supportedMimeTypes = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"] as const;
  public readonly supportedExtensions = [".docx"] as const;
  public readonly maxFileBytes = 8 * 1024 * 1024;

  public supports(input: { mimeType: string; originalName: string }): boolean {
    return input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && getExtension(input.originalName) === ".docx";
  }

  public async extract(input: TextExtractionInput): Promise<TextExtractionResult> {
    assertMaxBytes(input.content, Math.min(this.maxFileBytes, input.limits.maxFileBytes));

    if (!this.supports(input.attachment)) {
      throw new AttachmentExtractionError("EXTENSION_MISMATCH");
    }

    if (!isZipContainer(input.content)) {
      throw new AttachmentExtractionError("MALFORMED_DOCUMENT");
    }

    try {
      const result = await withTimeout(mammoth.extractRawText({ buffer: input.content }), input.limits.timeoutMs);
      const normalized = normalizeDocumentText(result.value);
      const bounded = boundExtractedText(normalized, input.limits.maxTextCharacters);

      return {
        text: bounded.text,
        characterCount: bounded.characterCount,
        truncated: bounded.truncated,
        extractorName: this.name,
        extractorVersion: this.version,
        warnings: [...result.messages.map((message) => message.type), ...(normalized.length === 0 ? ["empty_document"] : [])],
        metadata: { parserMessages: result.messages.length, empty: normalized.length === 0 }
      };
    } catch (error) {
      if (error instanceof AttachmentExtractionError) throw error;
      throw new AttachmentExtractionError("MALFORMED_DOCUMENT");
    }
  }
}
