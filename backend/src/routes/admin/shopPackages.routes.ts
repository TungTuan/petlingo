import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { shopPackageSchema, updateShopPackageSchema } from "../../schemas/admin.schema.js";
import { adminCreatePackage, adminDeletePackage, adminListPackages, adminUpdatePackage } from "../../services/packages.service.js";

export async function adminShopPackagesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const packages = await adminListPackages();
    return reply.send({ packages });
  });

  app.post("/", async (request, reply) => {
    const input = shopPackageSchema.parse(request.body);
    const pkg = await adminCreatePackage(input);
    return reply.status(201).send({ package: pkg });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateShopPackageSchema.parse(request.body);
    const pkg = await adminUpdatePackage(request.params.id, input);
    return reply.send({ package: pkg });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await adminDeletePackage(request.params.id);
    return reply.status(204).send();
  });
}
