import { useState } from "react";
import type { CheckInResult, ClaimQuestResult, Quest, QuestTrackKind } from "../lib/api";
import { BackIcon, CoinIcon } from "../components/ui";
import { useT } from "../lib/i18n";

interface QuestStreakProps {
  streak: number;
  coins: number;
  checkedInToday: boolean;
  /** Whether ANY synced activity (a lesson, a purchase, care for a pet — not just the "Điểm danh" claim) has already touched today. */
  activeToday: boolean;
  onCheckIn: () => Promise<CheckInResult>;
  quests: Quest[] | null;
  onClaimQuest: (questId: string) => Promise<ClaimQuestResult>;
  onOpenQuest: (trackKind: QuestTrackKind) => void;
  onExit: () => void;
}

const BOX_ITEMS: [string, string, string][] = [
  ["Pet Rare", "1", "#57C6C6"],
  ["Coin", "+300", "#F2A81C"],
  ["Gem", "+5", "#2F8C8C"],
];

// Fixed per REAL weekday (Monday..Sunday) — matches the backend's own
// DAILY_CHECKIN_LADDER exactly, since checkIn() now picks the reward by
// today's actual calendar day too (see progress.service.ts).
const REWARD_LADDER = [10, 15, 20, 25, 30, 35, 40];
const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Monday=0 … Sunday=6 — JS's own getDay() is Sunday=0, so shift it. */
function todayWeekdayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

