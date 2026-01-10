import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutForm from "@/components/CheckoutForm";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

describe("CheckoutForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("renders with amount displayed", () => {
    render(<CheckoutForm orderId="order123" amount={75000} paymentGateway="VERIPAY" />);

    expect(screen.getByRole("button")).toHaveTextContent("Pay");
    expect(screen.getByRole("button")).toHaveTextContent("75.000");
  });

  it("renders contact input field", () => {
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="VERIPAY" />);

    expect(screen.getByLabelText(/your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
  });

  it("formats large amounts correctly", () => {
    render(<CheckoutForm orderId="order123" amount={2500000} paymentGateway="VERIPAY" />);

    expect(screen.getByRole("button")).toHaveTextContent("2.500.000");
  });

  it("shows validation error for empty contact", async () => {
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="VERIPAY" />);

    const submitButton = screen.getByRole("button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Please enter your email address");
    });

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows validation error for whitespace-only contact", async () => {
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="VERIPAY" />);

    const input = screen.getByLabelText(/your email/i);
    await userEvent.type(input, "   ");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Please enter your email address");
    });
  });

  it("submits form with valid contact and processes payment", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true }) // PATCH /api/orders
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, payment_url: "https://pay.veripay.site/123" }),
      }); // POST /api/payment/veripay/create

    // Mock window.location.href using Object.defineProperty
    let capturedHref = "";
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "location");
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        get href() {
          return capturedHref;
        },
        set href(value: string) {
          capturedHref = value;
        },
      },
      writable: true,
    });

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="VERIPAY" />);

    const input = screen.getByLabelText(/your email/i);
    await userEvent.type(input, "customer@example.com");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "order123", contact: "customer@example.com" }),
      });
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/payment/veripay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "order123" }),
      });
    });

    await waitFor(() => {
      expect(capturedHref).toBe("https://pay.veripay.site/123");
    });

    // Restore window.location
    if (originalDescriptor) {
      Object.defineProperty(window, "location", originalDescriptor);
    }
  });

  it("trims contact input before sending", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="VERIPAY" />);

    const input = screen.getByLabelText(/your email/i);
    await userEvent.type(input, "  customer@example.com  ");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/orders",
        expect.objectContaining({
          body: JSON.stringify({ orderId: "order123", contact: "customer@example.com" }),
        })
      );
    });
  });

  it("shows loading state during submission", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="VERIPAY" />);

    const input = screen.getByLabelText(/your email/i);
    await userEvent.type(input, "customer@example.com");

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent("Processing...");
      expect(button).toBeDisabled();
      expect(input).toBeDisabled();
    });
  });

  it("shows error when contact save fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed to save contact" }),
    });

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="VERIPAY" />);

    const input = screen.getByLabelText(/your email/i);
    await userEvent.type(input, "customer@example.com");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Failed to save contact");
    });
  });

  it("shows error when payment fails", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true }) // Contact save succeeds
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Payment creation failed" }),
      }); // Payment fails

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="VERIPAY" />);

    const input = screen.getByLabelText(/your email/i);
    await userEvent.type(input, "customer@example.com");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Payment creation failed");
    });
  });

  it("re-enables form after error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="VERIPAY" />);

    const input = screen.getByLabelText(/your email/i);
    await userEvent.type(input, "customer@example.com");

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(input).not.toBeDisabled();
    });
  });

  it("accepts valid email as contact", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="VERIPAY" />);

    const input = screen.getByLabelText(/your email/i);
    await userEvent.type(input, "customer@example.com");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/orders",
        expect.objectContaining({
          body: JSON.stringify({ orderId: "order123", contact: "customer@example.com" }),
        })
      );
    });
  });

  it("uses Midtrans endpoint when paymentGateway is MIDTRANS", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        payment_url: "https://app.sandbox.midtrans.com/snap/123",
      }),
    });

    // Mock window.location.href
    let capturedHref = "";
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "location");
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        get href() {
          return capturedHref;
        },
        set href(value: string) {
          capturedHref = value;
        },
      },
      writable: true,
    });

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="MIDTRANS" />);

    const input = screen.getByLabelText(/your email/i);
    await userEvent.type(input, "customer@example.com");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/payment/midtrans/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "order123" }),
      });
    });

    // Restore window.location
    if (originalDescriptor) {
      Object.defineProperty(window, "location", originalDescriptor);
    }
  });
});
