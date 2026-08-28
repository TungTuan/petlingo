import { z } from "zod";
import {
  updateChatBuddyTopicSchema,
  updateDetectiveCaseSchema,
  updateEchoParrotTopicSchema,
  updateHomeTopicSchema,
  updateMiniGameTopicSchema,
  updateRpgTopicSchema,
  updateShopTopicSchema,
  updateStorySchema,
  updateWordCatchTopicSchema,
  updateWordTrainTopicSchema,
} from "./admin.schema.js";

/**
 * Self-serve content creation — what a regular PARENT (not just admin) can
 * submit for their own Lesson/Story/MiniGameTopic/WordCatchTopic. Deliberately
 * smaller than the matching admin schema in admin.schema.ts: no `key` slug,
 * no `colorTheme`/`color` hex picking, no `order`/`isActive` toggles — those
 * get sensible server-side defaults (see services/admin/*.service.ts's
 * createOwn*() helpers) so a parent only fills in what actually matters to
 * them. Nested rows (questions, story pages, minigame words, wordcatch
 * rounds) reuse the exact same schemas admin uses — those already have no
 * awkward admin-only fields to strip out.
 */

export const myLessonSchema = z.object({
  worldId: z.string().trim().min(1, "Chọn 1 vùng để gắn bài học."),
  title: z.string().trim().min(1),
});
export type MyLessonInput = z.infer<typeof myLessonSchema>;

export const myStorySchema = z.object({
  title: z.string().trim().min(1),
  topic: z.string().trim().min(1),
});
export type MyStoryInput = z.infer<typeof myStorySchema>;

export const myMiniGameTopicSchema = z.object({
  name: z.string().trim().min(1),
});
export type MyMiniGameTopicInput = z.infer<typeof myMiniGameTopicSchema>;

export const myWordCatchTopicSchema = z.object({
  name: z.string().trim().min(1),
});
export type MyWordCatchTopicInput = z.infer<typeof myWordCatchTopicSchema>;

export const myShopTopicSchema = z.object({
  name: z.string().trim().min(1),
});
export type MyShopTopicInput = z.infer<typeof myShopTopicSchema>;

export const myHomeTopicSchema = z.object({
  name: z.string().trim().min(1),
});
export type MyHomeTopicInput = z.infer<typeof myHomeTopicSchema>;

export const myRpgTopicSchema = z.object({
  name: z.string().trim().min(1),
});
export type MyRpgTopicInput = z.infer<typeof myRpgTopicSchema>;

export const myWordTrainTopicSchema = z.object({
  name: z.string().trim().min(1),
});
export type MyWordTrainTopicInput = z.infer<typeof myWordTrainTopicSchema>;

// Unlike the other self-serve topic schemas above, a Detective "case" has no
// meaning without its own scenario text (there's nothing sensible to
// auto-fill it with) — so this one asks for scenario/scenarioVi too, not just a name.
export const myDetectiveCaseSchema = z.object({
  name: z.string().trim().min(1),
  scenario: z.string().trim().min(1),
  scenarioVi: z.string().trim().min(1),
});
export type MyDetectiveCaseInput = z.infer<typeof myDetectiveCaseSchema>;

export const myEchoParrotTopicSchema = z.object({
  name: z.string().trim().min(1),
});
export type MyEchoParrotTopicInput = z.infer<typeof myEchoParrotTopicSchema>;

export const myChatBuddyTopicSchema = z.object({
  name: z.string().trim().min(1),
});
export type MyChatBuddyTopicInput = z.infer<typeof myChatBuddyTopicSchema>;

// Update schemas for self-serve edits — same shape as the admin ones minus
// `key` (a parent must never be able to hijack another row's slug/identity).
export const myUpdateStorySchema = updateStorySchema.omit({ key: true });
export const myUpdateMiniGameTopicSchema = updateMiniGameTopicSchema.omit({ key: true });
export const myUpdateWordCatchTopicSchema = updateWordCatchTopicSchema.omit({ key: true });
export const myUpdateShopTopicSchema = updateShopTopicSchema.omit({ key: true });
export const myUpdateHomeTopicSchema = updateHomeTopicSchema.omit({ key: true });
export const myUpdateRpgTopicSchema = updateRpgTopicSchema.omit({ key: true });
export const myUpdateWordTrainTopicSchema = updateWordTrainTopicSchema.omit({ key: true });
export const myUpdateDetectiveCaseSchema = updateDetectiveCaseSchema.omit({ key: true });
export const myUpdateEchoParrotTopicSchema = updateEchoParrotTopicSchema.omit({ key: true });
export const myUpdateChatBuddyTopicSchema = updateChatBuddyTopicSchema.omit({ key: true });
