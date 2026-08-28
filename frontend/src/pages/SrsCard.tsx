import { useState } from "react";
import { BackIcon, SpeakerIcon } from "../components/ui";
import { exampleFor, meaningFor, type DictionaryWord } from "../lib/dictionary";
import { useLang, useT } from "../lib/i18n";
import { speak } from "../lib/tts";

interface SrsCardProps {
  words: DictionaryWord[];
  onExit: () => void;
}

const GRADES: { label: string; next: string; kind: "hard" | "ok" | "easy"; bg: string; shadow: string }[] = [
  { label: "Khó", next: "10 phút", kind: "hard", bg: "#EF6A5A", shadow: "#C74B3D" },
  { label: "Ổn", next: "1 ngày", kind: "ok", bg: "#F5822B", shadow: "#C9631A" },
  { label: "Dễ", next: "3 ngày", kind: "easy", bg: "#7CC24A", shadow: "#5C9C31" },
];

/** SRS Card review — matches the reference sheet's "Phần 3 · Thẻ từ / SRS"
 * panel, now reviewing the child's REAL saved words (see Topics.tsx) instead
 * of a hardcoded 5-word "Travel" deck. The "Khó/Ổn/Dễ" grading is
 * deliberately session-only cosmetic (no real spaced-repetition scheduling
 * is persisted anywhere — same lightweight-progress convention already used
 * by every lighter mini-game in this app besides Word RPG) — the "next"
 * labels describe what a real SRS system would do, not something this
 * screen actually schedules. */
