import type { AxiosError } from "axios";
import { getErrorMessage } from "@/lib/api-error";

describe("getErrorMessage", () => {
  it("falls back to a friendlier message for generic 5xx responses", () => {
    const error = {
      isAxiosError: true,
      message: "Request failed with status code 500",
      response: {
        status: 500,
        data: {
          message: "Unexpected server error",
        },
      },
    } as AxiosError;

    expect(getErrorMessage(error, "Failed to load orders.")).toBe("Failed to load orders.");
  });

  it("keeps specific backend validation messages", () => {
    const error = {
      isAxiosError: true,
      message: "Request failed with status code 400",
      response: {
        status: 400,
        data: {
          message: "Current password is incorrect",
        },
      },
    } as AxiosError;

    expect(getErrorMessage(error, "Failed to change password.")).toBe(
      "Current password is incorrect"
    );
  });
});
