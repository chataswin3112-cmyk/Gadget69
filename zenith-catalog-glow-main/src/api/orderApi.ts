import apiClient from "./client";
import { Order } from "@/types";

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

export const getOrders = async (): Promise<Order[]> => {
  const res = await apiClient.get("/orders");
  return res.data;
};

export const updateOrderStatus = async (
  orderId: number,
  orderStatus: string
): Promise<Order> => {
  const res = await apiClient.put(`/orders/${orderId}/status`, { orderStatus });
  return res.data;
};

export const getOrderById = async (orderId: number, phone: string): Promise<Order> => {
  const res = await apiClient.get(`/orders/${orderId}`, {
    params: { phone },
  });
  return res.data;
};
