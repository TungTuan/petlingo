import { useT } from "../../lib/i18n";
import { ChunkyButton } from "./Button";
import { PetImage } from "./Card";

export interface MemoryCardDef {
  kind: "word" | "img" | "emoji";
  word?: string;
  pet?: string;
  /** A single emoji glyph — used for topics with no matching pet illustration (see MiniGame.tsx's isPetKey()). */
  emoji?: string;
}

/** Thẻ trong game Memory Match: mặt chữ hoặc mặt hình — lật 3D thật thay vì
 * chỉ fade, rung khi ghép sai, phát sáng khi ghép đúng. */
export function MemoryCard({
  card,
  open,
  matched,
  wrong,
  onClick,
  density = "normal",
}: {
  card: MemoryCardDef;
  open: boolean;
  matched: boolean;
  /** True for a brief moment right after a mismatch is revealed — triggers a shake before flipping back. */
  wrong?: boolean;
  onClick: () => void;
  density?: "normal" | "compact" | "dense";
}) {
  const radius = density === "dense" ? "rounded-[13px]" : density === "compact" ? "rounded-[17px]" : "rounded-[24px]";
  const border = density === "dense" ? "border-2" : "border-[3px]";
  const wordSize = density === "dense" ? "text-[13px] leading-tight px-1" : density === "compact" ? "text-base leading-tight px-2" : "text-2xl";
  const emojiSize = density === "dense" ? "text-3xl" : density === "compact" ? "text-4xl" : "text-6xl";
  return (
    <button onClick={onClick} disabled={open} className={`relative block min-h-0 h-full w-full [perspective:900px] ${wrong ? "animate-shake" : ""}`}>
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${open ? "[transform:rotateY(180deg)]" : ""} ${matched ? "animate-match-glow" : ""}`}
      >
        {/* Back face — face-down pattern, shown while closed. */}
        <div className={`absolute inset-0 grid place-items-center overflow-hidden ${radius} ${border} border-[#C9B4F2] bg-[linear-gradient(145deg,#A88AE8,#8062CE)] shadow-[0_4px_0_#6749B4,0_8px_16px_rgba(83,57,145,.18)] [backface-visibility:hidden] hover:brightness-105`}>
          <span className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/10" />
          <span className="absolute -bottom-7 -left-5 h-20 w-20 rounded-full bg-[#6245B5]/20" />
          <span className={`grid rounded-full border-2 border-white/70 bg-white/20 text-white shadow-inner ${density === "dense" ? "h-8 w-8 text-sm" : density === "compact" ? "h-10 w-10 text-lg" : "h-12 w-12 text-xl"}`}>✦</span>
        </div>
        {/* Front face — word or pet image, only reachable via the 180° flip. */}
        <div
          className={`absolute inset-0 grid place-items-center overflow-hidden ${radius} ${border} bg-white shadow-[0_4px_0_#E7D4B2] [backface-visibility:hidden] [transform:rotateY(180deg)] ${matched ? "border-brand-green bg-[#EEF9E3]" : "border-line"}`}
        >
          {card.kind === "word" ? (
            <span className={`text-center font-baloo font-extrabold text-ink ${wordSize}`}>{card.word}</span>
          ) : card.kind === "emoji" ? (
            <span className={`${emojiSize} leading-none`}>{card.emoji}</span>
          ) : (
            <PetImage id={card.pet!} className="absolute inset-3.5" />
          )}
          {matched && <span className="absolute -right-2 -top-2 h-14 w-14 rounded-full bg-brand-green/40 animate-burst" />}
        </div>
      </div>
    </button>
  );
}

/** Ô đáp án trong bài học trẻ em. */
export function AnswerTile({ label, slot, state = "idle", onClick }: { label: string; slot: string; state?: "idle" | "right" | "wrong"; onClick: () => void }) {
  const skin = { idle: "border-line bg-white", right: "border-brand-green bg-[#EEF9E3]", wrong: "border-[#EF6A5A] bg-[#FDE7E4]" }[state];
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-3 rounded-[26px] border-4 p-4 shadow-[0_6px_0_#E7D4B2] transition-transform hover:-translate-y-1 ${skin}`}>
      <span className="grid aspect-[1.15] w-full place-items-center rounded-[18px] border-2 border-dashed border-[#DFC9A2] bg-[#F3E9D6] font-mono text-[10px] text-[#A2947C]">{slot}</span>
      <span className="font-baloo text-[21px] font-extrabold text-ink">{label}</span>
    </button>
  );
}

export interface SrsWord {
  tag: string;
  pos: string;
  en: string;
  ipa: string;
  vi: string;
  example: string;
}

/** Thẻ từ spaced repetition cho người lớn. */
export function SrsCard({
  word,
  revealed,
  onReveal,
  onGrade,
}: {
  word: SrsWord;
  revealed: boolean;
  onReveal: () => void;
  onGrade: (kind: "hard" | "ok" | "easy") => void;
}) {
  const t = useT();
  const grades: { label: string; next: string; kind: "hard" | "ok" | "easy"; bg: string }[] = [
    { label: t("Khó"), next: t("10 phút"), kind: "hard", bg: "bg-[#EF6A5A] shadow-[0_5px_0_#C74B3D]" },
    { label: t("Ổn"), next: t("1 ngày"), kind: "ok", bg: "bg-brand-orange shadow-[0_5px_0_#C9631A]" },
    { label: t("Dễ"), next: t("3 ngày"), kind: "easy", bg: "bg-brand-green shadow-[0_5px_0_#5C9C31]" },
  ];
  return (
    <div className="flex w-full max-w-[640px] flex-col items-center gap-4 rounded-[32px] border-4 border-line2 bg-white p-8 shadow-[0_8px_0_#EADAB8]">
      <div className="flex w-full items-center gap-3">
        <span className="rounded-full bg-brand-purple px-3.5 py-1 font-baloo text-xs font-bold text-white">{word.tag}</span>
        <span className="font-baloo text-[13px] font-semibold text-[#8A7A62]">{word.pos}</span>
      </div>
      <div className="font-baloo text-[58px] font-extrabold leading-none text-ink">{word.en}</div>
      <div className="font-mono text-[17px] text-[#8A7A62]">{word.ipa}</div>
      <div className="h-[3px] w-full rounded-full bg-[#F1E7D3]" />
      <div className="flex min-h-[118px] flex-col items-center justify-center gap-2.5">
        {revealed ? (
          <div className="animate-pop flex flex-col items-center gap-2.5">
            <div className="font-baloo text-3xl font-extrabold text-[#C7551A]">{word.vi}</div>
            <div className="max-w-[480px] text-center font-baloo text-base font-semibold text-[#6E6047]">{word.example}</div>
          </div>
        ) : (
          <ChunkyButton tone="orange" onClick={onReveal}>
            {t("Hiện nghĩa")}
          </ChunkyButton>
        )}
      </div>
      <div className="flex w-full gap-3">
        {grades.map((g) => (
          <button
            key={g.kind}
            disabled={!revealed}
            onClick={() => onGrade(g.kind)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-[18px] py-3.5 font-baloo text-[17px] font-extrabold text-white transition-transform active:translate-y-1 disabled:opacity-45 ${g.bg}`}
          >
            {g.label}
            <span className="text-xs font-semibold opacity-90">{g.next}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