export default function SrsCard({ words, onExit }: SrsCardProps) {
  const t = useT();
  const { lang } = useLang();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState(0);
  const [hard, setHard] = useState(0);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");

  const w = words[idx]!;

  function grade(kind: "hard" | "ok" | "easy") {
    if (!revealed) return;
    const last = idx >= words.length - 1;
    setMsg(t({ hard: "Sẽ gặp lại sau 10 phút", ok: "Hẹn gặp lại sau 1 ngày", easy: "Hẹn gặp lại sau 3 ngày" }[kind]));
    if (kind === "hard") setHard((h) => h + 1);
    else setKnown((k) => k + 1);
    setRevealed(false);
    if (last) setDone(true);
    else setIdx((i) => i + 1);
  }

  function restart() {
    setIdx(0);
    setRevealed(false);
    setKnown(0);
    setHard(0);
    setDone(false);
    setMsg("");
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#EFEAF8] to-[#F7F4EE]">
      <div className="flex items-center gap-3.5 p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-1 items-center gap-3 rounded-full bg-white px-5 py-2.5 shadow-[0_3px_0_#E3CFA8]">
          <span className="font-baloo text-base font-extrabold text-[#6E6047]">
            {idx + 1}/{words.length}
          </span>
          <span className="h-3.5 flex-1 overflow-hidden rounded-full bg-[#EFE3CC]">
            <span className="block h-full rounded-full bg-brand-purple transition-[width] duration-300" style={{ width: `${Math.round((idx / words.length) * 100)}%` }} />
          </span>
          <span className="font-baloo text-[13px] font-bold text-[#8A7A62]">{t("Từ đã lưu")}</span>
        </div>
        <div className="rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#4F7C2A] shadow-[0_3px_0_#E3CFA8]">
          {known} {t("đã nhớ")}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center gap-6.5 px-10 pb-5">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-4.5 rounded-[32px] border-4 border-line2 bg-white p-8.5 shadow-[0_8px_0_#EADAB8]">
          <div className="flex w-full items-center gap-3">
            <span className="rounded-full bg-brand-purple px-3.5 py-1 font-baloo text-xs font-bold capitalize text-white">{w.topic}</span>
            <div className="flex-1" />
            <button
              onClick={() => speak(w.word)}
              className="grid h-[46px] w-[46px] place-items-center rounded-full bg-brand-teal shadow-[0_4px_0_#37A0A0] transition-transform active:translate-y-[3px]"
            >
              <SpeakerIcon size={24} />
            </button>
          </div>
          <div className="font-baloo text-[58px] font-extrabold leading-[1.05]">{w.word}</div>
          <div className="font-mono text-[17px] text-[#8A7A62]">{w.phonetic}</div>
          <div className="h-[3px] w-full rounded-full bg-[#F1E7D3]" />
          <div className="flex min-h-[118px] flex-col items-center justify-center gap-2.5">
            {revealed ? (
              <div className="animate-pop flex flex-col items-center gap-2.5">
                <div className="font-baloo text-[30px] font-extrabold text-[#C7551A]">{meaningFor(w, lang)}</div>
                <div className="max-w-120 text-center font-baloo text-[15px] font-semibold leading-snug text-[#8A7A62]">
                  <span className="italic">{w.example}</span>
                  <br />
                  {exampleFor(w, lang)}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="rounded-2xl border-[3px] border-line bg-cream-card px-11 py-3.5 font-baloo text-lg font-extrabold text-brand-brown shadow-[0_5px_0_#E7D4B2] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#E7D4B2]"
              >
                {t("Hiện nghĩa")}
              </button>
            )}
          </div>
          <div className="flex w-full gap-3">
            {GRADES.map((g) => (
              <button
                key={g.kind}
                disabled={!revealed}
                onClick={() => grade(g.kind)}
                className="flex flex-1 flex-col items-center gap-0.5 rounded-[18px] py-3.5 font-baloo text-[17px] font-extrabold text-white transition-transform active:translate-y-1 disabled:opacity-45"
                style={{ background: g.bg, boxShadow: `0 5px 0 ${g.shadow}` }}
              >
                {t(g.label)}
                <span className="text-xs font-semibold opacity-90">{t(g.next)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex w-[250px] flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-[22px] border-[3px] border-line2 bg-white p-4.5">
            <div className="font-baloo text-[17px] font-extrabold">{t("Phiên này")}</div>
            {[
              ["Đã nhớ", known, "#7CC24A"],
              ["Cần ôn lại", hard, "#EF6A5A"],
              ["Còn lại", words.length - idx - 1, "#B3A691"],
            ].map(([label, value, color]) => (
              <div key={label as string} className="flex justify-between font-baloo text-sm font-bold">
                <span className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full" style={{ background: color as string }} />
                  {t(label as string)}
                </span>
                <span className="text-[#8A7A62]">{value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-[22px] border-[3px] border-[#DDCFF5] bg-[#F1EAFB] p-4 font-baloo text-[13px] font-semibold leading-snug text-[#6E56A8]">
            {t('Chọn "Khó" thì từ quay lại trong 10 phút; "Ổn" 1 ngày; "Dễ" 3 ngày. Sai 2 lần liên tiếp thì reset về đầu.')}
          </div>
          <div className="mt-auto font-baloo text-[13.5px] font-bold text-[#8A7A62]">{msg}</div>
        </div>
      </div>

      {done && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-ink/[.42]">
          <div className="animate-pop flex w-[92%] max-w-[640px] flex-col items-center gap-4 rounded-[30px] border-4 border-line2 bg-cream-card p-8 shadow-[0_14px_40px_rgba(0,0,0,.24)]">
            <div className="font-baloo text-[30px] font-extrabold text-[#C7551A]">{t("Xong phiên ôn")}</div>
            <div className="flex gap-3">
              <div className="rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#4F7C2A]">
                {known} {t("đã nhớ")}
              </div>
              <div className="rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#B3402F]">
                {hard} {t("cần ôn lại")}
              </div>
            </div>
            <div className="flex w-full gap-3">
              <button onClick={restart} className="flex-1 rounded-[18px] border-[3px] border-line bg-white py-3.5 font-baloo text-[17px] font-bold text-brand-brown">
                {t("Ôn tiếp")}
              </button>
              <button
                onClick={onExit}
                className="flex-1 rounded-[18px] bg-brand-purple py-3.5 font-baloo text-[17px] font-extrabold text-white shadow-[0_5px_0_#7A5EBC] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#7A5EBC]"
              >
                {t("Về chủ đề")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
