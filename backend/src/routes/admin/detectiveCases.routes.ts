import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { detectiveCaseSchema, detectiveRoundSchema, updateDetectiveCaseSchema } from "../../schemas/admin.schema.js";
import { createDetectiveCase, deleteDetectiveCase, listDetectiveCases, updateDetectiveCase } from "../../services/admin/detectiveCases.service.js";
import { createRound, listRoundsByCase } from "../../services/admin/detectiveRounds.service.js";

export async function adminDetectiveCasesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const cases = await listDetectiveCases();
    return reply.send({ cases });
  });

  app.post("/", async (request, reply) => {
    const input = detectiveCaseSchema.parse(request.body);
    const detectiveCase = await createDetectiveCase(input);
    return reply.status(201).send({ case: detectiveCase });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateDetectiveCaseSchema.parse(request.body);
    const detectiveCase = await updateDetectiveCase(request.params.id, input);
    return reply.send({ case: detectiveCase });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteDetectiveCase(request.params.id);
    return reply.status(204).send();
  });

  // Rounds are nested under their case.
  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByCase(request.params.id);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = detectiveRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input);
    return reply.status(201).send({ round });
  });
}
