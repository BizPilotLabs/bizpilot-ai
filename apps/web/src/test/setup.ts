import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { env } from "@/lib";
import { useAuthStore } from "@/store";
import { organization } from "./factories";
import { server } from "./server";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const createMotionComponent = (tag: keyof React.JSX.IntrinsicElements) => React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function MotionComponent(props, ref) {
    return React.createElement(tag, { ...props, ref });
  });

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    motion: {
      article: createMotionComponent("article"),
      aside: createMotionComponent("aside"),
      div: createMotionComponent("div"),
      section: createMotionComponent("section"),
      span: createMotionComponent("span")
    }
  };
});

const createMediaQueryList = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(createMediaQueryList)
});

Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: window.matchMedia
});

HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement): void {
  this.open = true;
});

HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement): void {
  this.open = false;
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

beforeEach(() => {
  server.use(
    http.get(`${env.apiBaseUrl}/permissions`, () => HttpResponse.json({ success: true, data: { permissions: [] } })),
    http.get(`${env.apiBaseUrl}/roles`, () => HttpResponse.json({ success: true, data: { roles: [] } })),
    http.get(`${env.apiBaseUrl}/users`, () => HttpResponse.json({ success: true, data: { users: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 1 } } })),
    http.get(`${env.apiBaseUrl}/organizations/me`, () => HttpResponse.json({ success: true, data: { organization: organization() } }))
  );
});

afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  cleanup();
});

afterAll(() => server.close());

