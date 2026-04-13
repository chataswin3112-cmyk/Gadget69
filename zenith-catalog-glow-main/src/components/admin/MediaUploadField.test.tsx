import { render, screen } from "@testing-library/react";
import MediaUploadField from "@/components/admin/MediaUploadField";

vi.mock("@/api/productApi", () => ({
  uploadFile: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("MediaUploadField", () => {
  it("shows a provider-aware preview for pasted YouTube URLs", () => {
    const { container } = render(
      <MediaUploadField
        label="Product Video"
        value="https://youtu.be/abc123XYZ"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByTitle("Product Video")).toBeInTheDocument();
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/abc123XYZ?rel=0&modestbranding=1"
    );
  });
});
