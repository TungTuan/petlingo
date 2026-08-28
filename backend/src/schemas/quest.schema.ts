import { z } from "zod";

// "petCare" isn't accepted here on purpose — that quest's progress is bumped
// server-side from careForPet() itself once a real care action lands, not
// self-reported by the client. lessons/miniGame stay client-trusted the same
// way Lesson.tsx's/MiniGame's coin rewards already are (see mergeProgress) —
// amount is capped small so a single call can't finish a quest outright.
export const bumpQuestSchema = z.object({
  trackKind: z.enum(["lessons", "miniGame"]),
  amount: z.number().int().min(1).max(5),
});
export type BumpQuestInput = z.infer<typeof bumpQuestSchema>;
