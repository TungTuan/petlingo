import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // msedge-tts needs no API key (it rides the free Edge "Read Aloud" endpoint),
  // so these two are the only TTS knobs — see services/tts.service.ts.
  TTS_VOICE: z.string().default("en-US-JennyNeural"),
  TTS_CACHE_DIR: z.string().default("storage/audio"),

  // ---- Social login (see lib/socialProviders.ts) --------------------------
  // All optional: the corresponding /auth/<provider> route just returns a
  // clear "not configured yet" error (rather than crashing the whole server
  // at boot) until these are filled in — see each verify*() function's guard.
  // GOOGLE_CLIENT_ID must match the OAuth Client ID(s) the frontend's Google
  // Identity Services init call uses (VITE_GOOGLE_CLIENT_ID) — can be a
  // comma-separated list if web/iOS/Android each have their own Client ID.
  GOOGLE_CLIENT_ID: z.string().optional(),
  // App Access Token for Facebook's /debug_token check (verifies a login
  // token was actually issued to THIS app, not some other Facebook app).
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  // The audience Apple's identityToken must be issued for — your Services ID
  // for "Sign in with Apple JS" on web, or the app's bundle ID for the native
  // flow (see TASKS.md's note on the native Capacitor upgrade still needed).
  APPLE_CLIENT_ID: z.string().optional(),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production") return;

  const placeholderPattern = /replace_with|change[-_ ]?me|example/i;
  const secrets = [
    ["JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET],
    ["JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET],
  ] as const;

  for (const [field, value] of secrets) {
    if (value.length < 32 || placeholderPattern.test(value)) {
      ctx.addIssue({
        code: "custom",
        path: [field],
        message: `${field} must be a non-placeholder secret of at least 32 characters in production`,
      });
    }
  }

  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    ctx.addIssue({
      code: "custom",
      path: ["JWT_REFRESH_SECRET"],
      message: "JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET in production",
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;
