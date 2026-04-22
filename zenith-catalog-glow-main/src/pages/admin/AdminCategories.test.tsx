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
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));

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
});
