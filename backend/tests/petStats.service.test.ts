import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  petStatsUpsert: vi.fn(),
  petStatsUpdate: vi.fn(),
  childFindUnique: vi.fn(),
  getProgress: vi.fn(),
  bumpQuestProgress: vi.fn(),
}));

vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    petStats: { upsert: mocks.petStatsUpsert, update: mocks.petStatsUpdate },
    child: { findUnique: mocks.childFindUnique },
  },
}));
vi.mock("../src/services/progress.service.js", () => ({ getProgress: mocks.getProgress }));
vi.mock("../src/services/quest.service.js", () => ({ bumpQuestProgress: mocks.bumpQuestProgress }));

import { addPetExperience, applyPetEffects, MAX_PET_LEVEL, resetPetLevel } from "../src/services/petStats.service.js";

const baseRow = {
  petKey: "buddy",
  customName: null,
  hunger: 70,
  happiness: 70,
  health: 70,
  experience: 0,
  level: 1,
};

describe("petStats service economy rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.petStatsUpsert.mockResolvedValue({ ...baseRow });
    mocks.petStatsUpdate.mockImplementation(async ({ data }: { data: Partial<typeof baseRow> }) => ({ ...baseRow, ...data }));
  });

  it("levels a new pet from level 1 to level 2 at 50 XP", async () => {
    const result = await addPetExperience("child-1", "buddy", 50);

    expect(result).toMatchObject({ experience: 50, level: 2, experienceToNextLevel: 56 });
    expect(mocks.petStatsUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { experience: 50, level: 2 } }));
  });

  it("caps XP and level at the level-30 ceiling", async () => {
    const result = await addPetExperience("child-1", "buddy", Number.MAX_SAFE_INTEGER);

    expect(result.level).toBe(MAX_PET_LEVEL);
    expect(result.experienceToNextLevel).toBe(0);
    expect(result.experience).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it("clamps care effects to the 0..100 stat range", async () => {
    mocks.petStatsUpsert.mockResolvedValue({ ...baseRow, hunger: 95, happiness: 4, health: 50 });

    const result = await applyPetEffects("child-1", "buddy", [
      { stat: "hunger", delta: 30 },
      { stat: "happiness", delta: -20 },
      { stat: "health", delta: 8 },
    ]);

    expect(result).toMatchObject({ hunger: 100, happiness: 0, health: 58 });
  });

  it("resets only level and XP, preserving care stats", async () => {
    mocks.petStatsUpdate.mockResolvedValue({ ...baseRow, hunger: 22, happiness: 81, health: 64, experience: 0, level: 1 });

    const result = await resetPetLevel("child-1", "buddy");

    expect(mocks.petStatsUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { experience: 0, level: 1 } }));
    expect(result).toMatchObject({ hunger: 22, happiness: 81, health: 64, experience: 0, level: 1 });
  });
});
