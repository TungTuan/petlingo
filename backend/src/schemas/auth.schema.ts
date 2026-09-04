import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không đúng định dạng."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
  phone: z.string().trim().min(8).max(20).optional(),
  acceptedLegal: z.boolean().refine(Boolean, "Phụ huynh cần đồng ý Điều khoản và Chính sách quyền riêng tư."),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không đúng định dạng."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Thiếu refresh token."),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

/** Same shape for all 3 providers — the field is just called `token`
 * regardless of whether it's an idToken/accessToken/identityToken under the
 * hood, since which provider it is already comes from the route path
 * (/auth/google, /auth/facebook, /auth/apple). */
export const socialLoginSchema = z.object({
  token: z.string().min(1, "Thiếu token đăng nhập."),
  // Only required when this provider token creates a brand-new account.
  // Existing social accounts can continue signing in normally.
  acceptedLegal: z.boolean().optional().default(false),
});
export type SocialLoginInput = z.infer<typeof socialLoginSchema>;

export const updateLanguageSchema = z.object({
  language: z.enum(["vi", "en", "ja", "ko"]),
});
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;

export const deleteAccountSchema = z.object({
  confirmEmail: z.string().trim().min(1, "Thiếu email xác nhận."),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
