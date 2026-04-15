import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminSettings from "@/pages/admin/AdminSettings";

const { mockUseAdminData, mockRequestPasswordOtp, mockChangePasswordWithOtp, mockToastSuccess, mockToastError } =
  vi.hoisted(() => ({
    mockUseAdminData: vi.fn(),
    mockRequestPasswordOtp: vi.fn(),
    mockChangePasswordWithOtp: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
  }));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

vi.mock("@/api/adminApi", () => ({
  requestPasswordOtp: mockRequestPasswordOtp,
  changePasswordWithOtp: mockChangePasswordWithOtp,
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
    mockRequestPasswordOtp.mockReset();
    mockChangePasswordWithOtp.mockReset();
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

  it("uses the saved WhatsApp number for OTP messaging", async () => {
    mockRequestPasswordOtp.mockResolvedValue({
      message: "OTP sent to your registered WhatsApp number. Valid for 5 minutes.",
      recipient: "+91 88256 02356",
    });

    render(<AdminSettings />);

    expect(screen.getByText("+91 88256 02356")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Send OTP to WhatsApp" }));

    await waitFor(() => expect(mockRequestPasswordOtp).toHaveBeenCalled());
    expect(screen.getByText("OTP sent to WhatsApp +91 88256 02356")).toBeInTheDocument();
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "OTP sent to your registered WhatsApp number. Valid for 5 minutes."
    );
  });

  it("disables OTP requests until a WhatsApp number is configured", () => {
    mockUseAdminData.mockReturnValue({
      settings: {
        id: 1,
        siteTitle: "Gadget69",
        announcementItems: [],
        whatsappNumber: "",
      },
      updateSettings: vi.fn(),
    });

    render(<AdminSettings />);

    expect(
      screen.getByText("Save a WhatsApp number in Settings first. That saved number becomes the password-reset OTP destination.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send OTP to WhatsApp" })).toBeDisabled();
  });
});
