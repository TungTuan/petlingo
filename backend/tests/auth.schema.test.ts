import { describe, expect, it } from "vitest";
import { registerSchema, socialLoginSchema } from "../src/schemas/auth.schema.js";

describe("legal acceptance on authentication", () => {
  it("rejects email registration without parent legal acceptance", () => {
    expect(() => registerSchema.parse({ email: "parent@example.com", password: "password123", acceptedLegal: false })).toThrow();
  });

  it("accepts email registration with parent legal acceptance", () => {
    expect(registerSchema.parse({ email: "parent@example.com", password: "password123", acceptedLegal: true }).acceptedLegal).toBe(true);
  });

  it("keeps acceptance optional for an existing social-login attempt", () => {
    expect(socialLoginSchema.parse({ token: "provider-token" }).acceptedLegal).toBe(false);
  });
});
