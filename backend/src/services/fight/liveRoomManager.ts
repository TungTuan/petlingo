import type { WebSocket } from "@fastify/websocket";
import { prisma } from "../../lib/prisma.js";
import { clampToInt32 } from "../progress.service.js";
import { coinsForWin, getTier, ratingGainForWin, ratingLossForLoss } from "./rank.js";

/**
 * Live gameplay state for active fight rooms — deliberately NOT in Postgres.
 * FightRoom/FightParticipant (the DB rows) are the durable record of "who
 * played whom and who won"; this in-memory map is just the ephemeral
 * round-by-round state of a match actually being played right now (current
 * question, per-round timers, live socket handles). It only ever needs to
 * survive for the few minutes a single match takes, and there's exactly one
 * Node process running this API — a second instance would need this moved
 * to something shared (Redis pub/sub), but that's not a problem this app
 * has yet.
 *
 * Anti-cheat: the correct answer for the current question is NEVER put in
 * any message sent to a client — only prompt/options. Round and match
 * winners are derived purely from the server's own record of who answered
 * correctly first, never from anything a client claims about its own score.
 *
 * Room size: up to 10 kids (see rooms.service.ts's MAX_ROOM_PARTICIPANTS).
 * The lobby stays open (status "waiting") until the HOST sends "start" —
 * there's no auto-start-at-2 anymore, since with up to 10 seats a host may
 * want to wait for more people. Rating (Đường đua Hạng) only ever moves for
 * a room that ends up with EXACTLY 2 participants — see endMatch() below —
 * so the tuned 1v1 non-zero-sum math never has to generalize to a group.
 */

interface QuestionForBattle {
  id: string;
  prompt: string;
  hint: string;
  options: string[];
  answer: string;
}

interface Player {
  childId: string;
  displayName: string;
  avatarId: string;
  socket: WebSocket | null;
  score: number;
}

interface LiveRoom {
  roomId: string;
  code: string;
  hostChildId: string;
  rewardCoins: number;
  questions: QuestionForBattle[];
  currentIndex: number; // -1 = match not started yet
  roundWinnerChildId: string | null; // who scored the CURRENT round, if anyone yet
  answeredThisRound: Set<string>;
  roundTimer: NodeJS.Timeout | null;
  advanceTimer: NodeJS.Timeout | null;
  /** Set while at most 1 player is left connected mid-match, waiting to see if
   * anyone reconnects before the match gets forfeited — see handleDisconnect(). */
  disconnectGraceTimer: NodeJS.Timeout | null;
  started: boolean;
  finished: boolean;
  players: Map<string, Player>;
}

const ROUND_SECONDS = 12;
const NEXT_ROUND_DELAY_MS = 2200;
const MATCH_START_DELAY_MS = 1500; // short "get ready" beat once the host starts the match
// A dropped wifi connection or a backgrounded phone shouldn't cost a match
// outright — give whoever's left disconnected this long to reconnect (the
// existing reconnect-mid-match path in registerConnection() picks them right
// back up) before the match actually forfeits.
const RECONNECT_GRACE_MS = 20_000;

const liveRooms = new Map<string, LiveRoom>(); // keyed by room code
// Two connections for the same brand-new room can (and, with React
// StrictMode's mount→unmount→remount dance in dev, routinely do) arrive
// close enough together that both see `liveRooms.get(code)` come back empty
// and race to build their own separate LiveRoom — the second `set()` would
// silently clobber the first's, losing whichever socket it had just
// registered. Caching the in-flight *promise* (not just the eventual
// result) means every concurrent caller for the same code awaits the same
// single load instead of racing.
const loadingRooms = new Map<string, Promise<LiveRoom>>();

async function loadLiveRoom(code: string): Promise<LiveRoom> {
  const existing = liveRooms.get(code);
  if (existing) return existing;

  const inFlight = loadingRooms.get(code);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const dbRoom = await prisma.fightRoom.findUniqueOrThrow({
      where: { code },
      include: { participants: { include: { child: { select: { id: true, displayName: true, avatarId: true } } } } },
    });
    const questionRows = await prisma.question.findMany({ where: { lessonId: dbRoom.lessonId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });

    const room: LiveRoom = {
      roomId: dbRoom.id,
      code,
      hostChildId: dbRoom.hostChildId,
      rewardCoins: dbRoom.rewardCoins,
      questions: questionRows.map((q) => ({ id: q.id, prompt: q.prompt, hint: q.hint ?? "", options: Array.isArray(q.options) ? (q.options as string[]) : [], answer: q.answer })),
      currentIndex: -1,
      roundWinnerChildId: null,
      answeredThisRound: new Set(),
      roundTimer: null,
      advanceTimer: null,
      disconnectGraceTimer: null,
      started: false,
      finished: false,
      players: new Map(dbRoom.participants.map((p) => [p.childId, { childId: p.childId, displayName: p.child.displayName, avatarId: p.child.avatarId, socket: null, score: 0 }])),
    };
    liveRooms.set(code, room);
    return room;
  })();

  loadingRooms.set(code, promise);
  try {
    return await promise;
  } finally {
    loadingRooms.delete(code);
  }
}

