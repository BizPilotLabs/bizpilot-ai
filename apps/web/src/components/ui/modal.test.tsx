import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, useState } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render-with-providers";
import { Button } from "./button";
import { Modal } from "./modal";

function ModalHarness({ description }: { description?: string }): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open settings</Button>
      <Modal open={open} onOpenChange={setOpen} title="Workspace settings" {...(description === undefined ? {} : { description })}>
        <Button>Save changes</Button>
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("uses the visible title as the accessible dialog name", async () => {
    renderWithProviders(<ModalHarness description="Manage workspace preferences." />);

    await userEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(screen.getByRole("dialog", { name: "Workspace settings" })).toBeInTheDocument();
  });

  it("links meaningful descriptions without creating invalid references", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<ModalHarness description="Manage workspace preferences." />);

    await user.click(screen.getByRole("button", { name: "Open settings" }));
    const describedDialog = screen.getByRole("dialog", { name: "Workspace settings" });
    const descriptionId = describedDialog.getAttribute("aria-describedby");
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId ?? "")).toHaveTextContent("Manage workspace preferences.");

    rerender(<Modal open title="Untitled" onOpenChange={() => undefined}>No description.</Modal>);
    expect(screen.getByRole("dialog", { name: "Untitled" })).not.toHaveAttribute("aria-describedby");
  });

  it("exposes a named close button, focuses safely, closes on escape and restores focus", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModalHarness description="Manage workspace preferences." />);

    const trigger = screen.getByRole("button", { name: "Open settings" });
    trigger.focus();
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Workspace settings" });
    const closeButton = screen.getByRole("button", { name: "Close modal" });
    await waitFor(() => expect(closeButton).toHaveFocus());

    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Workspace settings" })).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});



