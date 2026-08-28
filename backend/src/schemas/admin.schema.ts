import { z } from "zod";

export const listQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["PARENT", "ADMIN"]).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

const rarity = z.enum(["Common", "Rare", "Epic", "Legendary"]);
const currency = z.enum(["coin", "gem"]);

export const petSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Chỉ dùng chữ thường, số và dấu gạch ngang."),
  name: z.string().trim().min(1),
  species: z.string().trim().min(1),
  rarity,
  price: z.number().int().min(0),
  currency,
  imagePath: z.string().trim().min(1),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updatePetSchema = petSchema.partial();
export type PetInput = z.infer<typeof petSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;

const itemCategory = z.enum(["food", "toy", "accessory", "special"]);
const itemEffect = z.object({
  stat: z.enum(["hunger", "happiness", "health", "coins", "experience", "resetLevel"]),
  delta: z.number().int(),
});

export const itemSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Chỉ dùng chữ thường, số và dấu gạch ngang."),
  name: z.string().trim().min(1),
  category: itemCategory,
  color: z.string().trim().min(1),
  radius: z.string().trim().min(1).default("12px"),
  description: z.string().trim().min(1),
  effects: z.array(itemEffect).default([]),
  price: z.number().int().min(0).default(0),
  currency: z.enum(["coin", "gem"]).default("coin"),
  imagePath: z.string().trim().default(""),
  defaultQty: z.number().int().min(0).default(0),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateItemSchema = itemSchema.partial();
export type ItemInput = z.infer<typeof itemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

const questTrackKind = z.enum(["lessons", "miniGame", "petCare"]);

export const dailyQuestSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Chỉ dùng chữ thường, số và dấu gạch ngang."),
  title: z.string().trim().min(1),
  trackKind: questTrackKind,
  target: z.number().int().min(1),
  rewardCoins: z.number().int().min(0),
  color: z.string().trim().min(1),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateDailyQuestSchema = dailyQuestSchema.partial();
export type DailyQuestInput = z.infer<typeof dailyQuestSchema>;
export type UpdateDailyQuestInput = z.infer<typeof updateDailyQuestSchema>;

export const worldSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Chỉ dùng chữ thường, số và dấu gạch ngang."),
  name: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  colorTheme: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  requiredStars: z.number().int().min(0).default(0),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateWorldSchema = worldSchema.partial();
export type WorldInput = z.infer<typeof worldSchema>;
export type UpdateWorldInput = z.infer<typeof updateWorldSchema>;

export const lessonSchema = z.object({
  title: z.string().trim().min(1),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateLessonSchema = lessonSchema.partial();
export type LessonInput = z.infer<typeof lessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;

export const questionSchema = z
  .object({
    prompt: z.string().trim().min(1),
    hint: z.string().trim().optional(),
    answer: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(2).max(6),
    order: z.number().int().default(0),
  })
  .refine((q) => q.options.includes(q.answer), { message: "Đáp án phải nằm trong danh sách lựa chọn.", path: ["answer"] });
export const updateQuestionSchema = z.object({
  prompt: z.string().trim().min(1).optional(),
  hint: z.string().trim().optional(),
  answer: z.string().trim().min(1).optional(),
  options: z.array(z.string().trim().min(1)).min(2).max(6).optional(),
  order: z.number().int().optional(),
});
export type QuestionInput = z.infer<typeof questionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

const slugKey = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9-]+$/, "Chỉ dùng chữ thường, số và dấu gạch ngang.");

