import apiClient from "@/api/client";
import {
  adminLogin,
  changePassword,
  requestPasswordOtp,
  changePasswordWithOtp,
  resetPasswordWithSecretKey,
  getDashboardStats,
} from "@/api/adminApi";

vi.mock("@/api/client", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("adminApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts admin login credentials and returns the backend payload", async () => {
    const response = { token: "test-token", message: "Login successful" };
    vi.mocked(apiClient.post).mockResolvedValue({ data: response });

    await expect(adminLogin({ email: "admin@gadget69.com", password: "Secret@123" })).resolves.toEqual(
      response
    );
    expect(apiClient.post).toHaveBeenCalledWith("/admin/login", {
      email: "admin@gadget69.com",
      password: "Secret@123",
    });
  });

  it("posts the change-password payload without reshaping the response", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { ignored: true } });

    await expect(
      changePassword({ currentPassword: "Old@123", newPassword: "New@1234" })
    ).resolves.toBeUndefined();
    expect(apiClient.post).toHaveBeenCalledWith("/admin/change-password", {
      currentPassword: "Old@123",
      newPassword: "New@1234",
    });
  });

  it("requests the password OTP and returns response data", async () => {
    const response = { message: "OTP sent", recipient: "admin@gadget69.com" };
    vi.mocked(apiClient.post).mockResolvedValue({ data: response });

    await expect(requestPasswordOtp()).resolves.toEqual(response);
    expect(apiClient.post).toHaveBeenCalledWith("/admin/request-password-otp");
  });

  it("posts OTP password changes without extra response shaping", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { ignored: true } });

    await expect(changePasswordWithOtp({ otp: "123456", newPassword: "Fresh@123" })).resolves.toBeUndefined();
    expect(apiClient.post).toHaveBeenCalledWith("/admin/change-password-with-otp", {
      otp: "123456",
      newPassword: "Fresh@123",
    });
  });

  it("posts secret-key password resets without extra response shaping", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { ignored: true } });

    await expect(
      resetPasswordWithSecretKey({ secretKey: "master-secret", newPassword: "Reset@123" })
    ).resolves.toBeUndefined();
    expect(apiClient.post).toHaveBeenCalledWith("/admin/reset-password-with-key", {
      secretKey: "master-secret",
      newPassword: "Reset@123",
    });
  });

  it("loads dashboard stats from the backend payload", async () => {
    const response = {
      totalOrders: 24,
      paidOrders: 18,
      totalRevenue: 640000,
      conversionRate: 75,
      totalProducts: 12,
      totalSections: 4,
      totalBanners: 2,
      totalCommunityMedia: 6,
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: response });

    await expect(getDashboardStats()).resolves.toEqual(response);
    expect(apiClient.get).toHaveBeenCalledWith("/admin/dashboard");
  });
});
