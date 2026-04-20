import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ContentViewer from "@/components/ContentViewer";

const mockFetch = vi.fn();

global.fetch = mockFetch;

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
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
      setLanguage: vi.fn(),
    }),
  };
});

describe("ContentViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn(),
      },
    });
  });

  it("shows a toast when copying fails", async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: "secret content" }),
    });

    render(<ContentViewer token="token-123" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /unlock content/i }));
    });
    await screen.findByText("secret content");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    });

    const { toast } = await import("sonner");

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("secret content");
      expect(toast.error).toHaveBeenCalledWith("Failed to copy to clipboard.");
    });

    expect(screen.getByRole("button", { name: /copy/i })).toHaveTextContent("COPY");
  });

  it("renders multiline content with line copy actions and preserved formatting classes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: "alpha   beta\r\n\r\nhttps://example.com" }),
    });

    render(<ContentViewer token="token-456" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /unlock content/i }));
    });

    const firstLine = await screen.findByText(
      (_, element) =>
        element?.tagName.toLowerCase() === "p" && element.textContent === "alpha   beta"
    );

    expect(firstLine).toHaveClass("whitespace-pre-wrap");
    expect(screen.getAllByRole("button", { name: /copy line/i })).toHaveLength(2);
  });
});
