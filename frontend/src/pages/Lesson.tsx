import { useEffect, useState } from "react";
import { AdSlot, BackIcon, HeartRow, SpeakerIcon } from "../components/ui";
import { useT } from "../lib/i18n";
import { speak } from "../lib/tts";
import { getAutoSpeak } from "../lib/ttsPrefs";

export interface LessonQuestion {
  prompt: string;
  hint: string;
  answer: string;
  options: string[];
}

interface LessonProps {
  questions: LessonQuestion[];
  isPremium: boolean;
  onExit: () => void;
  onComplete: (result: { correct: number; total: number; coinsEarned: number }) => void;
  onGoShop: () => void;
}

const COINS_PER_LESSON = 50;
const ANSWER_DELAY_MS = 1100;

/** Lesson — matches the reference sheet's "Phần 1 · Bài học + Test" panel. */
export default function Lesson({ questions, isPremium, onExit, onComplete, onGoShop }: LessonProps) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [showResult, setShowResult] = useState(false);

  const q = questions[step]!;

  useEffect(() => {
    if (getAutoSpeak()) speak(q.answer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function answer(label: string) {
    if (chosen) return;
    const ok = label === q.answer;
    setChosen(label);
    setRight((r) => r + (ok ? 1 : 0));
    if (!ok) setHearts((h) => Math.max(0, h - 1));
    setTimeout(() => {
      if (step >= questions.length - 1) {
        setShowResult(true);
      } else {
        setStep((s) => s + 1);
        setChosen(null);
      }
    }, ANSWER_DELAY_MS);
  }

  function restart() {
    setStep(0);
    setChosen(null);
    setRight(0);
    setHearts(3);
    setShowResult(false);
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#CFEAF6] via-[#EAF6E4] via-55% to-[#DCEFC8]">
      <div className="flex items-center gap-3.5 p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_#43609F]">
          <BackIcon />
        </button>
        <HeartRow total={3} left={hearts} />
        <div className="flex flex-1 items-center gap-3 rounded-full bg-white px-4.5 py-2 shadow-[0_3px_0_rgba(0,0,0,.1)]">
          <span className="font-baloo text-base font-extrabold text-[#6E6047]">
            {step + 1}/{questions.length}
          </span>
          <span className="h-3.5 flex-1 overflow-hidden rounded-full bg-[#EFE3CC]">
            <span className="block h-full rounded-full bg-brand-green transition-[width] duration-300" style={{ width: `${Math.round((step / questions.length) * 100)}%` }} />
          </span>
          <span className="font-baloo text-[13px] font-bold text-[#8A7A62]">Topic: Nature</span>
        </div>
        <button className="grid h-[50px] w-[50px] place-items-center rounded-full bg-white shadow-[0_4px_0_rgba(0,0,0,.12)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#6E6047">
            <rect x="6" y="5" width="4" height="14" rx="1.6" />
            <rect x="14" y="5" width="4" height="14" rx="1.6" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col items-center gap-5 px-10 pt-2">
        <div className="flex items-center gap-4.5">
          <img src="/pets/buddy.png" alt="Buddy" className="animate-bob h-[140px] w-[140px] object-contain" />
          <div className="relative flex items-center gap-3.5 rounded-[24px] border-[3px] border-line bg-white px-6.5 py-4 shadow-[0_5px_0_#E7D4B2]">
            <button
              onClick={() => speak(q.answer)}
              className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-brand-teal shadow-[0_4px_0_#37A0A0] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_#37A0A0]"
            >
              <SpeakerIcon />
            </button>
            <div className="flex flex-col">
              <span className="font-baloo text-[30px] font-extrabold">{q.prompt}</span>
              <span className="font-baloo text-sm font-semibold text-[#8A7A62]">{q.hint}</span>
            </div>
            <span className="absolute left-[-13px] top-[38px] h-5 w-5 rotate-45 border-b-[3px] border-l-[3px] border-line bg-white" />
          </div>
        </div>

        <div className="grid w-full grid-cols-4 gap-5">
          {q.options.map((label) => {
            const picked = chosen === label;
            const ok = label === q.answer;
            const show = chosen !== null;
            const bg = show && picked ? (ok ? "#EEF9E3" : "#FDE7E4") : show && ok ? "#EEF9E3" : "#fff";
            const border = show && picked ? (ok ? "#7CC24A" : "#EF6A5A") : show && ok ? "#CDE7B4" : "#E7D4B2";
            return (
              <button
                key={label}
                onClick={() => answer(label)}
                style={{ background: bg, borderColor: border, boxShadow: `0 6px 0 ${border}` }}
                className="flex flex-col items-center gap-3 rounded-[26px] border-4 p-4 transition-transform hover:-translate-y-1"
              >
                <span className="grid aspect-[1.15] w-full place-items-center rounded-[18px] border-2 border-dashed border-[#DFC9A2] bg-[#F3E9D6] font-mono text-[10px] text-[#A2947C]">
                  {label.toLowerCase()}
                </span>
                <span className="font-baloo text-[21px] font-extrabold text-ink">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex min-h-14 items-center gap-3.5">
          {chosen !== null && (
            <div
              className="animate-pop flex items-center gap-3 rounded-[18px] border-[3px] px-6.5 py-3 font-baloo text-xl font-extrabold"
              style={
                chosen === q.answer
                  ? { background: "#EEF9E3", borderColor: "#CDE7B4", color: "#4F7C2A" }
                  : { background: "#FDE7E4", borderColor: "#F6C3BB", color: "#B3402F" }
              }
            >
              {chosen === q.answer ? t("Đúng rồi! +10 coin") : `${t("Chưa đúng — đáp án là")} ${q.answer}`}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-6.5 left-6.5 flex gap-3.5">
        <button className="grid h-16 w-16 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_5px_0_#43609F]">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
            <rect x="3" y="5" width="8.4" height="15" rx="1.6" />
            <rect x="12.6" y="5" width="8.4" height="15" rx="1.6" />
          </svg>
        </button>
        <button className="relative grid h-16 w-16 place-items-center rounded-full bg-brand-green shadow-[0_5px_0_#5C9C31]">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
            <circle cx="12" cy="10" r="6" />
            <rect x="9.6" y="15.4" width="4.8" height="5" rx="1.6" />
          </svg>
          <span className="absolute -right-1.5 -top-1.5 grid h-[26px] w-[26px] place-items-center rounded-full bg-[#EF6A5A] font-baloo text-sm font-extrabold text-white shadow-[0_2px_0_#C74B3D]">
            3
          </span>
        </button>
      </div>

      {showResult && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-ink/[.42]">
          <div className="animate-pop flex w-[92%] max-w-[620px] flex-col items-center gap-4 rounded-[30px] border-4 border-line2 bg-cream-card p-8 shadow-[0_14px_40px_rgba(0,0,0,.24)]">
            <div className="font-baloo text-[30px] font-extrabold text-[#C7551A]">{t("Xong bài học!")}</div>
            <div className="grid h-[120px] w-[120px] place-items-center rounded-full bg-[#FFF3D6]">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="#FFC93C">
                <polygon points="12,3 14.7,9.2 21.4,9.8 16.4,14.2 17.9,20.8 12,17.3 6.1,20.8 7.6,14.2 2.6,9.8 9.3,9.2" />
              </svg>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-white px-4.5 py-2 font-baloo text-[17px] font-extrabold text-[#B07A0C]">
                <svg width="19" height="19" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="#F2A81C" />
                  <circle cx="12" cy="12" r="6.6" fill="#FFE08A" />
                </svg>
                +{COINS_PER_LESSON}
              </div>
              <div className="rounded-full bg-white px-4.5 py-2 font-baloo text-[17px] font-extrabold text-[#4F7C2A]">+30 XP</div>
              <div className="rounded-full bg-white px-4.5 py-2 font-baloo text-[17px] font-extrabold text-[#3E7FB0]">
                {right}/{questions.length} {t("đúng")}
              </div>
            </div>
            <div className="w-full rounded-[18px] border-[3px] border-dashed border-[#DFC9A2] bg-cream p-3.5">
              <AdSlot kind="banner" premium={isPremium} note={t("Chỉ tài khoản người lớn thấy quảng cáo")} />
            </div>
            <div className="flex w-full gap-3">
              <button onClick={restart} className="flex-1 rounded-[18px] border-[3px] border-line bg-white py-3.5 font-baloo text-[17px] font-bold text-brand-brown">
                {t("Học lại")}
              </button>
              <button
                onClick={() => {
                  onComplete({ correct: right, total: questions.length, coinsEarned: COINS_PER_LESSON });
                  onGoShop();
                }}
                className="flex-1 rounded-[18px] bg-brand-green py-3.5 font-baloo text-[17px] font-extrabold text-white shadow-[0_5px_0_#5C9C31] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#5C9C31]"
              >
                {t("Đổi thưởng")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
