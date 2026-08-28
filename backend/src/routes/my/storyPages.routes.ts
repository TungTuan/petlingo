import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { updateStoryPageSchema } from "../../schemas/admin.schema.js";
import { deletePage, updatePage } from "../../services/admin/storyPages.service.js";

export async function myStoryPagesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateStoryPageSchema.parse(request.body);
    const page = await updatePage(request.params.id, input, request.parentId);
    return reply.send({ page });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deletePage(request.params.id, request.parentId);
    return reply.status(204).send();
  });
}
