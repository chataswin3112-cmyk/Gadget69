import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminProducts from "@/pages/admin/AdminProducts";

const {
  mockAddProduct,
  mockDeleteProduct,
  mockEnsureProductsLoaded,
  mockEnsureSectionsLoaded,
  mockUpdateProduct,
  mockUseAdminData,
  mockToast,
} = vi.hoisted(() => ({
  mockAddProduct: vi.fn(),
  mockDeleteProduct: vi.fn(),
  mockEnsureProductsLoaded: vi.fn(),
  mockEnsureSectionsLoaded: vi.fn(),
  mockUpdateProduct: vi.fn(),
  mockUseAdminData: vi.fn(),
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/admin/ProductMediaManager", () => ({
  default: () => <div>Media manager stub</div>,
}));

vi.mock("@/components/admin/AdminVariantPanel", () => ({
  default: ({ productId }: { productId: number }) => <div>Variants for {productId}</div>,
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

const baseSections = [
  { id: 1, name: "Phones" },
  { id: 2, name: "Audio" },
];

const baseProducts = [
  {
    id: 7,
    name: "Atlas Pro",
    description: "Flagship phone",
    price: 79999,
    stockQuantity: 4,
    sectionId: 1,
    sectionName: "Phones",
    imageUrl: "/placeholder.svg",
    media: [{ id: 10, mediaUrl: "/placeholder.svg", mediaType: "IMAGE", mediaRole: "MAIN", isPrimary: true }],
    model_number: "ATL-01",
    createdAt: "2026-04-10T10:00:00.000Z",
    status: "ACTIVE",
    specifications: { Display: "6.7 inch" },
    variants: [{ id: 21 }],
  },
];

describe("AdminProducts", () => {
  beforeEach(() => {
    mockAddProduct.mockReset();
    mockDeleteProduct.mockReset();
    mockEnsureProductsLoaded.mockReset();
    mockEnsureSectionsLoaded.mockReset();
    mockToast.error.mockReset();
    mockToast.success.mockReset();
    mockUpdateProduct.mockReset();
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({
      products: baseProducts,
      sections: baseSections,
      addProduct: mockAddProduct,
      updateProduct: mockUpdateProduct,
      deleteProduct: mockDeleteProduct,
      isLoading: false,
      ensureProductsLoaded: mockEnsureProductsLoaded,
      ensureSectionsLoaded: mockEnsureSectionsLoaded,
    });
  });

  it("creates a product from the details tab", async () => {
    mockAddProduct.mockResolvedValue({
      ...baseProducts[0],
      id: 8,
      name: "Nova Pad",
      variants: [],
    });

    render(
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(mockEnsureProductsLoaded).toHaveBeenCalledTimes(1)
    );
    expect(mockEnsureSectionsLoaded).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /add product/i }));
    const dialog = await screen.findByRole("dialog");
    const textboxes = within(dialog).getAllByRole("textbox");
    const spinbuttons = within(dialog).getAllByRole("spinbutton");

    fireEvent.change(textboxes[0], { target: { value: "Nova Pad" } });
    fireEvent.change(spinbuttons[0], { target: { value: "45999" } });
    fireEvent.change(spinbuttons[2], { target: { value: "9" } });
    fireEvent.change(textboxes[2], { target: { value: "Tablet for everyday use" } });
    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    await waitFor(() =>
      expect(mockAddProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Nova Pad",
          price: 45999,
          stockQuantity: 9,
          description: "Tablet for everyday use",
        })
      )
    );
  });

  it("opens the editor tabs for an existing product and allows delete confirmation", async () => {
    mockDeleteProduct.mockResolvedValue(undefined);

    const { container } = render(
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/search products/i), { target: { value: "Atlas" } });
    expect(screen.getByText("Atlas Pro")).toBeInTheDocument();

    const row = screen.getByText("Atlas Pro").closest("tr");
    expect(row).not.toBeNull();

    const rowButtons = row ? within(row).getAllByRole("button") : [];
    fireEvent.click(rowButtons[0]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Edit Atlas Pro")).toBeInTheDocument();

    fireEvent.mouseDown(within(dialog).getByRole("tab", { name: "Media" }));
    expect(await screen.findByText("Media manager stub")).toBeInTheDocument();
    fireEvent.mouseDown(within(dialog).getByRole("tab", { name: "Variants" }));
    expect(await screen.findByText("Variants for 7")).toBeInTheDocument();

    fireEvent.click(rowButtons[rowButtons.length - 1]);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(mockDeleteProduct).toHaveBeenCalledWith(7));
    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("normalizes mixed specification values before updating a product", async () => {
    mockUseAdminData.mockReturnValue({
      products: [
        {
          ...baseProducts[0],
          specifications: {
            Display: "6.7 inch",
            Weight: 210,
            "Wireless Charging": true,
            Battery: { value: 5000, unit: "mAh" },
          },
        },
      ],
      sections: baseSections,
      addProduct: mockAddProduct,
      updateProduct: mockUpdateProduct,
      deleteProduct: mockDeleteProduct,
      isLoading: false,
      ensureProductsLoaded: mockEnsureProductsLoaded,
      ensureSectionsLoaded: mockEnsureSectionsLoaded,
    });
    mockUpdateProduct.mockResolvedValue(baseProducts[0]);

    render(
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
    );

    const row = screen.getByText("Atlas Pro").closest("tr");
    expect(row).not.toBeNull();
    const rowButtons = row ? within(row).getAllByRole("button") : [];
    fireEvent.click(rowButtons[0]);

    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(mockUpdateProduct).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          specifications: {
            Display: "6.7 inch",
            Weight: "210",
            "Wireless Charging": "true",
            Battery: "{\"value\":5000,\"unit\":\"mAh\"}",
          },
        })
      )
    );
  });
});
