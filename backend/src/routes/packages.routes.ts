import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { purchaseShopPackageSchema } from "../schemas/admin.schema.js";
import { listActivePackages, purchasePackage } from "../services/packages.service.js";

/** Child-facing "Shop packages" routes — see packages.service.ts's doc comment. */
export async function packagesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get<{ Params: { id: string } }>("/:id/packages", async (request, reply) => {
    const packages = await listActivePackages(request.params.id, request.parentId);
    return reply.send({ packages });
  });

  app.post<{ Params: { id: string } }>("/:id/packages/purchase", async (request, reply) => {
    const { packageId } = purchaseShopPackageSchema.parse(request.body);
    const result = await purchasePackage(request.params.id, request.parentId, packageId);
    return reply.send(result);
  });
}
