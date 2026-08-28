import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { StoryPageInput, UpdateStoryPageInput } from "../../schemas/admin.schema.js";
import { getStory } from "./stories.service.js";

type StoryWord = { en: string; vi: string; color: string };
type RawPage = { id: string; storyId: string; en: string; vi: string; img1: string; img2: string; label: string; sceneBg: string; ground: string; words: unknown; order: number };

function toClient(p: RawPage) {
  return { ...p, words: Array.isArray(p.words) ? (p.words as StoryWord[]) : [] };
}

export async function listPagesByStory(storyId: string, ownerId?: string) {
  await getStory(storyId, ownerId);
  const rows = await prisma.storyPage.findMany({ where: { storyId }, orderBy: [{ order: "asc" }, { id: "asc" }] });
  return rows.map(toClient);
}

async function getPageOrThrow(id: string, ownerId?: string) {
  const page = await prisma.storyPage.findUnique({ where: { id }, include: { story: true } });
  if (!page || (ownerId !== undefined && page.story.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy trang truyện.", "STORY_PAGE_NOT_FOUND");
  }
  return page;
}

export async function createPage(storyId: string, input: StoryPageInput, ownerId?: string) {
  await getStory(storyId, ownerId);
  const row = await prisma.storyPage.create({ data: { ...input, storyId } });
  return toClient(row);
}

export async function updatePage(id: string, input: UpdateStoryPageInput, ownerId?: string) {
  await getPageOrThrow(id, ownerId);
  const row = await prisma.storyPage.update({ where: { id }, data: input });
  return toClient(row);
}

export async function deletePage(id: string, ownerId?: string) {
  await getPageOrThrow(id, ownerId);
  await prisma.storyPage.delete({ where: { id } });
}
