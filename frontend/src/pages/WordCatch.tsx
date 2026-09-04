import { useEffect, useMemo, useState } from "react";
import { api, ApiError, type WordCatchTopicDetail, type WordCatchTopicListItem } from "../lib/api";
import { BackIcon, CoinIcon, HeartIcon, RewardModal, SpeakerIcon, TopicIcon } from "../components/ui";
import { useT } from "../lib/i18n";

interface WordCatchProps {
  onExit: () => void;
  onComplete?: (contentKey: string) => void;
}

const BORDERS = ["#E69A2C", "#4F9DC8", "#72AA45", "#8B6BC7"];

/** Word Catch — matches the reference sheet's "Phần 5 · Word Catch" panel.
 * Now backed by real WordCatchTopic/WordCatchRound catalog data (see
 * /catalog/wordcatch-topics): shows a topic picker first, then plays
 * whichever topic was tapped — instead of the single hard-coded 5-round set. */
export default function WordCatch({ onExit, onComplete }: WordCatchProps) {
  const t = useT();
  const [list, setList] = useState<WordCatchTopicListItem[] | null>(null);
  const [topic, setTopic] = useState<WordCatchTopicDetail | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    api
      .listWordCatchTopics()
      .then((r) => setList(r.topics))
      .catch((err) => setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách chủ đề, thử lại nhé.")));
  }, [t]);

  async function openTopic(id: string) {
    setLoadErr("");
    try {
      const { topic } = await api.getWordCatchTopic(id);
      setTopic(topic);
    } catch (err) {
      setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được chủ đề, thử lại nhé."));
    }
  }

  if (topic && difficulty) return <WordCatchPlay topic={topic} difficulty={difficulty} onExit={() => setDifficulty(null)} onComplete={() => onComplete?.(topic.id)} />;
  if (topic) return <WordCatchDifficulty topic={topic} onPick={setDifficulty} onExit={() => setTopic(null)} />;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#CFEAF6] to-[#EAF6E4]">
      <div className="flex items-center gap-3.5 p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[25px] font-extrabold">Word Catch</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#5A7080]">{t("Chọn 1 chủ đề để bắt đầu chơi")}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6.5 pb-6">
        {list === null ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải danh sách chủ đề…")}</div>
        ) : loadErr && list.length === 0 ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-[#B3402F]">{loadErr}</div>
        ) : (
          <div className="grid grid-cols-5 gap-4.5">
            {list.map((tp, i) => (
              <button
                key={tp.id}
                onClick={() => openTopic(tp.id)}
                className="flex flex-col items-start gap-2.5 rounded-[22px] border-[3px] border-line bg-white p-4.5 text-left shadow-[0_5px_0_#E7D4B2] transition-transform hover:-translate-y-1"
              >
                <TopicIcon label={tp.name} color={BORDERS[i % BORDERS.length]!} />
                <span className="font-baloo text-base font-extrabold leading-snug">{tp.name}</span>
                <span className="mt-auto font-baloo text-[11.5px] font-bold text-[#5A7080]">
                  {tp._count.rounds} {t("lượt chơi")}
                </span>
              </button>
            ))}
          </div>
        )}
        {loadErr && list && list.length > 0 && <div className="mt-3 font-baloo text-sm font-bold text-[#B3402F]">{loadErr}</div>}
      </div>
    </div>
  );
}

const DIFFICULTIES = {
  easy: { label: "Dễ", icon: "🌱", lives: 5, speed: 8.2, rounds: 5, note: "5 lượt · 5 tim · rơi chậm", color: "#70B94A" },
  medium: { label: "Trung bình", icon: "⭐", lives: 3, speed: 5.8, rounds: 10, note: "10 lượt · 3 tim · tốc độ vừa", color: "#E6A52D" },
  hard: { label: "Khó", icon: "⚡", lives: 2, speed: 3.8, rounds: 20, note: "20 lượt · 2 tim · rơi nhanh", color: "#E76558" },
} as const;

