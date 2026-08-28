import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { fusePetsSchema, petKeySchema, putProgressSchema, rankVisibilitySchema } from "../schemas/progress.schema.js";
import { fusePets } from "../services/petFusion.service.js";
import { checkIn, claimMonthlyLegendaryPets, getProgress, purchasePet, putProgress, selectActivePet, setRankVisibility } from "../services/progress.service.js";

export async function progressRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get<{ Params: { id: string } }>("/:id/progress", async (request, reply) => {
    const progress = await getProgress(request.params.id, request.parentId);
    return reply.send({ progress });
  });

  app.put<{ Params: { id: string } }>("/:id/progress", async (request, reply) => {
    const input = putProgressSchema.parse(request.body);
    const progress = await putProgress(request.params.id, request.parentId, input);
    return reply.send({ progress });
  });

  app.post<{ Params: { id: string } }>("/:id/checkin", async (request, reply) => {
    const result = await checkIn(request.params.id, request.parentId);
    return reply.send(result);
  });

  app.post<{ Params: { id: string } }>("/:id/legendary-claim", async (request, reply) => {
    const result = await claimMonthlyLegendaryPets(request.params.id, request.parentId);
    return reply.send(result);
  });

  app.post<{ Params: { id: string }; Body: { petKey: string } }>("/:id/pets/purchase", async (request, reply) => {
    const { petKey } = petKeySchema.parse(request.body);
    return reply.send(await purchasePet(request.params.id, request.parentId, petKey));
  });

  app.patch<{ Params: { id: string }; Body: { petKey: string } }>("/:id/pets/active", async (request, reply) => {
    const { petKey } = petKeySchema.parse(request.body);
    return reply.send({ progress: await selectActivePet(request.params.id, request.parentId, petKey) });
  });

  app.post<{ Params: { id: string } }>("/:id/pets/fuse", async (request, reply) => {
    const { rarity, materials } = fusePetsSchema.parse(request.body);
    const result = await fusePets(request.params.id, request.parentId, rarity, materials);
    return reply.send(result);
  });

  app.patch<{ Params: { id: string }; Body: { hidden: boolean } }>("/:id/rank-visibility", async (request, reply) => {
    const { hidden } = rankVisibilitySchema.parse(request.body);
    return reply.send({ progress: await setRankVisibility(request.params.id, request.parentId, hidden) });
  });
}
