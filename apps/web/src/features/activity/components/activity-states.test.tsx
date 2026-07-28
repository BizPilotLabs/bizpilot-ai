import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render-with-providers";
import { ActivityEmptyState, ActivityErrorState } from "./index";

describe("Activity state components", () => {
  it("renders the empty state for no organization activity", () => {
    renderWithProviders(<ActivityEmptyState filtered={false} />);

    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("renders the filtered empty state", () => {
    renderWithProviders(<ActivityEmptyState filtered />);

    expect(screen.getByText("No matching activity")).toBeInTheDocument();
  });

  it("calls retry from the error state", () => {
    const onRetry = vi.fn();
    renderWithProviders(<ActivityErrorState message="Failed" isRetrying={false} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
