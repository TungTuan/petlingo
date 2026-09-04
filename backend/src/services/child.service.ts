import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type { CreateChildInput, UpdateChildInput } from "../schemas/child.schema.js";
import { PRIVACY_VERSION, TERMS_VERSION } from "../config/legal.js";

/**
 * Loads a child and verifies it belongs to `parentId`. Every mutation below
 * calls this first — without it, any logged-in parent could edit or delete
 * another family's child by guessing/enumerating ids. We return 404 rather
 * than 403 so a stranger's child id doesn't even reveal that it exists.
 */
async function getOwnedChildOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  return child;
}

// A brand-new child starts with a starter pet + the first two worlds
// unlocked so the game isn't literally empty — everything else (coins,
// gems, streak) genuinely starts at the schema's zero defaults. This used
// to be seeded from the frontend via a PUT /progress call instead, but
// that path always stamps lastActiveDate = now and computes streakDays = 1
// (see mergeProgress/computeStreak) — meaning just creating a profile
// silently counted as "day 1 of your streak" before the child had done
// anything at all, which then showed up as a false "already checked in
// yesterday" tick on the Nhiệm vụ calendar. Setting it here at creation
// time instead leaves lastActiveDate/streakDays untouched until the child
// does something real.
const STARTER_UNLOCKED_PETS = ["buddy", "mimi", "poppy"];
const STARTER_UNLOCKED_WORLDS = ["forest", "town"];

export async function createChild(parentId: string, input: CreateChildInput) {
  const parent = await prisma.parent.findUnique({ where: { id: parentId }, select: { legalAcceptedAt: true, termsVersion: true, privacyVersion: true } });
  if (!parent?.legalAcceptedAt || parent.termsVersion !== TERMS_VERSION || parent.privacyVersion !== PRIVACY_VERSION) {
    throw new AppError(403, "Phụ huynh cần đồng ý Điều khoản và Chính sách quyền riêng tư trước khi tạo hồ sơ trẻ.", "LEGAL_ACCEPTANCE_REQUIRED");
  }
  const child = await prisma.child.create({
    data: {
      parentId,
      displayName: input.displayName,
      avatarId: input.avatarId,
      birthYear: input.birthYear,
      // Every child gets a Progress row up front so the sync endpoint
      // never has to special-case "no progress yet".
      progress: { create: { activePetId: input.avatarId, unlockedPets: STARTER_UNLOCKED_PETS, unlockedWorlds: STARTER_UNLOCKED_WORLDS } },
    },
  });

  // Starter Kho đồ — every active Item with a defaultQty > 0 (admin-managed,
  // see Item.defaultQty in schema.prisma) is granted up front so Bag isn't
  // empty on day one.
  const starterItems = await prisma.item.findMany({ where: { isActive: true, defaultQty: { gt: 0 } } });
  if (starterItems.length > 0) {
    await prisma.childItem.createMany({
      data: starterItems.map((item) => ({ childId: child.id, itemId: item.id, quantity: item.defaultQty })),
    });
  }

  return child;
}

export async function listChildren(parentId: string) {
  return prisma.child.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateChild(parentId: string, childId: string, input: UpdateChildInput) {
  await getOwnedChildOrThrow(childId, parentId);
  return prisma.child.update({
    where: { id: childId },
    data: input,
  });
}

export async function deleteChild(parentId: string, childId: string) {
  await getOwnedChildOrThrow(childId, parentId);
  // Progress + ChildVocab rows cascade-delete at the DB level (see schema.prisma).
  await prisma.child.delete({ where: { id: childId } });
}
