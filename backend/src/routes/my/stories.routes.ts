import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { storyPageSchema } from "../../schemas/admin.schema.js";
import { myStorySchema, myUpdateStorySchema } from "../../schemas/my.schema.js";
import { createOwnStory, deleteStory, listStories, updateStory } from "../../services/admin/stories.service.js";
import { createPage, listPagesByStory } from "../../services/admin/storyPages.service.js";
import { assertCanCreateOwnContent } from "../../services/premium.service.js";

export async function myStoriesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/", async (request, reply) => {
    const stories = await listStories(request.parentId);
    return reply.send({ stories });
  });

  app.post("/", async (request, reply) => {
    const input = myStorySchema.parse(request.body);
    await assertCanCreateOwnContent(request.parentId, "story");
    const story = await createOwnStory(request.parentId, input);
    return reply.status(201).send({ story });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = myUpdateStorySchema.parse(request.body);
    const story = await updateStory(request.params.id, input, request.parentId);
    return reply.send({ story });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteStory(request.params.id, request.parentId);
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/pages", async (request, reply) => {
    const pages = await listPagesByStory(request.params.id, request.parentId);
    return reply.send({ pages });
  });

  app.post<{ Params: { id: string } }>("/:id/pages", async (request, reply) => {
    const input = storyPageSchema.parse(request.body);
    const page = await createPage(request.params.id, input, request.parentId);
    return reply.status(201).send({ page });
  });
}
