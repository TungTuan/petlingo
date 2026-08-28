import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { listFoodShop, listHomeBackgroundShop, listInventory, purchaseItem, useItem } from "../services/inventory.service.js";

/** Child-facing Kho đồ (Bag) routes — read the child's own inventory and use an item from it. */
export async function inventoryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get<{ Params: { id: string } }>("/:id/items", async (request, reply) => {
    const items = await listInventory(request.params.id, request.parentId);
    return reply.send({ items });
  });

  app.post<{ Params: { id: string; itemId: string } }>("/:id/items/:itemId/use", async (request, reply) => {
    const result = await useItem(request.params.id, request.parentId, request.params.itemId);
    return reply.send(result);
  });

  app.get<{ Params: { id: string } }>("/:id/food-shop", async (request, reply) => reply.send({ items: await listFoodShop(request.params.id, request.parentId) }));

  app.get<{ Params: { id: string } }>("/:id/home-background-shop", async (request, reply) => reply.send({ items: await listHomeBackgroundShop(request.params.id, request.parentId) }));

  app.post<{ Params: { id: string; itemId: string } }>("/:id/items/:itemId/purchase", async (request, reply) => reply.send(await purchaseItem(request.params.id, request.parentId, request.params.itemId)));
}
