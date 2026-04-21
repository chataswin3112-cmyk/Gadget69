import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminOrders from "@/pages/admin/AdminOrders";

const {
  mockArchiveAdminOrder,
  mockCancelAdminOrder,
  mockDeleteAdminOrder,
  mockEnsureProductsLoaded,
  mockGetAdminOrderById,
  mockGetAdminOrders,
  mockToast,
  mockUpdateAdminOrderStatus,
  mockUseAdminData,
} = vi.hoisted(() => ({
  mockArchiveAdminOrder: vi.fn(),
  mockCancelAdminOrder: vi.fn(),
  mockDeleteAdminOrder: vi.fn(),
  mockEnsureProductsLoaded: vi.fn(),
  mockGetAdminOrderById: vi.fn(),
  mockGetAdminOrders: vi.fn(),
  mockToast: vi.fn(),
  mockUpdateAdminOrderStatus: vi.fn(),
  mockUseAdminData: vi.fn(),
}));

vi.mock("@/api/orderApi", () => ({
  getAdminOrders: mockGetAdminOrders,
  getAdminOrderById: mockGetAdminOrderById,
  updateAdminOrderStatus: mockUpdateAdminOrderStatus,
  cancelAdminOrder: mockCancelAdminOrder,
  archiveAdminOrder: mockArchiveAdminOrder,
  deleteAdminOrder: mockDeleteAdminOrder,
}));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: mockToast,
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const setDocumentVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
};

