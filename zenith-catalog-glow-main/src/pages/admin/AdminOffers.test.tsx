import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminOffers from "@/pages/admin/AdminOffers";

const today = new Date();
const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const { mockUseAdminData } = vi.hoisted(() => ({
  mockUseAdminData: vi.fn(),
}));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AdminOffers", () => {
  beforeEach(() => {
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({
      products: [
        {
          id: 1,
          name: "Active Phone",
          description: "Active offer",
          price: 1000,
          stockQuantity: 10,
          sectionId: 1,
          sectionName: "Phones",
          imageUrl: "https://example.com/a.png",
          createdAt: "2026-01-01T00:00:00.000Z",
          offer: true,
          offerPrice: 900,
          offerStartDate: toDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)),
          offerEndDate: toDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)),
        },
        {
          id: 2,
          name: "Upcoming Phone",
          description: "Upcoming offer",
          price: 1200,
          stockQuantity: 10,
          sectionId: 1,
          sectionName: "Phones",
          imageUrl: "https://example.com/b.png",
          createdAt: "2026-01-01T00:00:00.000Z",
          offer: true,
          offerPrice: 950,
          offerStartDate: toDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)),
          offerEndDate: toDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4)),
        },
        {
          id: 3,
          name: "Expired Phone",
          description: "Expired offer",
          price: 1300,
          stockQuantity: 10,
          sectionId: 1,
          sectionName: "Phones",
          imageUrl: "https://example.com/c.png",
          createdAt: "2026-01-01T00:00:00.000Z",
          offer: true,
          offerPrice: 1000,
          offerStartDate: toDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5)),
          offerEndDate: toDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)),
        },
        {
          id: 4,
          name: "No Offer Phone",
          description: "No offer",
          price: 1400,
          stockQuantity: 10,
          sectionId: 1,
          sectionName: "Phones",
          imageUrl: "https://example.com/d.png",
          createdAt: "2026-01-01T00:00:00.000Z",
          offer: false,
        },
      ],
      updateProduct: vi.fn(),
      isLoading: false,
    });
  });

  it("shows active, upcoming, expired, and no-offer status chips", () => {
    render(
      <MemoryRouter>
        <AdminOffers />
      </MemoryRouter>
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("No Offer")).toBeInTheDocument();
  });
});
