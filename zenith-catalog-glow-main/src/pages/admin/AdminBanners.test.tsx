import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminBanners from "@/pages/admin/AdminBanners";

const {
  mockAddBanner,
  mockDeleteBanner,
  mockEnsureBannersLoaded,
  mockUpdateBanner,
  mockUseAdminData,
  mockToast,
} = vi.hoisted(() => ({
  mockAddBanner: vi.fn(),
  mockDeleteBanner: vi.fn(),
  mockEnsureBannersLoaded: vi.fn(),
  mockUpdateBanner: vi.fn(),
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

describe("AdminBanners", () => {
  beforeEach(() => {
    mockAddBanner.mockReset();
    mockDeleteBanner.mockReset();
    mockEnsureBannersLoaded.mockReset();
    mockToast.error.mockReset();
    mockToast.success.mockReset();
    mockUpdateBanner.mockReset();
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({
      banners: [
        {
          id: 1,
          title: "Summer Sale",
          desktopImageUrl: "/placeholder.svg",
          mobileImageUrl: "/placeholder.svg",
          ctaText: "Shop Now",
          ctaLink: "/products",
          displayOrder: 0,
          isActive: true,
        },
      ],
      addBanner: mockAddBanner,
      updateBanner: mockUpdateBanner,
      deleteBanner: mockDeleteBanner,
      ensureBannersLoaded: mockEnsureBannersLoaded,
    });
  });

  it("creates a banner through the editor dialog", async () => {
    mockAddBanner.mockResolvedValue({ id: 2, title: "Launch Week" });

    render(
      <MemoryRouter>
        <AdminBanners />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockEnsureBannersLoaded).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: /add banner/i }));

    const dialog = await screen.findByRole("dialog");
    const textboxes = within(dialog).getAllByRole("textbox");

    fireEvent.change(textboxes[0], { target: { value: "Launch Week" } });
    fireEvent.change(screen.getByLabelText("Desktop Banner"), { target: { value: "/placeholder.svg" } });
    fireEvent.change(screen.getByLabelText("Mobile Banner"), { target: { value: "/placeholder.svg" } });
    fireEvent.change(textboxes[3], { target: { value: "Explore" } });
    fireEvent.change(textboxes[4], { target: { value: "/products" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockAddBanner).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Launch Week",
          desktopImageUrl: "/placeholder.svg",
          mobileImageUrl: "/placeholder.svg",
          ctaText: "Explore",
          ctaLink: "/products",
        })
      )
    );
  });

  it("opens delete confirmation from a banner card", async () => {
    mockDeleteBanner.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <AdminBanners />
      </MemoryRouter>
    );

    const card = screen.getByText("Summer Sale").closest("div.rounded-xl");
    expect(card).not.toBeNull();

    const buttons = card ? within(card).getAllByRole("button") : [];
    fireEvent.click(buttons[buttons.length - 1]);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(mockDeleteBanner).toHaveBeenCalledWith(1));
  });
});
