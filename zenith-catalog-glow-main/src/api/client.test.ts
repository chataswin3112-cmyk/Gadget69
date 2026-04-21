import apiClient from "@/api/client";

const ADMIN_TOKEN_KEY = "mzflow_admin_token";

const getRejectedInterceptor = () => {
  const handlers = (apiClient.interceptors.response as {
    handlers?: Array<{ rejected?: (error: unknown) => Promise<never> }>;
  }).handlers;

  const rejected = handlers?.find((handler) => typeof handler?.rejected === "function")?.rejected;
  if (!rejected) {
    throw new Error("Response rejection interceptor is not registered");
  }

  return rejected;
};

describe("apiClient response interceptor", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps the admin token when the login endpoint returns 401", async () => {
    localStorage.setItem(ADMIN_TOKEN_KEY, "seed-token");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const rejected = getRejectedInterceptor();
    const error = {
      response: { status: 401 },
      config: { url: "/admin/login" },
    };

    await expect(rejected(error)).rejects.toBe(error);

    expect(localStorage.getItem(ADMIN_TOKEN_KEY)).toBe("seed-token");
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: "admin-logout" }));

    dispatchSpy.mockRestore();
  });

  it("forces an admin logout when a protected request returns 401", async () => {
    localStorage.setItem(ADMIN_TOKEN_KEY, "seed-token");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const rejected = getRejectedInterceptor();
    const error = {
      response: { status: 401 },
      config: { url: "/admin/orders" },
    };

    await expect(rejected(error)).rejects.toBe(error);

    expect(localStorage.getItem(ADMIN_TOKEN_KEY)).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "admin-logout" }));

    dispatchSpy.mockRestore();
  });
});
