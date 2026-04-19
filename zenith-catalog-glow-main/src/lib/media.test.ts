import { resolveMediaUrl } from "@/lib/media";

describe("resolveMediaUrl", () => {
  it("keeps absolute media URLs unchanged", () => {
    expect(resolveMediaUrl("https://cdn.example.com/image.png")).toBe(
      "https://cdn.example.com/image.png"
    );
  });

  it("normalizes uploaded media URLs against the API origin", () => {
    expect(resolveMediaUrl("/uploads/images/sample.png")).toBe(
      `${window.location.origin}/uploads/images/sample.png`
    );
  });

  it("drops loopback media URLs on public https pages", () => {
    expect(
      resolveMediaUrl("http://localhost:7070/preview.png", "https://www.gadget69.in")
    ).toBe("");
  });

  it("drops insecure http media URLs on public https pages", () => {
    expect(
      resolveMediaUrl("http://cdn.example.com/preview.png", "https://www.gadget69.in")
    ).toBe("");
  });
});
