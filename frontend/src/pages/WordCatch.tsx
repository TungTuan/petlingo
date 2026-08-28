import { useEffect, useState } from "react";
import { api, ApiError, type WordCatchTopicDetail, type WordCatchTopicListItem } from "../lib/api";
import { BackIcon, CoinIcon, HeartIcon, SpeakerIcon } from "../components/ui";
import { useT } from "../lib/i18n";

interface WordCatchProps {
  onExit: () => void;
}

const BORDERS = ["#E7D4B2", "#C9E5F7", "#CDE7B4", "#DDCFF5"];

/** Word Catch — matches the reference sheet's "Phần 5 · Word Catch" panel.
 * Now backed by real WordCatchTopic/WordCatchRound catalog data (see
 * /catalog/wordcatch-topics): shows a topic picker first, then plays
 * whichever topic was tapped — instead of the single hard-coded 5-round set. */
export default function WordCatch({ onExit }: WordCatchProps) {
  const t = useT();
  const [list, setList] = useState<WordCatchTopicListItem[] | null>(null);
  const [topic, setTopic] = useState<WordCatchTopicDetail | null>(null);
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

  if (topic) return <WordCatchPlay topic={topic} onExit={() => setTopic(null)} />;

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
                <span className="h-10 w-10 rounded-2xl" style={{ background: BORDERS[i % BORDERS.length] }} />
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

/** The actual falling-words game, once a topic has been picked. */
function WordCatchPlay({ topic, onExit }: { topic: WordCatchTopicDetail; onExit: () => void }) {
  const t = useT();
  const rounds = topic.rounds;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [coins, setCoins] = useState(0);
  const [coinPop, setCoinPop] = useState(0);
  const [heartHit, setHeartHit] = useState(0);
  const [msg, setMsg] = useState(t("Sẵn sàng!"));
  const [tone, setTone] = useState<"idle" | "good" | "bad">("idle");
  const [zapped, setZapped] = useState<{ word: string; ok: boolean } | null>(null);
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
      setIdx((i) => (i + 1) % rounds.length);
    }, 420);
  }

  function reset() {
    setIdx(0);
    setScore(0);
    setLives(3);
    setCoins(0);
    setMsg(t("Sẵn sàng!"));
    setTone("idle");
    setZapped(null);
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#CFEAF6] from-0% via-[#EAF6E4] via-62% to-[#6FB544] to-62%">
      <div className="flex items-center gap-3.5 p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[25px] font-extrabold">{topic.name}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#5A7080]">{t("Chạm từ đúng nghĩa trước khi nó rơi")}</span>
        </div>
        <div className="flex-1" />
        <div className="rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#4F7C2A] shadow-[0_3px_0_rgba(0,0,0,.12)]">
          {t("Điểm")} {score}
        </div>
        <div key={heartHit} className={`flex gap-1.5 ${heartHit > 0 ? "animate-shake" : ""}`}>
          {[0, 1, 2].map((i) => (
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

      <div className="relative flex flex-1 flex-col px-6.5 pb-5">
        <div className="mx-auto flex items-center gap-3.5 rounded-[22px] border-[3px] border-line bg-white px-7.5 py-3 shadow-[0_5px_0_#E7D4B2]">
          <span className="grid h-[46px] w-[46px] place-items-center rounded-full bg-brand-teal">
            <SpeakerIcon />
          </span>
          <div className="flex flex-col">
            <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Bắt từ có nghĩa")}</span>
            <span className="font-baloo text-[27px] font-extrabold">{round.vi}</span>
          </div>
        </div>

        <div className="relative mt-3.5 flex-1">
          {round.options.map((word, i) => {
            const isZapped = zapped?.word === word;
            const zapAnim = isZapped
              ? zapped!.ok
                ? "catchGood 0.5s cubic-bezier(0.3,1.4,0.5,1) forwards"
                : "shake 0.42s ease-in-out"
              : `fall ${5.4 + (i % 3) * 1.1}s linear ${i * 0.9}s infinite`;
            return (
              <button
                key={word}
                onClick={() => pick(word)}
                disabled={!!zapped}
                className="absolute top-0 rounded-[20px] border-[3px] px-6.5 py-3.5 font-baloo text-[22px] font-extrabold text-ink disabled:cursor-default"
                style={{
                  left: `${7 + i * 23}%`,
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
          <div className="absolute inset-x-0 bottom-1.5 flex items-end justify-center gap-5.5">
            <img src="/pets/buddy.png" alt="" className="animate-bob h-[150px] w-[170px] object-contain object-bottom" />
            <div key={msg} className="animate-pop mb-5.5 rounded-2xl bg-white/95 px-5 py-2.5 font-baloo text-base font-extrabold shadow-[0_4px_0_rgba(0,0,0,.12)]" style={{ color: tone === "good" ? "#4F7C2A" : tone === "bad" ? "#B3402F" : "#8A7A62" }}>
              {msg}
            </div>
            <img src="/pets/mimi.png" alt="" className="h-[120px] w-[140px] object-contain object-bottom" style={{ animation: "bob 3.8s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
