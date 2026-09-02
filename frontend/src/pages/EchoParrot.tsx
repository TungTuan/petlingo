import { useEffect, useState } from "react";
import { api, ApiError, type EchoParrotRoundData, type EchoParrotTopicDetail, type EchoParrotTopicListItem } from "../lib/api";
import { BackIcon, CoinIcon, RewardModal, SpeakerIcon, SpeechBubble } from "../components/ui";
import PetPortrait from "../components/PetPortrait";
import { useT } from "../lib/i18n";
import { speak } from "../lib/tts";
import { isCloseSpeechMatch, useSpeechRecognition } from "../lib/useSpeechRecognition";

interface EchoParrotProps {
  onExit: () => void;
  onComplete?: () => void;
}

/** Vẹt Con Tập Nói (Echo Parrot) — the one game in the app that practices
 * SPEAKING instead of listening/reading/matching: hear a sample word/phrase
 * (server TTS, same lib/tts.ts every other game uses), then say it back —
 * the mic result gets compared against the round's English text (see
 * lib/useSpeechRecognition.ts for the native-vs-web recognition split and
 * why iOS specifically needs the native path). No punish-on-wrong, matching
 * every other game's philosophy: a miss just invites another try. */
export default function EchoParrot({ onExit, onComplete }: EchoParrotProps) {
  const t = useT();
  const [list, setList] = useState<EchoParrotTopicListItem[] | null>(null);
  const [topic, setTopic] = useState<EchoParrotTopicDetail | null>(null);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    api
      .listEchoParrotTopics()
      .then((r) => setList(r.topics))
      .catch((err) => setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách chủ đề, thử lại nhé.")));
  }, [t]);

  async function openTopic(id: string) {
    setLoadErr("");
    try {
      const { topic } = await api.getEchoParrotTopic(id);
      setTopic(topic);
    } catch (err) {
      setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được chủ đề, thử lại nhé."));
    }
  }

  if (topic) return <EchoParrotPlay topic={topic} onExit={() => setTopic(null)} onComplete={onComplete} />;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#FFE8CF] to-[#FFF6E9]">
      <div className="flex items-center gap-3.5 p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[25px] font-extrabold">🦜 Vẹt Con Tập Nói</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Chọn 1 chủ đề để bắt đầu tập nói")}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {list === null ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải danh sách chủ đề…")}</div>
        ) : loadErr && list.length === 0 ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-[#B3402F]">{loadErr}</div>
        ) : (
          <div className="grid grid-cols-5 gap-4.5">
            {list.map((tp) => (
              <button
                key={tp.id}
                onClick={() => openTopic(tp.id)}
                className="flex flex-col items-start gap-2.5 rounded-[22px] border-[3px] border-line bg-white p-4.5 text-left shadow-[0_5px_0_#E7D4B2] transition-transform hover:-translate-y-1"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl text-xl" style={{ background: tp.color }}>
                  🦜
                </span>
                <span className="font-baloo text-base font-extrabold leading-snug">{tp.name}</span>
                <span className="mt-auto font-baloo text-[11.5px] font-bold text-[#8A7A62]">
                  {tp._count.rounds} {t("từ vựng")}
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

/** The actual practice loop, once a topic has been picked. */
function EchoParrotPlay({ topic, onExit, onComplete }: { topic: EchoParrotTopicDetail; onExit: () => void; onComplete?: () => void }) {
  const t = useT();
  const makeSession = () => [...topic.rounds].sort(() => Math.random() - 0.5).slice(0, Math.min(5, topic.rounds.length));
  const [rounds, setRounds] = useState(makeSession);
  const [roundIdx, setRoundIdx] = useState(0);
  const [coins, setCoins] = useState(0);
  const [coinPop, setCoinPop] = useState(0);
  const [finished, setFinished] = useState(false);
  const round = rounds[roundIdx]!;

  function reset() {
    setRounds(makeSession());
    setRoundIdx(0);
    setCoins(0);
    setFinished(false);
  }

  function handleCorrect() {
    setCoins((c) => c + 10);
    setCoinPop((p) => p + 1);
    setTimeout(() => {
      if (roundIdx + 1 >= rounds.length) { setFinished(true); onComplete?.(); }
      else setRoundIdx((i) => i + 1);
    }, 1300);
  }

  function skipRound() {
    if (roundIdx + 1 >= rounds.length) setFinished(true);
    else setRoundIdx((i) => i + 1);
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#FFE8CF] to-[#FFF6E9]">
      <div className="flex items-center gap-3.5 p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[25px] font-extrabold">{topic.name}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">
            {t("Từ số")} {roundIdx + 1}/{rounds.length}
          </span>
        </div>
        <div className="flex-1" />
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

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-6 pb-6">
        <EchoRound key={roundIdx} data={round} onCorrect={handleCorrect} onSkip={skipRound} />

        {finished && (
          <RewardModal coins={coins} xp={15} score={`${rounds.length}/${rounds.length} ${t("từ vựng")}`} onContinue={reset}>
            <div className="font-baloo text-sm font-semibold text-[#6E6047]">{t("Vẹt con nói giỏi quá! Chơi lại để luyện thêm nhé.")}</div>
          </RewardModal>
        )}
      </div>
    </div>
  );
}

function EchoRound({ data, onCorrect, onSkip }: { data: EchoParrotRoundData; onCorrect: () => void; onSkip: () => void }) {
  const t = useT();
  const { status, listen } = useSpeechRecognition();
  const [heard, setHeard] = useState<string | null>(null);
  const [correct, setCorrect] = useState(false);

  async function handleMicTap() {
    if (status === "listening" || correct) return;
    setHeard(null);
    const text = await listen();
    if (text === null) return; // unsupported/denied — `status` already reflects why, message shown below
    setHeard(text);
    if (isCloseSpeechMatch(data.en, text)) {
      setCorrect(true);
      onCorrect();
    }
  }

  const wrongAttempt = heard !== null && !correct;

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6">
      {/* Rounds that talk ABOUT a specific pet ("This is Buddy.") carry
       * `petKey` so the round shows that pet's real portrait instead of
       * being pure text — plain vocabulary rounds ("Cat", "Hello!") leave it
       * null and render nothing here. */}
      {data.petKey && <PetPortrait petId={data.petKey} name={data.en} animated className="h-[130px] w-[130px] drop-shadow-[0_10px_10px_rgba(80,57,28,.18)]" />}
      <SpeechBubble className="text-center">
        <div className="font-baloo text-[32px] font-extrabold">{data.en}</div>
        {data.phonetic && <div className="mt-1 font-baloo text-base font-semibold text-[#8A7A62]">{data.phonetic}</div>}
        <div className="mt-1 font-baloo text-sm font-bold text-[#5A7080]">{data.vi}</div>
      </SpeechBubble>

      <button
        onClick={() => speak(data.en)}
        className="flex items-center gap-2 rounded-2xl border-[3px] border-line bg-white px-5 py-2.5 font-baloo text-[15px] font-bold text-brand-brown shadow-[0_4px_0_#E7D4B2] transition-transform active:translate-y-1"
      >
        <SpeakerIcon size={20} color="#8A5A3B" />
        {t("Nghe mẫu")}
      </button>

      <button
        onClick={handleMicTap}
        disabled={correct || status === "unsupported" || status === "denied"}
        className={`grid h-[110px] w-[110px] place-items-center rounded-full text-5xl shadow-[0_6px_0_#C9631A] transition-transform active:translate-y-1 disabled:opacity-60 ${
          status === "listening" ? "animate-pulse-soft bg-[#EF6A5A]" : correct ? "bg-brand-green shadow-[0_6px_0_#5C9C31]" : "bg-brand-orange"
        }`}
      >
        {correct ? "✅" : "🎤"}
      </button>

      <div className="grid h-14 place-items-center">
        {status === "listening" && <div className="font-baloo text-base font-extrabold text-[#EF6A5A]">{t("Đang nghe... nói đi bé!")}</div>}
        {status === "unsupported" && (
          <div className="max-w-md text-center font-baloo text-sm font-bold text-[#B3402F]">
            {t("Thiết bị này chưa hỗ trợ nhận diện giọng nói.")}{" "}
            <button onClick={onSkip} className="underline">
              {t("Bỏ qua từ này")}
            </button>
          </div>
        )}
        {status === "denied" && (
          <div className="max-w-md text-center font-baloo text-sm font-bold text-[#B3402F]">
            {t("Cần cho phép dùng micro để chơi trò này — vào Cài đặt bật lại quyền micro nhé.")}{" "}
            <button onClick={onSkip} className="underline">
              {t("Bỏ qua từ này")}
            </button>
          </div>
        )}
        {correct && <div className="font-baloo text-lg font-extrabold text-[#4F7C2A]">{t("Xuất sắc! Bạn nói đúng rồi!")}</div>}
        {wrongAttempt && status === "idle" && (
          <div className={`flex flex-col items-center gap-1 ${wrongAttempt ? "animate-shake" : ""}`}>
            <div className="font-baloo text-sm font-bold text-[#8A7A62]">
              {t("Bạn nói:")} "{heard}"
            </div>
            <div className="font-baloo text-base font-extrabold text-[#B3402F]">{t("Nghe chưa đúng, thử lại nhé!")}</div>
          </div>
        )}
      </div>
    </div>
  );
}
