import apiClient from "./client";
import { AdminLoginRequest, AdminLoginResponse, DashboardStats } from "@/types";

export const adminLogin = async (data: AdminLoginRequest): Promise<AdminLoginResponse> => {
  const res = await apiClient.post("/admin/login", data);
  return res.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
  await apiClient.post("/admin/change-password", data);
};

export const requestPasswordOtp = async (): Promise<{ message: string }> => {
  const res = await apiClient.post("/admin/request-password-otp");
  return res.data;
};

export const changePasswordWithOtp = async (data: { otp: string; newPassword: string }): Promise<void> => {
  await apiClient.post("/admin/change-password-with-otp", data);
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await apiClient.get("/admin/dashboard");
  return res.data;
};
