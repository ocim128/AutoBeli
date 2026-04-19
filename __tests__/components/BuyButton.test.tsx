import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BuyButton from "@/components/BuyButton";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

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
      setLanguage: vi.fn(),
    }),
  };
});

describe("BuyButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  function renderBuyButton(slug: string) {
    return render(<BuyButton slug={slug} />);
  }

  it("renders Secure Access button", () => {
    renderBuyButton("test-product");

    expect(screen.getByRole("button")).toHaveTextContent("Secure Access");
  });

  it("renders Secure Access for any product", () => {
    renderBuyButton("premium-product");

    expect(screen.getByRole("button")).toHaveTextContent("Secure Access");
  });

  it("shows secure payment messages", () => {
    renderBuyButton("test-product");

    expect(screen.getByText(/secure payment/i)).toBeInTheDocument();
    expect(screen.getByText(/qris/i)).toBeInTheDocument();
  });

  it("calls API and redirects on successful purchase", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ orderId: "order123" }),
    });

    renderBuyButton("my-product");

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-product", quantity: 1 }),
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/checkout/order123");
    });
  });

  it("shows loading state while processing", async () => {
    // Never resolve the fetch to keep loading state
    mockFetch.mockImplementation(() => new Promise(() => {}));

    renderBuyButton("test-product");

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent("Securing Access...");
      expect(button).toBeDisabled();
    });
  });

  it("shows toast on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    renderBuyButton("test-product");

    const user = userEvent.setup();
    const button = screen.getByRole("button");
    await user.click(button);

    const { toast } = await import("sonner");
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error creating order. Please try again.");
    });
  });

  it("shows toast on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    renderBuyButton("test-product");

    const user = userEvent.setup();
    const button = screen.getByRole("button");
    await user.click(button);

    const { toast } = await import("sonner");
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error creating order. Please try again.");
    });
  });

  it("re-enables button after error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    renderBuyButton("test-product");

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent("Secure Access");
    });
  });

  it("uses correct slug in API call", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ orderId: "order123" }),
    });

    renderBuyButton("special-product-slug");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/orders",
        expect.objectContaining({
          body: JSON.stringify({ slug: "special-product-slug", quantity: 1 }),
        })
      );
    });
  });
});
