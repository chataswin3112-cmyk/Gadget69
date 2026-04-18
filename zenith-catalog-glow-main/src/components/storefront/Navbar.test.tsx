import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "@/components/storefront/Navbar";
import { CartProvider } from "@/contexts/CartContext";

describe("Navbar", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the fixed Gadget 69 lockup and core controls", () => {
    render(
      <MemoryRouter>
        <CartProvider>
          <Navbar />
        </CartProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Gadget 69")).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /gadget 69 home/i });
    expect(homeLink).toHaveAttribute("href", "/");

    expect(screen.getByLabelText(/open cart/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/open menu/i)).toBeInTheDocument();
  });
});
