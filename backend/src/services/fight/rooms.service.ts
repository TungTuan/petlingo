import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { generateRoomCode } from "./roomCode.js";

// A room is a lobby, not an auto-match: it stays "waiting" (open to new
// joiners) until the HOST explicitly starts it over the WebSocket (see
// liveRoomManager.ts's "start" message) — joining alone never flips status,
// so up to this many kids can trickle in before the host kicks things off.
export const MAX_ROOM_PARTICIPANTS = 10;

const PARTICIPANT_SELECT = { include: { participants: { include: { child: { select: { id: true, displayName: true, avatarId: true } } } }, lesson: { select: { title: true } } } } as const;

async function getOwnedChildOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  return child;
}

/** Lessons a child can pick as the question set for a battle — any lesson with enough questions to be worth playing. */
export async function listBattleLessons(viewerId: string) {
  const rows = await prisma.lesson.findMany({
    where: { isActive: true, OR: [{ parentId: null }, { parentId: viewerId }] },
    orderBy: [{ world: { order: "asc" } }, { order: "asc" }],
    include: { world: { select: { name: true, colorTheme: true } }, _count: { select: { questions: true } } },
  });
  return rows
    .filter((r) => r._count.questions >= 3)
    .map((r) => ({ id: r.id, title: r.title, worldName: r.world.name, colorTheme: r.world.colorTheme, questionCount: r._count.questions, isOwn: r.parentId !== null }));
}

export async function createRoom(parentId: string, hostChildId: string, lessonId: string) {
  await getOwnedChildOrThrow(hostChildId, parentId);
  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, isActive: true }, include: { _count: { select: { questions: true } } } });
  if (!lesson) throw new AppError(404, "Không tìm thấy bài học.", "LESSON_NOT_FOUND");
  if (lesson._count.questions < 3) throw new AppError(400, "Bài học cần ít nhất 3 câu hỏi để đấu.", "LESSON_TOO_SHORT");

  // 32^6 codes ~ 1 billion combos — a collision on create is astronomically
  // unlikely, but check anyway rather than trust probability with a unique index waiting to reject us.
  let code = generateRoomCode();
  for (let attempt = 0; attempt < 5 && (await prisma.fightRoom.findUnique({ where: { code } })); attempt++) {
    code = generateRoomCode();
  }

  return prisma.fightRoom.create({ data: { code, lessonId, hostChildId, participants: { create: { childId: hostChildId } } }, ...PARTICIPANT_SELECT });
}

export async function joinRoom(parentId: string, joinerChildId: string, rawCode: string) {
  await getOwnedChildOrThrow(joinerChildId, parentId);
  const code = rawCode.trim().toUpperCase();
  const room = await prisma.fightRoom.findUnique({ where: { code }, include: { participants: true } });
  if (!room) throw new AppError(404, "Không tìm thấy phòng — kiểm tra lại mã.", "ROOM_NOT_FOUND");
  if (room.participants.some((p) => p.childId === joinerChildId)) {
    return prisma.fightRoom.findUniqueOrThrow({ where: { id: room.id }, ...PARTICIPANT_SELECT }); // already in — just return current state (handles refresh/re-navigate)
  }
  if (room.status !== "waiting") throw new AppError(409, "Phòng này đã bắt đầu hoặc đã kết thúc.", "ROOM_NOT_JOINABLE");
  if (room.participants.length >= MAX_ROOM_PARTICIPANTS) throw new AppError(409, "Phòng đã đủ người.", "ROOM_FULL");

  // Status stays "waiting" here — joining just adds a seat in the lobby.
  // It only flips to "active" once the host presses Start (see
  // liveRoomManager.ts), which is also the moment new joins get cut off.
  return prisma.fightRoom.update({ where: { id: room.id }, data: { participants: { create: { childId: joinerChildId } } }, ...PARTICIPANT_SELECT });
}

export async function getRoomByCode(rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const room = await prisma.fightRoom.findUnique({ where: { code }, ...PARTICIPANT_SELECT });
  if (!room) throw new AppError(404, "Không tìm thấy phòng — kiểm tra lại mã.", "ROOM_NOT_FOUND");
  return room;
}
