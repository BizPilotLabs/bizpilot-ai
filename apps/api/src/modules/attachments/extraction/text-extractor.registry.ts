import type { AttachmentExtractionMetadata, TextExtractor } from "./attachment-text-extraction.types.js";
import { DocxTextExtractor } from "./docx-text.extractor.js";
import { AttachmentExtractionError } from "./extraction-errors.js";
import { PdfTextExtractor } from "./pdf-text.extractor.js";
import { PlainTextExtractor } from "./plain-text.extractor.js";
import { getExtension } from "./text-normalization.js";

export class TextExtractorRegistry {
  private readonly extractors: readonly TextExtractor[];

  public constructor(extractors: readonly TextExtractor[] = [new PlainTextExtractor(), new PdfTextExtractor(), new DocxTextExtractor()]) {
    this.extractors = extractors;
  }

  public select(attachment: AttachmentExtractionMetadata): TextExtractor {
    const mimeMatches = this.extractors.filter((extractor) => extractor.supportedMimeTypes.includes(attachment.mimeType as never));

    if (mimeMatches.length === 0) {
      throw new AttachmentExtractionError("UNSUPPORTED_FILE_TYPE");
    }

    const selected = mimeMatches.find((extractor) => extractor.supportedExtensions.includes(getExtension(attachment.originalName) as never));
    if (selected === undefined) {
      throw new AttachmentExtractionError("EXTENSION_MISMATCH");
    }

    if (attachment.fileSize > selected.maxFileBytes) {
      throw new AttachmentExtractionError("FILE_TOO_LARGE");
    }

    return selected;
  }

  public isSupported(attachment: Pick<AttachmentExtractionMetadata, "mimeType" | "originalName" | "fileSize">): boolean {
    try {
      this.select({ attachmentId: "00000000-0000-4000-8000-000000000000", organizationId: "00000000-0000-4000-8000-000000000000", ...attachment });
      return true;
    } catch {
      return false;
    }
  }
}

export const textExtractorRegistry = new TextExtractorRegistry();
