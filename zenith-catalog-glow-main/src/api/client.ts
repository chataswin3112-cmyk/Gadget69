import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const ADMIN_TOKEN_KEY = "mzflow_admin_token";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = String(error.config?.url || "");
      const isLoginRequest = requestUrl.includes("/admin/login");
      const hadToken = Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));

      if (!isLoginRequest && hadToken) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        window.dispatchEvent(new Event("admin-logout"));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
