import { resolveMediaUrl } from "@/lib/media";

describe("resolveMediaUrl", () => {
  it("keeps absolute media URLs unchanged", () => {
    expect(resolveMediaUrl("https://cdn.example.com/image.png")).toBe(
      "https://cdn.example.com/image.png"
    );
  });

  it("normalizes uploaded media URLs against the API origin", () => {
    expect(resolveMediaUrl("/uploads/images/sample.png")).toBe(
      "http://localhost:8081/uploads/images/sample.png"
    );
  });
});
