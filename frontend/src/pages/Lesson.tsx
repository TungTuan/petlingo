import { useEffect, useState } from "react";
import { AdSlot, BackIcon, CoinIcon, HeartRow, TopicIcon } from "../components/ui";
import { ArrowRight, Check, Gift, RotateCcw, Sparkles, Trophy, Volume2, X } from "lucide-react";
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
  topicLabel?: string;
  onExit: () => void;
  onComplete: (result: { correct: number; total: number; coinsEarned: number; learnedWords: string[] }) => void;
  onGoShop: () => void;
}

const COINS_PER_LESSON = 50;
const ANSWER_DELAY_MS = 1100;
const OPTION_COLORS = ["#5C7BC9", "#F5822B", "#57B6AD", "#9B7EDE"];
// Forest and Town ship with complete local image packs. Keeping this explicit
// avoids requesting missing assets for worlds that have not been illustrated yet.
const GENERATED_LESSON_IMAGES = new Set([
  "flower", "bird", "tree", "sun", "river",
  "deer", "owl", "squirrel", "fox", "butterfly", "bee",
  "waterfall", "leaf", "mushroom", "fish", "nest",
  "whale", "dolphin", "shark", "octopus", "crab", "starfish", "jellyfish", "seahorse", "lobster", "squid", "seal", "penguin", "otter", "walrus", "eel", "clam", "stingray", "swordfish", "pelican",
  "cow", "pig", "sheep", "goat", "horse", "chicken", "duck", "rooster", "turkey", "rabbit", "donkey", "llama", "hen", "calf", "lamb", "goose", "mule", "ox", "pony",
  "ant", "ladybug", "spider", "grasshopper", "dragonfly", "mosquito", "fly", "worm", "snail", "caterpillar", "cricket", "beetle", "moth", "firefly", "wasp", "cockroach", "centipede",
  "grass", "root", "branch", "seed", "bush", "vine", "petal", "stem", "bark", "moss", "fern", "thorn", "weed", "sprout", "blossom", "cactus",
  "moon", "cloud", "rain", "snow", "wind", "storm", "rainbow", "lightning", "thunder", "fog", "star", "sky", "breeze", "mist", "hail", "sunshine", "drizzle", "hurricane",
  "tent", "campfire", "backpack", "flashlight", "map", "compass", "rope", "boots", "lantern", "canoe", "trail", "cabin", "blanket", "matches", "whistle", "hammock", "kettle", "paddle", "binoculars",
  "snake", "lizard", "turtle", "frog", "toad", "crocodile", "alligator", "gecko", "iguana", "chameleon", "newt", "salamander", "tortoise", "python", "cobra", "viper", "dinosaur", "tadpole", "skink",
  "park", "hospital", "market", "bridge", "airport",
  "police-officer", "doctor", "firefighter", "chef", "mailman", "farmer",
  "bakery", "library", "bank", "hotel", "bus", "train", "bicycle",
  "house", "apartment", "tower", "factory", "warehouse", "skyscraper", "cottage", "cabin", "mansion", "garage", "shed", "barn", "mall", "stadium", "theater", "palace", "cathedral", "lighthouse", "windmill",
  "bookstore", "toy-store", "pharmacy", "supermarket", "butcher-shop", "florist", "jewelry-store", "shoe-store", "pet-store", "candy-store", "barber-shop", "laundromat", "gas-station", "car-wash", "ice-cream-shop", "coffee-shop", "flower-shop", "bike-shop",
  "car", "bike", "motorbike", "taxi", "truck", "subway", "scooter", "ambulance", "fire-truck", "van", "tram", "ferry", "helicopter", "plane", "boat", "ship", "cable-car",
  "mother", "father", "sister", "brother", "grandmother", "grandfather", "aunt", "uncle", "cousin", "baby", "friend", "neighbor", "classmate", "driver", "dentist", "nurse", "pilot", "sailor", "artist",
  "traffic-light", "sidewalk", "crosswalk", "street", "sign", "lamp-post", "bench", "fountain", "statue", "trash-can", "mailbox", "fire-hydrant", "bus-stop", "parking-lot", "elevator", "escalator", "alley", "plaza", "tunnel",
  "soccer-ball", "basketball", "tennis-racket", "swimming-pool", "running-shoes", "dance-shoes", "paintbrush", "microphone", "storybook", "sketchbook", "skateboard", "chessboard", "cooking-pot", "garden-hose", "camera", "jump-rope", "surfboard", "fishing-rod",
  "shirt", "pants", "dress", "skirt", "shoe", "sock", "hat", "jacket", "coat", "glove", "scarf", "belt", "sweater", "shorts", "boot", "sandal", "t-shirt", "pajama", "button",
]);

