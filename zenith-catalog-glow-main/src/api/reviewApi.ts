import apiClient from "./client";
import { Review } from "@/types";

export const getReviews = async (): Promise<Review[]> => {
  const res = await apiClient.get("/reviews");
  return res.data;
};

export const getAdminReviews = async (): Promise<Review[]> => {
  const res = await apiClient.get("/admin/reviews");
  return res.data;
};

export const createReview = async (data: Partial<Review>): Promise<Review> => {
  const res = await apiClient.post("/admin/reviews", data);
  return res.data;
};

export const updateReview = async (id: number, data: Partial<Review>): Promise<Review> => {
  const res = await apiClient.put(`/admin/reviews/${id}`, data);
  return res.data;
};

export const deleteReview = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/reviews/${id}`);
};
