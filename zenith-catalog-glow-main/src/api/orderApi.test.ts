import apiClient from "@/api/client";
import { getAdminOrders } from "@/api/orderApi";

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("orderApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unwraps admin orders response items from the backend payload", async () => {
    const filters = { paymentStatus: "SUCCESS", orderStatus: "CONFIRMED" };
    const items = [
      {
        id: 225,
        customerName: "chat Aswin",
        phone: "8825602356",
        email: "chataswin3112@gmail.com",
        address: "2nd Street",
        pincode: "628003",
        totalAmount: 134999,
        paymentStatus: "PENDING",
        orderStatus: "OUT_FOR_DELIVERY",
        items: [
          {
            productId: 2,
            productName: "Gadget Book Air",
            quantity: 1,
            price: 134999,
          },
        ],
      },
    ];

    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        items,
        total: items.length,
        appliedFilters: {
          paymentStatus: "SUCCESS",
          orderStatus: "CONFIRMED",
          fromDate: null,
          toDate: null,
        },
      },
    });

    await expect(getAdminOrders(filters)).resolves.toEqual(items);
    expect(apiClient.get).toHaveBeenCalledWith("/admin/orders", { params: filters });
  });
});