function lessonImageKey(answer: string): string {
  return answer.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function LessonVisual({ answer }: { answer: string }) {
  const key = lessonImageKey(answer);
  const isInLegacyManifest = GENERATED_LESSON_IMAGES.has(key);
  return (
    <div className="relative grid h-full w-full place-items-center bg-[radial-gradient(circle,#FFFDF6_0%,#F5EEDC_100%)]">
      <TopicIcon label={answer} color="#57B6AD" size={112} />
      <img
        key={key}
        src={`/lesson-images/${key}.webp`}
        alt={answer}
        data-legacy-manifest={isInLegacyManifest || undefined}
        className="absolute inset-0 h-full w-full bg-[#FFFAF0] object-contain"
        onError={(event) => { event.currentTarget.style.display = "none"; }}
      />
    </div>
  );
}

export default function Lesson({ questions, isPremium, topicLabel, onExit, onComplete, onGoShop }: LessonProps) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [showResult, setShowResult] = useState(false);
  const [learnedWords, setLearnedWords] = useState<Set<string>>(() => new Set());
  const q = questions[step]!;
  const progress = Math.round(((step + (chosen ? 1 : 0)) / questions.length) * 100);

  useEffect(() => {
    if (getAutoSpeak()) speak(q.answer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function answer(label: string) {
    if (chosen) return;
    const ok = label === q.answer;
    setChosen(label);
    setRight((value) => value + (ok ? 1 : 0));
    if (ok) setLearnedWords((value) => new Set(value).add(q.answer.trim().toLowerCase()));
    if (!ok) setHearts((value) => Math.max(0, value - 1));
    setTimeout(() => {
      if (step >= questions.length - 1) setShowResult(true);
      else {
        setStep((value) => value + 1);
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
    setLearnedWords(new Set());
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#C9EEF4_0%,#EAF7EA_54%,#F8F3DE_100%)]">
      <div className="pointer-events-none absolute left-[6%] top-[16%] text-5xl opacity-45">☁️</div>
      <div className="pointer-events-none absolute right-[5%] top-[25%] text-4xl opacity-35">☁️</div>

      <header className="relative z-10 flex items-center gap-3.5 px-4.5 py-4">
        <button onClick={onExit} aria-label={t("Quay lại")} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[22px] border-2 border-white/90 bg-white/85 px-4 py-2.5 shadow-[0_4px_0_rgba(74,96,80,.12)] backdrop-blur-sm">
          <div className="shrink-0 font-baloo text-[14px] font-extrabold text-[#4C7E65]">{step + 1}/{questions.length}</div>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#E8E1CF]">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#67BB52,#A3D763)] transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="rounded-full bg-[#EAF6E4] px-3 py-1 font-baloo text-[11px] font-extrabold text-[#568B3B]">{progress}%</span>
        </div>
        <div className="rounded-[18px] border-2 border-white/80 bg-white/80 px-3 py-2 shadow-[0_3px_0_rgba(0,0,0,.08)]">
          <HeartRow total={3} left={hearts} />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-[980px] flex-1 flex-col px-6 pb-5">
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex min-w-0 items-center gap-2 font-baloo text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#598477]">
            <Sparkles size={16} /> <span className="truncate">{topicLabel ?? t("Bài học tiếng Anh")}</span>
          </div>
          <div className="font-baloo text-[12px] font-bold text-[#8A7A62]">{t("Chọn đáp án đúng")}</div>
        </div>

        <section className="mb-4 grid min-h-[205px] grid-cols-[220px_1fr] items-center gap-5 rounded-[30px] border-[3px] border-white bg-white/78 p-4 shadow-[0_7px_0_#CFE1D4] backdrop-blur-sm">
          <div className="relative h-[172px] overflow-hidden rounded-[24px] border-[3px] border-[#E9DABF] bg-[#FFF9ED] shadow-[0_5px_0_#E2D1B2]">
            <LessonVisual answer={q.answer} />
            <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-1 font-baloo text-[9px] font-extrabold uppercase tracking-wide text-[#8A7A62]">{t("Nhìn hình")}</span>
          </div>
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-3 rounded-full bg-[#FFEBA8] blur-xl" />
              <img src="/pets/buddy.png" alt="Buddy" className="animate-bob relative h-[100px] w-[100px] object-contain" />
            </div>
            <div className="relative min-w-0 flex-1 rounded-[25px] border-[3px] border-[#E7D4B2] bg-white px-5 py-4 shadow-[0_5px_0_#E7D4B2]">
              <span className="absolute -left-[11px] top-1/2 h-5 w-5 -translate-y-1/2 rotate-45 border-b-[3px] border-l-[3px] border-[#E7D4B2] bg-white" />
              <div className="flex items-center gap-3">
                <button onClick={() => speak(q.answer)} aria-label={t("Nghe lại")} className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-full bg-[#38BFC4] text-white shadow-[0_4px_0_#28999D] transition-transform hover:scale-105 active:translate-y-1 active:shadow-none">
                  <Volume2 size={24} strokeWidth={2.8} />
                </button>
                <div>
                  <h1 className="font-baloo text-[29px] font-extrabold leading-tight text-[#3F352D]">What is this?</h1>
                  <p className="mt-1 font-baloo text-[12px] font-semibold text-[#8A7A62]">{t("Nhìn hình và chọn đáp án đúng")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3.5">
          {q.options.map((label, index) => {
            const picked = chosen === label;
            const correct = label === q.answer;
            const revealed = chosen !== null;
            const state = revealed && correct ? "correct" : revealed && picked ? "wrong" : "idle";
            const border = state === "correct" ? "#75BA48" : state === "wrong" ? "#E65F55" : "#E3D5BA";
            const background = state === "correct" ? "#EFF9E5" : state === "wrong" ? "#FDE9E6" : "rgba(255,255,255,.94)";
            return (
              <button
                key={label}
                onClick={() => answer(label)}
                disabled={revealed}
                className="group relative flex min-h-[92px] items-center gap-4 overflow-hidden rounded-[24px] border-[3px] px-4 text-left transition-all hover:-translate-y-1 disabled:cursor-default disabled:hover:translate-y-0"
                style={{ borderColor: border, background, boxShadow: `0 5px 0 ${border}` }}
              >
                <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[17px] border-2 border-white font-baloo text-[22px] font-extrabold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,.1),0_3px_0_rgba(0,0,0,.1)]" style={{ background: OPTION_COLORS[index % OPTION_COLORS.length] }}>{String.fromCharCode(65 + index)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-baloo text-[20px] font-extrabold leading-tight text-[#40362F]">{label}</span>
                  <span className="mt-1 block font-baloo text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#A09282]">{t("Chọn đáp án này")}</span>
                </span>
                {state === "correct" && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#75BA48] text-white"><Check size={21} strokeWidth={3.5} /></span>}
                {state === "wrong" && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E65F55] text-white"><X size={21} strokeWidth={3.5} /></span>}
              </button>
            );
          })}
        </div>

        <div className="flex min-h-[62px] items-end justify-center pt-3">
          {chosen && (
            <div className={`animate-pop flex items-center gap-3 rounded-full border-[3px] px-6 py-2.5 font-baloo text-[17px] font-extrabold shadow-sm ${chosen === q.answer ? "border-[#B9DD9C] bg-[#F1FAE9] text-[#4E7D34]" : "border-[#F3B8B0] bg-[#FFF0ED] text-[#B3402F]"}`}>
              {chosen === q.answer ? <Check size={22} strokeWidth={3.5} /> : <X size={22} strokeWidth={3.5} />}
              {chosen === q.answer ? t("Chính xác! Buddy rất vui!") : `${t("Chưa đúng — đáp án là")} ${q.answer}`}
            </div>
          )}
        </div>
      </main>

      {showResult && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#2F2A25]/55 p-5 backdrop-blur-[3px]">
          <div className="animate-pop relative flex w-full max-w-[540px] flex-col items-center overflow-hidden rounded-[32px] border-4 border-white bg-[#FFFDF7] p-6 shadow-[0_18px_55px_rgba(0,0,0,.3)]">
            <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,#FFF0B8,#DDF4D0)]" />
            <div className="relative grid h-[92px] w-[92px] place-items-center rounded-full border-4 border-white bg-[#FFD85B] text-white shadow-[0_6px_0_#D8A91C]">
              <Trophy size={50} strokeWidth={2.4} />
            </div>
            <h2 className="relative mt-3 font-baloo text-[29px] font-extrabold text-[#C7551A]">{t("Hoàn thành bài học!")}</h2>
            <p className="font-baloo text-[13px] font-semibold text-[#7E7062]">{t("Buddy rất tự hào về bạn")}</p>

            <div className="my-4 grid w-full grid-cols-3 gap-2.5">
              <div className="rounded-[18px] bg-[#FFF5D8] p-3 text-center"><div className="flex justify-center"><CoinIcon size={25} /></div><div className="mt-1 font-baloo text-lg font-extrabold text-[#A9730C]">+{COINS_PER_LESSON}</div><div className="font-baloo text-[10px] font-bold text-[#9A8A72]">COIN</div></div>
              <div className="rounded-[18px] bg-[#EAF7E1] p-3 text-center"><Sparkles className="mx-auto text-[#6BA63E]" /><div className="mt-1 font-baloo text-lg font-extrabold text-[#568A35]">+30</div><div className="font-baloo text-[10px] font-bold text-[#78906A]">XP</div></div>
              <div className="rounded-[18px] bg-[#E6F2FA] p-3 text-center"><Check className="mx-auto text-[#4387B1]" /><div className="mt-1 font-baloo text-lg font-extrabold text-[#36799F]">{right}/{questions.length}</div><div className="font-baloo text-[10px] font-bold text-[#718A98]">{t("ĐÚNG")}</div></div>
            </div>

            <div className="w-full rounded-[17px] border-2 border-dashed border-[#DFC9A2] bg-[#FFF9EC] p-2.5">
              <AdSlot kind="banner" premium={isPremium} note={t("Chỉ tài khoản người lớn thấy quảng cáo")} />
            </div>
            <div className="mt-4 flex w-full gap-3">
              <button onClick={restart} className="flex flex-1 items-center justify-center gap-2 rounded-[18px] border-[3px] border-[#E3D3B5] bg-white py-3 font-baloo text-[16px] font-extrabold text-[#6E6047] shadow-[0_4px_0_#E3D3B5]"><RotateCcw size={19} /> {t("Học lại")}</button>
              <button onClick={() => { onComplete({ correct: right, total: questions.length, coinsEarned: COINS_PER_LESSON, learnedWords: [...learnedWords] }); onGoShop(); }} className="flex flex-1 items-center justify-center gap-2 rounded-[18px] bg-[#75B94B] py-3 font-baloo text-[16px] font-extrabold text-white shadow-[0_5px_0_#579832] transition-transform active:translate-y-1 active:shadow-none"><Gift size={19} /> {t("Nhận thưởng")} <ArrowRight size={18} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