function broadcast(room: LiveRoom, message: unknown) {
  const payload = JSON.stringify(message);
  for (const player of room.players.values()) {
    if (player.socket && player.socket.readyState === player.socket.OPEN) player.socket.send(payload);
  }
}

function sendTo(room: LiveRoom, childId: string, message: unknown) {
  const player = room.players.get(childId);
  if (player?.socket && player.socket.readyState === player.socket.OPEN) player.socket.send(JSON.stringify(message));
}

function scoresPayload(room: LiveRoom): Record<string, number> {
  return Object.fromEntries([...room.players.values()].map((p) => [p.childId, p.score]));
}

/** Everyone's current lobby/roster view — who's in the room, who's actually
 * connected right now, and whether the host has started yet. Sent to
 * everyone any time the roster changes (join, disconnect, reconnect), not
 * just in the lobby — the live scoreboard reuses it mid-match too so a
 * dropped player visibly greys out instead of just silently stalling. */
function broadcastRoster(room: LiveRoom) {
  broadcast(room, {
    type: "roster",
    players: [...room.players.values()].map((p) => ({ childId: p.childId, displayName: p.displayName, avatarId: p.avatarId, connected: !!p.socket })),
    hostChildId: room.hostChildId,
    started: room.started,
  });
}

function clearTimers(room: LiveRoom) {
  if (room.roundTimer) clearTimeout(room.roundTimer);
  if (room.advanceTimer) clearTimeout(room.advanceTimer);
  room.roundTimer = null;
  room.advanceTimer = null;
}

function startRound(room: LiveRoom) {
  clearTimers(room);
  room.currentIndex += 1;
  const question = room.questions[room.currentIndex];

  if (!question) {
    void endMatch(room); // out of questions — let the accumulated scores decide
    return;
  }

  room.roundWinnerChildId = null;
  room.answeredThisRound = new Set();
  broadcast(room, {
    type: "question",
    questionId: question.id,
    index: room.currentIndex,
    total: room.questions.length,
    prompt: question.prompt,
    hint: question.hint,
    options: question.options,
    seconds: ROUND_SECONDS,
  });
  room.roundTimer = setTimeout(() => resolveRound(room), ROUND_SECONDS * 1000);
}

function resolveRound(room: LiveRoom) {
  if (room.finished) return;
  clearTimers(room);
  const question = room.questions[room.currentIndex]!;
  broadcast(room, {
    type: "round_result",
    index: room.currentIndex,
    correctAnswer: question.answer,
    roundWinnerChildId: room.roundWinnerChildId,
    scores: scoresPayload(room),
  });
  room.advanceTimer = setTimeout(() => startRound(room), NEXT_ROUND_DELAY_MS);
}

/**
 * Ends the match and persists the result. `forcedWinnerChildId` is set for a
 * disconnect-forfeit (whoever's still standing wins outright, regardless of
 * the score so far) — omit it to let the accumulated quiz score decide (a
 * tie at the top, including a scoreless 0-0, is a draw: no coin, no rating).
 */
