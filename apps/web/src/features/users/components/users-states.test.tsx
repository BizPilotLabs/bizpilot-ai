import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render-with-providers";
import { UsersEmptyState } from "./users-empty-state";
import { UsersErrorState } from "./users-error-state";

describe("Users state components", () => {
  it("renders the no-users empty state", () => {
    renderWithProviders(<UsersEmptyState />);

    expect(screen.getByText("No users yet")).toBeInTheDocument();
    expect(screen.getByText("Invite your first team member to start collaborating.")).toBeInTheDocument();
  });

  it("calls retry from the error state", async () => {
    const onRetry = vi.fn();
    renderWithProviders(<UsersErrorState isRetrying={false} message="Network failed" onRetry={onRetry} />);

    expect(screen.getByText("Users could not be loaded")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
