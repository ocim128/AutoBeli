import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import OrderPending from "@/components/OrderPending";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return {
    useLanguage: () => ({
      t: (path: string) => {
        const keys = path.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = translations.en;
        for (const key of keys) {
          if (current === undefined || current[key] === undefined) return path;
          current = current[key];
        }
        return current;
      },
      language: "en",
    }),
  };
});

beforeEach(() => {
  vi.useFakeTimers();
});

describe("OrderPending", () => {
  it("renders the QR image, final amount, and expiry for a Qris order", () => {
    const expiresAt = Date.now() + 240_000;
    render(
      <OrderPending
        orderId="64b64c7f9f1b2c0012345678"
        productTitle="Test Product"
        amount={25321}
        createdAt="2026-01-01T00:00:00Z"
        isQris
        expiresAt={expiresAt}
      />
    );

    const img = screen.getByAltText("Qris QR code") as HTMLImageElement;
    expect(img.src).toContain("/api/payment/qris/image?orderId=");
    expect(img.src).toContain("64b64c7f9f1b2c0012345678");
    // The final amount is shown in both the QR panel and the order summary
    expect(screen.getAllByText("Rp 25.321").length).toBeGreaterThan(0);
    expect(screen.getByText(/Pay the exact amount/i)).toBeInTheDocument();
    expect(screen.getByText(/Valid until/i)).toBeInTheDocument();
  });

  it("renders the expired state with a retry action", () => {
    render(
      <OrderPending
        orderId="64b64c7f9f1b2c0012345678"
        productTitle="Test Product"
        amount={25321}
        createdAt="2026-01-01T00:00:00Z"
        isQris
        isExpired
      />
    );

    expect(screen.getAllByText(/Payment Expired/i).length).toBeGreaterThan(0);
    expect(screen.queryByAltText("Qris QR code")).not.toBeInTheDocument();
    const retry = screen.getByRole("link", { name: /Create New Payment/i });
    expect(retry).toHaveAttribute("href", "/checkout/64b64c7f9f1b2c0012345678?retry=true");
  });

  it("does not render the QR image for non-Qris orders", () => {
    render(
      <OrderPending
        orderId="64b64c7f9f1b2c0012345678"
        productTitle="Test Product"
        amount={25000}
        createdAt="2026-01-01T00:00:00Z"
      />
    );

    expect(screen.queryByAltText("Qris QR code")).not.toBeInTheDocument();
    expect(screen.getByText("Rp 25.000")).toBeInTheDocument();
  });
});