async function endMatch(room: LiveRoom, forcedWinnerChildId?: string) {
  if (room.finished) return;
  room.finished = true;
  clearTimers(room);

  const players = [...room.players.values()];
  let winnerChildId: string | null;
  if (forcedWinnerChildId !== undefined) {
    winnerChildId = forcedWinnerChildId;
  } else if (players.length === 0) {
    winnerChildId = null;
  } else {
    const maxScore = Math.max(...players.map((p) => p.score));
    const topScorers = players.filter((p) => p.score === maxScore);
    winnerChildId = topScorers.length === 1 ? topScorers[0]!.childId : null; // tie at the top -> draw, nobody's "the" winner
  }

  await prisma.fightRoom.update({ where: { id: room.roomId }, data: { status: "finished", winnerChildId } });

  // Rating only ever moves for a room that ends up with EXACTLY 2
  // participants — see the module doc comment. A 3-10 player room, or a
  // room where an invited opponent never actually connected at all, still
  // pays out a flat coin reward to the winner but never touches Progress.rating.
  let rewardCoins = 0;
  const ratingChanges: Record<string, number> = {};
  const newRatings: Record<string, number> = {};
  const tiers: Record<string, ReturnType<typeof getTier>> = {};

  if (winnerChildId && room.players.size === 2) {
    const loserChildId = [...room.players.keys()].find((id) => id !== winnerChildId)!;
    const [winnerProgress, loserProgress] = await Promise.all([
      prisma.progress.findUnique({ where: { childId: winnerChildId } }),
      prisma.progress.findUnique({ where: { childId: loserChildId } }),
    ]);
    const winnerRating = winnerProgress?.rating ?? 0;
    const loserRating = loserProgress?.rating ?? 0;

    const gain = ratingGainForWin(winnerRating, loserRating);
    const loss = ratingLossForLoss(loserRating, winnerRating);
    const winnerNewRating = winnerRating + gain;
    const loserNewRating = Math.max(0, loserRating + loss); // never goes negative

    rewardCoins = coinsForWin(room.rewardCoins, winnerNewRating);
    ratingChanges[winnerChildId] = gain;
    ratingChanges[loserChildId] = loserNewRating - loserRating; // may be smaller than `loss` if clamped at 0
    newRatings[winnerChildId] = winnerNewRating;
    newRatings[loserChildId] = loserNewRating;
    tiers[winnerChildId] = getTier(winnerNewRating);
    tiers[loserChildId] = getTier(loserNewRating);

    // Not a bare `{ increment }` — see clampToInt32's doc comment (a child
    // near the int32 ceiling would otherwise crash this with a raw Postgres
    // "value out of range" error instead of a clean coin payout).
    await Promise.all([
      prisma.progress.updateMany({ where: { childId: winnerChildId }, data: { coins: clampToInt32((winnerProgress?.coins ?? 0) + rewardCoins), rating: winnerNewRating } }),
      prisma.progress.updateMany({ where: { childId: loserChildId }, data: { rating: loserNewRating } }),
    ]);
  } else if (winnerChildId) {
    // Group room (3-10 players) with a clear #1, OR a 1v1 whose only other
    // seat never actually connected — flat reward, no rating impact either way.
    rewardCoins = room.rewardCoins;
    const winnerProgress = await prisma.progress.findUnique({ where: { childId: winnerChildId } });
    await prisma.progress.updateMany({ where: { childId: winnerChildId }, data: { coins: clampToInt32((winnerProgress?.coins ?? 0) + rewardCoins) } });
  }

  broadcast(room, { type: "match_end", winnerChildId, scores: scoresPayload(room), rewardCoins, ratingChanges, newRatings, tiers });
  // Give clients a moment to receive the final message before the room disappears.
  setTimeout(() => liveRooms.delete(room.code), 10_000);
}

/** Called when a child's WebSocket connects to a room. Match only actually
 * starts once the host explicitly sends "start" (see handleMessage) — this
 * just seats the player and refreshes everyone's roster view. */
