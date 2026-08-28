import { useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, type WordTrainFillData, type WordTrainRoundData, type WordTrainScrambleData, type WordTrainTopicDetail, type WordTrainTopicListItem } from "../lib/api";
import { BackIcon, ChunkyButton, CoinIcon, RewardModal } from "../components/ui";
import { useLang, useT } from "../lib/i18n";
import { loadMasteredSet, markRoundResult, roundKey } from "../lib/wordTrainMastery";
import { getMockWordTrainTopic, isMockWordTrainId, listMockWordTrainTopics } from "../lib/wordTrainMock";

interface WordTrainProps {
  onExit: () => void;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

const SESSION_FILL_COUNT = 8;
const SESSION_SCRAMBLE_COUNT = 2;

/** Picks `count` rounds from `pool`, preferring ones NOT in `mastered` (see
 * lib/wordTrainMastery.ts) — a child who already nailed a round on the first
 * try shouldn't keep seeing it every session, while one they got wrong stays
 * in the "still needs practice" rotation. Tops back up from the mastered
 * ones if there aren't enough unmastered rounds to fill the quota (e.g. once
 * a child has mastered everything, or for a small pool). */
function pickWeighted(pool: WordTrainRoundData[], mastered: Set<string>, count: number): WordTrainRoundData[] {
  const needsPractice = pool.filter((r) => !mastered.has(roundKey(r)));
  const learned = pool.filter((r) => mastered.has(roundKey(r)));
  const picked = shuffle(needsPractice).slice(0, count);
  if (picked.length < count) picked.push(...shuffle(learned).slice(0, count - picked.length));
  return picked;
}

/** Some Word Train topics now ship a big 500-round pool (see prisma/seed.ts's
 * `WORD_TRAIN_MOCK_TOPICS`) instead of a fixed 6-round ride — this samples a
 * fresh 8-fill-+-2-scramble session out of whatever pool a topic has (a small
 * hand-authored 6-round topic just gets all 6 of its rounds, reshuffled),
 * weighted toward whatever `topicKey` hasn't been mastered yet. */
function sampleWordTrainSession(topicKey: string, rounds: WordTrainRoundData[]): WordTrainRoundData[] {
  const mastered = loadMasteredSet(topicKey);
  const fills = rounds.filter((r) => r.kind === "fill");
  const scrambles = rounds.filter((r) => r.kind === "scramble");
  const pickedFills = pickWeighted(fills, mastered, Math.min(SESSION_FILL_COUNT, fills.length));
  const pickedScrambles = pickWeighted(scrambles, mastered, Math.min(SESSION_SCRAMBLE_COUNT, scrambles.length));
  return shuffle([...pickedFills, ...pickedScrambles]);
}

/** Word Train — a run of small puzzles the train "travels through": fill in
 * the missing letter of a word ("C _ T" -> "A"), then a couple of
 * "unscramble this sentence" rounds at the end of the run. The picker mixes
 * 2 kinds of topics: real WordTrainTopic/WordTrainRound catalog data from
 * the backend (see /catalog/word-train-topics — the 2 system topics plus
 * anything admin/parent-authored), and 9 big "mock" topics generated
 * entirely on-device from the offline dictionary bundle (see
 * lib/wordTrainMock.ts) — those need no network at all, so they're always
 * shown even if the API call below fails/times out (offline-first). */
export default function WordTrain({ onExit }: WordTrainProps) {
  const t = useT();
  const { lang } = useLang();
  const mockTopics = useMemo(() => listMockWordTrainTopics(), []);
  const [realTopics, setRealTopics] = useState<WordTrainTopicListItem[] | null>(null);
  const list = realTopics ? [...realTopics, ...mockTopics] : mockTopics;
  const [topic, setTopic] = useState<WordTrainTopicDetail | null>(null);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    api
      .listWordTrainTopics()
      .then((r) => setRealTopics(r.topics))
      .catch((err) => setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được các chủ đề hệ thống (cần có mạng) — vẫn chơi được các chủ đề bên dưới.")));
  }, [t]);

  async function openTopic(id: string) {
    setLoadErr("");
    try {
      const topic = isMockWordTrainId(id) ? await getMockWordTrainTopic(id.slice("mock:".length), lang) : (await api.getWordTrainTopic(id)).topic;
      if (topic) setTopic(topic);
    } catch (err) {
      setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được chủ đề, thử lại nhé."));
    }
  }

