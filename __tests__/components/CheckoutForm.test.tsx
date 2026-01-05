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

describe("CheckoutForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("renders with amount displayed", () => {
    render(<CheckoutForm orderId="order123" amount={75000} />);

    expect(screen.getByRole("button")).toHaveTextContent("Pay");
    expect(screen.getByRole("button")).toHaveTextContent("75.000");
  });

  it("renders contact input field", () => {
    render(<CheckoutForm orderId="order123" amount={50000} />);

    expect(screen.getByLabelText(/email or whatsapp/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/example@mail.com/i)).toBeInTheDocument();
  });

  it("formats large amounts correctly", () => {
    render(<CheckoutForm orderId="order123" amount={2500000} />);

    expect(screen.getByRole("button")).toHaveTextContent("2.500.000");
  });

  it("shows validation error for empty contact", async () => {
    render(<CheckoutForm orderId="order123" amount={50000} />);

    const submitButton = screen.getByRole("button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please enter your email or WhatsApp number"
      );
    });

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows validation error for whitespace-only contact", async () => {
    render(<CheckoutForm orderId="order123" amount={50000} />);

    const input = screen.getByLabelText(/email or whatsapp/i);
    await userEvent.type(input, "   ");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please enter your email or WhatsApp number"
      );
    });
  });

  it("submits form with valid contact and processes payment", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true }) // PATCH /api/orders
      .mockResolvedValueOnce({ ok: true }); // POST /api/payment/mock/pay

    render(<CheckoutForm orderId="order123" amount={50000} />);

    const input = screen.getByLabelText(/email or whatsapp/i);
    await userEvent.type(input, "test@example.com");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "order123", contact: "test@example.com" }),
      });
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/payment/mock/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "order123" }),
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/order/order123");
    });
  });

  it("trims contact input before sending", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: true });

    render(<CheckoutForm orderId="order123" amount={50000} />);

    const input = screen.getByLabelText(/email or whatsapp/i);
    await userEvent.type(input, "  test@example.com  ");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/orders",
        expect.objectContaining({
          body: JSON.stringify({ orderId: "order123", contact: "test@example.com" }),
        })
      );
    });
  });

  it("shows loading state during submission", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CheckoutForm orderId="order123" amount={50000} />);

    const input = screen.getByLabelText(/email or whatsapp/i);
    await userEvent.type(input, "test@example.com");

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

    render(<CheckoutForm orderId="order123" amount={50000} />);

    const input = screen.getByLabelText(/email or whatsapp/i);
    await userEvent.type(input, "test@example.com");

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
        json: async () => ({ error: "Payment failed" }),
      }); // Payment fails

    render(<CheckoutForm orderId="order123" amount={50000} />);

    const input = screen.getByLabelText(/email or whatsapp/i);
    await userEvent.type(input, "test@example.com");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Payment failed");
    });
  });

  it("re-enables form after error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<CheckoutForm orderId="order123" amount={50000} />);

    const input = screen.getByLabelText(/email or whatsapp/i);
    await userEvent.type(input, "test@example.com");

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(input).not.toBeDisabled();
    });
  });

  it("accepts phone number as contact", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: true });

    render(<CheckoutForm orderId="order123" amount={50000} />);

    const input = screen.getByLabelText(/email or whatsapp/i);
    await userEvent.type(input, "081234567890");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/orders",
        expect.objectContaining({
          body: JSON.stringify({ orderId: "order123", contact: "081234567890" }),
        })
      );
    });
  });
});
