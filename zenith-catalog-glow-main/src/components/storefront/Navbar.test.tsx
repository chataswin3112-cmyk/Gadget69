import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "@/components/storefront/Navbar";
import { CartProvider } from "@/contexts/CartContext";

const { mockUseAdminData } = vi.hoisted(() => ({
  mockUseAdminData: vi.fn(),
}));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

describe("Navbar", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({ products: [], isLoading: false });
  });

  it("renders the fixed Gadget 69 lockup and core controls", () => {
    render(
      <MemoryRouter>
        <CartProvider>
          <Navbar />
        </CartProvider>
      </MemoryRouter>
    );

    const homeLink = screen.getByRole("link", { name: /gadget 69 home/i });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(screen.getByRole("img", { name: /gadget 69/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/open cart/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/open menu/i)).toBeInTheDocument();
  });

  it("toggles the mobile menu links from the hamburger control", () => {
    render(
      <MemoryRouter>
        <CartProvider>
          <Navbar />
        </CartProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByRole("link", { name: "Categories" })).toHaveLength(1);
    fireEvent.click(screen.getByLabelText(/open menu/i));

    expect(screen.getByLabelText(/close menu/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Categories" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Track Order" })).toHaveLength(2);
  });
});
