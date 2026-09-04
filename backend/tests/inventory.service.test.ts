import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  childFindUnique: vi.fn(),
  childItemFindUnique: vi.fn(),
  childItemUpdate: vi.fn(),
  childItemUpsert: vi.fn(),
  childItemFindUniqueOrThrow: vi.fn(),
  itemFindFirst: vi.fn(),
  progressFindUnique: vi.fn(),
  progressUpdate: vi.fn(),
  transaction: vi.fn(),
  getProgress: vi.fn(),
  getPetStats: vi.fn(),
  applyPetEffects: vi.fn(),
  addPetExperience: vi.fn(),
  resetPetLevel: vi.fn(),
}));

vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    child: { findUnique: mocks.childFindUnique },
    childItem: {
      findUnique: mocks.childItemFindUnique,
      update: mocks.childItemUpdate,
      upsert: mocks.childItemUpsert,
      findUniqueOrThrow: mocks.childItemFindUniqueOrThrow,
    },
    item: { findFirst: mocks.itemFindFirst },
    progress: { findUnique: mocks.progressFindUnique, update: mocks.progressUpdate },
    $transaction: mocks.transaction,
  },
}));
vi.mock("../src/services/progress.service.js", () => ({ getProgress: mocks.getProgress }));
vi.mock("../src/services/petStats.service.js", () => ({
  getPetStats: mocks.getPetStats,
  applyPetEffects: mocks.applyPetEffects,
  addPetExperience: mocks.addPetExperience,
  resetPetLevel: mocks.resetPetLevel,
}));

import { purchaseItem, useItem } from "../src/services/inventory.service.js";

const progress = {
  coins: 100,
  gems: 10,
  unlockedPets: ["buddy"],
  petCopies: { buddy: 1 },
  petEggs: { buddy: 0 },
  unlockedWorlds: ["forest"],
  activePetId: "buddy",
  streakDays: 1,
  lastActiveDate: null,
  lastCheckinDate: null,
  lastLegendaryGrantAt: null,
  commonShards: 0,
  rareShards: 0,
  epicShards: 0,
  hiddenFromRank: false,
  localVersion: 1,
};

const stats = {
  petKey: "buddy",
  customName: null,
  hunger: 70,
  happiness: 70,
  health: 70,
  experience: 0,
  level: 1,
  experienceToNextLevel: 50,
};

function inventoryRow(effects: { stat: string; delta: number }[], category = "food") {
  return {
    childId: "child-1",
    itemId: "item-1",
    quantity: 2,
    item: { id: "item-1", key: "food", name: "Test food", category, effects },
  };
}

describe("inventory service safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.childFindUnique.mockResolvedValue({ id: "child-1", parentId: "parent-1" });
    mocks.getProgress.mockResolvedValue(progress);
    mocks.getPetStats.mockResolvedValue(stats);
    mocks.applyPetEffects.mockResolvedValue(stats);
    mocks.addPetExperience.mockResolvedValue({ ...stats, experience: 100, level: 2 });
    mocks.resetPetLevel.mockResolvedValue(stats);
    mocks.childItemUpdate.mockResolvedValue({});
    mocks.progressUpdate.mockResolvedValue({});
    mocks.childItemUpsert.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === "function") {
        return input({ childItem: { update: mocks.childItemUpdate }, progress: { update: mocks.progressUpdate } });
      }
      return Promise.all(input as Promise<unknown>[]);
    });
  });

  it("blocks hunger-only food for a full pet before consuming inventory", async () => {
    mocks.childItemFindUnique.mockResolvedValue(inventoryRow([{ stat: "hunger", delta: 20 }]));
    mocks.getPetStats.mockResolvedValue({ ...stats, hunger: 100 });

    await expect(useItem("child-1", "parent-1", "item-1")).rejects.toMatchObject({ code: "PET_FULL", statusCode: 409 });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.childItemUpdate).not.toHaveBeenCalled();
  });

  it("allows XP food while full when the pet is below max level", async () => {
    mocks.childItemFindUnique.mockResolvedValue(inventoryRow([
      { stat: "hunger", delta: 20 },
      { stat: "experience", delta: 100 },
    ]));
    mocks.getPetStats.mockResolvedValue({ ...stats, hunger: 100, level: 5 });

    const result = await useItem("child-1", "parent-1", "item-1");

    expect(result.quantity).toBe(1);
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.applyPetEffects).toHaveBeenCalledWith("child-1", "buddy", [{ stat: "hunger", delta: 20 }]);
    expect(mocks.addPetExperience).toHaveBeenCalledWith("child-1", "buddy", 100);
  });

  it("blocks XP food for a max-level pet before consuming inventory", async () => {
    mocks.childItemFindUnique.mockResolvedValue(inventoryRow([{ stat: "experience", delta: 300 }]));
    mocks.getPetStats.mockResolvedValue({ ...stats, level: 30, experienceToNextLevel: 0 });

    await expect(useItem("child-1", "parent-1", "item-1")).rejects.toMatchObject({ code: "PET_MAX_LEVEL", statusCode: 409 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a purchase with insufficient gems without changing balances", async () => {
    mocks.itemFindFirst.mockResolvedValue({ id: "item-1", currency: "gem", price: 12 });
    mocks.progressFindUnique.mockResolvedValue({ coins: 100, gems: 5 });

    await expect(purchaseItem("child-1", "parent-1", "item-1")).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS", statusCode: 409 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("deducts the correct coin price and increments owned quantity atomically", async () => {
    mocks.itemFindFirst.mockResolvedValue({ id: "item-1", currency: "coin", price: 30 });
    mocks.progressFindUnique.mockResolvedValue({ coins: 100, gems: 5 });
    mocks.childItemFindUniqueOrThrow.mockResolvedValue({ quantity: 3 });
    mocks.getProgress.mockResolvedValue({ ...progress, coins: 70 });

    const result = await purchaseItem("child-1", "parent-1", "item-1");

    expect(mocks.progressUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { coins: { decrement: 30 } } }));
    expect(mocks.childItemUpsert).toHaveBeenCalledWith(expect.objectContaining({ update: { quantity: { increment: 1 } } }));
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ quantity: 3, progress: { coins: 70 } });
  });
});
