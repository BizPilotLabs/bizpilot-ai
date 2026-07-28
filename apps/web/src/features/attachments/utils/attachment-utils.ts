const maximumAttachmentSizeBytes = 25 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/png",
  "image/jpeg"
]);

const unsafeFilenameCharacters = new Set(["<", ">", ":", '"', "/", "\\", "|", "?", "*"]);

export const isAllowedAttachmentMimeType = (mimeType: string): boolean => allowedMimeTypes.has(mimeType);

export const validateAttachmentFile = (file: File): string | null => {
  const hasUnsafeCharacter = [...file.name].some((character) => unsafeFilenameCharacters.has(character) || character.charCodeAt(0) < 32);
  if (file.name.trim().length === 0 || file.name.length > 255 || hasUnsafeCharacter) {
    return "Choose a file with a safe filename under 255 characters.";
  }

  if (!isAllowedAttachmentMimeType(file.type)) {
    return "This file type is not supported.";
  }

  if (file.size <= 0 || file.size > maximumAttachmentSizeBytes) {
    return "Attachments must be larger than 0 bytes and no more than 25 MB.";
  }

  return null;
};

export const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatAttachmentDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
};


