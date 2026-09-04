import { useEffect, useState } from "react";
import { api, ApiError, type BattleLesson, type Child, type FightRoom as FightRoomData } from "../lib/api";
import { useFightSocket, type RosterPlayer } from "../lib/useFightSocket";
import { BackIcon, ChunkyButton, CoinIcon, SoftButton, TopicIcon } from "../components/ui";
import { useT } from "../lib/i18n";

interface FightRoomProps {
  child: Child;
  onExit: () => void;
  /** Called once a match ends so App.tsx can re-pull the real coin balance from the server (it already credited the winner — see backend's liveRoomManager.ts endMatch()). */
  onRefreshProgress: () => void;
}

type Phase = "menu" | "pickLesson" | "enterCode" | "waiting" | "battle" | "result";

const OPTION_COLORS = ["#F5822B", "#5C7BC9", "#7CC24A", "#9B7EDE"];
const MAX_ROOM_SIZE = 10;

/** Đấu trường — real-time quiz lobby, 2-10 kids. Anyone with the 6-character
 * room code can join (no friends system needed) — see backend's fight.routes.ts
 * + fight.ws.routes.ts. The host explicitly starts the match once enough
 * people are in; winner is decided purely server-side and gets a coin bonus
 * credited straight to Progress. Rating (Đường đua Hạng) only ever moves for
 * a room that ends up with exactly 2 players — see backend's rank.ts. */
