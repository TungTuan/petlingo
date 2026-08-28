import { useEffect, useState } from "react";
import { api, ApiError, type Child, type RpgStatus, type RpgTopicDetail, type RpgTopicListItem } from "../lib/api";
import { BackIcon, ChunkyButton, CoinIcon, SoftButton } from "../components/ui";
import { useT } from "../lib/i18n";

interface WordRpgProps {
  child: Child;
  onExit: () => void;
}

const PLAYER_MAX_HP = 100;
const PLAYER_DAMAGE = 25;

/** Word RPG — a dungeon (topic) is a line of monsters; each monster is a
 * few "what does this word mean?" questions. Answer right and the monster
 * takes damage; answer wrong and YOU take damage (see the player HP bar) —
 * that real stakes-within-a-run is what makes this feel different from
 * Shop/Home's zero-penalty style. Coins + XP are credited to the real
 * backend Progress the instant a monster falls (services/rpg.service.ts),
 * not batched at the end, so even a mid-run game-over keeps what was
 * already earned — Level/XP persist across sessions (unlike Shop/Home's
 * purely session-local coin counters), which is the actual point of this
 * game per the original brief ("XP, level... giúp người chơi có lý do
 * quay lại"). Backed by real RpgTopic/RpgMonster catalog data (see
 * /catalog/rpg-topics): shows a dungeon picker first, then plays whichever
 * dungeon was tapped. */
export default function WordRpg({ child, onExit }: WordRpgProps) {
  const t = useT();
  const [list, setList] = useState<RpgTopicListItem[] | null>(null);
  const [topic, setTopic] = useState<RpgTopicDetail | null>(null);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    api
      .listRpgTopics()
      .then((r) => setList(r.topics))
      .catch((err) => setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách chủ đề, thử lại nhé.")));
  }, [t]);

  async function openTopic(id: string) {
    setLoadErr("");
    try {
      const { topic } = await api.getRpgTopic(id);
      setTopic(topic);
    } catch (err) {
      setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được chủ đề, thử lại nhé."));
    }
  }

  if (topic) return <WordRpgBattle child={child} topic={topic} onExit={() => setTopic(null)} />;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#2A1F3D] via-[#3B2A52] to-[#241A38]">
      <div className="flex items-center gap-3.5 p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[25px] font-extrabold text-white">Word RPG</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#C9BEDD]">{t("Chọn 1 hầm ngục để bắt đầu phiêu lưu")}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {list === null ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-white/40">{t("Đang tải danh sách chủ đề…")}</div>
        ) : loadErr && list.length === 0 ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-[#EF6A5A]">{loadErr}</div>
        ) : (
          <div className="grid grid-cols-5 gap-4.5">
            {list.map((tp) => (
              <button
                key={tp.id}
                onClick={() => openTopic(tp.id)}
                className="flex flex-col items-start gap-2.5 rounded-[22px] border-[3px] border-white/15 bg-white/95 p-4.5 text-left shadow-[0_5px_0_rgba(0,0,0,.25)] transition-transform hover:-translate-y-1"
              >
                <span className="h-10 w-10 rounded-2xl" style={{ background: tp.color }} />
                <span className="font-baloo text-base font-extrabold leading-snug">{tp.name}</span>
                <span className="mt-auto font-baloo text-[11.5px] font-bold text-[#8A7A62]">
                  {tp._count.monsters} {t("quái vật")}
                </span>
              </button>
            ))}
          </div>
        )}
        {loadErr && list && list.length > 0 && <div className="mt-3 font-baloo text-sm font-bold text-[#EF6A5A]">{loadErr}</div>}
      </div>
    </div>
  );
}

