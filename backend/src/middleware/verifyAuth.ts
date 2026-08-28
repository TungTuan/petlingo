import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "./errorHandler.js";

/**
 * preHandler that decodes the access JWT from the `Authorization: Bearer`
 * header, and attaches `parentId` to the request for downstream handlers.
 * Rejects with 401 if the token is missing, malformed, or expired.
 */
export async function verifyAuth(request: FastifyRequest, _reply: FastifyReply) {
  try {
    const payload = await request.accessJwtVerify();
    request.parentId = payload.parentId;
  } catch {
    throw new AppError(401, "Token không hợp lệ hoặc đã hết hạn.", "UNAUTHORIZED");
  }
}
