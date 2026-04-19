import apiClient from "./client";
import type { Order, OrderFilters } from "@/types";

export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
  const res = await apiClient.post("/orders", orderData);
  return res.data;
};

export const verifyPayment = async (paymentData: {
  orderId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<Order> => {
  const res = await apiClient.post("/verify-payment", paymentData);
  return res.data;
};

export const getAdminOrders = async (filters: OrderFilters = {}): Promise<Order[]> => {
  const res = await apiClient.get("/admin/orders", { params: filters });
  return res.data;
};

export const getAdminOrderById = async (orderId: number): Promise<Order> => {
  const res = await apiClient.get(`/admin/orders/${orderId}`);
  return res.data;
};

export const updateAdminOrderStatus = async (orderId: number, orderStatus: string): Promise<Order> => {
  const res = await apiClient.put(`/admin/orders/${orderId}/status`, { orderStatus });
  return res.data;
};

export const cancelAdminOrder = async (orderId: number): Promise<Order> => {
  const res = await apiClient.put(`/admin/orders/${orderId}/cancel`);
  return res.data;
};

export const archiveAdminOrder = async (orderId: number): Promise<Order> => {
  const res = await apiClient.put(`/admin/orders/${orderId}/archive`);
  return res.data;
};

export const deleteAdminOrder = async (orderId: number): Promise<void> => {
  await apiClient.delete(`/admin/orders/${orderId}`);
};

export const getOrderById = async (orderId: number, phone: string): Promise<Order> => {
  const res = await apiClient.get(`/orders/${orderId}`, {
    params: { phone },
  });
  return res.data;
};
