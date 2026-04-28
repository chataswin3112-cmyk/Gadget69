import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminCategories from "@/pages/admin/AdminCategories";

const {
  mockAddSection,
  mockDeleteSection,
  mockEnsureSectionsLoaded,
  mockUpdateSection,
  mockUseAdminData,
  mockToast,
} = vi.hoisted(() => ({
  mockAddSection: vi.fn(),
  mockDeleteSection: vi.fn(),
  mockEnsureSectionsLoaded: vi.fn(),
  mockUpdateSection: vi.fn(),
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

vi.mock("@/components/admin/MediaUploadField", () => ({
  default: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: string;
    onChange: (value: string) => void;
  }) => (
    <label>
      <span>{label}</span>
      <input aria-label={label} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  ),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

describe("AdminCategories", () => {
  beforeEach(() => {
    mockAddSection.mockReset();
    mockDeleteSection.mockReset();
    mockEnsureSectionsLoaded.mockReset();
    mockToast.error.mockReset();
    mockToast.success.mockReset();
    mockUpdateSection.mockReset();
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({
      sections: [
        {
          id: 1,
          name: "Phones",
          description: "Flagship devices",
          imageUrl: "/placeholder.svg",
          is_active: true,
          show_in_explore: true,
          show_in_top_category: false,
          parentSectionId: null,
        },
      ],
      addSection: mockAddSection,
      updateSection: mockUpdateSection,
      deleteSection: mockDeleteSection,
      ensureSectionsLoaded: mockEnsureSectionsLoaded,
    });
  });

  it("loads categories and creates a new category from the dialog", async () => {
    mockAddSection.mockResolvedValue({ id: 2, name: "Speakers" });

    render(
      <MemoryRouter>
        <AdminCategories />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockEnsureSectionsLoaded).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: /add main category/i }));

    const dialog = await screen.findByRole("dialog");
    const textboxes = within(dialog).getAllByRole("textbox");
    const spinbutton = within(dialog).getByRole("spinbutton");

    fireEvent.change(textboxes[0], { target: { value: "Speakers" } });
    fireEvent.change(textboxes[1], { target: { value: "Wireless audio" } });
    fireEvent.change(screen.getByLabelText("Category Image"), { target: { value: "/placeholder.svg" } });
    fireEvent.change(spinbutton, { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockAddSection).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Speakers",
          description: "Wireless audio",
          imageUrl: "/placeholder.svg",
          sort_order: 4,
        })
      )
    );
  });

  it("opens the delete confirmation from the table row", async () => {
    mockDeleteSection.mockResolvedValue(undefined);

    const { container } = render(
      <MemoryRouter>
        <AdminCategories />
      </MemoryRouter>
    );

    const row = screen.getByText("Phones").closest("tr");
    expect(row).not.toBeNull();

    const rowButtons = row ? within(row).getAllByRole("button") : [];
    fireEvent.click(rowButtons[rowButtons.length - 1]);

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(mockDeleteSection).toHaveBeenCalledWith(1));
    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("creates a subcategory from the parent category subcategories panel", async () => {
    mockAddSection.mockResolvedValue({ id: 2, name: "Android", parentSectionId: 1 });

    render(
      <MemoryRouter>
        <AdminCategories />
      </MemoryRouter>
    );

    const row = screen.getByText("Phones").closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(
      within(row!).getByRole("button", {
        name: /view subcategories for phones, 0 subcategories/i,
      })
    );

    const panel = await screen.findByRole("dialog", { name: /subcategories - phones/i });
    expect(within(panel).getByText("Phones")).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole("button", { name: /add subcategory/i }));

    const dialog = await screen.findByRole("dialog", { name: /add subcategory under phones/i });
    const textboxes = within(dialog).getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Android" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockAddSection).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Android",
          parentSectionId: 1,
        })
      )
    );
  });

  it("edits and deletes subcategories from the subcategories panel", async () => {
    mockUpdateSection.mockResolvedValue({ id: 2, name: "Android Pro", parentSectionId: 1 });
    mockDeleteSection.mockResolvedValue(undefined);
    mockUseAdminData.mockReturnValue({
      sections: [
        {
          id: 1,
          name: "Phones",
          description: "Flagship devices",
          imageUrl: "/placeholder.svg",
          is_active: true,
          show_in_explore: true,
          show_in_top_category: false,
          parentSectionId: null,
        },
        {
          id: 2,
          name: "Android",
          description: "Android devices",
          imageUrl: "/placeholder.svg",
          is_active: true,
          show_in_explore: true,
          show_in_top_category: false,
          parentSectionId: 1,
          parentSectionName: "Phones",
        },
      ],
      addSection: mockAddSection,
      updateSection: mockUpdateSection,
      deleteSection: mockDeleteSection,
      ensureSectionsLoaded: mockEnsureSectionsLoaded,
    });

    render(
      <MemoryRouter>
        <AdminCategories />
      </MemoryRouter>
    );

    const table = screen.getByRole("table");
    expect(within(table).getByText("Phones")).toBeInTheDocument();
    expect(within(table).queryByText("Android")).not.toBeInTheDocument();

    const row = screen.getByText("1 subcategory").closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(
      within(row!).getByRole("button", {
        name: /view subcategories for phones, 1 subcategory/i,
      })
    );

    const panel = await screen.findByRole("dialog", { name: /subcategories - phones/i });
    expect(within(panel).getByText("Android")).toBeInTheDocument();

    fireEvent.click(within(panel).getByRole("button", { name: /^edit$/i }));
    const editDialog = await screen.findByRole("dialog", { name: /edit subcategory/i });
    fireEvent.change(within(editDialog).getAllByRole("textbox")[0], {
      target: { value: "Android Pro" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockUpdateSection).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          name: "Android Pro",
          parentSectionId: 1,
        })
      )
    );

    const reopenedPanel = await screen.findByRole("dialog", { name: /subcategories - phones/i });
    await waitFor(() => expect(reopenedPanel).toHaveAttribute("data-state", "open"));

    fireEvent.click(within(reopenedPanel).getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(mockDeleteSection).toHaveBeenCalledWith(2));
  });
});
