import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { AppError } from "../middleware/errorHandler.js";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { deleteAccountSchema, loginSchema, refreshSchema, registerSchema, socialLoginSchema, updateLanguageSchema } from "../schemas/auth.schema.js";
import { acceptCurrentLegal, activatePremium, deleteAccount, getParentById, loginParent, loginWithSocial, registerParent, updateLanguage, type SocialProvider } from "../services/auth.service.js";

// Tight in production to slow down brute-force/credential-stuffing.
// Loose in dev — otherwise everyone testing from localhost shares one
// bucket and locks each other out (bit us during development).
const LOGIN_RATE_LIMIT = env.NODE_ENV === "production" ? { max: 5, timeWindow: "1 minute" } : { max: 100, timeWindow: "1 minute" };

function issueTokenPair(app: FastifyInstance, parentId: string) {
  return {
    accessToken: signAccessToken(app, { parentId }),
    refreshToken: signRefreshToken(app, { parentId }),
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const parent = await registerParent(input);
    const tokens = issueTokenPair(app, parent.id);
    return reply.status(201).send({ parent, ...tokens });
  });

  app.post(
    "/login",
    { config: { rateLimit: LOGIN_RATE_LIMIT } },
    async (request, reply) => {
      const input = loginSchema.parse(request.body);
      const parent = await loginParent(input);
      const tokens = issueTokenPair(app, parent.id);
      return reply.send({ parent, ...tokens });
    },
  );

  // Same request/response shape for all 3 — see socialLoginSchema's doc
  // comment on why the body field is just `token`. Rate-limited the same as
  // /login since it's another "prove who you are" endpoint.
  const SOCIAL_PROVIDERS: SocialProvider[] = ["google", "facebook", "apple"];
  for (const provider of SOCIAL_PROVIDERS) {
    app.post(`/${provider}`, { config: { rateLimit: LOGIN_RATE_LIMIT } }, async (request, reply) => {
      const { token, acceptedLegal } = socialLoginSchema.parse(request.body);
      const parent = await loginWithSocial(provider, token, acceptedLegal);
      const tokens = issueTokenPair(app, parent.id);
      return reply.send({ parent, ...tokens });
    });
  }

  app.post("/refresh", async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body);

    let payload: { parentId: string };
    try {
      payload = verifyRefreshToken(app, refreshToken);
    } catch {
      throw new AppError(401, "Refresh token không hợp lệ hoặc đã hết hạn.", "INVALID_REFRESH_TOKEN");
    }

    const parent = await getParentById(payload.parentId);
    if (!parent) throw new AppError(401, "Tài khoản không tồn tại.", "PARENT_NOT_FOUND");

    const accessToken = signAccessToken(app, { parentId: parent.id });
    return reply.send({ accessToken });
  });

  app.get("/me", { preHandler: verifyAuth }, async (request, reply) => {
    const parent = await getParentById(request.parentId);
    if (!parent) throw new AppError(404, "Không tìm thấy phụ huynh.", "PARENT_NOT_FOUND");
    return reply.send({ parent });
  });

  app.patch("/me/language", { preHandler: verifyAuth }, async (request, reply) => {
    const { language } = updateLanguageSchema.parse(request.body);
    const parent = await updateLanguage(request.parentId, language);
    return reply.send({ parent });
  });

  app.patch("/me/legal-acceptance", { preHandler: verifyAuth }, async (request, reply) => {
    const parent = await acceptCurrentLegal(request.parentId);
    return reply.send({ parent });
  });

  app.patch("/me/premium", { preHandler: verifyAuth }, async (request, reply) => {
    const parent = await activatePremium(request.parentId);
    return reply.send({ parent });
  });

  app.delete("/me", { preHandler: verifyAuth }, async (request, reply) => {
    const { confirmEmail } = deleteAccountSchema.parse(request.body);
    await deleteAccount(request.parentId, confirmEmail);
    return reply.status(204).send();
  });
}
