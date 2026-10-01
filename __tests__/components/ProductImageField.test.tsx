import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProductImageField } from "@/components/admin/ProductImageField";

const fetchMock = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});

function field(value = "https://example.com/existing.jpg") {
  const onChange = vi.fn();
  const onUploadingChange = vi.fn();
  render(
    <ProductImageField value={value} onChange={onChange} onUploadingChange={onUploadingChange} />
  );
  return { onChange, onUploadingChange, input: screen.getByLabelText("Upload Image (Optional)") };
}

it("uploads a selected file and replaces the image URL only after success", async () => {
  let finish!: (value: unknown) => void;
  fetchMock.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const { input, onChange, onUploadingChange } = field();
  const file = new File(["image"], "product.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/admin/products/image",
    expect.objectContaining({
      method: "POST",
      body: file,
      headers: { "Content-Type": "image/png" },
    })
  );
  expect(input).toBeDisabled();
  expect(screen.getByLabelText("Image URL (Optional)")).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Uploading image...");
  expect(onUploadingChange).toHaveBeenCalledWith(true);
  expect(onChange).not.toHaveBeenCalled();
  finish({ ok: true, json: async () => ({ imageUrl: "/api/images/abcdef123456789012345678" }) });
  await waitFor(() =>
    expect(onChange).toHaveBeenCalledWith("/api/images/abcdef123456789012345678")
  );
  expect(onUploadingChange).toHaveBeenLastCalledWith(false);
  expect(input).not.toBeDisabled();
});

it("preserves the existing image and lets the admin retry after a failed upload", async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Failed to upload image" }),
  });
  const { input, onChange, onUploadingChange } = field();
  const file = new File(["image"], "product.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });
  await screen.findByText("Failed to upload image");
  expect(onChange).not.toHaveBeenCalled();
  expect(onUploadingChange).toHaveBeenLastCalledWith(false);
  expect(screen.getByLabelText("Image URL (Optional)")).toHaveValue(
    "https://example.com/existing.jpg"
  );
  expect(input).not.toBeDisabled();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ imageUrl: "/api/images/abcdef123456789012345678" }),
  });
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(onChange).toHaveBeenCalled());
});

it.each([
  new File(["<svg/>"], "product.svg", { type: "image/svg+xml" }),
  new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }),
  new File([], "empty.png", { type: "image/png" }),
])("rejects unsupported, oversized, or empty files before upload", (file) => {
  const { input, onChange, onUploadingChange } = field();
  fireEvent.change(input, { target: { files: [file] } });
  expect(fetchMock).not.toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();
  expect(onUploadingChange).not.toHaveBeenCalled();
});

it("allows manual URLs and previews permanent image paths", () => {
  const { onChange } = field("/api/images/abcdef123456789012345678");
  expect(screen.getByRole("img")).toHaveAttribute("src", "/api/images/abcdef123456789012345678");
  fireEvent.change(screen.getByLabelText("Image URL (Optional)"), {
    target: { value: "https://example.com/new.jpg" },
  });
  expect(onChange).toHaveBeenCalledWith("https://example.com/new.jpg");
});
