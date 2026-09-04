import { useEffect, useMemo, useState } from "react";
import {
  api,
  ApiError,
  type DetectiveAccuseData,
  type DetectiveCaseDetail,
  type DetectiveCaseListItem,
  type DetectiveInterrogateData,
} from "../lib/api";
import { BackIcon, ChunkyButton, CoinIcon, RewardModal, SpeechBubble } from "../components/ui";
import { useT } from "../lib/i18n";

interface EnglishDetectiveProps {
  onExit: () => void;
  onComplete?: (contentKey: string) => void;
}

/** English Detective — nhắm tới người lớn/trẻ lớn hơn (xem TASKS.md): đọc 1
 * vụ án bằng tiếng Anh, hỏi cung từng nghi phạm bằng câu hỏi trắc nghiệm để
 * lộ ra manh mối, rồi buộc tội thủ phạm ở bước cuối. Bản đầu dùng trắc
 * nghiệm cho cả 2 bước (không nhập câu trả lời tự do). Cùng khung
 * picker→play với English Shop/Home/Word RPG/Word Train. */
export default function EnglishDetective({ onExit, onComplete }: EnglishDetectiveProps) {
  const t = useT();
  const [list, setList] = useState<DetectiveCaseListItem[] | null>(null);
  const [detectiveCase, setDetectiveCase] = useState<DetectiveCaseDetail | null>(null);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    api
      .listDetectiveCases()
      .then((r) => setList(r.cases))
      .catch((err) => setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách vụ án, thử lại nhé.")));
  }, [t]);

  async function openCase(id: string) {
    setLoadErr("");
    try {
      const { case: loaded } = await api.getDetectiveCase(id);
      setDetectiveCase(loaded);
    } catch (err) {
      setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được vụ án, thử lại nhé."));
    }
  }

  if (detectiveCase) return <EnglishDetectivePlay detectiveCase={detectiveCase} onExit={() => setDetectiveCase(null)} onComplete={() => onComplete?.(detectiveCase.id)} />;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#2A2E45] to-[#454B6B]">
      <div className="flex items-center gap-3.5 p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[25px] font-extrabold text-white">🕵️ English Detective</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#C7CBE0]">{t("Chọn 1 vụ án để bắt đầu điều tra")}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {list === null ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-white/40">{t("Đang tải danh sách vụ án…")}</div>
        ) : loadErr && list.length === 0 ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-[#FF9B8A]">{loadErr}</div>
        ) : (
          <div className="grid grid-cols-4 gap-4.5">
            {list.map((c) => (
              <button
                key={c.id}
                onClick={() => openCase(c.id)}
                className="flex flex-col items-start gap-2.5 rounded-[22px] border-[3px] p-4.5 text-left shadow-[0_5px_0_rgba(0,0,0,.3)] transition-transform hover:-translate-y-1"
                style={{ background: "#F3EEE1", borderColor: c.color }}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl text-xl" style={{ background: c.color }}>
                  🔎
                </span>
                <span className="font-baloo text-base font-extrabold leading-snug text-[#2A2E45]">{c.name}</span>
                <span className="font-baloo text-[11.5px] font-semibold leading-snug text-[#6E6047]">{c.scenarioVi}</span>
                <span className="mt-auto font-baloo text-[11px] font-bold text-[#8A7A62]">
                  {Math.max(0, c._count.rounds - 1)} {t("nghi phạm")}
                </span>
              </button>
            ))}
          </div>
        )}
        {loadErr && list && list.length > 0 && <div className="mt-3 font-baloo text-sm font-bold text-[#FF9B8A]">{loadErr}</div>}
      </div>
    </div>
  );
}

