import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { petSchema, updatePetSchema } from "../../schemas/admin.schema.js";
import { createPet, deletePet, listPets, updatePet } from "../../services/admin/pets.service.js";

export async function adminPetsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const pets = await listPets();
    return reply.send({ pets });
  });

  app.post("/", async (request, reply) => {
    const input = petSchema.parse(request.body);
    const pet = await createPet(input);
    return reply.status(201).send({ pet });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updatePetSchema.parse(request.body);
    const pet = await updatePet(request.params.id, input);
    return reply.send({ pet });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deletePet(request.params.id);
    return reply.status(204).send();
  });
}
