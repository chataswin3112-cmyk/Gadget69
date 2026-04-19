import { render, screen } from "@testing-library/react";
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
});
