import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { detectiveRoundSchema } from "../../schemas/admin.schema.js";
import { myDetectiveCaseSchema, myUpdateDetectiveCaseSchema } from "../../schemas/my.schema.js";
import { createOwnDetectiveCase, deleteDetectiveCase, listDetectiveCases, updateDetectiveCase } from "../../services/admin/detectiveCases.service.js";
import { createRound, listRoundsByCase } from "../../services/admin/detectiveRounds.service.js";
import { assertCanCreateOwnContent } from "../../services/premium.service.js";

export async function myDetectiveCasesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/", async (request, reply) => {
    const cases = await listDetectiveCases(request.parentId);
    return reply.send({ cases });
  });

  app.post("/", async (request, reply) => {
    const input = myDetectiveCaseSchema.parse(request.body);
    await assertCanCreateOwnContent(request.parentId, "detectiveCase");
    const detectiveCase = await createOwnDetectiveCase(request.parentId, input);
    return reply.status(201).send({ case: detectiveCase });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = myUpdateDetectiveCaseSchema.parse(request.body);
    const detectiveCase = await updateDetectiveCase(request.params.id, input, request.parentId);
    return reply.send({ case: detectiveCase });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteDetectiveCase(request.params.id, request.parentId);
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByCase(request.params.id, request.parentId);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = detectiveRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input, request.parentId);
    return reply.status(201).send({ round });
  });
}
