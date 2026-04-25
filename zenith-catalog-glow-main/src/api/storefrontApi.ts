import apiClient from "./client";
import { StorefrontBootstrap } from "@/types";

export const getStorefrontBootstrap = async (): Promise<StorefrontBootstrap> => {
  const response = await apiClient.get("/storefront/bootstrap");
  return response.data;
};
