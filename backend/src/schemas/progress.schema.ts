import { z } from "zod";

export const putProgressSchema = z.object({
  coins: z.number().int().min(0),
  gems: z.number().int().min(0),
  unlockedPets: z.array(z.string()),
  unlockedWorlds: z.array(z.string()),
  // Which unlocked pet is the active companion (shown on Home/PetCare) — last
  // write wins, not merged like coins/unlocks (it's a single choice, not
  // something that only ever grows).
  activePetId: z.string().nullable(),
  // Client's own clock isn't trusted for streak math (see mergeProgress),
  // but we still record what it *thinks* "now" is for the lastActiveDate input.
  lastActiveDate: z.coerce.date(),
  localVersion: z.number().int().min(0),
});
export type PutProgressInput = z.infer<typeof putProgressSchema>;

export const petKeySchema = z.object({
  petKey: z.string().trim().min(1).max(80),
});

export const fusePetsSchema = z.object({
  rarity: z.enum(["Common", "Rare", "Epic"]),
  materials: z.array(z.object({
    petKey: z.string().trim().min(1).max(80),
    source: z.enum(["primary", "egg"]),
  })).length(3),
});

export const rankVisibilitySchema = z.object({
  hidden: z.boolean(),
});
