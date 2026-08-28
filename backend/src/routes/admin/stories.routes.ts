import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { storyPageSchema, storySchema, updateStorySchema } from "../../schemas/admin.schema.js";
import { createStory, deleteStory, listStories, updateStory } from "../../services/admin/stories.service.js";
import { createPage, listPagesByStory } from "../../services/admin/storyPages.service.js";

export async function adminStoriesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const stories = await listStories();
    return reply.send({ stories });
  });

  app.post("/", async (request, reply) => {
    const input = storySchema.parse(request.body);
    const story = await createStory(input);
    return reply.status(201).send({ story });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateStorySchema.parse(request.body);
    const story = await updateStory(request.params.id, input);
    return reply.send({ story });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteStory(request.params.id);
    return reply.status(204).send();
  });

  // Pages are nested under their story.
  app.get<{ Params: { id: string } }>("/:id/pages", async (request, reply) => {
    const pages = await listPagesByStory(request.params.id);
    return reply.send({ pages });
  });

  app.post<{ Params: { id: string } }>("/:id/pages", async (request, reply) => {
    const input = storyPageSchema.parse(request.body);
    const page = await createPage(request.params.id, input);
    return reply.status(201).send({ page });
  });
}
