import { render, screen } from "@testing-library/react";
import MediaFrame from "@/components/storefront/MediaFrame";

describe("MediaFrame", () => {
  it("renders native video URLs with a video element", () => {
    const { container } = render(
      <MediaFrame src="https://cdn.example.com/demo.mp4" alt="Demo video" />
    );

    expect(container.querySelector("video")).toBeInTheDocument();
    expect(screen.queryByTitle("Demo video")).not.toBeInTheDocument();
  });

  it("renders YouTube URLs with an iframe", () => {
    const { container } = render(
      <MediaFrame src="https://www.youtube.com/watch?v=abc123XYZ" alt="Launch trailer" />
    );

    expect(screen.getByTitle("Launch trailer")).toBeInTheDocument();
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/abc123XYZ?rel=0&modestbranding=1"
    );
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });
});