export async function registerConnection(code: string, childId: string, socket: WebSocket): Promise<void> {
  const room = await loadLiveRoom(code);
  let player = room.players.get(childId);

  if (!player) {
    // The room's in-memory snapshot is normally built once, from whoever's
    // socket connects first — the HOST, typically, right after creating the
    // room and before anyone else has joined. Later participants who join
    // the DB room afterward would otherwise never show up here, so check
    // the DB directly for a late-arriving legitimate participant before
    // rejecting them outright.
    const participant = await prisma.fightParticipant.findUnique({
      where: { roomId_childId: { roomId: room.roomId, childId } },
      include: { child: { select: { displayName: true, avatarId: true } } },
    });
    if (!participant) {
      socket.send(JSON.stringify({ type: "error", message: "Bé không thuộc phòng này." }));
      socket.close();
      return;
    }
    player = { childId, displayName: participant.child.displayName, avatarId: participant.child.avatarId, socket: null, score: 0 };
    room.players.set(childId, player);
  }

  const reconnecting = room.started && !room.finished;
  player.socket = socket;

  // They're back — cancel any pending disconnect-forfeit so the match just continues.
  if (room.disconnectGraceTimer) {
    clearTimeout(room.disconnectGraceTimer);
    room.disconnectGraceTimer = null;
    broadcast(room, { type: "opponent_reconnected", childId });
  }

  socket.send(JSON.stringify({ type: "joined", scores: scoresPayload(room), started: room.started, isHost: childId === room.hostChildId }));

  socket.on("message", (raw: Buffer) => handleMessage(room, childId, raw));
  socket.on("close", () => {
    // Only a real disconnect if `socket` is STILL this player's current
    // connection. React StrictMode's dev-mode double-effect (mount →
    // cleanup → remount) — and any other case where a client opens a
    // second socket before the first one has finished closing — means a
    // stale first socket's "close" event can arrive on the server AFTER a
    // newer socket has already called registerConnection() and taken over
    // `player.socket`. Without this guard that stale close would null out
    // the still-live connection, so the player's browser sits there
    // thinking it's connected while every subsequent broadcast silently
    // skips them.
    const current = room.players.get(childId);
    if (current?.socket === socket) handleDisconnect(room, childId);
  });

  broadcastRoster(room);

  if (reconnecting) {
    // A player reconnected mid-match — replay just enough state for their UI to catch up.
    const question = room.questions[room.currentIndex];
    if (question) {
      socket.send(
        JSON.stringify({
          type: "question",
          questionId: question.id,
          index: room.currentIndex,
          total: room.questions.length,
          prompt: question.prompt,
          hint: question.hint,
          options: question.options,
          seconds: ROUND_SECONDS,
        }),
      );
    }
  }
}

function handleMessage(room: LiveRoom, childId: string, raw: Buffer) {
  let msg: { type?: string; questionId?: string; choice?: string };
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return;
  }

  if (msg.type === "start") {
    // Host-only, needs at least 1 opponent, and only fires once per room.
    if (childId !== room.hostChildId || room.started || room.finished || room.players.size < 2) return;
    room.started = true;
    void prisma.fightRoom.update({ where: { id: room.roomId }, data: { status: "active" } });
    broadcastRoster(room); // flips everyone's lobby view to "started" so latecomer joins get rejected client-side too
    broadcast(room, { type: "match_starting", seconds: Math.round(MATCH_START_DELAY_MS / 1000) });
    setTimeout(() => startRound(room), MATCH_START_DELAY_MS);
    return;
  }

  if (msg.type !== "answer" || room.finished || room.currentIndex < 0) return;

  const question = room.questions[room.currentIndex];
  if (!question || msg.questionId !== question.id) return; // stale/mistimed answer — ignore
  if (room.answeredThisRound.has(childId)) return; // one answer per round per player

  room.answeredThisRound.add(childId);
  const player = room.players.get(childId);
  if (!player) return;

  const correct = msg.choice === question.answer;
  if (correct && !room.roundWinnerChildId) {
    room.roundWinnerChildId = childId;
    player.score += 1;
  }
  sendTo(room, childId, { type: "answer_ack", correct });

  const connectedCount = [...room.players.values()].filter((p) => p.socket).length;
  if (room.answeredThisRound.size >= connectedCount) resolveRound(room);
}

function handleDisconnect(room: LiveRoom, childId: string) {
  const player = room.players.get(childId);
  if (player) player.socket = null;
  broadcastRoster(room);

  if (!room.started || room.finished) return; // dropped before the match started — just an empty seat, room stays "waiting"

  // A mid-match disconnect only threatens to end the match once at most 1
  // player is still actually connected — for a 1v1 that's the only opponent
  // dropping (2-1=1); for a 3-10 player room, the rest just keep playing
  // without the dropped player and this whole branch never triggers.
  const stillConnected = [...room.players.values()].filter((p) => p.socket);
  if (stillConnected.length > 1) return;

  if (room.disconnectGraceTimer) return; // already counting down for an earlier drop
  broadcast(room, { type: "opponent_disconnected", childId, graceSeconds: Math.round(RECONNECT_GRACE_MS / 1000) });
  room.disconnectGraceTimer = setTimeout(() => {
    room.disconnectGraceTimer = null;
    if (room.finished) return;
    const stillConnectedNow = [...room.players.values()].filter((p) => p.socket);
    if (stillConnectedNow.length <= 1) void endMatch(room, stillConnectedNow[0]?.childId);
  }, RECONNECT_GRACE_MS);
}
