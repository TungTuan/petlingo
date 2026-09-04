import { describe, expect, it } from "vitest";
import { mergeProgress, type ClientProgressInput, type ProgressState } from "../src/services/progress.service.js";

function makeServerState(overrides: Partial<ProgressState> = {}): ProgressState {
  return {
    coins: 100,
    gems: 10,
    unlockedPets: ["buddy"],
    petCopies: { buddy: 1 },
    petEggs: { buddy: 0 },
    unlockedWorlds: ["forest"],
    activePetId: "buddy",
    streakDays: 3,
    lastActiveDate: new Date("2026-08-15T09:00:00Z"),
    lastCheckinDate: null,
    lastLegendaryGrantAt: null,
    commonShards: 0,
    rareShards: 0,
    epicShards: 0,
    hiddenFromRank: false,
    localVersion: 5,
    ...overrides,
  };
}

function makeClientInput(overrides: Partial<ClientProgressInput> = {}): ClientProgressInput {
  return {
    coins: 100,
    gems: 10,
    unlockedPets: ["buddy"],
    unlockedWorlds: ["forest"],
    activePetId: "buddy",
    lastActiveDate: new Date("2026-08-16T09:00:00Z"),
    ...overrides,
  };
}

describe("mergeProgress", () => {
  it("(1) keeps the higher coin value when the client has more coins than the server", () => {
    const server = makeServerState({ coins: 100 });
    const client = makeClientInput({ coins: 250 });

    const merged = mergeProgress(server, client, new Date("2026-08-16T09:00:00Z"));

    expect(merged.coins).toBe(250);
  });

  it("(2) unions unlockedPets so a pet the server has (that the client doesn't yet) is preserved", () => {
    const server = makeServerState({ unlockedPets: ["buddy", "mimi"] });
    const client = makeClientInput({ unlockedPets: ["buddy"] }); // client hasn't seen "mimi" yet

    const merged = mergeProgress(server, client, new Date("2026-08-16T09:00:00Z"));

    expect(merged.unlockedPets.sort()).toEqual(["buddy", "mimi"]);
  });

  it("(3a) increments streakDays when the server's lastActiveDate was yesterday", () => {
    const server = makeServerState({ streakDays: 3, lastActiveDate: new Date("2026-08-15T09:00:00Z") });
    const client = makeClientInput();

    const merged = mergeProgress(server, client, new Date("2026-08-16T12:00:00Z"));

    expect(merged.streakDays).toBe(4);
  });

  it("(3b) resets streakDays to 1 when the server's lastActiveDate was 3 days ago", () => {
    const server = makeServerState({ streakDays: 7, lastActiveDate: new Date("2026-08-13T09:00:00Z") });
    const client = makeClientInput();

    const merged = mergeProgress(server, client, new Date("2026-08-16T12:00:00Z"));

    expect(merged.streakDays).toBe(1);
  });

  it("always bumps localVersion by exactly 1 on a successful merge, ignoring the client's version", () => {
    const server = makeServerState({ localVersion: 5 });
    const client = makeClientInput();

    const merged = mergeProgress(server, client, new Date("2026-08-16T09:00:00Z"));

    expect(merged.localVersion).toBe(6);
  });
});
