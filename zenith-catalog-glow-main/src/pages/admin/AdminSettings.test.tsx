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
  beforeEach(() => {
    mockChangePassword.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockUseAdminData.mockReturnValue({
      settings: {
        id: 1,
        siteTitle: "Gadget69",
        announcementItems: [],
        whatsappNumber: "8825602356",
      },
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
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    mockUseAdminData.mockReturnValue({
      settings: {
        id: 1,
        siteTitle: "Gadget69",
        announcementItems: [],
        whatsappNumber: "8825602356",
      },
      updateSettings,
    });

    render(<AdminSettings />);

    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() => expect(updateSettings).toHaveBeenCalled());
    expect(mockToastSuccess).toHaveBeenCalledWith("Settings saved");
  });

  it("submits a strong current-password change", async () => {
    mockChangePassword.mockResolvedValue(undefined);

    render(<AdminSettings />);

    fireEvent.change(screen.getByPlaceholderText("Your current password"), {
      target: { value: "Admin@123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Min 8 chars, uppercase, number, special char"), {
      target: { value: "NewPass@123" },
    });
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
