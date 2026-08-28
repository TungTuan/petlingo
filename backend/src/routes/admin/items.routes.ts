import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { itemSchema, updateItemSchema } from "../../schemas/admin.schema.js";
import { createItem, deleteItem, listItems, updateItem } from "../../services/admin/items.service.js";

export async function adminItemsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const items = await listItems();
    return reply.send({ items });
  });

  app.post("/", async (request, reply) => {
    const input = itemSchema.parse(request.body);
    const item = await createItem(input);
    return reply.status(201).send({ item });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateItemSchema.parse(request.body);
    const item = await updateItem(request.params.id, input);
    return reply.send({ item });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteItem(request.params.id);
    return reply.status(204).send();
  });
}
