import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminSettings from "@/pages/admin/AdminSettings";

const { mockUseAdminData, mockChangePassword, mockToastSuccess, mockToastError } =
  vi.hoisted(() => ({
    mockUseAdminData: vi.fn(),
    mockChangePassword: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
  }));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

vi.mock("@/api/adminApi", () => ({
  changePassword: mockChangePassword,
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/admin/MediaUploadField", () => ({
  default: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

describe("AdminSettings", () => {
  const baseSettings = {
    id: 1,
    siteTitle: "Gadget69",
    announcementItems: [],
    whatsappNumber: "8825602356",
  };

  beforeEach(() => {
    mockChangePassword.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockUseAdminData.mockReturnValue({
      settings: baseSettings,
      ensureSettingsLoaded: vi.fn(),
      updateSettings: vi.fn(),
    });
  });

  it("keeps the saved WhatsApp number tied to admin reset delivery", () => {
    render(<AdminSettings />);

    expect(screen.getByDisplayValue("8825602356")).toBeInTheDocument();
    expect(
      screen.getByText("This saved number is also used for admin password-reset OTP delivery.")
    ).toBeInTheDocument();
  });

  it("saves store settings updates", async () => {
    const updateSettings = vi.fn().mockResolvedValue({
      ...baseSettings,
      announcementItems: ["Existing announcement", "New deal"],
    });
    mockUseAdminData.mockReturnValue({
      settings: {
        ...baseSettings,
        announcementItems: ["Existing announcement"],
      },
      ensureSettingsLoaded: vi.fn(),
      updateSettings,
    });

    render(<AdminSettings />);

    fireEvent.change(screen.getByPlaceholderText("New announcement..."), {
      target: { value: "  New deal  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add announcement" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() =>
      expect(updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          announcementItems: ["Existing announcement", "New deal"],
        })
      )
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Settings saved");
  });

  it("saves announcement add and remove when the catalogue URL has an old placeholder", async () => {
    const updateSettings = vi.fn().mockResolvedValue({
      ...baseSettings,
      catalogueUrl: undefined,
      announcementItems: ["Keep this", "Added deal"],
    });
    mockUseAdminData.mockReturnValue({
      settings: {
        ...baseSettings,
        catalogueUrl: "#",
        announcementItems: ["Keep this", "Remove this"],
      },
      ensureSettingsLoaded: vi.fn(),
      updateSettings,
    });

    render(<AdminSettings />);

    fireEvent.click(screen.getByRole("button", { name: "Remove announcement 2" }));
    fireEvent.change(screen.getByPlaceholderText("New announcement..."), {
      target: { value: "  Added deal  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add announcement" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() =>
      expect(updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          catalogueUrl: undefined,
          announcementItems: ["Keep this", "Added deal"],
        })
      )
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Settings saved");
  });

  it("keeps unsaved edits when settings refresh in the background", () => {
    let settings = { ...baseSettings, siteTitle: "Gadget69" };
    const ensureSettingsLoaded = vi.fn();
    const updateSettings = vi.fn();
    mockUseAdminData.mockImplementation(() => ({
      settings,
      ensureSettingsLoaded,
      updateSettings,
    }));

    const view = render(<AdminSettings />);
    fireEvent.change(screen.getByDisplayValue("Gadget69"), {
      target: { value: "Gadget69 Updated" },
    });

    settings = { ...baseSettings, siteTitle: "Server Refresh" };
    view.rerender(<AdminSettings />);

    expect(screen.getByDisplayValue("Gadget69 Updated")).toBeInTheDocument();
  });

  it("submits a strong current-password change", async () => {
    mockChangePassword.mockResolvedValue(undefined);

    render(<AdminSettings />);

    fireEvent.change(screen.getByPlaceholderText("Your current password"), {
      target: { value: "Admin@123" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Min 8 chars, uppercase, lowercase, number, special char"),
      {
      target: { value: "NewPass@123" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("Re-enter new password"), {
      target: { value: "NewPass@123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change Password" }));

    await waitFor(() =>
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: "Admin@123",
        newPassword: "NewPass@123",
      })
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Password changed successfully! Please log in again.");
  });
});