  if (topic) return <WordTrainPlay topic={topic} onExit={() => setTopic(null)} />;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#BCEB9A]">
      <img src="/games/word-train/railway-map-v1.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#153A45]/18 backdrop-blur-[1px]" />
      <div className="relative flex items-center gap-3.5 border-b-2 border-white/50 bg-white/72 p-4.5 backdrop-blur-md">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[28px] font-extrabold text-[#315B72]">🚂 Word Train Adventure</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#5A7080]">{t("Chọn tuyến đường · giải câu đố · đưa tàu về ga")}</span>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-y-auto px-8 pb-7 pt-5">
        {/* `list` always has at least the 9 offline mock topics — see the doc
            comment above — so there's no "loading"/"empty" full-screen state
            to handle here, only a small note below if the real ones failed. */}
        <div className="flex max-w-[850px] flex-wrap justify-center gap-6">
          {list.map((tp) => (
            <button
              key={tp.id}
              onClick={() => openTopic(tp.id)}
              className="group relative flex min-h-[210px] w-[260px] flex-col items-center gap-3 overflow-hidden rounded-[28px] border-4 border-white bg-[#FFFDF4]/96 p-5 text-center shadow-[0_8px_0_#B78345,0_20px_38px_rgba(42,65,42,.25)] transition-all hover:-translate-y-2"
            >
              <span className="absolute inset-x-0 top-0 h-4 bg-[repeating-linear-gradient(90deg,#EF6A5A_0_26px,#FFF1C7_26px_52px)]" />
              <span className="mt-2 grid h-20 w-20 place-items-center rounded-full border-4 border-white text-[48px] shadow-[0_5px_0_rgba(0,0,0,.13)] transition-transform group-hover:scale-110" style={{ background: tp.color }}>🚂</span>
              <span className="font-baloo text-[20px] font-extrabold leading-snug text-[#315B72]">{tp.name}</span>
              {/* "Đã thuộc bao nhiêu / tổng pool" — không phải độ dài 1 phiên chơi
                  (xem sampleWordTrainSession) — đọc thẳng từ localStorage mỗi lần
                  render nên tự cập nhật ngay khi quay lại màn này sau khi chơi. */}
              <span className="rounded-full bg-[#E9F6E1] px-4 py-1.5 font-baloo text-[12px] font-extrabold text-[#4F7C2A]">
                🎫 {loadMasteredSet(tp.key).size}/{tp._count.rounds} {t("chặng")}
              </span>
              <span className="mt-auto font-baloo text-[11px] font-bold uppercase tracking-[.12em] text-[#B07A0C]">Khởi hành →</span>
            </button>
          ))}
        </div>
        {loadErr && <div className="mt-3 font-baloo text-sm font-bold text-[#B3402F]">{loadErr}</div>}
      </div>
    </div>
  );
}

/** The actual ride, once a topic has been picked. `topic.rounds` may be a
 * big pool (500, for the mock topics — see prisma/seed.ts) rather than a
 * fixed ride, so this draws a fresh, mastery-weighted session from it on
 * mount AND every "Chơi lại" (small hand-authored topics just get all of
 * their rounds, reshuffled, every time instead — see sampleWordTrainSession). */
