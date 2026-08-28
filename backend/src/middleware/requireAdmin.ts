import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { AppError } from "./errorHandler.js";

/**
 * preHandler for `/admin/*` routes. Must run AFTER `verifyAuth` (needs
 * `request.parentId`). Looks the role up fresh from the DB on every request
 * instead of trusting the JWT — the JWT only proves *who* they are, not
 * their current role, so a demoted admin loses access immediately instead
 * of waiting out their access-token TTL.
 */
export async function requireAdmin(request: FastifyRequest, _reply: FastifyReply) {
  const parent = await prisma.parent.findUnique({
    where: { id: request.parentId },
    select: { role: true, isActive: true },
  });
  if (!parent || !parent.isActive || parent.role !== "ADMIN") {
    throw new AppError(403, "Bạn không có quyền truy cập trang quản trị.", "FORBIDDEN");
  }
}
