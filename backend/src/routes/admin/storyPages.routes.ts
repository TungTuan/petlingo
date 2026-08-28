import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { updateStoryPageSchema } from "../../schemas/admin.schema.js";
import { deletePage, updatePage } from "../../services/admin/storyPages.service.js";

export async function adminStoryPagesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateStoryPageSchema.parse(request.body);
    const page = await updatePage(request.params.id, input);
    return reply.send({ page });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deletePage(request.params.id);
    return reply.status(204).send();
  });
}