function HpBar({ percent, color, track = "#F1E7D3" }: { percent: number; color: string; track?: string }) {
  return (
    <div className="h-3.5 overflow-hidden rounded-full" style={{ background: track }}>
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.max(0, percent)}%`, background: color }} />
    </div>
  );
}

/** The actual dungeon crawl, once a topic has been picked. */
function WordRpgBattle({ child, topic, onExit }: { child: Child; topic: RpgTopicDetail; onExit: () => void }) {
  const t = useT();
  const monsters = topic.monsters;
  const [monsterIdx, setMonsterIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<RpgStatus | null>(null);
  const [runCoins, setRunCoins] = useState(0);
  const [runXp, setRunXp] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [defeated, setDefeated] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);

  const monster = monsters[monsterIdx]!;
  const question = monster.questions[questionIdx]!;
  const monsterHpPercent = Math.round(((monster.questions.length - questionIdx) / monster.questions.length) * 100);

  useEffect(() => {
    api
      .getRpgStatus(child.id)
      .then(setStatus)
      .catch((err) => console.warn("Failed to load RPG status:", err));
  }, [child.id]);

  function reset() {
    setMonsterIdx(0);
    setQuestionIdx(0);
    setPlayerHp(PLAYER_MAX_HP);
    setChosen(null);
    setBusy(false);
    setRunCoins(0);
    setRunXp(0);
    setLeveledUp(false);
    setDefeated(false);
    setGameOver(false);
    setVictory(false);
  }

  async function answer(opt: string) {
    if (chosen || busy) return;
    setChosen(opt);
    setBusy(true);
    const correct = opt === question.answer;

    if (correct) {
      const isLastQuestion = questionIdx + 1 >= monster.questions.length;
      if (!isLastQuestion) {
        setTimeout(() => {
          setChosen(null);
          setBusy(false);
          setQuestionIdx((i) => i + 1);
        }, 800);
        return;
      }
      // Last hit — monster falls. Reward is computed and credited server-side.
      try {
        const result = await api.defeatRpgMonster(child.id, monster.id);
        setRunCoins((c) => c + result.rewardCoins);
        setRunXp((x) => x + result.rewardXp);
        setStatus({ xp: result.xp, level: result.level, nextLevel: result.nextLevel });
        if (result.leveledUp) setLeveledUp(true);
      } catch (err) {
        console.warn("Failed to credit monster defeat reward:", err);
      }
      setDefeated(true);
      setTimeout(() => {
        setDefeated(false);
        setLeveledUp(false);
        setChosen(null);
        setBusy(false);
        if (monsterIdx + 1 >= monsters.length) {
          setVictory(true);
        } else {
          setMonsterIdx((i) => i + 1);
          setQuestionIdx(0);
        }
      }, 1600);
    } else {
      const nextHp = Math.max(0, playerHp - PLAYER_DAMAGE);
      setPlayerHp(nextHp);
      setTimeout(() => {
        setChosen(null);
        setBusy(false);
        if (nextHp <= 0) setGameOver(true);
      }, 1100);
    }
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#2A1F3D] via-[#3B2A52] to-[#241A38]">
      <div className="flex items-center gap-3.5 p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-2xl font-extrabold text-white">{topic.name}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#C9BEDD]">
            {t("Quái")} {monsterIdx + 1}/{monsters.length}
          </span>
        </div>
        <div className="flex-1" />
        {status && (
          <div className="flex flex-col items-end gap-1 rounded-2xl bg-white/10 px-3.5 py-2">
            <span className="font-baloo text-xs font-extrabold text-[#FFC93C]">
              {t("Cấp")} {status.level.level}
            </span>
            <div className="h-1.5 w-[90px] overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-[#FFC93C]"
                style={{ width: status.nextLevel ? `${Math.round(((status.xp - status.level.minXp) / (status.nextLevel.minXp - status.level.minXp)) * 100)}%` : "100%" }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-[17px] font-extrabold text-[#B07A0C] shadow-[0_3px_0_rgba(0,0,0,.14)]">
          <CoinIcon size={20} />+{runCoins}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-5 px-6 pb-6">
        {/* Player HP */}
        <div className="flex w-full max-w-xl flex-col gap-1.5">
          <div className="flex items-center justify-between font-baloo text-[13px] font-bold text-[#C9BEDD]">
            <span>
              ❤️ {child.displayName} · {t("Sinh lực")}
            </span>
            <span>
              {playerHp}/{PLAYER_MAX_HP}
            </span>
          </div>
          <HpBar percent={(playerHp / PLAYER_MAX_HP) * 100} color={playerHp > 40 ? "#7CC24A" : "#EF6A5A"} track="rgba(255,255,255,.15)" />
        </div>

        {/* Monster */}
        <div className="flex w-full max-w-xl flex-col items-center gap-2.5 rounded-[24px] border-[3px] border-white/15 bg-white/10 p-5">
          <div className="flex items-center gap-2 font-baloo text-lg font-extrabold text-white">
            {monster.isBoss && <span className="rounded-full bg-[#EF6A5A] px-3 py-0.5 text-xs font-extrabold text-white">BOSS</span>}
            {monster.name}
          </div>
          <span className={`text-[64px] leading-none ${defeated ? "animate-shake" : "animate-bob"}`}>{monster.emoji}</span>
          <div className="w-full max-w-xs">
            <HpBar percent={monsterHpPercent} color="#EF6A5A" track="rgba(255,255,255,.15)" />
          </div>

          {defeated && (
            <div className="animate-pop flex flex-col items-center gap-1.5 rounded-2xl bg-[#EEF9E3] px-5 py-3 text-center">
              <div className="font-baloo text-lg font-extrabold text-[#4F7C2A]">{t("Đã hạ gục")}!</div>
              {leveledUp && <div className="font-baloo text-sm font-extrabold text-[#B07A0C]">🎉 {t("Lên cấp!")}</div>}
            </div>
          )}
        </div>

        {!defeated && (
          <div className="flex w-full max-w-xl flex-1 flex-col justify-center gap-4">
            <div className="rounded-[22px] border-[3px] border-white/20 bg-white/95 px-7 py-6 text-center">
              <div className="font-baloo text-[13px] font-bold text-[#8A7A62]">{t("Từ này nghĩa là gì?")}</div>
              <div className="font-baloo text-[28px] font-extrabold text-ink">{question.en}</div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              {question.options.map((opt, i) => {
                const show = chosen !== null;
                const isPicked = chosen === opt;
                const isAnswer = opt === question.answer;
                const bg = show && isPicked ? (isAnswer ? "#EEF9E3" : "#FDE7E4") : show && isAnswer ? "#EEF9E3" : "#fff";
                const border = show && isPicked ? (isAnswer ? "#7CC24A" : "#EF6A5A") : show && isAnswer ? "#CDE7B4" : "rgba(255,255,255,.3)";
                // Odd option counts (most monsters have 3) would otherwise leave
                // a lone tile stranded in the left column — stretch the last
                // one across both columns instead of a lopsided 2-then-1 grid.
                const isDangling = question.options.length % 2 === 1 && i === question.options.length - 1;
                return (
                  <button
                    key={opt}
                    onClick={() => answer(opt)}
                    disabled={chosen !== null}
                    className={`rounded-2xl border-[3px] py-4 font-baloo text-lg font-extrabold text-ink shadow-[0_5px_0_rgba(0,0,0,.15)] transition-transform active:translate-y-1 disabled:cursor-default ${isDangling ? "col-span-2" : ""}`}
                    style={{ background: bg, borderColor: border }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {chosen && (
              <div className="text-center font-baloo text-sm font-extrabold" style={{ color: chosen === question.answer ? "#7CC24A" : "#EF6A5A" }}>
                {chosen === question.answer ? t("Tấn công trúng!") : `${t("Bạn bị tấn công!")} ${t("Đáp án đúng:")} ${question.answer}`}
              </div>
            )}
          </div>
        )}
      </div>

      {gameOver && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-ink/50">
          <div className="animate-pop flex w-[92%] max-w-md flex-col items-center gap-4 rounded-[30px] border-4 border-white/20 bg-white p-8 text-center shadow-[0_14px_40px_rgba(0,0,0,.35)]">
            <span className="text-[56px]">💀</span>
            <div className="font-baloo text-2xl font-extrabold text-[#B3402F]">{t("Bạn đã thua!")}</div>
            <div className="font-baloo text-sm font-semibold text-[#6E6047]">
              {t("Vẫn giữ nguyên")} +{runCoins} coin · +{runXp} XP {t("đã kiếm được")}
            </div>
            <div className="flex w-full gap-3">
              <SoftButton onClick={onExit} className="flex-1">
                {t("Về Home")}
              </SoftButton>
              <ChunkyButton tone="orange" onClick={reset} className="flex-1">
                {t("Thử lại")}
              </ChunkyButton>
            </div>
          </div>
        </div>
      )}

      {victory && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-ink/50">
          <div className="animate-pop flex w-[92%] max-w-md flex-col items-center gap-4 rounded-[30px] border-4 border-white/20 bg-white p-8 text-center shadow-[0_14px_40px_rgba(0,0,0,.35)]">
            <span className="text-[56px]">🏆</span>
            <div className="font-baloo text-2xl font-extrabold text-[#4F7C2A]">{t("Chinh phục hầm ngục!")}</div>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="flex items-center gap-2 rounded-full bg-[#FFF3D6] px-4 py-2 font-baloo font-extrabold text-[#B07A0C]">
                <CoinIcon size={18} />+{runCoins}
              </span>
              <span className="rounded-full bg-[#EEF9E3] px-4 py-2 font-baloo font-extrabold text-[#4F7C2A]">+{runXp} XP</span>
              {status && <span className="rounded-full bg-[#F1EAFB] px-4 py-2 font-baloo font-extrabold text-[#6E56A8]">{t("Cấp")} {status.level.level}</span>}
            </div>
            <div className="flex w-full gap-3">
              <SoftButton onClick={onExit} className="flex-1">
                {t("Về Home")}
              </SoftButton>
              <ChunkyButton tone="green" onClick={reset} className="flex-1">
                {t("Chơi lại")}
              </ChunkyButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
