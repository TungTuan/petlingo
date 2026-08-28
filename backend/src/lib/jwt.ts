import type { JWT } from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import type { AccessTokenPayload } from "../types/fastify.js";

/**
 * `@fastify/jwt`'s `namespace` option decorates `fastify.jwt.<namespace>`
 * at runtime, but its published types don't know about arbitrary namespace
 * names — so we type that shape once here instead of casting in every route.
 */
interface NamespacedJwt extends JWT {
  access: JWT;
  refresh: JWT;
}

function namespaced(app: FastifyInstance): NamespacedJwt {
  return app.jwt as unknown as NamespacedJwt;
}

export function signAccessToken(app: FastifyInstance, payload: AccessTokenPayload): string {
  return namespaced(app).access.sign(payload);
}

export function signRefreshToken(app: FastifyInstance, payload: AccessTokenPayload): string {
  return namespaced(app).refresh.sign(payload);
}

export function verifyRefreshToken(app: FastifyInstance, token: string): AccessTokenPayload {
  return namespaced(app).refresh.verify(token);
}

/**
 * Same access-token verification `verifyAuth`'s preHandler does via
 * `request.accessJwtVerify()`, but callable directly with a raw token
 * string — needed for the fight-room WebSocket handshake, since the
 * browser's native WebSocket API cannot attach an Authorization header
 * (the token has to travel as a query param instead, see fight.ws.routes.ts).
 */
export function verifyAccessToken(app: FastifyInstance, token: string): AccessTokenPayload {
  return namespaced(app).access.verify(token);
}
