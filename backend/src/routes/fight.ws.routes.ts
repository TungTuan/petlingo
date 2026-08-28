import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { registerConnection } from "../services/fight/liveRoomManager.js";

/**
 * The battle itself — everything after "you're in the room" happens here
 * over a single persistent connection instead of polling. Registered
 * separately from fight.routes.ts (plain REST) because the browser's native
 * WebSocket API can't attach an Authorization header to the handshake, so
 * auth has to travel as query params and gets verified by hand below rather
 * than through the usual `verifyAuth` preHandler.
 */
export async function fightWsRoutes(app: FastifyInstance) {
  app.get<{ Params: { code: string }; Querystring: { childId?: string; token?: string } }>(
    "/rooms/:code/ws",
    { websocket: true },
    async (socket, request) => {
      const { childId, token } = request.query;
      const code = request.params.code.trim().toUpperCase();

      if (!token || !childId) {
        socket.send(JSON.stringify({ type: "error", message: "Thiếu thông tin xác thực." }));
        socket.close();
        return;
      }

      let parentId: string;
      try {
        parentId = verifyAccessToken(app, token).parentId;
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "Phiên đăng nhập đã hết hạn." }));
        socket.close();
        return;
      }

      const child = await prisma.child.findUnique({ where: { id: childId } });
      if (!child || child.parentId !== parentId) {
        socket.send(JSON.stringify({ type: "error", message: "Không tìm thấy hồ sơ trẻ." }));
        socket.close();
        return;
      }

      const room = await prisma.fightRoom.findUnique({ where: { code }, select: { id: true } });
      if (!room) {
        socket.send(JSON.stringify({ type: "error", message: "Không tìm thấy phòng." }));
        socket.close();
        return;
      }

      await registerConnection(code, childId, socket);
    },
  );
}
