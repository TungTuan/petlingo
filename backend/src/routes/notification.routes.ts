import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { createNotification, listNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notification.service.js";

/** Child-facing "Thông báo" routes — mirrors savedWords.routes.ts's shape. */
export async function notificationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get<{ Params: { id: string } }>("/:id/notifications", async (request, reply) => {
    const notifications = await listNotifications(request.params.id, request.parentId);
    return reply.send({ notifications });
  });

  app.patch<{ Params: { id: string; notificationId: string } }>("/:id/notifications/:notificationId/read", async (request, reply) => {
    const notifications = await markNotificationRead(request.params.id, request.parentId, request.params.notificationId);
    return reply.send({ notifications });
  });

  app.patch<{ Params: { id: string } }>("/:id/notifications/read-all", async (request, reply) => {
    const notifications = await markAllNotificationsRead(request.params.id, request.parentId);
    return reply.send({ notifications });
  });

  // The one client-reported kind (see schema.prisma's Notification doc
  // comment) — a lesson's result is trusted from the client throughout this
  // app already (progress sync is offline-first, see mergeProgress()), so
  // this is consistent with that existing trust boundary, not a new one.
  app.post<{ Params: { id: string }; Body: { title: string; body: string } }>("/:id/notifications/lesson-complete", async (request, reply) => {
    const title = request.body.title?.trim();
    const body = request.body.body?.trim();
    if (!title || !body) return reply.status(400).send({ error: "BAD_REQUEST", message: "Thiếu nội dung thông báo." });
    await createNotification(request.params.id, "lesson", title.slice(0, 200), body.slice(0, 400));
    const notifications = await listNotifications(request.params.id, request.parentId);
    return reply.send({ notifications });
  });
}
