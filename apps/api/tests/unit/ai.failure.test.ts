import { describe, expect, it } from "vitest";
import { AppError } from "../../src/core/errors/index.js";
import { aiFailureDefinitions, createAiError, getAiFailureDefinition } from "../../src/modules/ai/ai.failure.js";

describe("AI failure taxonomy", () => {
  it("maps stable AI categories to safe HTTP responses", () => {
    expect(createAiError("AI_RATE_LIMIT_EXCEEDED")).toMatchObject({ statusCode: 429, code: "AI_RATE_LIMIT_EXCEEDED" });
    expect(createAiError("AI_PROVIDER_TIMEOUT")).toMatchObject({ statusCode: 504, code: "AI_PROVIDER_TIMEOUT" });
    expect(createAiError("AI_CONTEXT_PERMISSION_DENIED")).toMatchObject({ statusCode: 403, code: "AI_CONTEXT_PERMISSION_DENIED" });
  });

  it("categorizes unknown failures as internal context failures", () => {
    expect(getAiFailureDefinition(new Error("database exploded with secrets"))).toEqual(aiFailureDefinitions.AI_INTERNAL_CONTEXT_FAILURE);
  });

  it("normalizes generic app errors to permission or scope failures", () => {
    expect(getAiFailureDefinition(new AppError({ statusCode: 403, message: "Denied" })).code).toBe("AI_CONTEXT_PERMISSION_DENIED");
    expect(getAiFailureDefinition(new AppError({ statusCode: 404, message: "Missing" })).code).toBe("AI_SCOPE_NOT_FOUND");
  });
});
