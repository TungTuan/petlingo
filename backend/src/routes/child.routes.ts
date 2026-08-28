import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { createChildSchema, updateChildSchema } from "../schemas/child.schema.js";
import { createChild, deleteChild, listChildren, updateChild } from "../services/child.service.js";

export async function childRoutes(app: FastifyInstance) {
  // Every route here requires a valid parent access token.
  app.addHook("preHandler", verifyAuth);

  app.post("/", async (request, reply) => {
    const input = createChildSchema.parse(request.body);
    const child = await createChild(request.parentId, input);
    return reply.status(201).send({ child });
  });

  app.get("/", async (request, reply) => {
    const children = await listChildren(request.parentId);
    return reply.send({ children });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateChildSchema.parse(request.body);
    const child = await updateChild(request.parentId, request.params.id, input);
    return reply.send({ child });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteChild(request.parentId, request.params.id);
    return reply.status(204).send();
  });
}
