import { AttachmentExtractionError } from "./extraction-errors.js";

const replacementCharacter = "\uFFFD";

export const getExtension = (filename: string): string => {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
};

export const assertMaxBytes = (buffer: Buffer, maxBytes: number): void => {
  if (buffer.byteLength > maxBytes) {
    throw new AttachmentExtractionError("FILE_TOO_LARGE");
  }
};

export const decodeUtf8Strict = (buffer: Buffer): string => {
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    if (decoded.includes(replacementCharacter)) {
      throw new AttachmentExtractionError("INVALID_ENCODING");
    }
    return decoded;
  } catch (error) {
    if (error instanceof AttachmentExtractionError) throw error;
    throw new AttachmentExtractionError("INVALID_ENCODING");
  }
};

export const sanitizeExtractedText = (value: string): string => {
  const withoutBom = value.startsWith("\uFEFF") ? value.slice(1) : value;
  const normalizedLines = withoutBom.replace(/\r\n?/gu, "\n");
  const sanitized = Array.from(normalizedLines).filter((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint === 0) return false;
    if (codePoint === 9 || codePoint === 10) return true;
    return codePoint > 31 && codePoint !== 127;
  }).join("");

  return sanitized.replace(/[ \t]+\n/gu, "\n").trim();
};

export const normalizeDocumentText = (value: string): string => sanitizeExtractedText(value.replace(/[ \t]{2,}/gu, " ").replace(/\n{3,}/gu, "\n\n"));

export const boundExtractedText = (value: string, maxCharacters: number): { text: string; characterCount: number; truncated: boolean } => {
  const characters = Array.from(value);
  if (characters.length <= maxCharacters) {
    return { text: value, characterCount: characters.length, truncated: false };
  }
  return { text: characters.slice(0, maxCharacters).join(""), characterCount: maxCharacters, truncated: true };
};
