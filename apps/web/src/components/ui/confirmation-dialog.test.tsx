import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render-with-providers";
import { Button } from "./button";
import { ConfirmationDialog } from "./confirmation-dialog";

function ConfirmationHarness({ onConfirm = vi.fn(), pending = false, error = null }: { onConfirm?: () => void; pending?: boolean; error?: string | null }): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open delete</Button>
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete project"
        description="This project will be soft deleted."
        confirmLabel="Delete project"
        isPending={pending}
        error={error}
        onConfirm={onConfirm}
      >
        <p>Customer Launch will be removed from active project lists.</p>
      </ConfirmationDialog>
    </>
  );
}

describe("ConfirmationDialog", () => {
  it("has an accessible name, description and safe initial focus", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConfirmationHarness />);

    await user.click(screen.getByRole("button", { name: "Open delete" }));

    const dialog = screen.getByRole("dialog", { name: "Delete project" });
    expect(dialog).toHaveAccessibleDescription("This project will be soft deleted.");
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    expect(screen.getByRole("button", { name: "Delete project" })).not.toHaveFocus();
  });

  it("closes by cancel and escape while returning focus to the trigger", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConfirmationHarness />);
    const trigger = screen.getByRole("button", { name: "Open delete" });

    trigger.focus();
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Delete project" })).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    fireEvent(screen.getByRole("dialog", { name: "Delete project" }), new Event("cancel", { bubbles: false, cancelable: true }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Delete project" })).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("runs confirmation once and disables duplicate confirmation while pending", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const { rerender } = renderWithProviders(<ConfirmationHarness onConfirm={onConfirm} pending />);

    await user.click(screen.getByRole("button", { name: "Open delete" }));
    expect(screen.getByRole("button", { name: "Delete project" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    rerender(<ConfirmationHarness onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("can remain open with a caller-controlled error", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConfirmationHarness error="Unable to delete project" />);

    await user.click(screen.getByRole("button", { name: "Open delete" }));

    expect(screen.getByRole("dialog", { name: "Delete project" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to delete project");
  });
});
