import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Loading from "@/app/loading";

describe("Loading", () => {
  it("announces loading status for assistive tech", () => {
    render(<Loading />);

    const status = screen.getByRole("status", { name: /loading/i });

    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Loading")).toHaveClass("sr-only");
  });
});
