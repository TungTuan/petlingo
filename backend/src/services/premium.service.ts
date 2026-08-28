import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Free-tier limit on self-serve content ("Nội dung của tôi") — applies
 * per content TYPE, not combined: a free account can have up to 5 of their
 * own Lessons AND (separately) up to 5 of their own Stories, etc. Nested
 * content (questions inside a lesson, pages inside a story...) is never
 * limited — once you have a lesson slot, you can fill it with as many
 * questions as make it a real lesson.
 */
const FREE_CONTENT_LIMIT = 5;

type OwnContentKind =
  | "lesson"
  | "story"
  | "miniGameTopic"
  | "wordCatchTopic"
  | "shopTopic"
  | "homeTopic"
  | "rpgTopic"
  | "wordTrainTopic"
  | "detectiveCase"
  | "echoParrotTopic"
  | "chatBuddyTopic";

async function countOwnContent(parentId: string, kind: OwnContentKind): Promise<number> {
  switch (kind) {
    case "lesson":
      return prisma.lesson.count({ where: { parentId } });
    case "story":
      return prisma.story.count({ where: { parentId } });
    case "miniGameTopic":
      return prisma.miniGameTopic.count({ where: { parentId } });
    case "wordCatchTopic":
      return prisma.wordCatchTopic.count({ where: { parentId } });
    case "shopTopic":
      return prisma.shopTopic.count({ where: { parentId } });
    case "homeTopic":
      return prisma.homeTopic.count({ where: { parentId } });
    case "rpgTopic":
      return prisma.rpgTopic.count({ where: { parentId } });
    case "wordTrainTopic":
      return prisma.wordTrainTopic.count({ where: { parentId } });
    case "detectiveCase":
      return prisma.detectiveCase.count({ where: { parentId } });
    case "echoParrotTopic":
      return prisma.echoParrotTopic.count({ where: { parentId } });
    case "chatBuddyTopic":
      return prisma.chatBuddyTopic.count({ where: { parentId } });
  }
}

/**
 * Throws a 403 if `parentId` is on the free tier and already has
 * `FREE_CONTENT_LIMIT` of their own `kind` — call this BEFORE creating a
 * new top-level self-serve item (lesson/story/topic), never for nested rows.
 */
export async function assertCanCreateOwnContent(parentId: string, kind: OwnContentKind): Promise<void> {
  const parent = await prisma.parent.findUniqueOrThrow({ where: { id: parentId } });
  if (parent.isPremium) return;

  const count = await countOwnContent(parentId, kind);
  if (count >= FREE_CONTENT_LIMIT) {
    throw new AppError(403, `Tài khoản thường chỉ tạo được tối đa ${FREE_CONTENT_LIMIT} mục loại này. Mở Premium để tạo không giới hạn.`, "CONTENT_LIMIT_REACHED");
  }
}

/** Powers the "3/5 bài học" progress the self-serve UI shows before a user hits the 403. */
export async function getQuotaStatus(parentId: string) {
  const parent = await prisma.parent.findUniqueOrThrow({ where: { id: parentId } });
  const [lesson, story, miniGameTopic, wordCatchTopic, shopTopic, homeTopic, rpgTopic, wordTrainTopic, detectiveCase, echoParrotTopic, chatBuddyTopic] = await Promise.all([
    countOwnContent(parentId, "lesson"),
    countOwnContent(parentId, "story"),
    countOwnContent(parentId, "miniGameTopic"),
    countOwnContent(parentId, "wordCatchTopic"),
    countOwnContent(parentId, "shopTopic"),
    countOwnContent(parentId, "homeTopic"),
    countOwnContent(parentId, "rpgTopic"),
    countOwnContent(parentId, "wordTrainTopic"),
    countOwnContent(parentId, "detectiveCase"),
    countOwnContent(parentId, "echoParrotTopic"),
    countOwnContent(parentId, "chatBuddyTopic"),
  ]);
  return {
    isPremium: parent.isPremium,
    limit: FREE_CONTENT_LIMIT,
    counts: { lesson, story, miniGameTopic, wordCatchTopic, shopTopic, homeTopic, rpgTopic, wordTrainTopic, detectiveCase, echoParrotTopic, chatBuddyTopic },
  };
}

export { FREE_CONTENT_LIMIT };