export default function FightRoom({ child, onExit, onRefreshProgress }: FightRoomProps) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("menu");
  const [lessons, setLessons] = useState<BattleLesson[] | null>(null);
  const [room, setRoom] = useState<FightRoomData | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const socket = useFightSocket(room?.code ?? null, room ? child.id : null);

  // Drive phase transitions purely off what the socket reports — once a
  // question arrives we're battling, once match_end arrives it's over. The
  // `!socket.matchEnd` guard matters: the hook clears `question` when the
  // match ends, but belt-and-suspenders here too, since without it this
  // effect would re-fire the instant `phase` flips to "result" (it's in the
  // dep array) and bounce straight back to "battle".
  useEffect(() => {
    if (socket.question && !socket.matchEnd && phase !== "battle") setPhase("battle");
  }, [socket.question, socket.matchEnd, phase]);
  useEffect(() => {
    if (socket.matchEnd) {
      setPhase("result");
      onRefreshProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket.matchEnd]);

  function backToMenu() {
    setRoom(null);
    setJoinCode("");
    setError("");
    setPhase("menu");
  }

  async function openPickLesson() {
    setError("");
    setPhase("pickLesson");
    if (lessons) return;
    try {
      const { lessons: rows } = await api.listBattleLessons();
      setLessons(rows);
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách bài học, thử lại nhé."));
    }
  }

  async function createRoom(lessonId: string) {
    setBusy(true);
    setError("");
    try {
      const { room } = await api.createFightRoom(child.id, lessonId);
      setRoom(room);
      setPhase("waiting");
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không tạo được phòng, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom() {
    if (joinCode.trim().length < 4) return;
    setBusy(true);
    setError("");
    try {
      const { room } = await api.joinFightRoom(joinCode.trim(), child.id);
      setRoom(room);
      setPhase("waiting"); // same "connecting…" beat the host sees — flips to "battle" automatically once the socket delivers the first question
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không vào được phòng, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#2A1F3D] via-[#3B2A52] to-[#241A38]">
      <div className="flex items-center gap-3.5 p-4.5">
        <button onClick={phase === "menu" ? onExit : backToMenu} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-2xl font-extrabold text-white">{t("Đấu trường")}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#C9BEDD]">{t("Thi đấu trực tiếp — thắng nhận thêm coin!")}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        {phase === "menu" && (
          <div className="flex flex-col items-center gap-4">
            <img src={`/pets/${child.avatarId}.webp`} alt="" className="animate-bob h-[130px] w-[130px] object-contain" />
            <ChunkyButton tone="orange" shine onClick={openPickLesson} className="w-72">
              {t("Tạo phòng mới")}
            </ChunkyButton>
            <ChunkyButton tone="blue" onClick={() => setPhase("enterCode")} className="w-72">
              {t("Vào phòng bằng mã")}
            </ChunkyButton>
          </div>
        )}

        {phase === "pickLesson" && (
          <div className="flex w-full max-w-3xl flex-col gap-3.5">
            <div className="font-baloo text-lg font-extrabold text-white">{t("Chọn bài học để đấu")}</div>
            {error && <div className="rounded-xl bg-[#FDF0EC] px-3 py-2 font-baloo text-[13px] font-bold text-[#B3402F]">{error}</div>}
            {lessons === null ? (
              <div className="font-baloo text-sm font-bold text-white/70">{t("Đang tải danh sách bài học…")}</div>
            ) : lessons.length === 0 ? (
              <div className="font-baloo text-sm font-bold text-white/70">{t("Chưa có bài học nào đủ điều kiện để đấu.")}</div>
            ) : (
              <div className="grid grid-cols-3 gap-3.5">
                {lessons.map((l) => (
                  <button
                    key={l.id}
                    disabled={busy}
                    onClick={() => createRoom(l.id)}
                    className="flex flex-col items-start gap-2 rounded-[20px] border-[3px] border-white/15 bg-white/95 p-4 text-left shadow-[0_5px_0_rgba(0,0,0,.25)] transition-transform hover:-translate-y-1 disabled:opacity-60"
                  >
                    <TopicIcon label={`${l.worldName} ${l.title}`} color={l.colorTheme} size={36} />
                    <span className="font-baloo text-[15px] font-extrabold">{l.title}</span>
                    <span className="font-baloo text-[11.5px] font-bold text-[#8A7A62]">
                      {l.worldName} · {l.questionCount} {t("câu")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === "enterCode" && (
          <div className="flex w-full max-w-sm flex-col items-center gap-3.5">
            <div className="font-baloo text-lg font-extrabold text-white">{t("Nhập mã phòng")}</div>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full rounded-2xl border-[3px] border-white/30 bg-white/95 px-5 py-4 text-center font-baloo text-[28px] font-extrabold uppercase tracking-[0.35em] text-ink outline-none focus:border-brand-orange"
            />
            {error && <div className="w-full rounded-xl bg-[#FDF0EC] px-3 py-2 text-center font-baloo text-[13px] font-bold text-[#B3402F]">{error}</div>}
            <ChunkyButton tone="green" onClick={joinRoom} disabled={busy || joinCode.trim().length < 4} className="w-full">
              {busy ? t("Đang vào…") : t("Vào phòng")}
            </ChunkyButton>
          </div>
        )}

        {phase === "waiting" && room && <WaitingView code={room.code} childId={child.id} socket={socket} t={t} />}

        {/* socket.question guard matters here, not just for types: match_end clears it
            one render before the phase-transition effect flips `phase` away from
            "battle", and BattleView reads straight from it without its own null check. */}
        {phase === "battle" && room && socket.question && <BattleView roster={socket.roster} childId={child.id} socket={socket} t={t} />}

        {phase === "result" && socket.matchEnd && (
          <ResultView matchEnd={socket.matchEnd} childId={child.id} roster={socket.roster} onPlayAgain={backToMenu} onExit={onExit} t={t} />
        )}
      </div>
    </div>
  );
}

function WaitingView({ code, childId, socket, t }: { code: string; childId: string; socket: ReturnType<typeof useFightSocket>; t: (s: string) => string }) {
  const emptySeats = Math.max(0, MAX_ROOM_SIZE - socket.roster.length);
  const canStart = socket.roster.length >= 2 && !socket.matchStarted;

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4">
      <div className="font-baloo text-sm font-bold text-[#C9BEDD]">{t("Chia sẻ mã này cho bạn đấu")}</div>
      <div className="rounded-[26px] border-4 border-dashed border-white/40 bg-white/10 px-10 py-6 font-baloo text-[46px] font-extrabold tracking-[0.3em] text-white">{code}</div>

      <div className="flex flex-wrap justify-center gap-2.5">
        {socket.roster.map((p) => (
          <div
            key={p.childId}
            className="flex w-[64px] flex-col items-center gap-1 rounded-2xl border-[3px] px-2 py-2.5 transition-opacity"
            style={{ borderColor: p.childId === childId ? "#FFC93C" : "rgba(255,255,255,.2)", background: p.childId === childId ? "rgba(255,201,60,.12)" : "rgba(255,255,255,.05)", opacity: p.connected ? 1 : 0.4 }}
          >
            <img src={`/pets/${p.avatarId}.webp`} alt="" className="h-9 w-9 object-contain" />
            <span className="w-full truncate text-center font-baloo text-[10.5px] font-bold text-white">{p.childId === childId ? t("Bạn") : p.displayName}</span>
          </div>
        ))}
        {Array.from({ length: emptySeats }).map((_, i) => (
          <div key={`empty-${i}`} className="grid h-[62px] w-[64px] place-items-center rounded-2xl border-[3px] border-dashed border-white/15">
            <span className="text-lg text-white/25">?</span>
          </div>
        ))}
      </div>
      <div className="font-baloo text-[13px] font-bold text-[#C9BEDD]">
        {socket.roster.length}/{MAX_ROOM_SIZE} {t("người chơi")}
      </div>

      {socket.isHost ? (
        <>
          <ChunkyButton tone="green" onClick={socket.start} disabled={!canStart} className="w-72">
            {socket.matchStarted ? t("Đang chuẩn bị…") : t("Bắt đầu trận đấu")}
          </ChunkyButton>
          {socket.roster.length < 2 && <div className="font-baloo text-[12.5px] font-semibold text-[#C9BEDD]/80">{t("Cần ít nhất 2 người để bắt đầu")}</div>}
        </>
      ) : (
        <div className="flex items-center gap-2.5 font-baloo text-sm font-bold text-[#C9BEDD]">
          <span className="h-2.5 w-2.5 animate-pulse-soft rounded-full bg-[#FFC93C]" />
          {socket.matchStarted ? t("Trận đấu sắp bắt đầu…") : t("Đang chờ chủ phòng bắt đầu…")}
        </div>
      )}
      {socket.status === "error" && <div className="font-baloo text-[13px] font-bold text-[#EF6A5A]">{t("Mất kết nối, thử tạo phòng lại nhé.")}</div>}
    </div>
  );
}

function BattleView({ roster, childId, socket, t }: { roster: RosterPlayer[]; childId: string; socket: ReturnType<typeof useFightSocket>; t: (s: string) => string }) {
  const q = socket.question!;
  const answered = socket.lastAnswerCorrect !== null;
  const sorted = [...roster].sort((a, b) => (socket.scores[b.childId] ?? 0) - (socket.scores[a.childId] ?? 0));
  const me = roster.find((p) => p.childId === childId) ?? null;
  const opponent = roster.length === 2 ? (roster.find((p) => p.childId !== childId) ?? null) : null;
  const disconnectedName = socket.reconnectGrace && roster.find((p) => p.childId === socket.reconnectGrace!.childId)?.displayName;

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-5">
      {socket.reconnectGrace && (
        <div className="flex items-center gap-2.5 rounded-2xl border-[3px] border-brand-yellow/50 bg-brand-yellow/15 px-4 py-2.5 font-baloo text-[13px] font-bold text-brand-yellow">
          <span className="h-2.5 w-2.5 animate-pulse-soft rounded-full bg-brand-yellow" />
          {disconnectedName ?? t("Đối thủ")} {t("mất kết nối — chờ")} {socket.reconnectGrace.graceSeconds}s {t("để kết nối lại…")}
        </div>
      )}
      {/* The 1v1 case keeps the original symmetric "VS" layout — it's the most
          common room size (and the only one that feeds Đường đua Hạng), worth
          the extra polish. A 3-10 player room gets a scrollable scoreboard row instead. */}
      {roster.length === 2 ? (
        <div className="flex w-full items-center justify-between">
          <PlayerBadge avatarId={me?.avatarId ?? "buddy"} name={t("Bạn")} score={socket.scores[childId] ?? 0} align="left" />
          <div className="flex flex-col items-center gap-1">
            <span className="font-baloo text-[13px] font-bold text-[#C9BEDD]">
              {t("Câu")} {q.index + 1}/{q.total}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 font-baloo text-xs font-bold text-white">VS</span>
          </div>
          <PlayerBadge avatarId={opponent?.avatarId ?? "mimi"} name={opponent?.displayName ?? t("Đối thủ")} score={opponent ? (socket.scores[opponent.childId] ?? 0) : 0} align="right" />
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-2">
          <span className="font-baloo text-[13px] font-bold text-[#C9BEDD]">
            {t("Câu")} {q.index + 1}/{q.total}
          </span>
          <div className="flex w-full gap-2 overflow-x-auto pb-1">
            {sorted.map((p) => (
              <ScoreChip key={p.childId} player={p} score={socket.scores[p.childId] ?? 0} me={p.childId === childId} t={t} />
            ))}
          </div>
        </div>
      )}

      {socket.roundResult ? (
        <div className="flex w-full flex-col items-center gap-2 rounded-[22px] border-[3px] border-white/20 bg-white/95 p-6">
          <div className="font-baloo text-xl font-extrabold" style={{ color: socket.roundResult.roundWinnerChildId === childId ? "#4F7C2A" : socket.roundResult.roundWinnerChildId ? "#B3402F" : "#8A7A62" }}>
            {socket.roundResult.roundWinnerChildId === childId
              ? t("Bạn ghi điểm!")
              : socket.roundResult.roundWinnerChildId
                ? `${roster.find((p) => p.childId === socket.roundResult!.roundWinnerChildId)?.displayName ?? t("Đối thủ")} ${t("ghi điểm!")}`
                : t("Chưa ai trả lời đúng!")}
          </div>
          <div className="font-baloo text-sm font-bold text-[#8A7A62]">
            {t("Đáp án đúng:")} {socket.roundResult.correctAnswer}
          </div>
        </div>
      ) : (
        <>
          <div className="w-full rounded-[24px] border-[3px] border-white/20 bg-white/95 px-7 py-6 text-center font-baloo text-[24px] font-extrabold text-ink">{q.prompt}</div>
          <div className="grid w-full grid-cols-2 gap-3.5">
            {q.options.map((opt, i) => (
              <button
                key={opt}
                disabled={answered}
                onClick={() => socket.answer(q.questionId, opt)}
                className="rounded-2xl border-[3px] py-4 font-baloo text-lg font-extrabold text-white shadow-[0_5px_0_rgba(0,0,0,.25)] transition-transform active:translate-y-1 disabled:opacity-60"
                style={{ background: OPTION_COLORS[i % OPTION_COLORS.length], borderColor: "rgba(255,255,255,.25)" }}
              >
                {opt}
              </button>
            ))}
          </div>
          {answered && (
            <div className="font-baloo text-sm font-bold" style={{ color: socket.lastAnswerCorrect ? "#7CC24A" : "#EF6A5A" }}>
              {socket.lastAnswerCorrect ? t("Đúng rồi! Chờ mọi người…") : t("Chưa đúng — chờ kết quả…")}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ScoreChip({ player, score, me, t }: { player: RosterPlayer; score: number; me: boolean; t: (s: string) => string }) {
  return (
    <div
      className="flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border-[3px] px-3 py-2 transition-opacity"
      style={{ borderColor: me ? "#FFC93C" : "rgba(255,255,255,.18)", background: me ? "rgba(255,201,60,.14)" : "rgba(255,255,255,.05)", opacity: player.connected ? 1 : 0.4 }}
    >
      <img src={`/pets/${player.avatarId}.webp`} alt="" className="h-8 w-8 object-contain" />
      <span className="max-w-[64px] truncate font-baloo text-[10.5px] font-extrabold text-white">{me ? t("Bạn") : player.displayName}</span>
      <span className="font-baloo text-base font-extrabold text-[#FFC93C]">{score}</span>
    </div>
  );
}

function PlayerBadge({ avatarId, name, score, align }: { avatarId: string; name: string; score: number; align: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-2.5 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <img src={`/pets/${avatarId}.webp`} alt="" className="h-14 w-14 object-contain" />
      <div className="flex flex-col">
        <span className="font-baloo text-sm font-extrabold text-white">{name}</span>
        <span className="font-baloo text-2xl font-extrabold text-[#FFC93C]">{score}</span>
      </div>
    </div>
  );
}

function ResultView({
  matchEnd,
  childId,
  roster,
  onPlayAgain,
  onExit,
  t,
}: {
  matchEnd: NonNullable<ReturnType<typeof useFightSocket>["matchEnd"]>;
  childId: string;
  roster: RosterPlayer[];
  onPlayAgain: () => void;
  onExit: () => void;
  t: (s: string) => string;
}) {
  const won = matchEnd.winnerChildId === childId;
  const draw = matchEnd.winnerChildId === null;
  const ratingChange = matchEnd.ratingChanges[childId];
  const tier = matchEnd.tiers[childId];
  const me = roster.find((p) => p.childId === childId);

  const sorted = [...roster].sort((a, b) => (matchEnd.scores[b.childId] ?? 0) - (matchEnd.scores[a.childId] ?? 0));
  const myPosition = sorted.findIndex((p) => p.childId === childId) + 1;

  const title = draw ? t("Hoà rồi!") : won ? t("Bạn đã thắng!") : roster.length > 2 ? `${t("Bạn xếp hạng")} #${myPosition}/${roster.length}` : t("Thua rồi, cố lên lần sau!");
  const titleColor = draw ? "#8A7A62" : won ? "#4F7C2A" : "#B3402F";
  const opponent = roster.length === 2 ? (roster.find((p) => p.childId !== childId) ?? null) : null;

  return (
    <div className="animate-pop flex w-[92%] max-w-md flex-col items-center gap-4 rounded-[30px] border-4 border-white/20 bg-white p-8 shadow-[0_14px_40px_rgba(0,0,0,.35)]">
      <img src={`/pets/${me?.avatarId ?? "buddy"}.webp`} alt="" className={`h-[120px] w-[120px] object-contain ${won ? "animate-bob" : ""}`} />
      <div className="font-baloo text-[26px] font-extrabold" style={{ color: titleColor }}>
        {title}
      </div>

      {roster.length === 2 ? (
        <div className="font-baloo text-sm font-semibold text-[#6E6047]">
          {matchEnd.scores[childId] ?? 0} — {opponent ? (matchEnd.scores[opponent.childId] ?? 0) : 0}
        </div>
      ) : (
        <div className="flex w-full flex-col gap-1.5">
          {sorted.slice(0, 5).map((p, i) => (
            <div
              key={p.childId}
              className="flex items-center gap-2.5 rounded-xl px-3 py-1.5"
              style={{ background: p.childId === childId ? "#FFF1DE" : "transparent" }}
            >
              <span className="w-5 text-center font-baloo text-[13px] font-extrabold text-[#8A7A62]">{i + 1}</span>
              <img src={`/pets/${p.avatarId}.webp`} alt="" className="h-7 w-7 object-contain" />
              <span className="flex-1 truncate font-baloo text-[13.5px] font-bold text-ink">{p.childId === childId ? t("Bạn") : p.displayName}</span>
              <span className="font-baloo text-[13.5px] font-extrabold text-[#3E7FB0]">{matchEnd.scores[p.childId] ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {won && matchEnd.rewardCoins > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-[#FFF3D6] px-4.5 py-2 font-baloo text-lg font-extrabold text-[#B07A0C]">
            <CoinIcon size={22} />+{matchEnd.rewardCoins}
          </div>
        )}
        {ratingChange !== undefined && tier && (
          <div className="flex items-center gap-1.5 rounded-full px-4 py-2 font-baloo text-sm font-extrabold text-white" style={{ background: tier.color }}>
            {ratingChange > 0 ? "▲" : ratingChange < 0 ? "▼" : "—"} {Math.abs(ratingChange)} · {t(tier.name)}
          </div>
        )}
      </div>
      <div className="flex w-full gap-3">
        <SoftButton onClick={onExit} className="flex-1">
          {t("Về Home")}
        </SoftButton>
        <ChunkyButton tone="orange" onClick={onPlayAgain} className="flex-1">
          {t("Đấu tiếp")}
        </ChunkyButton>
      </div>
    </div>
  );
}
