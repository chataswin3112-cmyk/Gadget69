import apiClient from "./client";
import { AdminLoginRequest, AdminLoginResponse, DashboardStats, OtpDispatchResponse } from "@/types";

export const adminLogin = async (data: AdminLoginRequest): Promise<AdminLoginResponse> => {
  const res = await apiClient.post("/admin/login", data);
  return res.data;
};

/** Change password using the current (old) password — no OTP needed */
export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
  await apiClient.post("/admin/change-password", data);
};

export const requestPasswordOtp = async (): Promise<OtpDispatchResponse> => {
  const res = await apiClient.post("/admin/request-password-otp");
  return res.data;
};

export const changePasswordWithOtp = async (data: { otp: string; newPassword: string }): Promise<void> => {
  await apiClient.post("/admin/change-password-with-otp", data);
};

/** Forgot password — reset using the admin secret key (no login required) */
export const resetPasswordWithSecretKey = async (data: { secretKey: string; newPassword: string }): Promise<void> => {
  await apiClient.post("/admin/reset-password-with-key", data);
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await apiClient.get("/admin/dashboard");
  return res.data;
};