/** The actual investigation, once a case has been picked. */
function EnglishDetectivePlay({ detectiveCase, onExit, onComplete }: { detectiveCase: DetectiveCaseDetail; onExit: () => void; onComplete?: () => void }) {
  const t = useT();
  const rounds = detectiveCase.rounds;
  const [started, setStarted] = useState(false);
  const [roundIdx, setRoundIdx] = useState(0);
  const [coins, setCoins] = useState(0);
  const [coinPop, setCoinPop] = useState(0);
  const [clues, setClues] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const round = rounds[roundIdx];

  const npcEmojiByName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of rounds) if (r.kind === "interrogate") map[r.data.npcName] = r.data.npcEmoji;
    return map;
  }, [rounds]);

  function reset() {
    setStarted(false);
    setRoundIdx(0);
    setCoins(0);
    setClues([]);
    setSolved(false);
  }

  function handleInterrogateSolved(clue: string) {
    setClues((c) => [...c, clue]);
    setCoins((c) => c + 10);
    setCoinPop((p) => p + 1);
    setTimeout(() => setRoundIdx((i) => i + 1), 1300);
  }

  function handleAccuseSolved() {
    setCoins((c) => c + 30);
    setCoinPop((p) => p + 1);
    setTimeout(() => { setSolved(true); onComplete?.(); }, 800);
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#2A2E45] to-[#454B6B]">
      <div className="flex items-center gap-3.5 p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[22px] font-extrabold text-white">{detectiveCase.name}</span>
          {started && !solved && (
            <span className="font-baloo text-[12.5px] font-semibold text-[#C7CBE0]">
              {t("Bước")} {roundIdx + 1}/{rounds.length}
            </span>
          )}
        </div>
        <div className="flex-1" />
        <div className="relative flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#B07A0C] shadow-[0_3px_0_rgba(0,0,0,.25)]">
          <CoinIcon size={19} />
          {coins}
          {coinPop > 0 && (
            <span key={coinPop} className="animate-float-up pointer-events-none absolute -top-1 right-2 font-baloo text-sm font-extrabold text-[#4F7C2A]">
              +10
            </span>
          )}
        </div>
        <button onClick={reset} className="rounded-2xl border-[3px] border-[#5C6180] bg-[#3A3E5C] px-5 py-2.5 font-baloo text-[15px] font-bold text-white shadow-[0_4px_0_rgba(0,0,0,.3)]">
          {t("Chơi lại")}
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pb-8">
        {!started ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <div className="text-5xl">🕵️</div>
            <SpeechBubble className="max-w-xl text-left">
              <div className="font-baloo text-base font-bold">{detectiveCase.scenario}</div>
              <div className="mt-1.5 font-baloo text-xs font-semibold text-[#8A7A62]">{detectiveCase.scenarioVi}</div>
            </SpeechBubble>
            <ChunkyButton tone="blue" shine onClick={() => setStarted(true)}>
              {t("Bắt đầu điều tra")}
            </ChunkyButton>
          </div>
        ) : (
          <div className="flex w-full flex-1 flex-col items-center gap-4 pt-6">
            {clues.length > 0 && (
              <div className="flex w-full max-w-xl flex-col gap-1.5 rounded-2xl border-[3px] border-dashed border-[#5C6180] bg-white/10 p-3.5">
                <div className="font-baloo text-xs font-extrabold text-[#C7CBE0]">{t("Manh mối đã thu thập")}</div>
                {clues.map((c, i) => (
                  <div key={i} className="font-baloo text-xs font-semibold text-white">
                    • {c}
                  </div>
                ))}
              </div>
            )}

            {round?.kind === "interrogate" && <InterrogateRound key={roundIdx} vi={round.vi} data={round.data} onSolved={handleInterrogateSolved} />}
            {round?.kind === "accuse" && <AccuseRound key={roundIdx} vi={round.vi} data={round.data} npcEmojiByName={npcEmojiByName} onSolved={handleAccuseSolved} />}
          </div>
        )}

        {solved && (
          <RewardModal coins={coins} xp={20} score={t("Đã phá án!")} onContinue={reset}>
            <div className="font-baloo text-sm font-semibold text-[#6E6047]">
              {t("Thủ phạm là")} <b>{(rounds[rounds.length - 1]!.data as DetectiveAccuseData).correctSuspect}</b>!
            </div>
          </RewardModal>
        )}
      </div>
    </div>
  );
}

function InterrogateRound({ data, vi, onSolved }: { data: DetectiveInterrogateData; vi: string; onSolved: (clue: string) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  function pick(i: number) {
    if (picked !== null) return;
    if (i === data.answerIndex) {
      setPicked(i);
      setRevealed(true);
      setTimeout(() => onSolved(data.clue), 1200);
    } else {
      setWrongIdx(i);
      setTimeout(() => setWrongIdx(null), 450);
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="font-baloo text-sm font-bold text-[#C7CBE0]">{vi}</div>
      <div className="flex items-start gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white text-3xl shadow-[0_4px_0_rgba(0,0,0,.25)]">{data.npcEmoji}</div>
        <SpeechBubble tail="left" className="flex-1">
          <div className="font-baloo text-base font-bold">{data.testimony}</div>
          <div className="mt-1 font-baloo text-xs font-semibold text-[#8A7A62]">{data.testimonyVi}</div>
        </SpeechBubble>
      </div>
      <div className="font-baloo text-base font-extrabold text-white">{data.question}</div>
      <div className="flex flex-col gap-2.5">
        {data.options.map((opt, i) => {
          const isCorrectShown = revealed && i === data.answerIndex;
          return (
            <button
              key={opt}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`rounded-2xl border-[3px] bg-white px-5 py-3.5 text-left font-baloo text-base font-bold shadow-[0_4px_0_rgba(0,0,0,.2)] transition-transform active:translate-y-1 disabled:opacity-70 ${
                wrongIdx === i ? "animate-shake" : ""
              }`}
              style={{ borderColor: isCorrectShown ? "#7CC24A" : wrongIdx === i ? "#EF6A5A" : "#E7D4B2", background: isCorrectShown ? "#EEF9E3" : "#fff" }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="rounded-2xl border-[3px] border-dashed border-[#F5822B] bg-[#FFF6E9] px-4 py-3 font-baloo text-sm font-bold text-[#B3701A]">🔎 {data.clue}</div>
      )}
    </div>
  );
}

function AccuseRound({
  data,
  vi,
  npcEmojiByName,
  onSolved,
}: {
  data: DetectiveAccuseData;
  vi: string;
  npcEmojiByName: Record<string, string>;
  onSolved: () => void;
}) {
  const [wrong, setWrong] = useState<string | null>(null);
  const [correct, setCorrect] = useState(false);

  function pick(name: string) {
    if (correct || wrong) return;
    if (name === data.correctSuspect) {
      setCorrect(true);
      onSolved();
    } else {
      setWrong(name);
      setTimeout(() => setWrong(null), 450);
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5">
      <div className="text-center font-baloo text-lg font-extrabold text-white">{vi}</div>
      <div className="flex flex-wrap justify-center gap-3.5">
        {data.suspects.map((name) => (
          <button
            key={name}
            onClick={() => pick(name)}
            disabled={correct}
            className={`flex w-36 flex-col items-center gap-2 rounded-2xl border-[3px] bg-white px-4 py-5 font-baloo text-base font-extrabold shadow-[0_5px_0_rgba(0,0,0,.25)] transition-transform active:translate-y-1 disabled:opacity-70 ${
              wrong === name ? "animate-shake" : ""
            }`}
            style={{ borderColor: correct && name === data.correctSuspect ? "#7CC24A" : wrong === name ? "#EF6A5A" : "#E7D4B2" }}
          >
            <span className="text-3xl">{npcEmojiByName[name] ?? "🕵️"}</span>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
