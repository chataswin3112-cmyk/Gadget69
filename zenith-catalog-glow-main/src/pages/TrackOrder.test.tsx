import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TrackOrder from "@/pages/TrackOrder";

const { mockGetOrderById, mockToast } = vi.hoisted(() => ({
  mockGetOrderById: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock("@/api/orderApi", () => ({
  getOrderById: mockGetOrderById,
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

describe("TrackOrder", () => {
  beforeEach(() => {
    mockGetOrderById.mockReset();
    mockToast.mockReset();
  });

  it("requires an order id and phone number before calling the API", () => {
    render(<TrackOrder />);

    fireEvent.click(screen.getByRole("button", { name: "Track Order" }));

    expect(mockToast).toHaveBeenCalledWith({
      title: "Enter your order ID and phone number",
      variant: "destructive",
    });
    expect(mockGetOrderById).not.toHaveBeenCalled();
  });

  it("renders the tracked order details and delivery timeline after a successful lookup", async () => {
    mockGetOrderById.mockResolvedValue({
      id: 321,
      customerName: "Asha",
      phone: "9876543210",
      email: "asha@example.com",
      address: "12 Market Road",
      pincode: "600001",
      totalAmount: 74999,
      paymentStatus: "SUCCESS",
      orderStatus: "SHIPPED",
      items: [
        {
          productId: 1,
          productName: "Atlas Pro",
          variantColor: "Blue",
          variantSize: "128 GB",
          quantity: 1,
          price: 74999,
        },
        {
          productId: 2,
          productName: "Pulse Speaker",
          quantity: 1,
          price: 15999,
        },
      ],
    });

    render(<TrackOrder />);

    fireEvent.change(screen.getByPlaceholderText("12345"), {
      target: { value: "321" },
    });
    fireEvent.change(screen.getByPlaceholderText("+91 98765 43210"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Track Order" }));

    await waitFor(() => expect(mockGetOrderById).toHaveBeenCalledWith(321, "9876543210"));

    expect(await screen.findByText("#321")).toBeInTheDocument();
    expect(screen.getByText("Atlas Pro (Blue / 128 GB), Pulse Speaker")).toBeInTheDocument();
    expect(screen.getByText("Rs. 74,999")).toBeInTheDocument();
    expect(screen.getAllByText("SHIPPED")).not.toHaveLength(0);
    expect(screen.getByText("Your package has left our facility and is on the way.")).toBeInTheDocument();
  });

  it("shows the cancelled state and clears the tracked order when a later lookup fails", async () => {
    mockGetOrderById
      .mockResolvedValueOnce({
        id: 654,
        customerName: "Bala",
        phone: "9999999999",
        email: "bala@example.com",
        address: "42 Lake View",
        pincode: "600002",
        totalAmount: 19999,
        paymentStatus: "FAILED",
        orderStatus: "CANCELLED",
        items: [
          {
            productId: 5,
            productName: "Cancelled Tablet",
            quantity: 1,
            price: 19999,
          },
        ],
      })
      .mockRejectedValueOnce(new Error("Order not found"));

    render(<TrackOrder />);

    fireEvent.change(screen.getByPlaceholderText("12345"), {
      target: { value: "654" },
    });
    fireEvent.change(screen.getByPlaceholderText("+91 98765 43210"), {
      target: { value: "9999999999" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Track Order" }));

    expect(await screen.findByText("#654")).toBeInTheDocument();
    expect(screen.getByText(/This order was cancelled/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("12345"), {
      target: { value: "999" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Track Order" }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith({
        title: "Order not found",
        variant: "destructive",
      })
    );
    await waitFor(() => expect(screen.queryByText("#654")).not.toBeInTheDocument());
    expect(screen.queryByText(/This order was cancelled/i)).not.toBeInTheDocument();
  });
});
