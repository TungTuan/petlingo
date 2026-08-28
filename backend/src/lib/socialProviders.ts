import { OAuth2Client } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Verifies a token a client claims came from Google/Facebook/Apple's own
 * sign-in flow, and extracts the provider's stable user id + a verified
 * email — the only 2 things auth.service.ts's loginWithSocial() needs to
 * find-or-create a Parent. Each verify*() throws a clear AppError (never a
 * raw fetch/library error) so the route layer doesn't need provider-specific
 * error handling.
 *
 * None of these need the app's OWN JWT secrets or touch the database —
 * they're pure "is this token real, and who does it belong to" checks
 * against each provider's own servers/public keys.
 */
export interface SocialProfile {
  /** The provider's own stable user id (Google `sub`, Facebook `id`, Apple `sub`). */
  id: string;
  email: string;
}

function notConfigured(provider: string): never {
  throw new AppError(503, `Đăng nhập ${provider} chưa được cấu hình trên server.`, "SOCIAL_LOGIN_NOT_CONFIGURED");
}

// Accepts multiple comma-separated Client IDs (web + iOS + Android often
// each get their own from Google Cloud Console) as valid audiences.
const googleAudiences = env.GOOGLE_CLIENT_ID?.split(",").map((s) => s.trim()).filter(Boolean);
const googleClient = googleAudiences?.length ? new OAuth2Client() : null;

/** `idToken` = the credential Google Identity Services (web) or the native
 * Google Sign-In SDK hands back after the user picks an account. */
export async function verifyGoogleIdToken(idToken: string): Promise<SocialProfile> {
  if (!googleClient || !googleAudiences?.length) notConfigured("Google");
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: googleAudiences });
    payload = ticket.getPayload();
  } catch {
    throw new AppError(401, "Không xác thực được tài khoản Google.", "GOOGLE_TOKEN_INVALID");
  }
  if (!payload?.sub || !payload.email) {
    throw new AppError(401, "Tài khoản Google cần cấp quyền chia sẻ email để đăng nhập.", "GOOGLE_EMAIL_REQUIRED");
  }
  return { id: payload.sub, email: payload.email };
}

/** `accessToken` = what Facebook's JS SDK / native SDK hands back after
 * FB.login(). Verified in 2 steps: confirm the token was actually issued to
 * THIS app (not some other Facebook app) via /debug_token, then read the
 * profile via /me — a raw access token alone proves nothing about which app
 * requested it, so skipping the debug_token step would let a token minted
 * for a totally different Facebook app log into ours. */
export async function verifyFacebookAccessToken(accessToken: string): Promise<SocialProfile> {
  if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) notConfigured("Facebook");
  const appToken = `${env.FACEBOOK_APP_ID}|${env.FACEBOOK_APP_SECRET}`;

  const debugRes = await fetch(`https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`);
  const debugJson = (await debugRes.json()) as { data?: { app_id?: string; is_valid?: boolean } };
  if (!debugRes.ok || debugJson.data?.app_id !== env.FACEBOOK_APP_ID || !debugJson.data?.is_valid) {
    throw new AppError(401, "Không xác thực được tài khoản Facebook.", "FACEBOOK_TOKEN_INVALID");
  }

  const meRes = await fetch(`https://graph.facebook.com/me?fields=id,email&access_token=${encodeURIComponent(accessToken)}`);
  const me = (await meRes.json()) as { id?: string; email?: string };
  if (!meRes.ok || !me.id || !me.email) {
    throw new AppError(401, "Tài khoản Facebook cần cấp quyền chia sẻ email để đăng nhập.", "FACEBOOK_EMAIL_REQUIRED");
  }
  return { id: me.id, email: me.email };
}

// Apple's public signing keys — `jose` fetches + caches these automatically,
// no API key needed to verify (only needed for the OPTIONAL server-side
// authorizationCode exchange, which this app doesn't do — see TASKS.md).
const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

/** `identityToken` = the JWT Apple's native Sign in with Apple flow (or
 * "Sign in with Apple JS" on web) hands back — signed by Apple, so this
 * verifies the signature + issuer/audience rather than calling Apple's
 * servers per login. Apple only includes `email` the FIRST time a user
 * authorizes this app, so a real product needs to persist it right away
 * (which loginWithSocial() does, by creating/linking the Parent row then). */
export async function verifyAppleIdentityToken(identityToken: string): Promise<SocialProfile> {
  if (!env.APPLE_CLIENT_ID) notConfigured("Apple");
  let payload;
  try {
    ({ payload } = await jwtVerify(identityToken, appleJwks, { issuer: "https://appleid.apple.com", audience: env.APPLE_CLIENT_ID }));
  } catch {
    throw new AppError(401, "Không xác thực được tài khoản Apple.", "APPLE_TOKEN_INVALID");
  }
  const email = typeof payload.email === "string" ? payload.email : null;
  if (!payload.sub || !email) {
    throw new AppError(401, "Tài khoản Apple cần cấp quyền chia sẻ email để đăng nhập.", "APPLE_EMAIL_REQUIRED");
  }
  return { id: payload.sub, email };
}
