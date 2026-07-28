import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { organization } from "@/test/factories";
import { renderWithProviders } from "@/test/render-with-providers";
import { OrganizationSummaryCard } from "./organization-summary-card";

describe("OrganizationSummaryCard", () => {
  it("renders identity, timezone and country from real organization fields", () => {
    renderWithProviders(<OrganizationSummaryCard organization={organization()} />);

    expect(screen.getByText("BizPilot Test")).toBeInTheDocument();
    expect(screen.getByText("bizpilot-test")).toBeInTheDocument();
    expect(screen.getByText("UTC")).toBeInTheDocument();
    expect(screen.getByText("US")).toBeInTheDocument();
  });
});