describe("AdminOrders", () => {
  beforeEach(() => {
    mockArchiveAdminOrder.mockReset();
    mockCancelAdminOrder.mockReset();
    mockDeleteAdminOrder.mockReset();
    mockEnsureProductsLoaded.mockReset();
    mockGetAdminOrderById.mockReset();
    mockGetAdminOrders.mockReset();
    mockToast.mockReset();
    mockUpdateAdminOrderStatus.mockReset();
    mockUseAdminData.mockReset();
    setDocumentVisibility("visible");
    mockUseAdminData.mockReturnValue({
      products: [
        {
          id: 1,
          name: "A very long gadget name that should stay neatly clamped in the admin table layout",
          imageUrl: "https://example.com/alpha.png",
          sectionName: "Phones",
          model_number: "ZX-100",
        },
        {
          id: 2,
          name: "Delivery Speaker",
          imageUrl: "https://example.com/beta.png",
          sectionName: "Audio",
          model_number: "SP-20",
        },
      ],
      ensureProductsLoaded: mockEnsureProductsLoaded,
    });
  });

  it("renders a clean empty state without showing the server error banner", async () => {
    mockGetAdminOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    expect(
      await screen.findByText("No orders match the current tab and filters.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Unexpected server error")).not.toBeInTheDocument();
    expect(mockEnsureProductsLoaded).toHaveBeenCalledTimes(1);
  });

  it("auto-refreshes the order list every 30 seconds", async () => {
    const intervalCallbacks: Array<() => void | Promise<void>> = [];
    const setIntervalSpy = vi
      .spyOn(window, "setInterval")
      .mockImplementation(((callback: TimerHandler) => {
        intervalCallbacks.push(callback as () => void | Promise<void>);
        return 1 as unknown as number;
      }) as typeof window.setInterval);
    const clearIntervalSpy = vi.spyOn(window, "clearInterval").mockImplementation(() => {});

    mockGetAdminOrders
      .mockResolvedValueOnce([
        {
          id: 1,
          customerName: "Asha",
          phone: "9999999999",
          email: "asha@example.com",
          address: "Street 1",
          pincode: "600001",
          totalAmount: 1000,
          paymentStatus: "PENDING",
          orderStatus: "PENDING",
          createdAt: "2026-04-10T10:00:00",
          items: [{ productId: 1, productName: "Alpha", quantity: 1, price: 1000 }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 2,
          customerName: "Bala",
          phone: "8888888888",
          email: "bala@example.com",
          address: "Street 2",
          pincode: "600002",
          totalAmount: 2000,
          paymentStatus: "SUCCESS",
          orderStatus: "CONFIRMED",
          createdAt: "2026-04-10T10:05:00",
          items: [{ productId: 2, productName: "Beta", quantity: 2, price: 1000 }],
        },
      ]);

    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    expect(await screen.findByText("Order #1")).toBeInTheDocument();

    await act(async () => {
      await intervalCallbacks[0]?.();
    });

    await waitFor(() => expect(mockGetAdminOrders).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Order #2")).toBeInTheDocument();

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it("pauses background polling while the page is hidden and refreshes when visible again", async () => {
    const intervalCallbacks: Array<() => void | Promise<void>> = [];
    const setIntervalSpy = vi
      .spyOn(window, "setInterval")
      .mockImplementation(((callback: TimerHandler) => {
        intervalCallbacks.push(callback as () => void | Promise<void>);
        return 1 as unknown as number;
      }) as typeof window.setInterval);
    const clearIntervalSpy = vi.spyOn(window, "clearInterval").mockImplementation(() => {});

    mockGetAdminOrders.mockResolvedValue([
      {
        id: 18,
        customerName: "Dev",
        phone: "9000000001",
        email: "dev@example.com",
        address: "Main Street",
        pincode: "600010",
        totalAmount: 1200,
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
        createdAt: "2026-04-10T10:00:00",
        items: [{ productId: 1, productName: "Alpha", quantity: 1, price: 1200 }],
      },
    ]);

    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    expect(await screen.findByText("Order #18")).toBeInTheDocument();
    expect(mockGetAdminOrders).toHaveBeenCalledTimes(1);

    setDocumentVisibility("hidden");
    await act(async () => {
      await intervalCallbacks[0]?.();
    });

    expect(mockGetAdminOrders).toHaveBeenCalledTimes(1);

    setDocumentVisibility("visible");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => expect(mockGetAdminOrders).toHaveBeenCalledTimes(2));

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it("renders state-toned tabs, cards, badges, and clamped product names", async () => {
    mockGetAdminOrders.mockResolvedValue([
      {
        id: 41,
        customerName: "Kavin",
        phone: "9000000000",
        email: "kavin@example.com",
        address: "Market Road",
        pincode: "641001",
        totalAmount: 4599,
        paymentStatus: "FAILED",
        orderStatus: "CANCELLED",
        createdAt: "2026-04-12T09:30:00",
        items: [
          {
            productId: 1,
            productName:
              "A very long gadget name that should stay neatly clamped in the admin table layout",
            quantity: 1,
            price: 4599,
          },
        ],
      },
    ]);

    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    expect(await screen.findByText("Order #41")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Failed Orders" })).toHaveAttribute(
      "data-tone",
      "failed"
    );
    expect(screen.getByTestId("order-summary-failed")).toHaveAttribute("data-tone", "failed");
    expect(screen.getByText("FAILED", { selector: "span" })).toHaveAttribute(
      "data-tone",
      "failed"
    );
    expect(screen.getByText("CANCELLED", { selector: "span" })).toHaveAttribute(
      "data-tone",
      "failed"
    );

    const longName = screen.getByText(
      "A very long gadget name that should stay neatly clamped in the admin table layout"
    );
    expect(longName).toHaveAttribute("data-clamp", "2");
    expect(screen.getByAltText(longName.textContent || "")).toBeInTheDocument();
  });

  it("keeps rendering orders while product metadata loads later", async () => {
    let currentProducts: Array<Record<string, unknown>> = [];
    mockUseAdminData.mockImplementation(() => ({
      products: currentProducts,
      ensureProductsLoaded: mockEnsureProductsLoaded,
    }));
    mockGetAdminOrders.mockResolvedValue([
      {
        id: 91,
        customerName: "Later Meta",
        phone: "9222222222",
        email: "later@example.com",
        address: "Lake View",
        pincode: "600090",
        totalAmount: 5400,
        paymentStatus: "SUCCESS",
        orderStatus: "CONFIRMED",
        createdAt: "2026-04-12T09:30:00",
        items: [
          {
            productId: 1,
            productName: "Alpha Phone",
            quantity: 1,
            price: 5400,
          },
        ],
      },
    ]);

    const view = render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    expect(await screen.findByText("Order #91")).toBeInTheDocument();
    expect(screen.getByText("Catalog item")).toBeInTheDocument();

    currentProducts = [{
      id: 1,
      name: "Alpha Phone",
      imageUrl: "https://example.com/alpha.png",
      sectionName: "Phones",
      model_number: "ZX-100",
    }];
    view.rerender(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    expect(await screen.findByText("Phones - ZX-100")).toBeInTheDocument();
    expect(screen.getByAltText("Alpha Phone")).toBeInTheDocument();
  });

  it("shows aligned multi-item cards in the order details dialog", async () => {
    mockGetAdminOrders.mockResolvedValue([
      {
        id: 52,
        customerName: "Meera",
        phone: "9888888888",
        email: "meera@example.com",
        address: "River Street",
        pincode: "600028",
        totalAmount: 8998,
        paymentStatus: "SUCCESS",
        orderStatus: "SHIPPED",
        createdAt: "2026-04-12T09:30:00",
        items: [
          { productId: 1, productName: "Alpha", quantity: 1, price: 4599 },
          { productId: 2, productName: "Delivery Speaker", quantity: 1, price: 4399 },
        ],
      },
    ]);
    mockGetAdminOrderById.mockResolvedValue({
      id: 52,
      customerName: "Meera",
      phone: "9888888888",
      email: "meera@example.com",
      address: "River Street",
      pincode: "600028",
      totalAmount: 8998,
      paymentStatus: "SUCCESS",
      orderStatus: "SHIPPED",
      createdAt: "2026-04-12T09:30:00",
      updatedAt: "2026-04-12T10:10:00",
      items: [
        { productId: 1, productName: "Alpha", quantity: 1, price: 4599 },
        { productId: 2, productName: "Delivery Speaker", quantity: 1, price: 4399 },
      ],
    });

    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    expect(await screen.findByText("Order #52")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /view/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Order #52")).toBeInTheDocument();
    expect(within(dialog).getByText("Delivery")).toBeInTheDocument();
    expect(within(dialog).getAllByText("Qty 1")).toHaveLength(2);
    expect(within(dialog).getByText("SUCCESS", { selector: "p" })).toHaveAttribute(
      "data-tone",
      "success"
    );
    expect(within(dialog).getByText("SHIPPED", { selector: "p" })).toHaveAttribute(
      "data-tone",
      "delivery"
    );

    const itemsHeading = within(dialog).getByText("Items");
    const itemsSection = itemsHeading.closest("div");
    expect(itemsSection).not.toBeNull();
    if (itemsSection) {
      expect(within(itemsSection).getByText("Delivery Speaker")).toHaveAttribute("data-clamp", "2");
    }
  });

  it("keeps delete clickable for paid orders and shows the not-allowed toast", async () => {
    mockGetAdminOrders.mockResolvedValue([
      {
        id: 77,
        customerName: "Ishaan",
        phone: "9111111111",
        email: "ishaan@example.com",
        address: "Harbour Road",
        pincode: "600040",
        totalAmount: 6199,
        paymentStatus: "SUCCESS",
        orderStatus: "CONFIRMED",
        createdAt: "2026-04-12T09:30:00",
        items: [{ productId: 1, productName: "Alpha", quantity: 1, price: 6199 }],
      },
    ]);

    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    expect(await screen.findByText("Order #77")).toBeInTheDocument();
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    expect(deleteButton).toBeEnabled();

    fireEvent.click(deleteButton);

    expect(mockDeleteAdminOrder).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Delete not allowed",
      })
    );
  });
});
