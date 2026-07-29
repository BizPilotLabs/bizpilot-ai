import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/lib";
import { renderWithProviders } from "@/test/render-with-providers";
import { server } from "@/test/server";
import { AiCopilotPage } from "./ai-copilot-page";
import type { AiHealthResponse } from "../types";

const healthResponse = (overrides: Partial<AiHealthResponse> = {}): AiHealthResponse => ({
  enabled: true,
  configured: true,
  available: true,
  status: "healthy",
  provider: "test",
  model: "fake-model",
  checkedAt: "2026-01-01T00:00:00.000Z",
  latencyCategory: "fast",
  rateLimit: { store: "memory", distributed: false, windowMs: 60000, userLimit: 20, organizationLimit: 200, available: true, detail: "In-memory AI rate limits are active." },
  persistence: { promptsStored: false, responsesStored: false, conversationHistoryStored: false },
  mode: "read_only",
  ...overrides
});

const mockHealth = (health: Partial<AiHealthResponse> = {}): void => {
  server.use(http.get(`${env.apiBaseUrl}/ai/copilot/health`, () => HttpResponse.json({ success: true, data: healthResponse(health) })));
};

const responseMetadata = { requestId: "request-1", resultCategory: "success", durationCategory: "fast", sourceCount: 1 } as const;

