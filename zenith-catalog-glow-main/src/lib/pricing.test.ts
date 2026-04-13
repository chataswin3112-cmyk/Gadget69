import { getEffectivePrice, getOfferStatus, isOfferActive } from "@/lib/pricing";
import { Product } from "@/types";

const baseProduct: Product = {
  id: 1,
  name: "Test Product",
  description: "Description",
  price: 1000,
  stockQuantity: 10,
  sectionId: 1,
  imageUrl: "https://example.com/product.png",
  createdAt: "2026-01-01T00:00:00.000Z",
  offer: true,
  offerPrice: 800,
  offerStartDate: "2026-04-10",
  offerEndDate: "2026-04-15",
};

describe("pricing helpers", () => {
  it("treats the offer window as inclusive", () => {
    expect(isOfferActive(baseProduct, new Date(2026, 3, 10))).toBe(true);
    expect(isOfferActive(baseProduct, new Date(2026, 3, 15))).toBe(true);
    expect(getEffectivePrice(baseProduct, new Date(2026, 3, 12))).toBe(800);
  });

  it("falls back to the regular price outside the active offer window", () => {
    expect(isOfferActive(baseProduct, new Date(2026, 3, 9))).toBe(false);
    expect(isOfferActive(baseProduct, new Date(2026, 3, 16))).toBe(false);
    expect(getEffectivePrice(baseProduct, new Date(2026, 3, 16))).toBe(1000);
  });

  it("reports active, upcoming, expired, and no-offer states", () => {
    expect(getOfferStatus(baseProduct, new Date(2026, 3, 12))).toBe("active");
    expect(getOfferStatus(baseProduct, new Date(2026, 3, 8))).toBe("upcoming");
    expect(getOfferStatus(baseProduct, new Date(2026, 3, 18))).toBe("expired");
    expect(getOfferStatus({ ...baseProduct, offer: false })).toBe("no-offer");
  });
});
