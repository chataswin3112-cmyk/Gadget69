import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Products from "@/pages/Products";
import { Product, Section } from "@/types";

const { mockUseAdminData } = vi.hoisted(() => ({
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

vi.mock("@/components/storefront/SectionHeader", () => ({
  default: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  ),
}));

vi.mock("@/components/storefront/ProductCard", () => ({
  default: ({ product }: { product: { name: string } }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const sections: Section[] = [
  {
    id: 1,
    name: "Smartphones",
    description: "Phones",
    imageUrl: "https://cdn.example.com/section.png",
    is_active: true,
    show_in_explore: true,
    show_in_top_category: true,
    sort_order: 0,
  },
];

const products: Product[] = [
  {
    id: 1,
    name: "Nova X",
    description: "New launch phone",
    price: 999,
    stockQuantity: 10,
    sectionId: 1,
    sectionName: "Smartphones",
    imageUrl: "https://cdn.example.com/nova-x.png",
    createdAt: "2026-01-01T00:00:00.000Z",
    is_new_launch: true,
    is_best_seller: false,
  },
  {
    id: 2,
    name: "Atlas Pro",
    description: "Best seller phone",
    price: 1299,
    stockQuantity: 8,
    sectionId: 1,
    sectionName: "Smartphones",
    imageUrl: "https://cdn.example.com/atlas-pro.png",
    createdAt: "2026-01-02T00:00:00.000Z",
    is_new_launch: false,
    is_best_seller: true,
  },
  {
    id: 3,
    name: "Core Lite",
    description: "Everyday phone",
    price: 699,
    stockQuantity: 20,
    sectionId: 1,
    sectionName: "Smartphones",
    imageUrl: "https://cdn.example.com/core-lite.png",
    createdAt: "2026-01-03T00:00:00.000Z",
    is_new_launch: false,
    is_best_seller: false,
  },
];

const LocationProbe = () => {
  const location = useLocation();

  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
};

const renderProductsPage = (initialEntry = "/products?filter=new") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/products"
          element={
            <>
              <Products />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe("Products", () => {
  beforeEach(() => {
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({
      products,
      sections,
    });
  });

  it("keeps the visible filter tab and results in sync with the URL query", () => {
    renderProductsPage();

    const newLaunchesTab = screen.getByRole("button", { name: "New Launches" });
    const bestSellersTab = screen.getByRole("button", { name: "Best Sellers" });

    expect(newLaunchesTab).toHaveClass("bg-accent");
    expect(bestSellersTab).not.toHaveClass("bg-accent");
    expect(screen.getByText("Nova X")).toBeInTheDocument();
    expect(screen.queryByText("Atlas Pro")).not.toBeInTheDocument();
    expect(screen.queryByText("Core Lite")).not.toBeInTheDocument();

    fireEvent.click(bestSellersTab);

    expect(screen.getByTestId("location")).toHaveTextContent("/products?filter=best");
    expect(bestSellersTab).toHaveClass("bg-accent");
    expect(newLaunchesTab).not.toHaveClass("bg-accent");
    expect(screen.getByText("Atlas Pro")).toBeInTheDocument();
    expect(screen.queryByText("Nova X")).not.toBeInTheDocument();
    expect(screen.queryByText("Core Lite")).not.toBeInTheDocument();
  });
});
