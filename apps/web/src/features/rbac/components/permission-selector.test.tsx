import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ids, rbacRole } from "@/test/factories";
import { renderWithProviders } from "@/test/render-with-providers";
import { PermissionSelector } from "./permission-selector";

describe("PermissionSelector", () => {
  it("groups permissions by resource and emits selected ids", async () => {
    const onChange = vi.fn();
    const permissions = [
      ...rbacRole().permissions,
      { id: "55555555-5555-4555-8555-555555555555", key: "roles.update", name: "Update roles", description: "Update roles permission.", resource: "roles", action: "update" }
    ];

    renderWithProviders(<PermissionSelector permissions={permissions} selectedPermissionIds={[]} onChange={onChange} />);

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Roles")).toBeInTheDocument();
    await userEvent.click(within(screen.getByText("Users").closest("section") as HTMLElement).getByRole("button", { name: "Select all" }));
    expect(onChange).toHaveBeenCalledWith([ids.permission]);
  });

  it("clears a module selection", async () => {
    const onChange = vi.fn();
    renderWithProviders(<PermissionSelector permissions={rbacRole().permissions} selectedPermissionIds={[ids.permission]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
