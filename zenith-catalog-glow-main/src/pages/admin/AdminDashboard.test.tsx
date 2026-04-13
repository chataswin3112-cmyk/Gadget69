import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "@/pages/admin/AdminDashboard";

const { mockGetDashboardStats } = vi.hoisted(() => ({
  mockGetDashboardStats: vi.fn(),
}));

vi.mock("@/api/adminApi", () => ({
  getDashboardStats: mockGetDashboardStats,
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AdminDashboard", () => {
  beforeEach(() => {
    mockGetDashboardStats.mockReset();
  });

  it("renders API-driven analytics and top-selling products", async () => {
    mockGetDashboardStats.mockResolvedValue({
      totalOrders: 12,
      paidOrders: 9,
      totalRevenue: 540000,
      conversionRate: 75,
      totalProducts: 28,
      totalSections: 6,
      totalBanners: 2,
      totalCommunityMedia: 4,
      topSellingProducts: [
        { productId: 1, productName: "Atlas Pro", unitsSold: 14, revenue: 210000 },
      ],
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockGetDashboardStats).toHaveBeenCalled());
    expect(screen.getByText("Paid Orders")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("75.00%")).toBeInTheDocument();
    expect(screen.getByText("Atlas Pro")).toBeInTheDocument();
    expect(screen.getByText("14 sold")).toBeInTheDocument();
  });

  it("falls back to zero values when sparse dashboard analytics are returned", async () => {
    mockGetDashboardStats.mockResolvedValue({
      totalOrders: 2,
      totalRevenue: 264998,
      totalProducts: 3,
      totalSections: 3,
      totalBanners: 2,
      totalCommunityMedia: 3,
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockGetDashboardStats).toHaveBeenCalled());
    expect(screen.getByText("Paid Orders")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("0.00%")).toBeInTheDocument();
    expect(
      screen.getByText("No paid orders yet, so top-selling products will appear here once sales start coming in.")
    ).toBeInTheDocument();
  });
});
