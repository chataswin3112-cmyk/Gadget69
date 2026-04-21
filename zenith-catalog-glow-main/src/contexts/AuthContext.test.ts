import { isTokenExpired } from "@/contexts/AuthContext";

const createToken = (expiresAt: number) =>
  Buffer.from(`1:admin@gadget69.com:${expiresAt}:0:signature`).toString("base64url");

describe("isTokenExpired", () => {
  it("accepts URL-safe admin tokens without base64 padding", () => {
    expect(isTokenExpired(createToken(Date.now() + 60_000))).toBe(false);
  });

  it("treats expired admin tokens as expired", () => {
    expect(isTokenExpired(createToken(Date.now() - 60_000))).toBe(true);
  });
});
