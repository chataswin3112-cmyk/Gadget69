import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CategoryDetails from "@/pages/CategoryDetails";
import { Product, Section } from "@/types";

const { mockEnsureProductsLoaded, mockEnsureSectionsLoaded, mockUseAdminData } = vi.hoisted(() => ({
  mockEnsureProductsLoaded: vi.fn(),
  mockEnsureSectionsLoaded: vi.fn(),
  mockUseAdminData: vi.fn(),
}));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

vi.mock("@/components/storefront/AnnouncementBar", () => ({
  default: () => <div data-testid="announcement-bar" />,
}));

vi.mock("@/components/storefront/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("@/components/storefront/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("@/components/storefront/FloatingContactActions", () => ({
  default: () => null,
}));

vi.mock("@/components/storefront/MediaFrame", () => ({
  default: () => <div data-testid="media-frame" />,
}));

vi.mock("@/components/ui/media-image", () => ({
  default: () => <div data-testid="media-image" />,
}));

vi.mock("@/components/storefront/ProductCard", () => ({
  default: ({ product }: { product: Product }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

const sections: Section[] = [
  {
    id: 1,
    name: "Phones",
    imageUrl: "/phones.png",
    is_active: true,
    sort_order: 0,
    parentSectionId: null,
  },
  {
    id: 2,
    name: "Android",
    imageUrl: "/android.png",
    is_active: true,
    sort_order: 20,
    parentSectionId: 1,
    parentSectionName: "Phones",
  },
  {
    id: 3,
    name: "iPhone",
    imageUrl: "/iphone.png",
    is_active: true,
    sort_order: 10,
    parentSectionId: 1,
    parentSectionName: "Phones",
  },
];

const products: Product[] = [
  {
    id: 10,
    name: "Legacy Phone",
    description: "Old parent product",
    price: 999,
    stockQuantity: 2,
    sectionId: 1,
    sectionName: "Phones",
    imageUrl: "/legacy.png",
    createdAt: "2026-01-01T00:00:00.000Z",
    display_order: 30,
  },
  {
    id: 11,
    name: "Pixel Nova",
    description: "Android phone",
    price: 1299,
    stockQuantity: 4,
    sectionId: 2,
    sectionName: "Android",
    parentSectionId: 1,
    parentSectionName: "Phones",
    imageUrl: "/pixel.png",
    createdAt: "2026-01-03T00:00:00.000Z",
    display_order: 20,
  },
  {
    id: 12,
    name: "iPhone Flash",
    description: "iPhone",
    price: 1599,
    stockQuantity: 3,
    sectionId: 3,
    sectionName: "iPhone",
    parentSectionId: 1,
    parentSectionName: "Phones",
    imageUrl: "/iphone-flash.png",
    createdAt: "2026-01-04T00:00:00.000Z",
    display_order: 5,
  },
  {
    id: 13,
    name: "Pixel Alpha",
    description: "Android phone",
    price: 1199,
    stockQuantity: 4,
    sectionId: 2,
    sectionName: "Android",
    parentSectionId: 1,
    parentSectionName: "Phones",
    imageUrl: "/pixel-alpha.png",
    createdAt: "2026-01-02T00:00:00.000Z",
    display_order: 10,
  },
];

const renderCategoryDetails = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/categories/:id" element={<CategoryDetails />} />
      </Routes>
    </MemoryRouter>
  );

describe("CategoryDetails", () => {
  beforeEach(() => {
    mockEnsureProductsLoaded.mockReset();
    mockEnsureSectionsLoaded.mockReset();
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({
      sections,
      products,
      ensureProductsLoaded: mockEnsureProductsLoaded,
      ensureSectionsLoaded: mockEnsureSectionsLoaded,
    });
  });

  it("shows subcategory product groups and legacy direct products for a parent category", () => {
    renderCategoryDetails("/categories/1");

    expect(screen.getByRole("heading", { name: "Phones" })).toBeInTheDocument();
    expect(screen.getAllByText("Android").length).toBeGreaterThan(0);
    expect(screen.getAllByText("iPhone").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Products in this Category" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Android" }).length).toBeGreaterThan(0);
    expect(screen.getByText("Pixel Nova")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Other Products" })).toBeInTheDocument();
    expect(screen.getByText("Legacy Phone")).toBeInTheDocument();
    expect(screen.getAllByTestId("product-card").map((card) => card.textContent)).toEqual([
      "iPhone Flash",
      "Pixel Alpha",
      "Pixel Nova",
      "Legacy Phone",
    ]);
  });

  it("shows products for a subcategory with the parent breadcrumb", () => {
    renderCategoryDetails("/categories/2");

    expect(screen.getByRole("heading", { name: "Android" })).toBeInTheDocument();
    expect(screen.getByText("Phones")).toBeInTheDocument();
    expect(screen.getByText("Pixel Alpha")).toBeInTheDocument();
    expect(screen.getByText("Pixel Nova")).toBeInTheDocument();
    expect(screen.getAllByTestId("product-card").map((card) => card.textContent)).toEqual([
      "Pixel Alpha",
      "Pixel Nova",
    ]);
    expect(screen.queryByText("Legacy Phone")).not.toBeInTheDocument();
  });
});
