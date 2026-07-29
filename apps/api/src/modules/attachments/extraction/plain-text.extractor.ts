import type { TextExtractionInput, TextExtractionResult, TextExtractor } from "./attachment-text-extraction.types.js";
import { AttachmentExtractionError } from "./extraction-errors.js";
import { assertMaxBytes, boundExtractedText, decodeUtf8Strict, getExtension, sanitizeExtractedText } from "./text-normalization.js";

export class PlainTextExtractor implements TextExtractor {
  public readonly name = "plain_text";
  public readonly version = "1";
  public readonly supportedMimeTypes = ["text/plain"] as const;
  public readonly supportedExtensions = [".txt", ".md"] as const;
  public readonly maxFileBytes = 1 * 1024 * 1024;

  public supports(input: { mimeType: string; originalName: string }): boolean {
    return input.mimeType === "text/plain" && this.supportedExtensions.includes(getExtension(input.originalName) as ".txt" | ".md");
  }

  public async extract(input: TextExtractionInput): Promise<TextExtractionResult> {
    assertMaxBytes(input.content, Math.min(this.maxFileBytes, input.limits.maxFileBytes));

    if (!this.supports(input.attachment)) {
      throw new AttachmentExtractionError("EXTENSION_MISMATCH");
    }

    const sanitized = sanitizeExtractedText(decodeUtf8Strict(input.content));
    const bounded = boundExtractedText(sanitized, input.limits.maxTextCharacters);

    return {
      text: bounded.text,
      characterCount: bounded.characterCount,
      truncated: bounded.truncated,
      extractorName: this.name,
      extractorVersion: this.version,
      warnings: sanitized.length === 0 ? ["empty_document"] : [],
      metadata: { empty: sanitized.length === 0 }
    };
  }
}