export const storySchema = z.object({
  key: slugKey,
  title: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  colorTheme: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateStorySchema = storySchema.partial();
export type StoryInput = z.infer<typeof storySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;

const storyWord = z.object({
  en: z.string().trim().min(1),
  vi: z.string().trim().min(1),
  /** Tuỳ chọn — rỗng thì pickLang() (catalog.service.ts) rơi về vi. */
  ja: z.string().trim().min(1).optional(),
  ko: z.string().trim().min(1).optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
});

export const storyPageSchema = z.object({
  en: z.string().trim().min(1),
  vi: z.string().trim().min(1),
  ja: z.string().trim().min(1).optional(),
  ko: z.string().trim().min(1).optional(),
  img1: z.string().trim().min(1),
  img2: z.string().trim().min(1),
  label: z.string().trim().min(1),
  sceneBg: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  ground: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  words: z.array(storyWord).default([]),
  order: z.number().int().default(0),
});
export const updateStoryPageSchema = z.object({
  en: z.string().trim().min(1).optional(),
  vi: z.string().trim().min(1).optional(),
  ja: z.string().trim().min(1).optional(),
  ko: z.string().trim().min(1).optional(),
  img1: z.string().trim().min(1).optional(),
  img2: z.string().trim().min(1).optional(),
  label: z.string().trim().min(1).optional(),
  sceneBg: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  ground: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  words: z.array(storyWord).optional(),
  order: z.number().int().optional(),
});
export type StoryPageInput = z.infer<typeof storyPageSchema>;
export type UpdateStoryPageInput = z.infer<typeof updateStoryPageSchema>;

export const miniGameTopicSchema = z.object({
  key: slugKey,
  name: z.string().trim().min(1),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateMiniGameTopicSchema = miniGameTopicSchema.partial();
export type MiniGameTopicInput = z.infer<typeof miniGameTopicSchema>;
export type UpdateMiniGameTopicInput = z.infer<typeof updateMiniGameTopicSchema>;

export const miniGameWordSchema = z.object({
  en: z.string().trim().min(1),
  vi: z.string().trim().min(1),
  /** Tuỳ chọn — rỗng thì pickLang() (catalog.service.ts) rơi về vi. */
  ja: z.string().trim().min(1).optional(),
  ko: z.string().trim().min(1).optional(),
  /** A Pet.key (reuses the pet art) or a single emoji glyph — see frontend's isPetKey(). */
  img: z.string().trim().min(1),
  order: z.number().int().default(0),
});
export const updateMiniGameWordSchema = miniGameWordSchema.partial();
export type MiniGameWordInput = z.infer<typeof miniGameWordSchema>;
export type UpdateMiniGameWordInput = z.infer<typeof updateMiniGameWordSchema>;

export const wordCatchTopicSchema = z.object({
  key: slugKey,
  name: z.string().trim().min(1),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateWordCatchTopicSchema = wordCatchTopicSchema.partial();
export type WordCatchTopicInput = z.infer<typeof wordCatchTopicSchema>;
export type UpdateWordCatchTopicInput = z.infer<typeof updateWordCatchTopicSchema>;

export const wordCatchRoundSchema = z
  .object({
    vi: z.string().trim().min(1),
    /** Tuỳ chọn — rỗng thì pickLang() (catalog.service.ts) rơi về vi. */
    ja: z.string().trim().min(1).optional(),
    ko: z.string().trim().min(1).optional(),
    answer: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(2).max(6),
    order: z.number().int().default(0),
  })
  .refine((r) => r.options.includes(r.answer), { message: "Đáp án phải nằm trong danh sách lựa chọn.", path: ["answer"] });
export const updateWordCatchRoundSchema = z.object({
  vi: z.string().trim().min(1).optional(),
  ja: z.string().trim().min(1).optional(),
  ko: z.string().trim().min(1).optional(),
  answer: z.string().trim().min(1).optional(),
  options: z.array(z.string().trim().min(1)).min(2).max(6).optional(),
  order: z.number().int().optional(),
});
export type WordCatchRoundInput = z.infer<typeof wordCatchRoundSchema>;
export type UpdateWordCatchRoundInput = z.infer<typeof updateWordCatchRoundSchema>;

export const shopTopicSchema = z.object({
  key: slugKey,
  name: z.string().trim().min(1),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateShopTopicSchema = shopTopicSchema.partial();
export type ShopTopicInput = z.infer<typeof shopTopicSchema>;
export type UpdateShopTopicInput = z.infer<typeof updateShopTopicSchema>;

/** 1 item on the shelf — `price` is small in-universe play money, not a real currency. */
const shopShelfItem = z.object({
  en: z.string().trim().min(1),
  vi: z.string().trim().min(1),
  /** Tuỳ chọn — rỗng thì pickLang() (catalog.service.ts) rơi về vi. */
  ja: z.string().trim().min(1).optional(),
  ko: z.string().trim().min(1).optional(),
  emoji: z.string().trim().min(1),
  price: z.number().positive(),
});
const shopRequiredItem = z.object({
  en: z.string().trim().min(1),
  qty: z.number().int().positive(),
});
export const shopRoundSchema = z
  .object({
    instructionEn: z.string().trim().min(1),
    instructionVi: z.string().trim().min(1),
    instructionJa: z.string().trim().min(1).optional(),
    instructionKo: z.string().trim().min(1).optional(),
    shelf: z.array(shopShelfItem).min(2).max(12),
    required: z.array(shopRequiredItem).min(1).max(6),
    order: z.number().int().default(0),
  })
  .refine((r) => r.required.every((req) => r.shelf.filter((s) => s.en === req.en).length >= req.qty), {
    message: "Kệ hàng phải có đủ số lượng mỗi món cần mua.",
    path: ["shelf"],
  });
// No cross-field .refine() here (mirrors updateWordCatchRoundSchema) since a
// partial update might only touch `shelf` OR `required` — the shelf/required
// consistency check happens in services/admin/shopRounds.service.ts's
// updateRound() instead, against whichever of the two didn't change.
export const updateShopRoundSchema = z.object({
  instructionEn: z.string().trim().min(1).optional(),
  instructionVi: z.string().trim().min(1).optional(),
  instructionJa: z.string().trim().min(1).optional(),
  instructionKo: z.string().trim().min(1).optional(),
  shelf: z.array(shopShelfItem).min(2).max(12).optional(),
  required: z.array(shopRequiredItem).min(1).max(6).optional(),
  order: z.number().int().optional(),
});
export type ShopRoundInput = z.infer<typeof shopRoundSchema>;
export type UpdateShopRoundInput = z.infer<typeof updateShopRoundSchema>;
export type ShopShelfItem = z.infer<typeof shopShelfItem>;
export type ShopRequiredItem = z.infer<typeof shopRequiredItem>;

export const homeTopicSchema = z.object({
  key: slugKey,
  name: z.string().trim().min(1),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateHomeTopicSchema = homeTopicSchema.partial();
export type HomeTopicInput = z.infer<typeof homeTopicSchema>;
export type UpdateHomeTopicInput = z.infer<typeof updateHomeTopicSchema>;

const homeObject = z.object({
  key: z.string().trim().min(1),
  en: z.string().trim().min(1),
  emoji: z.string().trim().min(1),
  /** Hex swatch shown behind the emoji — teaches the color word, since most emoji can't be recolored. */
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
});
const homeZone = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  emoji: z.string().trim().min(1),
});
export const homeRoundSchema = z
  .object({
    instructionEn: z.string().trim().min(1),
    instructionVi: z.string().trim().min(1),
    instructionJa: z.string().trim().min(1).optional(),
    instructionKo: z.string().trim().min(1).optional(),
    objects: z.array(homeObject).min(2).max(6),
    correctObjectKey: z.string().trim().min(1),
    zones: z.array(homeZone).min(2).max(6),
    correctZoneKey: z.string().trim().min(1),
    order: z.number().int().default(0),
  })
  .refine((r) => r.objects.some((o) => o.key === r.correctObjectKey), { message: "correctObjectKey phải trùng 1 key trong objects.", path: ["correctObjectKey"] })
  .refine((r) => r.zones.some((z) => z.key === r.correctZoneKey), { message: "correctZoneKey phải trùng 1 key trong zones.", path: ["correctZoneKey"] });
// No cross-field .refine() on the update schema (same reasoning as
// updateShopRoundSchema) — a partial update might only touch one side, so
// the consistency check happens in services/admin/homeRounds.service.ts's
// updateRound() against whichever field didn't change.
export const updateHomeRoundSchema = z.object({
  instructionEn: z.string().trim().min(1).optional(),
  instructionVi: z.string().trim().min(1).optional(),
  instructionJa: z.string().trim().min(1).optional(),
  instructionKo: z.string().trim().min(1).optional(),
  objects: z.array(homeObject).min(2).max(6).optional(),
  correctObjectKey: z.string().trim().min(1).optional(),
  zones: z.array(homeZone).min(2).max(6).optional(),
  correctZoneKey: z.string().trim().min(1).optional(),
  order: z.number().int().optional(),
});
export type HomeRoundInput = z.infer<typeof homeRoundSchema>;
export type UpdateHomeRoundInput = z.infer<typeof updateHomeRoundSchema>;
export type HomeObject = z.infer<typeof homeObject>;
export type HomeZone = z.infer<typeof homeZone>;

export const rpgTopicSchema = z.object({
  key: slugKey,
  name: z.string().trim().min(1),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateRpgTopicSchema = rpgTopicSchema.partial();
export type RpgTopicInput = z.infer<typeof rpgTopicSchema>;
export type UpdateRpgTopicInput = z.infer<typeof updateRpgTopicSchema>;

// answerVi/optionsVi là dữ liệu gốc (tên cũ "answer"/"options", đổi tên khi
// thêm đa ngôn ngữ — xem schema.prisma's doc comment trên RpgMonster.questions).
// answerJa/optionsJa và answerKo/optionsKo tuỳ chọn: dịch `options` GIỮ NGUYÊN
// THỨ TỰ với optionsVi để chỉ số của answer khớp nhau giữa các ngôn ngữ (xem
// catalog.service.ts's getRpgTopicWithMonsters()) — mỗi refine dưới đây chỉ
// kiểm tra khi ngôn ngữ đó thực sự có mặt.
const rpgQuestion = z
  .object({
    en: z.string().trim().min(1),
    answerVi: z.string().trim().min(1),
    optionsVi: z.array(z.string().trim().min(1)).min(2).max(6),
    answerJa: z.string().trim().min(1).optional(),
    optionsJa: z.array(z.string().trim().min(1)).min(2).max(6).optional(),
    answerKo: z.string().trim().min(1).optional(),
    optionsKo: z.array(z.string().trim().min(1)).min(2).max(6).optional(),
  })
  .refine((q) => q.optionsVi.includes(q.answerVi), { message: "Đáp án phải nằm trong danh sách lựa chọn.", path: ["answerVi"] })
  .refine((q) => !q.answerJa || !q.optionsJa || q.optionsJa.includes(q.answerJa), { message: "Đáp án tiếng Nhật phải nằm trong danh sách lựa chọn tiếng Nhật.", path: ["answerJa"] })
  .refine((q) => !q.answerKo || !q.optionsKo || q.optionsKo.includes(q.answerKo), { message: "Đáp án tiếng Hàn phải nằm trong danh sách lựa chọn tiếng Hàn.", path: ["answerKo"] });
export const rpgMonsterSchema = z.object({
  name: z.string().trim().min(1),
  emoji: z.string().trim().min(1),
  isBoss: z.boolean().default(false),
  questions: z.array(rpgQuestion).min(1).max(10),
  order: z.number().int().default(0),
});
export const updateRpgMonsterSchema = z.object({
  name: z.string().trim().min(1).optional(),
  emoji: z.string().trim().min(1).optional(),
  isBoss: z.boolean().optional(),
  questions: z.array(rpgQuestion).min(1).max(10).optional(),
  order: z.number().int().optional(),
});
export type RpgMonsterInput = z.infer<typeof rpgMonsterSchema>;
export type UpdateRpgMonsterInput = z.infer<typeof updateRpgMonsterSchema>;
export type RpgQuestion = z.infer<typeof rpgQuestion>;

export const wordTrainTopicSchema = z.object({
  key: slugKey,
  name: z.string().trim().min(1),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateWordTrainTopicSchema = wordTrainTopicSchema.partial();
export type WordTrainTopicInput = z.infer<typeof wordTrainTopicSchema>;
export type UpdateWordTrainTopicInput = z.infer<typeof updateWordTrainTopicSchema>;

const wordTrainFillData = z.object({
  word: z
    .string()
    .trim()
    .min(1)
    .transform((s) => s.toUpperCase()),
  blankIndex: z.number().int().min(0),
  options: z
    .array(
      z
        .string()
        .trim()
        .length(1)
        .transform((s) => s.toUpperCase()),
    )
    .min(2)
    .max(6),
});
const wordTrainScrambleData = z.object({
  /** Correct-order tokens — the client shuffles a copy for display and checks the player's arrangement against this order. */
  words: z.array(z.string().trim().min(1)).min(2).max(10),
});

export const wordTrainRoundSchema = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("fill"),
      vi: z.string().trim().min(1),
      ja: z.string().trim().min(1).optional(),
      ko: z.string().trim().min(1).optional(),
      data: wordTrainFillData,
      order: z.number().int().default(0),
    }),
    z.object({
      kind: z.literal("scramble"),
      vi: z.string().trim().min(1),
      ja: z.string().trim().min(1).optional(),
      ko: z.string().trim().min(1).optional(),
      data: wordTrainScrambleData,
      order: z.number().int().default(0),
    }),
  ])
  .refine((r) => r.kind !== "fill" || (r.data.blankIndex < r.data.word.length && r.data.options.includes(r.data.word[r.data.blankIndex]!)), {
    message: "blankIndex phải nằm trong độ dài từ, và options phải chứa đúng chữ cái bị che.",
    path: ["data"],
  });
// No cross-field .refine() on the update schema (same reasoning as
// updateShopRoundSchema/updateHomeRoundSchema) — services/admin/wordTrainRounds.service.ts's
// updateRound() re-validates against whichever fields didn't change.
export const updateWordTrainRoundSchema = z.object({
  kind: z.enum(["fill", "scramble"]).optional(),
  vi: z.string().trim().min(1).optional(),
  ja: z.string().trim().min(1).optional(),
  ko: z.string().trim().min(1).optional(),
  data: z.union([wordTrainFillData, wordTrainScrambleData]).optional(),
  order: z.number().int().optional(),
});
export type WordTrainRoundInput = z.infer<typeof wordTrainRoundSchema>;
export type UpdateWordTrainRoundInput = z.infer<typeof updateWordTrainRoundSchema>;
export type WordTrainFillData = z.infer<typeof wordTrainFillData>;
export type WordTrainScrambleData = z.infer<typeof wordTrainScrambleData>;

export const detectiveCaseSchema = z.object({
  key: slugKey,
  name: z.string().trim().min(1),
  scenario: z.string().trim().min(1),
  scenarioVi: z.string().trim().min(1),
  /** Tuỳ chọn — rỗng thì pickLang() (catalog.service.ts) rơi về scenarioVi. */
  scenarioJa: z.string().trim().min(1).optional(),
  scenarioKo: z.string().trim().min(1).optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateDetectiveCaseSchema = detectiveCaseSchema.partial();
export type DetectiveCaseInput = z.infer<typeof detectiveCaseSchema>;
export type UpdateDetectiveCaseInput = z.infer<typeof updateDetectiveCaseSchema>;

const detectiveInterrogateData = z.object({
  npcName: z.string().trim().min(1),
  npcEmoji: z.string().trim().min(1),
  testimony: z.string().trim().min(1),
  testimonyVi: z.string().trim().min(1),
  /** Tuỳ chọn — rỗng thì pickLang() (catalog.service.ts) rơi về testimonyVi. */
  testimonyJa: z.string().trim().min(1).optional(),
  testimonyKo: z.string().trim().min(1).optional(),
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).min(2).max(4),
  answerIndex: z.number().int().min(0),
  /** Tên cũ "clue" — đổi tên khi thêm đa ngôn ngữ (xem schema.prisma). ja/ko
   * tuỳ chọn, rỗng thì pickLang() rơi về clueVi. */
  clueVi: z.string().trim().min(1),
  clueJa: z.string().trim().min(1).optional(),
  clueKo: z.string().trim().min(1).optional(),
});
const detectiveAccuseData = z.object({
  /** Correct-order-agnostic — just the roster of suspects shown as the final "who did it?" choices. */
  suspects: z.array(z.string().trim().min(1)).min(2).max(4),
  correctSuspect: z.string().trim().min(1),
});

export const detectiveRoundSchema = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("interrogate"),
      vi: z.string().trim().min(1),
      ja: z.string().trim().min(1).optional(),
      ko: z.string().trim().min(1).optional(),
      data: detectiveInterrogateData,
      order: z.number().int().default(0),
    }),
    z.object({
      kind: z.literal("accuse"),
      vi: z.string().trim().min(1),
      ja: z.string().trim().min(1).optional(),
      ko: z.string().trim().min(1).optional(),
      data: detectiveAccuseData,
      order: z.number().int().default(0),
    }),
  ])
  .refine((r) => r.kind !== "interrogate" || r.data.answerIndex < r.data.options.length, {
    message: "answerIndex phải nằm trong khoảng số lượng options.",
    path: ["data"],
  })
  .refine((r) => r.kind !== "accuse" || r.data.suspects.includes(r.data.correctSuspect), {
    message: "correctSuspect phải nằm trong danh sách suspects.",
    path: ["data"],
  });
// No cross-field .refine() on the update schema (same reasoning as
// updateWordTrainRoundSchema) — services/admin/detectiveRounds.service.ts's
// updateRound() re-validates against whichever fields didn't change.
export const updateDetectiveRoundSchema = z.object({
  kind: z.enum(["interrogate", "accuse"]).optional(),
  vi: z.string().trim().min(1).optional(),
  ja: z.string().trim().min(1).optional(),
  ko: z.string().trim().min(1).optional(),
  data: z.union([detectiveInterrogateData, detectiveAccuseData]).optional(),
  order: z.number().int().optional(),
});
export type DetectiveRoundInput = z.infer<typeof detectiveRoundSchema>;
export type UpdateDetectiveRoundInput = z.infer<typeof updateDetectiveRoundSchema>;
export type DetectiveInterrogateData = z.infer<typeof detectiveInterrogateData>;
export type DetectiveAccuseData = z.infer<typeof detectiveAccuseData>;

export const echoParrotTopicSchema = z.object({
  key: slugKey,
  name: z.string().trim().min(1),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateEchoParrotTopicSchema = echoParrotTopicSchema.partial();
export type EchoParrotTopicInput = z.infer<typeof echoParrotTopicSchema>;
export type UpdateEchoParrotTopicInput = z.infer<typeof updateEchoParrotTopicSchema>;

export const echoParrotRoundSchema = z.object({
  en: z.string().trim().min(1),
  vi: z.string().trim().min(1),
  /** Tuỳ chọn — rỗng thì pickLang() (catalog.service.ts) rơi về vi. */
  ja: z.string().trim().min(1).optional(),
  ko: z.string().trim().min(1).optional(),
  /** Optional IPA hint (vd "/ˈæp.əl/") — chỉ hiện tham khảo, không dùng để chấm điểm. */
  phonetic: z.string().trim().min(1).optional(),
  order: z.number().int().default(0),
});
export const updateEchoParrotRoundSchema = echoParrotRoundSchema.partial();
export type EchoParrotRoundInput = z.infer<typeof echoParrotRoundSchema>;
export type UpdateEchoParrotRoundInput = z.infer<typeof updateEchoParrotRoundSchema>;

// ---- Chat with Buddy (2026-08-28) — interactive multi-turn dialogue, easier than Detective ----

export const chatBuddyTopicSchema = z.object({
  key: slugKey,
  name: z.string().trim().min(1),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu dạng #RRGGBB."),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const updateChatBuddyTopicSchema = chatBuddyTopicSchema.partial();
export type ChatBuddyTopicInput = z.infer<typeof chatBuddyTopicSchema>;
export type UpdateChatBuddyTopicInput = z.infer<typeof updateChatBuddyTopicSchema>;

const chatBuddyRoundData = z.object({
  petLine: z.string().trim().min(1),
  petLineVi: z.string().trim().min(1),
  /** Tuỳ chọn — rỗng thì pickLang() (catalog.service.ts) rơi về bản vi tương ứng. */
  petLineJa: z.string().trim().min(1).optional(),
  petLineKo: z.string().trim().min(1).optional(),
  options: z.array(z.string().trim().min(1)).min(2).max(4),
  optionsVi: z.array(z.string().trim().min(1)).min(2).max(4),
  optionsJa: z.array(z.string().trim().min(1)).min(2).max(4).optional(),
  optionsKo: z.array(z.string().trim().min(1)).min(2).max(4).optional(),
  answerIndex: z.number().int().min(0),
  replyLine: z.string().trim().min(1),
  replyLineVi: z.string().trim().min(1),
  replyLineJa: z.string().trim().min(1).optional(),
  replyLineKo: z.string().trim().min(1).optional(),
});
function assertChatBuddyDataValid(data: z.infer<typeof chatBuddyRoundData>): boolean {
  if (data.answerIndex >= data.options.length) return false;
  if (data.optionsVi.length !== data.options.length) return false;
  if (data.optionsJa && data.optionsJa.length !== data.options.length) return false;
  if (data.optionsKo && data.optionsKo.length !== data.options.length) return false;
  return true;
}
export const chatBuddyRoundSchema = z
  .object({
    data: chatBuddyRoundData,
    order: z.number().int().default(0),
  })
  .refine((r) => assertChatBuddyDataValid(r.data), {
    message: "answerIndex phải nằm trong khoảng số lượng options, và optionsVi/optionsJa/optionsKo phải cùng độ dài với options.",
    path: ["data"],
  });
// No cross-field .refine() on the update schema (same reasoning as
// updateWordTrainRoundSchema) — services/admin/chatBuddyRounds.service.ts's
// updateRound() re-validates against whichever fields didn't change.
export const updateChatBuddyRoundSchema = z.object({
  data: chatBuddyRoundData.optional(),
  order: z.number().int().optional(),
});
export type ChatBuddyRoundInput = z.infer<typeof chatBuddyRoundSchema>;
export type UpdateChatBuddyRoundInput = z.infer<typeof updateChatBuddyRoundSchema>;
export type ChatBuddyRoundData = z.infer<typeof chatBuddyRoundData>;

// ---- Battle Pass (2026-08-28) — season + 30-tier ladder, admin-authored content ----

export const battlePassSeasonSchema = z.object({
  name: z.string().trim().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});
export const updateBattlePassSeasonSchema = battlePassSeasonSchema.partial();
export type BattlePassSeasonInput = z.infer<typeof battlePassSeasonSchema>;
export type UpdateBattlePassSeasonInput = z.infer<typeof updateBattlePassSeasonSchema>;

/** Matches battlePass.service.ts's grantReward() — the ONLY reward kinds that
 * actually do something when claimed, so the admin form can't configure a
 * tier into granting nothing by typo. */
const battlePassRewardKind = z.enum([
  "coins",
  "gems",
  "commonShards",
  "rareShards",
  "epicShards",
  "petEggCommon",
  "petEggRare",
  "petEggEpic",
  "petEggLegendary",
  "item",
]);

// .nullable() alongside .optional() on the item-key fields: the admin form
// always sends an explicit `null` (not just omits the key) when the reward
// kind isn't "item", since it's a controlled React input — plain .optional()
// only accepts `undefined`, so every non-"item" tier save was failing
// validation until this was added.
export const battlePassTierSchema = z
  .object({
    tier: z.number().int().min(1).max(30),
    xpRequired: z.number().int().min(0),
    freeRewardKind: battlePassRewardKind,
    freeRewardAmount: z.number().int().min(0).default(0),
    freeRewardItemKey: z.string().trim().min(1).nullable().optional(),
    vipRewardKind: battlePassRewardKind,
    vipRewardAmount: z.number().int().min(0).default(0),
    vipRewardItemKey: z.string().trim().min(1).nullable().optional(),
  })
  .refine((v) => v.freeRewardKind !== "item" || !!v.freeRewardItemKey, { message: "Quà miễn phí kiểu 'item' cần chọn vật phẩm.", path: ["freeRewardItemKey"] })
  .refine((v) => v.vipRewardKind !== "item" || !!v.vipRewardItemKey, { message: "Quà VIP kiểu 'item' cần chọn vật phẩm.", path: ["vipRewardItemKey"] });
export const updateBattlePassTierSchema = z.object({
  tier: z.number().int().min(1).max(30).optional(),
  xpRequired: z.number().int().min(0).optional(),
  freeRewardKind: battlePassRewardKind.optional(),
  freeRewardAmount: z.number().int().min(0).optional(),
  freeRewardItemKey: z.string().trim().min(1).nullable().optional(),
  vipRewardKind: battlePassRewardKind.optional(),
  vipRewardAmount: z.number().int().min(0).optional(),
  vipRewardItemKey: z.string().trim().min(1).nullable().optional(),
});
export type BattlePassTierInput = z.infer<typeof battlePassTierSchema>;
export type UpdateBattlePassTierInput = z.infer<typeof updateBattlePassTierSchema>;

export const claimBattlePassTierSchema = z.object({
  tier: z.number().int().min(1).max(30),
  track: z.enum(["free", "vip"]),
});
export type ClaimBattlePassTierInput = z.infer<typeof claimBattlePassTierSchema>;