function WordCatchDifficulty({ topic, onPick, onExit }: { topic: WordCatchTopicDetail; onPick: (level: "easy" | "medium" | "hard") => void; onExit: () => void }) {
  return <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#C9EDFF_0%,#EDF9F2_70%,#D7F0BD_100%)]"><div className="absolute left-[8%] top-[16%] text-7xl opacity-50">☁️</div><div className="absolute right-[7%] top-[11%] text-8xl opacity-40">☁️</div><div className="relative z-10 flex h-[84px] items-center gap-3 border-b border-white/70 bg-white/35 px-5 backdrop-blur-sm"><button onClick={onExit} className="grid h-[48px] w-[48px] place-items-center rounded-[16px] bg-[#5C7BC9] shadow-[0_4px_0_#43609F]"><BackIcon /></button><div><div className="font-baloo text-[24px] font-extrabold">{topic.name}</div><div className="font-baloo text-xs font-bold text-[#5A7080]">Chọn tốc độ bắt từ</div></div><span className="ml-auto rounded-full border-2 border-white bg-white/80 px-4 py-2 font-baloo text-xs font-extrabold text-[#4E7B82]">🎯 {topic.rounds.length} lượt</span></div><div className="relative z-10 grid flex-1 place-items-center p-8"><div className="grid w-full max-w-[940px] grid-cols-3 gap-6">{Object.entries(DIFFICULTIES).map(([key, level]) => <button key={key} onClick={() => onPick(key as keyof typeof DIFFICULTIES)} className="group overflow-hidden rounded-[30px] border-4 border-white bg-white/92 p-7 text-left shadow-[0_8px_0_rgba(80,112,91,.2),0_20px_35px_rgba(64,103,112,.15)] transition-transform hover:-translate-y-2"><div className="mb-5 grid h-20 w-20 place-items-center rounded-[24px] text-4xl" style={{background:`${level.color}22`}}>{level.icon}</div><div className="font-baloo text-2xl font-extrabold" style={{color:level.color}}>{level.label}</div><div className="mt-2 font-baloo text-sm font-bold text-[#71807A]">{level.note}</div><div className="mt-6 flex gap-1">{Array.from({length:level.lives},(_,i)=><HeartIcon key={i} size={20} filled />)}</div></button>)}</div></div></div>;
}

