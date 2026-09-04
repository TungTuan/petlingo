import { useEffect, useState } from "react";
import { api, ApiError, type ChatBuddyRoundData, type ChatBuddyTopicDetail, type ChatBuddyTopicListItem } from "../lib/api";
import { BackIcon, CoinIcon, RewardModal, SpeakerIcon, SpeechBubble } from "../components/ui";
import { useT } from "../lib/i18n";
import { speak } from "../lib/tts";

interface ChatBuddyProps {
  onExit: () => void;
  onComplete?: (contentKey: string) => void;
}

/** Trò Chuyện Cùng Bạn Thú (Chat with Buddy) — luyện hội thoại tương tác,
 * bản nhẹ hơn dành cho trẻ em so với "hỏi cung NPC" của English Detective
 * (nhắm người lớn/trẻ lớn hơn — xem TASKS.md). Pet hỏi 1 câu tiếng Anh (TTS),
 * bé chọn 1 trong vài câu trả lời phù hợp ngữ cảnh, đúng thì pet phản hồi lại
 * (cũng TTS) rồi sang lượt kế — nhiều lượt nối tiếp nhau tạo cảm giác đang
 * trò chuyện thật, khác với 1 câu hỏi độc lập như phần lớn game khác. Sai chỉ
 * rung nút, không tính, không phạt — giống mọi game khác trong app. Cùng
 * khung picker→play với English Detective/Echo Parrot. */
export default function ChatBuddy({ onExit, onComplete }: ChatBuddyProps) {
  const t = useT();
  const [list, setList] = useState<ChatBuddyTopicListItem[] | null>(null);
  const [topic, setTopic] = useState<ChatBuddyTopicDetail | null>(null);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    api
      .listChatBuddyTopics()
      .then((r) => setList(r.topics))
      .catch((err) => setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách chủ đề, thử lại nhé.")));
  }, [t]);

  async function openTopic(id: string) {
    setLoadErr("");
    try {
      const { topic } = await api.getChatBuddyTopic(id);
      setTopic(topic);
    } catch (err) {
      setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được chủ đề, thử lại nhé."));
    }
  }

  if (topic) return <ChatBuddyPlay topic={topic} onExit={() => setTopic(null)} onComplete={() => onComplete?.(topic.id)} />;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#FFF3D6] to-[#FFF9EC]">
      <div className="flex items-center gap-3.5 p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[25px] font-extrabold">💬 {t("Trò Chuyện Cùng Bạn Thú")}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Chọn 1 chủ đề để bắt đầu trò chuyện")}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {list === null ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải danh sách chủ đề…")}</div>
        ) : loadErr && list.length === 0 ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-[#B3402F]">{loadErr}</div>
        ) : (
          <div className="grid grid-cols-4 gap-4.5">
            {list.map((tp) => (
              <button
                key={tp.id}
                onClick={() => openTopic(tp.id)}
                className="flex flex-col items-start gap-2.5 rounded-[22px] border-[3px] border-line bg-white p-4.5 text-left shadow-[0_5px_0_#E7D4B2] transition-transform hover:-translate-y-1"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl text-xl" style={{ background: tp.color }}>
                  🐾
                </span>
                <span className="font-baloo text-base font-extrabold leading-snug">{tp.name}</span>
                <span className="mt-auto font-baloo text-[11.5px] font-bold text-[#8A7A62]">
                  {tp._count.rounds} {t("lượt trò chuyện")}
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

/** The actual conversation, once a topic has been picked. */
function ChatBuddyPlay({ topic, onExit, onComplete }: { topic: ChatBuddyTopicDetail; onExit: () => void; onComplete?: () => void }) {
  const t = useT();
  const rounds = topic.rounds;
  const [roundIdx, setRoundIdx] = useState(0);
  const [coins, setCoins] = useState(0);
  const [coinPop, setCoinPop] = useState(0);
  const [finished, setFinished] = useState(false);
  const round = rounds[roundIdx]!;

  function reset() {
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
    }, 1600);
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#FFF3D6] to-[#FFF9EC]">
      <div className="flex items-center gap-3.5 p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[22px] font-extrabold">{topic.name}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">
            {t("Lượt")} {roundIdx + 1}/{rounds.length}
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
        <ChatRound key={roundIdx} data={round} onCorrect={handleCorrect} />

        {finished && (
          <RewardModal coins={coins} xp={15} score={`${rounds.length}/${rounds.length} ${t("lượt trò chuyện")}`} onContinue={reset}>
            <div className="font-baloo text-sm font-semibold text-[#6E6047]">{t("Bạn thú rất vui vì được trò chuyện cùng bạn! Chơi lại để luyện thêm nhé.")}</div>
          </RewardModal>
        )}
      </div>
    </div>
  );
}

function ChatRound({ data, onCorrect }: { data: ChatBuddyRoundData; onCorrect: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Đọc câu hỏi của pet ngay khi vào lượt mới — giống EchoParrot's speak() on
  // mount, giúp bé nghe trước khi phải đọc chữ.
  useEffect(() => {
    speak(data.petLine);
  }, [data]);

  function pick(i: number) {
    if (picked !== null) return;
    if (i === data.answerIndex) {
      setPicked(i);
      setRevealed(true);
      speak(data.replyLine);
      setTimeout(onCorrect, 1500);
    } else {
      setWrongIdx(i);
      setTimeout(() => setWrongIdx(null), 450);
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white text-3xl shadow-[0_4px_0_rgba(0,0,0,.15)]">🐶</div>
        <SpeechBubble tail="left" className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="font-baloo text-lg font-extrabold">{data.petLine}</div>
            <button onClick={() => speak(data.petLine)} className="shrink-0 rounded-full bg-[#FFF3D6] p-1.5">
              <SpeakerIcon size={18} color="#B3701A" />
            </button>
          </div>
          <div className="mt-1 font-baloo text-sm font-semibold text-[#8A7A62]">{data.petLineVi}</div>
        </SpeechBubble>
      </div>

      <div className="flex flex-col gap-2.5">
        {data.options.map((opt, i) => {
          const isCorrectShown = revealed && i === data.answerIndex;
          return (
            <button
              key={opt}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`rounded-2xl border-[3px] bg-white px-5 py-3.5 text-left shadow-[0_4px_0_rgba(0,0,0,.1)] transition-transform active:translate-y-1 disabled:opacity-70 ${
                wrongIdx === i ? "animate-shake" : ""
              }`}
              style={{ borderColor: isCorrectShown ? "#7CC24A" : wrongIdx === i ? "#EF6A5A" : "#E7D4B2", background: isCorrectShown ? "#EEF9E3" : "#fff" }}
            >
              <div className="font-baloo text-base font-bold">{opt}</div>
              <div className="font-baloo text-xs font-semibold text-[#8A7A62]">{data.optionsVi[i]}</div>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-2xl shadow-[0_4px_0_rgba(0,0,0,.15)]">🐾</div>
          <div className="rounded-2xl border-[3px] border-dashed border-[#7CC24A] bg-[#EEF9E3] px-4 py-3">
            <div className="font-baloo text-sm font-extrabold text-[#4F7C2A]">{data.replyLine}</div>
            <div className="font-baloo text-xs font-semibold text-[#5C9C31]">{data.replyLineVi}</div>
          </div>
        </div>
      )}
    </div>
  );
}
