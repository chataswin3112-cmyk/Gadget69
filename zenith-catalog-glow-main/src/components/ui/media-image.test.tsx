import { fireEvent, render, screen } from "@testing-library/react";
import MediaImage from "@/components/ui/media-image";

describe("MediaImage", () => {
  it("falls back to the shared placeholder when an image fails to load", () => {
    render(<MediaImage src="https://cdn.example.com/broken-image.png" alt="Preview image" />);

    const image = screen.getByAltText("Preview image");
    fireEvent.error(image);

    expect(image).toHaveAttribute("src", "/placeholder.svg");
  });
});
