import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { getQuotaStatus } from "../../services/premium.service.js";

export async function myQuotaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/", async (request, reply) => {
    return reply.send(await getQuotaStatus(request.parentId));
  });
}