/** Quests & Streak — matches the reference sheet's "Phần 6 · Nhiệm vụ & streak" panel. */
export default function QuestStreak({ streak, coins, checkedInToday, activeToday, onCheckIn, quests, onClaimQuest, onOpenQuest, onExit }: QuestStreakProps) {
  const t = useT();
  const [msg, setMsg] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [gain, setGain] = useState(0);

  // "Today" is the REAL current weekday, not a position within the streak
  // count (streak can run past 7 and keeps going after a week rolls over —
  // conflating the two used to point "today" at the wrong day entirely,
  // e.g. showing Monday as today on a Wednesday). Days before today this
  // week are "done" if they fall within the trailing run of consecutive
  // days the streak actually covers; days after today haven't happened yet.
  //
  // Whether today itself already counts toward `streak` depends on
  // `activeToday`, NOT `checkedInToday` — any synced activity (a lesson, pet
  // care, a purchase) bumps streakDays for today on the server the same way
  // an explicit check-in does (see computeStreak), so using checkedInToday
  // here would misattribute today's un-checked-in activity to yesterday.
  const todayIndex = todayWeekdayIndex();
  const daysDoneBeforeToday = activeToday ? Math.max(0, streak - 1) : streak;
  const week = WEEKDAY_LABELS.map((label, i) => {
    const isToday = i === todayIndex;
    const isFuture = i > todayIndex;
    const done = isToday ? checkedInToday : !isFuture && todayIndex - i <= daysDoneBeforeToday;
    return { label, done, today: isToday, reward: i === 6 ? t("Hộp quà") : `+${REWARD_LADDER[i]}` };
  });

  async function claimCheckIn() {
    if (checkedInToday || checkingIn) return;
    setCheckingIn(true);
    try {
      const result = await onCheckIn();
      if (result.alreadyCheckedIn) {
        setMsg(t("Đã điểm danh hôm nay rồi!"));
      } else {
        setGain(result.reward);
        setMsg(`${t("Điểm danh thành công!")} +${result.reward} coin`);
      }
    } catch {
      setMsg(t("Không điểm danh được, thử lại nhé."));
    } finally {
      setCheckingIn(false);
    }
  }

  async function claim(quest: Quest) {
    if (quest.claimed || claimingId) return;
    setClaimingId(quest.id);
    try {
      await onClaimQuest(quest.id);
      setMsg(`${t("Nhận")} +${quest.rewardCoins} coin ${t("từ")} "${t(quest.title)}"`);
    } catch (err) {
      setMsg(err instanceof Error ? t(err.message) : t("Không nhận được thưởng, thử lại nhé."));
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#CFEAF6] to-[#F7F4EE]">
      <div className="flex items-center gap-3.5 p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <span className="font-baloo text-2xl font-extrabold">{t("Nhiệm vụ hôm nay")}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 shadow-[0_3px_0_#E3CFA8]">
          <span className="animate-[pulseSoft_1.6s_ease-in-out_infinite] grid h-6.5 w-6.5 place-items-center rounded-full bg-brand-orange">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFE08A]" />
          </span>
          <span className="font-baloo text-[17px] font-extrabold text-[#C7551A]">
            {streak} {t("ngày liền")}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#B07A0C] shadow-[0_3px_0_#E3CFA8]">
          <CoinIcon size={18} />
          {coins}
        </div>
      </div>

      <div className="flex flex-1 gap-5 px-6 pb-5.5">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <div className="flex flex-col gap-3 rounded-[24px] border-[3px] border-[#EFDFC2] bg-white p-4.5 shadow-[0_5px_0_#EADAB8]">
            <div className="flex items-center gap-3">
              <span className="font-baloo text-[19px] font-extrabold">{t("Chuỗi 7 ngày")}</span>
              <div className="flex-1" />
              <span className="font-baloo text-[13.5px] font-bold text-[#8A7A62]">
                {checkedInToday ? `${t(WEEKDAY_LABELS[todayIndex]!)} — ${t("đã điểm danh hôm nay")}` : t("Bấm vào hôm nay để điểm danh")}
              </span>
            </div>
            <div className="flex gap-2.5">
              {week.map((d, i) => {
                const clickableToday = d.today && !checkedInToday;
                return (
                  <button
                    key={d.label}
                    onClick={clickableToday ? claimCheckIn : undefined}
                    disabled={!clickableToday || checkingIn}
                    className={`relative flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-[3px] p-3 disabled:cursor-default ${clickableToday ? "animate-ring cursor-pointer transition-transform active:translate-y-0.5" : ""}`}
                    style={{ background: d.done ? "#EEF9E3" : d.today ? "#FFF1DE" : "#fff", borderColor: d.done ? "#CDE7B4" : d.today ? "#F5C88F" : "#EFDFC2" }}
                  >
                    {d.today && gain > 0 && checkedInToday && (
                      <span className="animate-float-up pointer-events-none absolute -top-1 font-baloo text-sm font-extrabold text-[#4F7C2A]">+{gain}</span>
                    )}
                    <span className="font-baloo text-[12.5px] font-bold" style={{ color: d.done ? "#4F7C2A" : "#8A7A62" }}>
                      {t(d.label)}
                    </span>
                    <span className="grid h-9.5 w-9.5 place-items-center rounded-full shadow-[0_3px_0_rgba(0,0,0,.1)]" style={{ background: d.done ? "#7CC24A" : d.today ? "#F5822B" : "#EDE0C8" }}>
                      {d.done ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4.5 4.5L19 7" />
                        </svg>
                      ) : (
                        <span className="font-baloo text-sm font-extrabold" style={{ color: d.today ? "#fff" : "#A2947C" }}>
                          {i + 1}
                        </span>
                      )}
                    </span>
                    <span className="font-baloo text-[12.5px] font-extrabold" style={{ color: d.done ? "#4F7C2A" : d.today ? "#C7551A" : "#A2947C" }}>
                      {d.reward}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2.5">
            {quests === null ? (
              <div className="grid flex-1 place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải nhiệm vụ…")}</div>
            ) : (
              quests.map((q) => {
                const full = q.progress >= q.target;
                return (
                  <div
                    key={q.id}
                    className="flex items-center gap-4 rounded-[20px] border-[3px] px-4.5 py-3.5"
                    style={{
                      background: q.claimed ? "#F6F2E8" : full ? "#EEF9E3" : "#fff",
                      borderColor: q.claimed ? "#E4D9C2" : full ? "#CDE7B4" : "#EBD9B8",
                      boxShadow: `0 4px 0 ${q.claimed ? "#E4D9C2" : full ? "#CDE7B4" : "#EADAB8"}`,
                    }}
                  >
                    <span className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-2xl" style={{ background: q.color }}>
                      <span className="h-5.5 w-5.5 rounded-full bg-white/92" />
                    </span>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="font-baloo text-base font-extrabold">{t(q.title)}</div>
                      <div className="flex items-center gap-2.5">
                        <span className="block h-3 flex-1 overflow-hidden rounded-full bg-[#F1E7D3]">
                          <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.round((q.progress / q.target) * 100))}%`, background: q.color }} />
                        </span>
                        <span className="w-16 font-baloo text-[13px] font-bold text-[#8A7A62]">
                          {q.progress}/{q.target}
                        </span>
                      </div>
                    </div>
                    <div className="flex w-24 items-center gap-1.5 font-baloo text-base font-extrabold text-[#B07A0C]">
                      <CoinIcon size={18} />+{q.rewardCoins}
                    </div>
                    <button
                      onClick={() => (full ? claim(q) : onOpenQuest(q.trackKind))}
                      disabled={q.claimed || claimingId === q.id}
                      className="w-31.5 rounded-2xl py-3 font-baloo text-[15px] font-extrabold disabled:cursor-default"
                      style={{
                        background: q.claimed ? "#E4D3BC" : full ? "#7CC24A" : "#F5822B",
                        color: q.claimed ? "#8A7A62" : "#fff",
                        boxShadow: `0 4px 0 ${q.claimed ? "#D3C1A8" : full ? "#5C9C31" : "#C9631A"}`,
                      }}
                    >
                      {q.claimed ? t("Đã nhận") : claimingId === q.id ? t("Đang nhận…") : full ? t("Nhận") : t("Làm ngay")}
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div className="min-h-5 font-baloo text-sm font-bold text-[#4F7C2A]">{msg}</div>
        </div>

        <div className="flex w-[270px] flex-col items-center gap-3.5 rounded-[24px] border-[3px] border-[#EFDFC2] bg-white p-5 shadow-[0_5px_0_#EADAB8]">
          <div className="self-start font-baloo text-[19px] font-extrabold">{t("Hộp quà ngày mai")}</div>
          <div className="relative grid h-[170px] w-full place-items-center rounded-2xl bg-[#FFF1DE]">
            <span className="animate-pulse-soft h-24 w-24 rounded-2xl bg-brand-orange shadow-[inset_0_-8px_0_rgba(0,0,0,.14)]" />
            <span className="absolute inset-x-0 top-8.5 h-3.5 bg-[#FFE08A]" />
          </div>
          <div className="text-center font-baloo text-[13.5px] font-semibold leading-relaxed text-[#6E6047]">{t("Học đủ 7 ngày liền để mở hộp: 1 pet Rare, 300 coin và 5 gem.")}</div>
          <div className="flex w-full flex-col gap-2">
            {BOX_ITEMS.map(([label, value, color]) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-cream-card px-3.5 py-2.5 font-baloo text-sm font-bold">
                <span className="flex items-center gap-2.5">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ background: color }} />
                  {label}
                </span>
                <span style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto font-mono text-[10.5px] leading-relaxed text-[#A2947C]">{t("Bỏ 1 ngày là chuỗi về 0. Có thể dùng 1 vé giữ chuỗi mỗi tuần.")}</div>
        </div>
      </div>
    </div>
  );
}
