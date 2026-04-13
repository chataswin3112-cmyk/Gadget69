import apiClient from "./client";
import { Order } from "@/types";

export const createOrder = async (orderData: Partial<Order>) => {
  const res = await apiClient.post("/create-order", orderData);
  return res.data;
};

export const verifyPayment = async (paymentData: {
  orderId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const res = await apiClient.post("/verify-payment", paymentData);
  return res.data;
};

export const getOrders = async (): Promise<Order[]> => {
  const res = await apiClient.get("/admin/orders");
  return res.data;
};
