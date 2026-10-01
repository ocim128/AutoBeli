import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits and retries a temporary QRIS creation failure without resaving contact", async () => {
    vi.useFakeTimers();
    mockFetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Payment provider did not confirm the payment." }), {
          status: 504,
          headers: { "Retry-After": "30" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Creation in progress" }), {
          status: 409,
          headers: { "Retry-After": "1" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, paymentId: "recovered" }))
      );
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="QRIS" />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "returning@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(mockPush).toHaveBeenCalledWith("/order/order123");
    expect(mockFetch.mock.calls.slice(1).map((call) => call[1].body)).toEqual([
      JSON.stringify({ orderId: "order123" }),
      JSON.stringify({ orderId: "order123" }),
      JSON.stringify({ orderId: "order123" }),
    ]);
  });

  it("stops retrying after three QRIS creation attempts", async () => {
    vi.useFakeTimers();
    mockFetch.mockResolvedValueOnce({ ok: true }).mockImplementation(
      async () =>
        new Response(JSON.stringify({ error: "Provider still unavailable" }), {
          status: 504,
          headers: { "Retry-After": "30" },
        })
    );
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="QRIS" />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "returning@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(screen.getByRole("alert")).toHaveTextContent("Provider still unavailable");
    expect(screen.getByRole("button")).not.toBeDisabled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens order status so a recovered expired QRIS payment can be retried", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Payment expired" }), { status: 410 })
      );
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="QRIS" />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "returning@example.com" },
    });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/order/order123");
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a permanent QRIS conflict immediately without retrying", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "This payment request has changed. Please contact support." }),
          { status: 409 }
        )
      );
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="QRIS" />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "returning@example.com" },
    });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("request has changed");
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders with amount displayed", () => {
    render(<CheckoutForm orderId="order123" amount={75000} paymentGateway="PAKASIR" />);

    expect(screen.getByRole("button")).toHaveTextContent("Pay");
    expect(screen.getByRole("button")).toHaveTextContent("75.000");
  });

  it("renders contact input field", () => {
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="PAKASIR" />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
  });

  it("formats large amounts correctly", () => {
    render(<CheckoutForm orderId="order123" amount={2500000} paymentGateway="PAKASIR" />);

    expect(screen.getByRole("button")).toHaveTextContent("2.500.000");
  });

  it("shows supported payment methods only for Pakasir", () => {
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="PAKASIR" />);

    expect(screen.getByText(/payment methods/i)).toBeInTheDocument();
    expect(screen.getByText(/^QRIS$/i)).toBeInTheDocument();
  });

  it("hides supported payment methods for mock gateway", () => {
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="MOCK" />);

    expect(screen.queryByText(/payment methods/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^QRIS$/i)).not.toBeInTheDocument();
  });

  it("shows validation error for empty contact", async () => {
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="PAKASIR" />);

    const submitButton = screen.getByRole("button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Email address is required");
    });

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows validation error for whitespace-only contact", async () => {
    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="PAKASIR" />);

    const input = screen.getByLabelText(/email address/i);
    await userEvent.type(input, "   ");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Email address is required");
    });
  });

  it("submits form with valid contact and processes payment", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true }) // PATCH /api/orders
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          payment_url: "https://app.pakasir.com/pay/test/50000",
        }),
      }); // POST /api/payment/pakasir/create

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

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="PAKASIR" />);

    const input = screen.getByLabelText(/email address/i);
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
      expect(mockFetch).toHaveBeenCalledWith("/api/payment/pakasir/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "order123" }),
      });
    });

    await waitFor(() => {
      expect(capturedHref).toBe("https://app.pakasir.com/pay/test/50000");
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

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="PAKASIR" />);

    const input = screen.getByLabelText(/email address/i);
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

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="PAKASIR" />);

    const input = screen.getByLabelText(/email address/i);
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

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="PAKASIR" />);

    const input = screen.getByLabelText(/email address/i);
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

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="PAKASIR" />);

    const input = screen.getByLabelText(/email address/i);
    await userEvent.type(input, "customer@example.com");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Payment creation failed");
    });
  });

  it("re-enables form after error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="PAKASIR" />);

    const input = screen.getByLabelText(/email address/i);
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

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="PAKASIR" />);

    const input = screen.getByLabelText(/email address/i);
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

  it("uses Mock endpoint when paymentGateway is MOCK", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    render(<CheckoutForm orderId="order123" amount={50000} paymentGateway="MOCK" />);

    const input = screen.getByLabelText(/email address/i);
    await userEvent.type(input, "customer@example.com");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/payment/mock/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "order123" }),
      });
    });
  });
});
