import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

async function getOwnedChildOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  return child;
}

/**
 * "Từ đã lưu" — words a child bookmarked from the Dictionary screen
 * (frontend/public/dictionary/words.json, bundled with the app for offline
 * search). Only the `word` key is stored here; meaning/phonetic/example are
 * looked up client-side from that bundled file, so this stays a tiny table
 * that just answers "which words has this child saved". Feeds Topics.tsx/
 * SrsCard.tsx's real review deck and the suggestion chips in MyContent.tsx.
 */
export async function listSavedWords(childId: string, parentId: string): Promise<string[]> {
  await getOwnedChildOrThrow(childId, parentId);
  const rows = await prisma.savedWord.findMany({ where: { childId }, orderBy: { createdAt: "desc" }, select: { word: true } });
  return rows.map((r) => r.word);
}

export async function saveWord(childId: string, parentId: string, word: string): Promise<string[]> {
  await getOwnedChildOrThrow(childId, parentId);
  await prisma.savedWord.upsert({
    where: { childId_word: { childId, word } },
    update: {},
    create: { childId, word },
  });
  return listSavedWords(childId, parentId);
}

export async function unsaveWord(childId: string, parentId: string, word: string): Promise<string[]> {
  await getOwnedChildOrThrow(childId, parentId);
  await prisma.savedWord.deleteMany({ where: { childId, word } });
  return listSavedWords(childId, parentId);
}