/** The actual falling-words game, once a topic has been picked. */
function WordCatchPlay({ topic, difficulty, onExit, onComplete }: { topic: WordCatchTopicDetail; difficulty: keyof typeof DIFFICULTIES; onExit: () => void; onComplete?: () => void }) {
  const t = useT();
  const config = DIFFICULTIES[difficulty];
  const rounds = useMemo(() => {
    const shuffled = [...topic.rounds];
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]; }
    return shuffled.slice(0, config.rounds);
  }, [topic, config.rounds]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState<number>(config.lives);
  const [coins, setCoins] = useState(0);
  const [coinPop, setCoinPop] = useState(0);
  const [heartHit, setHeartHit] = useState(0);
  const [msg, setMsg] = useState(t("Sẵn sàng!"));
  const [tone, setTone] = useState<"idle" | "good" | "bad">("idle");
  const [zapped, setZapped] = useState<{ word: string; ok: boolean } | null>(null);
  const [finished, setFinished] = useState(false);
  const round = rounds[idx]!;

  function pick(word: string) {
    if (zapped) return; // ignore taps mid-animation so the same word can't be double-caught
    const ok = word === round.answer;
    setZapped({ word, ok });
    if (ok) {
      setScore((s) => s + 10);
      setCoins((c) => c + 5);
      setCoinPop((p) => p + 1);
      setMsg(`${t("Bắt được")} ${word}!`);
      setTone("good");
    } else {
      setLives((l) => Math.max(0, l - 1));
      setHeartHit((h) => h + 1);
      setMsg(`${t("Sai rồi — là")} ${round.answer}`);
      setTone("bad");
    }
    // Let the catch/shake animation play out before the row of falling words moves on.
    setTimeout(() => {
      setZapped(null);
      if (idx + 1 >= rounds.length) {
        setFinished(true);
        onComplete?.();
      } else {
        setIdx((i) => i + 1);
      }
    }, 420);
  }

  function reset() {
    setIdx(0);
    setScore(0);
    setLives(config.lives);
    setCoins(0);
    setMsg(t("Sẵn sàng!"));
    setTone("idle");
    setZapped(null);
    setFinished(false);
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#BDEAFF_0%,#E7F8F6_58%,#99D36E_58%,#64AE43_100%)]">
      <div className="pointer-events-none absolute left-[5%] top-[15%] text-7xl opacity-60">☁️</div><div className="pointer-events-none absolute right-[5%] top-[22%] text-8xl opacity-45">☁️</div><div className="pointer-events-none absolute bottom-[5%] left-0 right-0 h-24 bg-[radial-gradient(ellipse_at_center,#B7E681_0_30%,transparent_31%)] bg-[length:180px_90px] opacity-70" />
      <div className="relative z-20 flex h-[82px] shrink-0 items-center gap-3.5 border-b border-white/60 bg-white/35 px-5 backdrop-blur-sm">
        <button onClick={onExit} className="grid h-[46px] w-[46px] place-items-center rounded-[16px] bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[23px] font-extrabold">{topic.name}</span>
          <span className="font-baloo text-[11px] font-extrabold uppercase tracking-wide" style={{color:config.color}}>Word Catch · {config.label}</span>
        </div>
        <div className="flex-1" />
        <div className="w-[150px]"><div className="mb-1 flex justify-between font-baloo text-[10px] font-extrabold text-[#50717A]"><span>LƯỢT</span><span>{Math.min(idx + 1, rounds.length)}/{rounds.length}</span></div><div className="h-3 overflow-hidden rounded-full border-2 border-white bg-[#BED6D5]"><div className="h-full rounded-full bg-[#62B9D0] transition-[width]" style={{width:`${(idx + 1) / rounds.length * 100}%`}} /></div></div>
        <div className="rounded-full bg-white/90 px-4 py-2 font-baloo text-sm font-extrabold text-[#4F7C2A] shadow-sm">⭐ {score}</div>
        <div key={heartHit} className={`flex gap-1.5 ${heartHit > 0 ? "animate-shake" : ""}`}>
          {Array.from({length: config.lives}, (_, i) => (
            <HeartIcon key={i} size={26} filled={i < lives} />
          ))}
        </div>
        <div className="relative flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#B07A0C] shadow-[0_3px_0_rgba(0,0,0,.12)]">
          <CoinIcon size={19} />
          {coins}
          {coinPop > 0 && (
            <span key={coinPop} className="animate-float-up pointer-events-none absolute -top-1 right-2 font-baloo text-sm font-extrabold text-[#4F7C2A]">
              +5
            </span>
          )}
        </div>
        <button onClick={reset} className="rounded-2xl border-[3px] border-white bg-white/85 px-4.5 py-2.5 font-baloo text-sm font-bold text-brand-brown">
          {t("Chơi lại")}
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pb-4">
        <div className="mx-auto mt-3 flex items-center gap-3 rounded-[22px] border-2 border-white bg-white/92 px-7 py-2.5 shadow-[0_6px_0_rgba(85,121,112,.18),0_14px_24px_rgba(65,105,111,.13)]">
          <span className="grid h-[42px] w-[42px] place-items-center rounded-[14px] bg-brand-teal shadow-[0_3px_0_#2998A2]">
            <SpeakerIcon />
          </span>
          <div className="flex flex-col">
            <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Bắt từ có nghĩa")}</span>
            <span className="font-baloo text-[25px] font-extrabold">{round.vi}</span>
          </div>
        </div>

        <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-[30px] border-2 border-white/55 bg-white/10 shadow-inner">
          <div className="pointer-events-none absolute inset-0 grid grid-cols-4">{round.options.map((_,i)=><div key={i} className="border-r border-dashed border-white/35 last:border-0" />)}</div>
          {round.options.map((word, i) => {
            const isZapped = zapped?.word === word;
            const zapAnim = isZapped
              ? zapped!.ok
                ? "catchGood 0.5s cubic-bezier(0.3,1.4,0.5,1) forwards"
                : "shake 0.42s ease-in-out"
              : `fall ${config.speed + (i % 3) * .7}s linear ${i * 0.72}s infinite`;
            return (
              <button
                key={word}
                onClick={() => pick(word)}
                disabled={!!zapped}
                className="absolute top-0 min-w-[145px] rounded-[18px] border-[3px] bg-white px-5 py-3 font-baloo text-[19px] font-extrabold text-ink disabled:cursor-default"
                style={{
                  left: `${4.5 + i * 24}%`,
                  background: isZapped ? (zapped!.ok ? "#EEF9E3" : "#FDE7E4") : "#fff",
                  borderColor: isZapped && !zapped!.ok ? "#EF6A5A" : BORDERS[i % 4],
                  boxShadow: `0 5px 0 ${isZapped && !zapped!.ok ? "#EF6A5A" : BORDERS[i % 4]}`,
                  animation: zapAnim,
                }}
              >
                {word}
              </button>
            );
          })}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center gap-4">
            <img src="/pets/buddy.webp" alt="" className="animate-bob h-[125px] w-[145px] object-contain object-bottom" />
            <div key={msg} className="animate-pop mb-5 rounded-[16px] border-2 border-white bg-white/92 px-4 py-2 font-baloo text-sm font-extrabold shadow-[0_4px_0_rgba(0,0,0,.1)]" style={{ color: tone === "good" ? "#4F7C2A" : tone === "bad" ? "#B3402F" : "#8A7A62" }}>
              {msg}
            </div>
            <img src="/pets/mimi.webp" alt="" className="h-[105px] w-[125px] object-contain object-bottom" style={{ animation: "bob 3.8s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
      {finished && <RewardModal coins={25} xp={15} score={`${score + (zapped?.ok ? 10 : 0)} ${t("điểm")}`} onContinue={reset} />}
    </div>
  );
}
