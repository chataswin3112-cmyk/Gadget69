import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminMedia from "@/pages/admin/AdminMedia";

const {
  mockAddCommunityMedia,
  mockDeleteCommunityMedia,
  mockEnsureCommunityMediaLoaded,
  mockUpdateCommunityMedia,
  mockUseAdminData,
  mockToast,
} = vi.hoisted(() => ({
  mockAddCommunityMedia: vi.fn(),
  mockDeleteCommunityMedia: vi.fn(),
  mockEnsureCommunityMediaLoaded: vi.fn(),
  mockUpdateCommunityMedia: vi.fn(),
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

vi.mock("@/components/admin/CloudinaryVideoUploadField", () => ({
  default: ({ onChange }: { onChange: (patch: Record<string, string>) => void }) => (
    <button type="button" onClick={() => onChange({ videoUrl: "/video.mp4", thumbnailUrl: "/placeholder.svg" })}>
      Upload Community Video
    </button>
  ),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

describe("AdminMedia", () => {
  beforeEach(() => {
    mockAddCommunityMedia.mockReset();
    mockDeleteCommunityMedia.mockReset();
    mockEnsureCommunityMediaLoaded.mockReset();
    mockToast.error.mockReset();
    mockToast.success.mockReset();
    mockUpdateCommunityMedia.mockReset();
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({
      communityMedia: [
        {
          id: 1,
          title: "Store Reel",
          caption: "Behind the scenes",
          mediaType: "IMAGE",
          imageUrl: "/placeholder.svg",
          thumbnailUrl: "/placeholder.svg",
          displayOrder: 0,
          isActive: true,
        },
      ],
      addCommunityMedia: mockAddCommunityMedia,
      updateCommunityMedia: mockUpdateCommunityMedia,
      deleteCommunityMedia: mockDeleteCommunityMedia,
      ensureCommunityMediaLoaded: mockEnsureCommunityMediaLoaded,
    });
  });

  it("creates a media item from the add dialog", async () => {
    mockAddCommunityMedia.mockResolvedValue({ id: 2, title: "Launch Reel" });

    render(
      <MemoryRouter>
        <AdminMedia />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockEnsureCommunityMediaLoaded).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: /add media/i }));

    const dialog = await screen.findByRole("dialog");
    const textboxes = within(dialog).getAllByRole("textbox");

    fireEvent.change(textboxes[0], { target: { value: "Launch Reel" } });
    fireEvent.change(textboxes[1], { target: { value: "Fast cuts and product details" } });
    fireEvent.change(screen.getByLabelText("Image"), { target: { value: "/placeholder.svg" } });
    fireEvent.change(screen.getByLabelText("Thumbnail"), { target: { value: "/placeholder.svg" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockAddCommunityMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Launch Reel",
          caption: "Fast cuts and product details",
          imageUrl: "/placeholder.svg",
          thumbnailUrl: "/placeholder.svg",
        })
      )
    );
  });

  it("confirms delete from an existing media card", async () => {
    mockDeleteCommunityMedia.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <AdminMedia />
      </MemoryRouter>
    );

    const card = screen.getByText("Store Reel").closest("div.rounded-xl");
    expect(card).not.toBeNull();

    const buttons = card ? within(card).getAllByRole("button") : [];
    fireEvent.click(buttons[buttons.length - 1]);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(mockDeleteCommunityMedia).toHaveBeenCalledWith(1));
  });
});
