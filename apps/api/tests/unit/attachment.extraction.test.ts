import { describe, expect, it, vi } from "vitest";
import { InProcessBackgroundJobDispatcher } from "../../src/core/background/index.js";
import { AttachmentExtractionError, PlainTextExtractor, TextExtractorRegistry } from "../../src/modules/attachments/extraction/index.js";

const attachment = { attachmentId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", organizationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", originalName: "notes.txt", mimeType: "text/plain", fileSize: 64 };

describe("attachment text extraction", () => {
  it("selects supported extractors deterministically", () => {
    const registry = new TextExtractorRegistry([new PlainTextExtractor()]);

    expect(registry.select(attachment).name).toBe("plain_text");
    expect(registry.isSupported(attachment)).toBe(true);
  });

  it("rejects unsupported mime types and mismatched extensions", () => {
    const registry = new TextExtractorRegistry([new PlainTextExtractor()]);

    expect(() => registry.select({ ...attachment, mimeType: "image/png", originalName: "image.png" })).toThrow(AttachmentExtractionError);
    expect(() => registry.select({ ...attachment, originalName: "notes.exe" })).toThrow(AttachmentExtractionError);
  });

  it("sanitizes and truncates plain text safely", async () => {
    const extractor = new PlainTextExtractor();
    const result = await extractor.extract({
      attachment,
      content: Buffer.from("\uFEFFhello\u0000\r\nworld\u0007"),
      limits: { maxFileBytes: 1024, maxTextCharacters: 7, timeoutMs: 1000 }
    });

    expect(result.text).toBe("hello\nw");
    expect(result.truncated).toBe(true);
    expect(result.characterCount).toBe(7);
  });

  it("rejects invalid UTF-8 text", async () => {
    const extractor = new PlainTextExtractor();

    await expect(extractor.extract({ attachment, content: Buffer.from([0xc3, 0x28]), limits: { maxFileBytes: 1024, maxTextCharacters: 100, timeoutMs: 1000 } })).rejects.toMatchObject({ extractionCode: "INVALID_ENCODING" });
  });
});

describe("InProcessBackgroundJobDispatcher", () => {
  it("prevents duplicate jobs and contains failures", async () => {
    const dispatcher = new InProcessBackgroundJobDispatcher({ concurrency: 1, queueSize: 2 });
    const run = vi.fn().mockRejectedValue(new Error("boom"));

    expect(dispatcher.dispatch({ key: "attachment:1", name: "attachment_extraction", run }).status).toBe("accepted");
    expect(dispatcher.dispatch({ key: "attachment:1", name: "attachment_extraction", run }).status).toBe("duplicate");

    await dispatcher.shutdown(1000);
    expect(run).toHaveBeenCalledTimes(1);
    expect(dispatcher.stats().activeCount).toBe(0);
  });

  it("rejects jobs when capacity is full", () => {
    const dispatcher = new InProcessBackgroundJobDispatcher({ concurrency: 1, queueSize: 1 });
    const never = () => new Promise<void>(() => undefined);

    expect(dispatcher.dispatch({ key: "a", name: "attachment_extraction", run: never }).status).toBe("accepted");
    expect(dispatcher.dispatch({ key: "b", name: "attachment_extraction", run: never }).status).toBe("rejected");
  });
});
