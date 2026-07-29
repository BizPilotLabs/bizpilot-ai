import { PDFParse } from "pdf-parse";

import type { TextExtractionInput, TextExtractionResult, TextExtractor } from "./attachment-text-extraction.types.js";
import { AttachmentExtractionError } from "./extraction-errors.js";
import { assertMaxBytes, boundExtractedText, getExtension, normalizeDocumentText } from "./text-normalization.js";

const isPdf = (content: Buffer): boolean => content.subarray(0, 5).toString("ascii") === "%PDF-";

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

export class PdfTextExtractor implements TextExtractor {
  public readonly name = "pdf_parse";
  public readonly version = "2";
  public readonly supportedMimeTypes = ["application/pdf"] as const;
  public readonly supportedExtensions = [".pdf"] as const;
  public readonly maxFileBytes = 8 * 1024 * 1024;

  public supports(input: { mimeType: string; originalName: string }): boolean {
    return input.mimeType === "application/pdf" && getExtension(input.originalName) === ".pdf";
  }

  public async extract(input: TextExtractionInput): Promise<TextExtractionResult> {
    assertMaxBytes(input.content, Math.min(this.maxFileBytes, input.limits.maxFileBytes));

    if (!this.supports(input.attachment)) {
      throw new AttachmentExtractionError("EXTENSION_MISMATCH");
    }

    if (!isPdf(input.content)) {
      throw new AttachmentExtractionError("MALFORMED_DOCUMENT");
    }

    const parser = new PDFParse({ data: new Uint8Array(input.content), stopAtErrors: true, isEvalSupported: false, disableFontFace: true, enableXfa: false, isImageDecoderSupported: false, useSystemFonts: false });

    try {
      const result = await withTimeout(parser.getText({ first: 50, parseHyperlinks: false, pageJoiner: "\n" }), input.limits.timeoutMs);
      const normalized = normalizeDocumentText(result.text);
      const bounded = boundExtractedText(normalized, input.limits.maxTextCharacters);

      return {
        text: bounded.text,
        characterCount: bounded.characterCount,
        truncated: bounded.truncated,
        extractorName: this.name,
        extractorVersion: this.version,
        warnings: normalized.length === 0 ? ["empty_document"] : [],
        metadata: { pageCount: result.total, empty: normalized.length === 0 }
      };
    } catch (error) {
      if (error instanceof AttachmentExtractionError) throw error;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("password") || message.includes("encrypted")) throw new AttachmentExtractionError("ENCRYPTED_DOCUMENT");
      throw new AttachmentExtractionError("MALFORMED_DOCUMENT");
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }
}
