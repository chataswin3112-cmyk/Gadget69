import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Checkout from "@/pages/Checkout";

const { mockCreateOrder, mockVerifyPayment, mockUseCart, mockToast } = vi.hoisted(() => ({
  mockCreateOrder: vi.fn(),
  mockVerifyPayment: vi.fn(),
  mockUseCart: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock("@/api/orderApi", () => ({
  createOrder: mockCreateOrder,
  verifyPayment: mockVerifyPayment,
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: mockUseCart,
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: mockToast,
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
  default: () => <div data-testid="floating-actions" />,
}));

describe("Checkout", () => {
  beforeEach(() => {
    mockCreateOrder.mockReset();
    mockVerifyPayment.mockReset();
    mockToast.mockReset();
    mockUseCart.mockReset();

    mockUseCart.mockReturnValue({
      items: [
        {
          product: {
            id: 11,
            name: "Smart Speaker",
            description: "Voice-enabled speaker",
            price: 2999,
            stockQuantity: 10,
            sectionId: 1,
            imageUrl: "https://cdn.example.com/speaker.png",
            createdAt: "2026-04-10T09:00:00",
            offer: false,
          },
          quantity: 1,
        },
      ],
      totalAmount: 2999,
      totalItems: 1,
      clearCart: vi.fn(),
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      updateQuantity: vi.fn(),
    });

    mockCreateOrder.mockResolvedValue({
      id: 42,
      customerName: "Hari",
      phone: "9876543210",
      address: "12 Main Street",
      pincode: "600001",
      totalAmount: 2999,
      paymentStatus: "PENDING",
      razorpayOrderId: "order_test_42",
      razorpayKeyId: "rzp_test_123",
      currency: "INR",
      amountPaise: 299900,
      items: [],
    });

    delete window.Razorpay;
  });

  it("opens Razorpay with the fixed Gadget 69 brand name and backend order values", async () => {
    const open = vi.fn();
    const on = vi.fn();
    const razorpayConstructor = vi.fn().mockImplementation(() => ({
      open,
      on,
    }));

    window.Razorpay = razorpayConstructor as unknown as typeof window.Razorpay;

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Hari" },
    });
    fireEvent.change(screen.getByPlaceholderText("+91 98765 43210"), {
      target: { value: "9876543210" },
    });
    fireEvent.change(screen.getByPlaceholderText("Street address, apartment, city, state"), {
      target: { value: "12 Main Street" },
    });
    fireEvent.change(screen.getByPlaceholderText("560001"), {
      target: { value: "600001" },
    });

    fireEvent.click(screen.getByRole("button", { name: /pay securely/i }));

    await waitFor(() => expect(mockCreateOrder).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(razorpayConstructor).toHaveBeenCalledTimes(1));

    const options = razorpayConstructor.mock.calls[0][0];
    expect(options.key).toBe("rzp_test_123");
    expect(options.order_id).toBe("order_test_42");
    expect(options.name).toBe("Gadget 69");
    expect(on).toHaveBeenCalledWith("payment.failed", expect.any(Function));
    expect(open).toHaveBeenCalledTimes(1);
  });
});
