import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminOrders from "@/pages/admin/AdminOrders";

const { mockGetOrders } = vi.hoisted(() => ({
  mockGetOrders: vi.fn(),
}));

vi.mock("@/api/orderApi", () => ({
  getOrders: mockGetOrders,
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AdminOrders", () => {
  beforeEach(() => {
    mockGetOrders.mockReset();
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

    mockGetOrders
      .mockResolvedValueOnce([
        {
          id: 1,
          customerName: "Asha",
          phone: "9999999999",
          address: "Street 1",
          pincode: "600001",
          totalAmount: 1000,
          paymentStatus: "PENDING",
          createdAt: "2026-04-10T10:00:00",
          items: [{ productId: 1, productName: "Alpha", quantity: 1, price: 1000 }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 2,
          customerName: "Bala",
          phone: "8888888888",
          address: "Street 2",
          pincode: "600002",
          totalAmount: 2000,
          paymentStatus: "PAID",
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

    await waitFor(() => expect(mockGetOrders).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Order #2")).toBeInTheDocument();

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});
