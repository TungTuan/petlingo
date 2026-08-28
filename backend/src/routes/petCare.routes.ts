import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { careActionSchema } from "../schemas/petCare.schema.js";
import { careForPet, getPetStats, rewardLessonExperience } from "../services/petStats.service.js";

/** Child-facing Pet Care routes — per-pet hunger/happiness/health, persisted instead of resetting on reload. */
export async function petCareRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get<{ Params: { id: string; petKey: string } }>("/:id/pets/:petKey/stats", async (request, reply) => {
    const petStats = await getPetStats(request.params.id, request.parentId, request.params.petKey);
    return reply.send({ petStats });
  });

  app.post<{ Params: { id: string; petKey: string } }>("/:id/pets/:petKey/care", async (request, reply) => {
    const { action } = careActionSchema.parse(request.body);
    const result = await careForPet(request.params.id, request.parentId, request.params.petKey, action);
    return reply.send(result);
  });

  app.post<{ Params: { id: string; petKey: string } }>("/:id/pets/:petKey/lesson-experience", async (request, reply) => {
    const petStats = await rewardLessonExperience(request.params.id, request.parentId, request.params.petKey);
    return reply.send({ petStats });
  });
}
