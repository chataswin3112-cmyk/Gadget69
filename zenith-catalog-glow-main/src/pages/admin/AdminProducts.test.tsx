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
  { id: 1, name: "Phones", parentSectionId: null, sort_order: 1 },
  { id: 2, name: "Flagship Phones", parentSectionId: 1, parentSectionName: "Phones", sort_order: 1 },
  { id: 3, name: "Audio", parentSectionId: null, sort_order: 2 },
  { id: 4, name: "Earbuds", parentSectionId: 3, parentSectionName: "Audio", sort_order: 1 },
  { id: 5, name: "Wearables", parentSectionId: null, sort_order: 3 },
];

const baseProducts = [
  {
    id: 7,
    name: "Atlas Pro",
    description: "Flagship phone",
    price: 79999,
    stockQuantity: 4,
    sectionId: 2,
    sectionName: "Flagship Phones",
    parentSectionId: 1,
    parentSectionName: "Phones",
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
          sectionId: 2,
        })
      )
    );
  });

  it("shows live main categories and blocks saving until a subcategory is selected", async () => {
    render(
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /add product/i }));
    const dialog = await screen.findByRole("dialog");
    const categorySelect = within(dialog).getAllByRole("combobox")[0];

    fireEvent.keyDown(categorySelect, { key: "ArrowDown" });
    expect(await screen.findByRole("option", { name: "Wearables" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Wearables" }));

    expect(
      within(dialog).getByText(/add a subcategory under this category before saving a product/i)
    ).toBeInTheDocument();

    const textboxes = within(dialog).getAllByRole("textbox");
    const spinbuttons = within(dialog).getAllByRole("spinbutton");
    fireEvent.change(textboxes[0], { target: { value: "Nova Band" } });
    fireEvent.change(spinbuttons[0], { target: { value: "1999" } });
    fireEvent.change(textboxes[2], { target: { value: "Fitness band" } });
    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    expect(mockToast.error).toHaveBeenCalledWith("Select a subcategory before saving this product");
    expect(mockAddProduct).not.toHaveBeenCalled();
  });

  it("filters subcategories by selected main category when creating a product", async () => {
    mockAddProduct.mockResolvedValue({
      ...baseProducts[0],
      id: 8,
      name: "Nova Buds",
      sectionId: 4,
      sectionName: "Earbuds",
      parentSectionId: 3,
      parentSectionName: "Audio",
      variants: [],
    });

    render(
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /add product/i }));
    const dialog = await screen.findByRole("dialog");
    const [categorySelect, subcategorySelect] = within(dialog).getAllByRole("combobox");

    fireEvent.keyDown(categorySelect, { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name: "Audio" }));

    fireEvent.keyDown(subcategorySelect, { key: "ArrowDown" });
    expect(await screen.findByRole("option", { name: "Earbuds" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Flagship Phones" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Earbuds" }));

    const textboxes = within(dialog).getAllByRole("textbox");
    const spinbuttons = within(dialog).getAllByRole("spinbutton");
    fireEvent.change(textboxes[0], { target: { value: "Nova Buds" } });
    fireEvent.change(spinbuttons[0], { target: { value: "2999" } });
    fireEvent.change(textboxes[2], { target: { value: "Wireless earbuds" } });
    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    await waitFor(() =>
      expect(mockAddProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Nova Buds",
          sectionId: 4,
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
    expect(within(dialog).getByText("Phones")).toBeInTheDocument();
    expect(within(dialog).getByText("Flagship Phones")).toBeInTheDocument();

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
