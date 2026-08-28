import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { listQuerySchema, updateUserSchema } from "../../schemas/admin.schema.js";
import { deleteUser, getUser, listUsers, updateUser } from "../../services/admin/users.service.js";

export async function adminUsersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    const result = await listUsers(query);
    return reply.send(result);
  });

  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const user = await getUser(request.params.id);
    return reply.send({ user });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateUserSchema.parse(request.body);
    const user = await updateUser(request.params.id, request.parentId, input);
    return reply.send({ user });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteUser(request.params.id, request.parentId);
    return reply.status(204).send();
  });
}