function WordTrainPlay({ topic, onExit }: { topic: WordTrainTopicDetail; onExit: () => void }) {
  const t = useT();
  const [rounds, setRounds] = useState(() => sampleWordTrainSession(topic.key, topic.rounds));
  const [roundIdx, setRoundIdx] = useState(0);
  const [coins, setCoins] = useState(0);
  const [coinPop, setCoinPop] = useState(0);
  const [finished, setFinished] = useState(false);
  const round = rounds[roundIdx]!;

  function reset() {
    setRounds(sampleWordTrainSession(topic.key, topic.rounds));
    setRoundIdx(0);
    setCoins(0);
    setFinished(false);
  }

  /** `flawless` = no wrong pick along the way — see lib/wordTrainMastery.ts:
   * a flawless round gets deprioritized in future sessions of this topic;
   * one that took a mistake to get right stays (or goes back) in rotation,
   * per the user's own framing ("đúng luôn thì khỏi lặp, sai thì cần học lại"). */
  function handleSuccess(flawless: boolean) {
    markRoundResult(topic.key, round, flawless);
    setCoins((c) => c + 10);
    setCoinPop((p) => p + 1);
    setTimeout(() => {
      if (roundIdx + 1 >= rounds.length) {
        setFinished(true);
      } else {
        setRoundIdx((i) => i + 1);
      }
    }, 700);
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#BCEB9A]">
      <img src="/games/word-train/railway-map-v1.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-white/6" />
      <div className="relative z-20 flex items-center gap-3.5 border-b-2 border-white/60 bg-white/78 p-3.5 backdrop-blur-md">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[24px] font-extrabold text-[#315B72]">🚂 {topic.name}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#5A7080]">
            {t("Chặng")} {roundIdx + 1}/{rounds.length}
          </span>
        </div>
        <div className="mx-5 flex min-w-[280px] flex-1 items-center gap-2">
          {rounds.map((_, i) => <span key={i} className={`h-3 flex-1 rounded-full border border-white transition-colors ${i < roundIdx ? "bg-[#7CC24A]" : i === roundIdx ? "animate-pulse bg-[#F2A81C]" : "bg-[#D7E8D0]"}`} />)}
        </div>
        <div className="relative flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#B07A0C] shadow-[0_3px_0_rgba(0,0,0,.12)]">
          <CoinIcon size={19} />
          {coins}
          {coinPop > 0 && (
            <span key={coinPop} className="animate-float-up pointer-events-none absolute -top-1 right-2 font-baloo text-sm font-extrabold text-[#4F7C2A]">
              +10
            </span>
          )}
        </div>
        <button onClick={reset} className="rounded-2xl border-[3px] border-line bg-cream-card px-5 py-2.5 font-baloo text-[15px] font-bold text-brand-brown shadow-[0_4px_0_#E7D4B2]">
          {t("Chơi lại")}
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-6 pb-5 pt-4">
        <div className="word-train-route pointer-events-none absolute inset-[3%] z-0">
          <span className="word-train-engine absolute text-[56px] drop-shadow-[0_8px_4px_rgba(30,60,30,.28)]" style={{ offsetDistance: `${(roundIdx / Math.max(1, rounds.length - 1)) * 100}%` }}>🚂</span>
        </div>
        <div className="relative z-10 flex min-h-[430px] w-[720px] max-w-[72%] flex-col items-center justify-center overflow-hidden rounded-[34px] border-[5px] border-white bg-[#E9FAFF]/96 px-8 py-7 shadow-[0_9px_0_#4B9DB2,0_24px_60px_rgba(25,75,70,.28)] backdrop-blur-sm">
          <div className="absolute inset-x-0 top-0 h-5 bg-[repeating-linear-gradient(90deg,#57C6C6_0_38px,#B8F1F1_38px_76px)]" />
          <div className="mb-4 flex items-center gap-2 rounded-full bg-[#D8F3F7] px-4 py-1.5 font-baloo text-[11px] font-extrabold uppercase tracking-[.15em] text-[#357D8C]">Ga {roundIdx + 1} · Word puzzle</div>
          {round.kind === "fill" ? (
            <FillRound key={roundIdx} data={round.data} vi={round.vi} onSuccess={handleSuccess} />
          ) : (
            <ScrambleRound key={roundIdx} data={round.data} vi={round.vi} onSuccess={handleSuccess} />
          )}
        </div>

        {finished && (
          <RewardModal coins={coins} xp={15} score={`${rounds.length}/${rounds.length} ${t("chặng")}`} onContinue={reset}>
            <div className="font-baloo text-sm font-semibold text-[#6E6047]">{t("Tàu đã về ga cuối! Chơi lại để ôn nhanh hơn nhé.")}</div>
          </RewardModal>
        )}
      </div>
    </div>
  );
}

function FillRound({ data, vi, onSuccess }: { data: WordTrainFillData; vi: string; onSuccess: (flawless: boolean) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [wrongOpt, setWrongOpt] = useState<string | null>(null);
  const hadWrongRef = useRef(false);
  const correctLetter = data.word[data.blankIndex];

  function pick(letter: string) {
    if (picked || wrongOpt) return;
    if (letter === correctLetter) {
      setPicked(letter);
      onSuccess(!hadWrongRef.current);
    } else {
      hadWrongRef.current = true;
      setWrongOpt(letter);
      setTimeout(() => setWrongOpt(null), 450);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="rounded-full bg-white/75 px-5 py-2 font-baloo text-base font-semibold text-[#5A7080] shadow-sm">💡 {vi}</div>
      <div className="flex gap-2.5">
        {data.word.split("").map((ch, i) => {
          const isBlank = i === data.blankIndex;
          const shown = isBlank ? (picked ?? "_") : ch;
          return (
            <div
              key={i}
              className="grid h-22 w-18 place-items-center rounded-[20px] border-[4px] font-baloo text-4xl font-extrabold shadow-[0_6px_0_#BFD8DF]"
              style={{
                borderColor: isBlank ? (picked ? "#7CC24A" : "#F5822B") : "#E7D4B2",
                background: isBlank && picked ? "#EEF9E3" : "#fff",
                color: isBlank && !picked ? "#C9BEA0" : "#4A3728",
              }}
            >
              {shown}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3.5">
        {data.options.map((opt, optionIdx) => (
          <button
            key={opt}
            onClick={() => pick(opt)}
            disabled={picked !== null}
            className={`grid h-18 w-18 place-items-center rounded-[20px] border-[4px] font-baloo text-3xl font-extrabold text-white shadow-[0_6px_0_rgba(55,70,90,.28)] transition-all hover:-translate-y-1 active:translate-y-1 disabled:opacity-50 ${wrongOpt === opt ? "animate-shake" : ""}`}
            style={{ borderColor: wrongOpt === opt ? "#EF6A5A" : "#fff", background: ["#EF6A8A", "#7CC24A", "#9B7EDE", "#57C6C6"][optionIdx % 4] }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScrambleRound({ data, vi, onSuccess }: { data: WordTrainScrambleData; vi: string; onSuccess: (flawless: boolean) => void }) {
  const t = useT();
  const [pool, setPool] = useState<string[]>(() => shuffle(data.words));
  const [answer, setAnswer] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const [correct, setCorrect] = useState(false);
  const hadWrongRef = useRef(false);

  function pickWord(idx: number) {
    if (correct || wrong) return;
    const word = pool[idx]!;
    const nextAnswer = [...answer, word];
    setPool((p) => p.filter((_, i) => i !== idx));
    setAnswer(nextAnswer);
    if (nextAnswer.length === data.words.length) {
      const isCorrect = nextAnswer.every((w, i) => w === data.words[i]);
      if (isCorrect) {
        setCorrect(true);
        onSuccess(!hadWrongRef.current);
      } else {
        hadWrongRef.current = true;
        setWrong(true);
      }
    }
  }

  function tryAgain() {
    setWrong(false);
    setAnswer([]);
    setPool(shuffle(data.words));
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="rounded-full bg-white/75 px-5 py-2 font-baloo text-base font-semibold text-[#5A7080] shadow-sm">💡 {vi}</div>
      <div
        className="flex min-h-16 w-full max-w-xl flex-wrap justify-center gap-2.5 rounded-2xl border-[3px] border-dashed p-3.5"
        style={{ borderColor: wrong ? "#EF6A5A" : correct ? "#7CC24A" : "#E7D4B2" }}
      >
        {answer.length === 0 && <span className="my-2 font-baloo text-sm font-semibold text-[#C9BEA0]">{t("Chạm từ bên dưới để ghép thành câu")}</span>}
        {answer.map((w, i) => (
          <span key={i} className="rounded-xl bg-brand-orange px-4 py-2.5 font-baloo text-lg font-extrabold text-white shadow-[0_4px_0_#C9631A]">
            {w}
          </span>
        ))}
      </div>
      {wrong ? (
        <div className="flex flex-col items-center gap-2.5">
          <div className="font-baloo text-sm font-extrabold text-[#B3402F]">{t("Chưa đúng thứ tự, thử lại nhé!")}</div>
          <ChunkyButton tone="orange" onClick={tryAgain}>
            {t("Làm lại")}
          </ChunkyButton>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {pool.map((w, i) => (
            <button
              key={i}
              onClick={() => pickWord(i)}
              disabled={correct}
              className="rounded-xl border-[3px] border-line bg-white px-4 py-2.5 font-baloo text-lg font-extrabold shadow-[0_4px_0_#E7D4B2] transition-transform active:translate-y-1 disabled:opacity-50"
            >
              {w}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
