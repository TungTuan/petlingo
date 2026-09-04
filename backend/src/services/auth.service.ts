import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { verifyAppleIdentityToken, verifyFacebookAccessToken, verifyGoogleIdToken, type SocialProfile } from "../lib/socialProviders.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import { PRIVACY_VERSION, TERMS_VERSION } from "../config/legal.js";

export type SocialProvider = "google" | "facebook" | "apple";

export type LanguageCode = "vi" | "en" | "ja" | "ko";

export interface SafeParent {
  id: string;
  email: string;
  phone: string | null;
  role: "PARENT" | "ADMIN";
  /** null = chưa từng chọn — App.tsx dùng để quyết định hiện LanguagePicker. */
  language: LanguageCode | null;
  isPremium: boolean;
  legalAcceptedAt: Date | null;
  termsVersion: string | null;
  privacyVersion: string | null;
}

function toSafeParent(parent: { id: string; email: string; phone: string | null; role: "PARENT" | "ADMIN"; language: LanguageCode | null; isPremium: boolean; legalAcceptedAt: Date | null; termsVersion: string | null; privacyVersion: string | null }): SafeParent {
  // Never leak passwordHash (or isActive — irrelevant to the client) out of this service.
  return { id: parent.id, email: parent.email, phone: parent.phone, role: parent.role, language: parent.language, isPremium: parent.isPremium, legalAcceptedAt: parent.legalAcceptedAt, termsVersion: parent.termsVersion, privacyVersion: parent.privacyVersion };
}

export async function updateLanguage(id: string, language: LanguageCode): Promise<SafeParent> {
  const parent = await prisma.parent.update({ where: { id }, data: { language } });
  return toSafeParent(parent);
}

/**
 * Demo activation — the app has no real payment gateway yet, so this is
 * what "Dùng thử 7 ngày" on the Premium page actually does: flip the flag
 * for good (no expiry). See premium.service.ts for what it unlocks.
 */
export async function activatePremium(id: string): Promise<SafeParent> {
  const parent = await prisma.parent.update({ where: { id }, data: { isPremium: true } });
  return toSafeParent(parent);
}

export async function registerParent(input: RegisterInput): Promise<SafeParent> {
  const existing = await prisma.parent.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, "Email này đã được đăng ký.", "EMAIL_TAKEN");
  }

  const passwordHash = await argon2.hash(input.password);
  const parent = await prisma.parent.create({
    data: {
      email: input.email,
      phone: input.phone,
      passwordHash,
      legalAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
    },
  });

  return toSafeParent(parent);
}

export async function loginParent(input: LoginInput): Promise<SafeParent> {
  const parent = await prisma.parent.findUnique({ where: { email: input.email } });

  // Same generic error whether the email doesn't exist or the password is
  // wrong — telling an attacker "email not found" vs "wrong password"
  // makes it trivial to enumerate registered accounts.
  const invalidCredentials = () => new AppError(401, "Email hoặc mật khẩu không đúng.", "INVALID_CREDENTIALS");

  if (!parent) throw invalidCredentials();

  // Social-only accounts (registered via Google/Facebook/Apple) never set a
  // password — a clear, distinct error beats a confusing "wrong password"
  // for someone who's never had one.
  if (!parent.passwordHash) {
    throw new AppError(401, "Tài khoản này đăng nhập bằng Google/Facebook/Apple, chưa có mật khẩu.", "NO_PASSWORD_SET");
  }

  const passwordValid = await argon2.verify(parent.passwordHash, input.password);
  if (!passwordValid) throw invalidCredentials();

  if (!parent.isActive) {
    throw new AppError(403, "Tài khoản này đã bị khoá.", "ACCOUNT_DISABLED");
  }

  return toSafeParent(parent);
}

async function verifySocialToken(provider: SocialProvider, token: string): Promise<SocialProfile> {
  if (provider === "google") return verifyGoogleIdToken(token);
  if (provider === "facebook") return verifyFacebookAccessToken(token);
  return verifyAppleIdentityToken(token);
}

/**
 * Log in (or silently register/link) via Google/Facebook/Apple — `token` is
 * whatever that provider's own SDK handed the frontend (see
 * lib/socialProviders.ts's doc comment on each verify function for exactly
 * which token that is per provider). Finds the Parent by that provider's id
 * first; if none, links onto an existing email-registered account (so
 * someone who signed up with email/password can later also sign in with
 * Google using the same address); if no account exists at all, creates a
 * brand-new one with no password set.
 */
export async function loginWithSocial(provider: SocialProvider, token: string, acceptedLegal = false): Promise<SafeParent> {
  const profile = await verifySocialToken(provider, token);

  let parent =
    provider === "google"
      ? await prisma.parent.findUnique({ where: { googleId: profile.id } })
      : provider === "facebook"
        ? await prisma.parent.findUnique({ where: { facebookId: profile.id } })
        : await prisma.parent.findUnique({ where: { appleId: profile.id } });

  if (!parent) {
    const idField = provider === "google" ? { googleId: profile.id } : provider === "facebook" ? { facebookId: profile.id } : { appleId: profile.id };
    const existingByEmail = await prisma.parent.findUnique({ where: { email: profile.email } });
    if (!existingByEmail && !acceptedLegal) {
      throw new AppError(409, "Hãy chuyển sang Đăng ký và đồng ý Điều khoản trước khi tạo tài khoản.", "LEGAL_ACCEPTANCE_REQUIRED");
    }
    parent = existingByEmail
      ? await prisma.parent.update({ where: { id: existingByEmail.id }, data: idField })
      : await prisma.parent.create({
          data: {
            email: profile.email,
            ...idField,
            legalAcceptedAt: new Date(),
            termsVersion: TERMS_VERSION,
            privacyVersion: PRIVACY_VERSION,
          },
        });
  }

  if (!parent.isActive) {
    throw new AppError(403, "Tài khoản này đã bị khoá.", "ACCOUNT_DISABLED");
  }

  return toSafeParent(parent);
}

export async function acceptCurrentLegal(parentId: string): Promise<SafeParent> {
  const parent = await prisma.parent.update({
    where: { id: parentId },
    data: { legalAcceptedAt: new Date(), termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION },
  });
  return toSafeParent(parent);
}

export async function getParentById(id: string): Promise<SafeParent | null> {
  const parent = await prisma.parent.findUnique({ where: { id } });
  return parent ? toSafeParent(parent) : null;
}

/**
 * Settings.tsx's "Xoá toàn bộ dữ liệu" — permanently deletes the parent
 * account and everything under it (every Child → Progress/PetStats/
 * ChildItem/SavedWord/fight history, every lesson/story/mini-game topic the
 * parent authored themselves) via Prisma's cascading `onDelete: Cascade`
 * relations, in one query. Requires typing the account's own email back
 * (case/whitespace-insensitive) as the confirmation step described right on
 * that Settings row — a password re-prompt doesn't work uniformly since a
 * social-login-only parent may not have one (see loginParent()'s own
 * passwordHash check above).
 */
export async function deleteAccount(parentId: string, confirmEmail: string): Promise<void> {
  const parent = await prisma.parent.findUnique({ where: { id: parentId } });
  if (!parent) throw new AppError(404, "Không tìm thấy phụ huynh.", "PARENT_NOT_FOUND");
  if (confirmEmail.trim().toLowerCase() !== parent.email.toLowerCase()) {
    throw new AppError(400, "Email xác nhận không khớp.", "EMAIL_MISMATCH");
  }
  await prisma.parent.delete({ where: { id: parentId } });
}
