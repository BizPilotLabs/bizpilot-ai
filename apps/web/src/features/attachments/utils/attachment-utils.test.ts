import { describe, expect, it } from "vitest";
import { formatFileSize, validateAttachmentFile } from "./attachment-utils";

const file = (name: string, type: string, size: number): File => new File(["x".repeat(size)], name, { type, lastModified: 0 });

describe("attachment utilities", () => {
  it("formats file sizes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });

  it("accepts allowed files", () => {
    expect(validateAttachmentFile(file("scope.pdf", "application/pdf", 1000))).toBeNull();
  });

  it("rejects unsupported types and unsafe names", () => {
    expect(validateAttachmentFile(file("script.js", "application/javascript", 1000))).toBe("This file type is not supported.");
    expect(validateAttachmentFile(file("../scope.pdf", "application/pdf", 1000))).toBe("Choose a file with a safe filename under 255 characters.");
  });
});