describe("AiCopilotPage", () => {
  beforeEach(() => {
    mockHealth();
  });

  it("hides Copilot when the user lacks ai.use", () => {
    renderWithProviders(<AiCopilotPage />, { permissions: [], roleNames: ["Member"] });

    expect(screen.getByText("You do not have permission to use BizPilot AI Copilot.")).toBeInTheDocument();
  });

  it("shows provider unavailable state without crashing", async () => {
    mockHealth({ enabled: false, configured: false, available: false, status: "disabled", provider: "disabled", model: "disabled", degradedReasonCode: "AI_DISABLED", reason: "AI is disabled for this deployment." });
    renderWithProviders(<AiCopilotPage />, { permissions: ["ai.use"], roleNames: ["Member"] });

    expect(await screen.findByText("Disabled")).toBeInTheDocument();
    expect(screen.getByText("AI is disabled for this deployment.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask Copilot" })).toBeDisabled();
  });

  it("shows degraded provider status with safe model details", async () => {
    mockHealth({ available: false, status: "degraded", degradedReasonCode: "AI_PROVIDER_TIMEOUT", reason: "AI provider is unreachable or timed out." });
    renderWithProviders(<AiCopilotPage />, { permissions: ["ai.use"], roleNames: ["Member"] });

    expect(await screen.findByLabelText(/AI status: Degraded/)).toBeInTheDocument();
    expect(screen.getByText(/test \/ fake-model/)).toBeInTheDocument();
    expect(screen.queryByText(/localhost|11434/)).not.toBeInTheDocument();
  });

  it("validates required questions before submitting", async () => {
    const handler = vi.fn();
    server.use(http.post(`${env.apiBaseUrl}/ai/copilot/query`, handler));
    const user = userEvent.setup();
    renderWithProviders(<AiCopilotPage />, { permissions: ["ai.use"], roleNames: ["Member"] });

    await user.click(await screen.findByRole("button", { name: "Ask Copilot" }));

    expect(await screen.findByText("Ask a question first.")).toBeInTheDocument();
    expect(handler).not.toHaveBeenCalled();
  });

  it("submits organization questions, prevents duplicate pending submits and renders verified sources", async () => {
    const handler = vi.fn(async () => {
      await delay(100);
      return HttpResponse.json({
        success: true,
        data: {
          requestId: "request-1",
          answer: "Facts: Launch is active [S2].",
          sources: [
            { marker: "[S1]", type: "organization", id: "org-1", label: "BizPilot", appRoute: "/app/organizations" },
            { marker: "[S2]", type: "project", id: "project-1", label: "Launch", appRoute: "/app/projects/project-1", updatedAt: "2026-01-01T00:00:00.000Z" }
          ],
          provider: { provider: "test", model: "fake-model" },
          metadata: responseMetadata,
          scope: { type: "organization" },
          limitations: ["AI answers are generated from bounded authorized context."]
        }
      });
    });
    server.use(http.post(`${env.apiBaseUrl}/ai/copilot/query`, handler));
    const user = userEvent.setup();
    renderWithProviders(<AiCopilotPage />, { permissions: ["ai.use"], roleNames: ["Member"] });

    await user.type(await screen.findByLabelText("Ask Copilot"), "Summarize progress");
    await user.click(screen.getByRole("button", { name: "Ask Copilot" }));

    expect(screen.getByRole("button", { name: "Ask Copilot" })).toBeDisabled();
    expect(await screen.findByText(/Launch is active/)).toBeInTheDocument();
    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
    const sourceRegion = screen.getByText("Sources").closest("div");
    expect(sourceRegion).not.toBeNull();
    expect(screen.getByText("[S2]")).toBeInTheDocument();
    expect(screen.getByText("Launch")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Open/ })[0]).toHaveAttribute("href", "/app/organizations");
  });

  it("supports project scope and sends only the selected entity id", async () => {
    const handler = vi.fn(async ({ request }) => {
      const body = await request.json() as { scope: { type: string; entityId?: string } };
      expect(body.scope).toEqual({ type: "project", entityId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
      return HttpResponse.json({ success: true, data: { requestId: "request-2", answer: "Project summary [S1].", sources: [], provider: { provider: "test", model: "fake-model" }, metadata: responseMetadata, scope: body.scope, limitations: [] } });
    });
    server.use(http.post(`${env.apiBaseUrl}/ai/copilot/query`, handler));
    const user = userEvent.setup();
    renderWithProviders(<AiCopilotPage />, { permissions: ["ai.use"], roleNames: ["Member"] });

    await user.selectOptions(await screen.findByLabelText("Scope"), "project");
    await user.type(screen.getByLabelText("Project ID"), "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    await user.type(screen.getByLabelText("Ask Copilot"), "Summarize project");
    await user.click(screen.getByRole("button", { name: "Ask Copilot" }));

    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
  });

  it("preserves the question and shows retry timing when rate limited", async () => {
    server.use(http.post(`${env.apiBaseUrl}/ai/copilot/query`, () => HttpResponse.json({ success: false, error: { code: "AI_RATE_LIMIT_EXCEEDED", message: "AI request limit exceeded. Please try again later." } }, { status: 429, headers: { "Retry-After": "42" } })));
    const user = userEvent.setup();
    renderWithProviders(<AiCopilotPage />, { permissions: ["ai.use"], roleNames: ["Member"] });

    await user.type(await screen.findByLabelText("Ask Copilot"), "Summarize progress");
    await user.click(screen.getByRole("button", { name: "Ask Copilot" }));

    expect(await screen.findByText(/Try again in about 42 seconds/)).toBeInTheDocument();
    expect(screen.getByLabelText("Ask Copilot")).toHaveValue("Summarize progress");
    expect(screen.getByRole("button", { name: "Ask Copilot" })).toBeDisabled();
  });

  it("preserves the question when distributed governance is unavailable", async () => {
    server.use(http.post(`${env.apiBaseUrl}/ai/copilot/query`, () => HttpResponse.json({ success: false, error: { code: "AI_RATE_LIMIT_STORE_UNAVAILABLE", message: "AI governance service is temporarily unavailable." } }, { status: 503 })));
    const user = userEvent.setup();
    renderWithProviders(<AiCopilotPage />, { permissions: ["ai.use"], roleNames: ["Member"] });

    await user.type(await screen.findByLabelText("Ask Copilot"), "Summarize progress");
    await user.click(screen.getByRole("button", { name: "Ask Copilot" }));

    expect(await screen.findByText("AI governance service is temporarily unavailable. Please try again in a moment.")).toBeInTheDocument();
    expect(screen.getByLabelText("Ask Copilot")).toHaveValue("Summarize progress");
    expect(screen.queryByText(/redis:\/\//iu)).not.toBeInTheDocument();
  });
  it("renders model HTML-like output as text", async () => {
    server.use(http.post(`${env.apiBaseUrl}/ai/copilot/query`, () => HttpResponse.json({ success: true, data: { requestId: "request-3", answer: "<img src=x onerror=alert(1)> Safe text", sources: [], provider: { provider: "test", model: "fake-model" }, metadata: responseMetadata, scope: { type: "organization" }, limitations: [] } })));
    const user = userEvent.setup();
    renderWithProviders(<AiCopilotPage />, { permissions: ["ai.use"], roleNames: ["Member"] });

    await user.type(await screen.findByLabelText("Ask Copilot"), "Render safely");
    await user.click(screen.getByRole("button", { name: "Ask Copilot" }));

    const answer = await screen.findByText(/Safe text/);
    expect(answer).toHaveTextContent("<img src=x onerror=alert(1)> Safe text");
    expect(within(answer).queryByRole("img")).not.toBeInTheDocument();
  });
});

