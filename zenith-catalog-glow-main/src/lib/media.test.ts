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

  it("drops bare origin media URLs that would otherwise hit the site root", () => {
    expect(resolveMediaUrl("https://www.gadget69.in", "https://www.gadget69.in")).toBe("");
    expect(resolveMediaUrl("https://www.gadget69.in/", "https://www.gadget69.in")).toBe("");
  });

  it("rewrites known broken Unsplash media URLs to a working alias", () => {
    expect(
      resolveMediaUrl("https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=1200&h=1200&fit=crop")
    ).toContain("photo-1606220588913-b3aacb4d2f46");
  });
});
