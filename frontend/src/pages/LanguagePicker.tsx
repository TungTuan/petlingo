import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { useLang, type Lang } from "../lib/i18n";

interface LanguagePickerProps {
  /** Called once the account's language has been saved server-side AND
   * applied locally via setLang() — App.tsx picks up the flow (createChild
   * vs onboarding vs home) from here, exactly like it does after Login.tsx's
   * onAuthenticated. */
  onDone: (lang: Lang) => void;
}

const OPTIONS: { lang: Lang; label: string; flag: string }[] = [
  { lang: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { lang: "ja", label: "日本語", flag: "🇯🇵" },
  { lang: "ko", label: "한국어", flag: "🇰🇷" },
  { lang: "en", label: "English", flag: "🇬🇧" },
];

/**
 * First-launch language picker — shown once per account (App.tsx gates on
 * `parent.language === null`, see schema.prisma's doc comment on
 * Parent.language) before Onboarding/Home. Picking vi/ja/ko changes BOTH the
 * interface chrome AND which language every game's word meanings show in
 * (resolved server-side, see catalog.service.ts's pickLang()); picking en
 * keeps today's original behavior (English chrome, Vietnamese content) — see
 * schema.prisma's enum Language doc comment for why "en" is special-cased.
 *
 * Visually matches Onboarding.tsx's sky-gradient/cloud styling since this
 * screen sits immediately before it in the first-launch flow.
 */
export default function LanguagePicker({ onDone }: LanguagePickerProps) {
  const { setLang } = useLang();
  const [busy, setBusy] = useState<Lang | null>(null);
  const [err, setErr] = useState("");

  async function pick(lang: Lang) {
    if (busy) return;
    setBusy(lang);
    setErr("");
    try {
      await api.updateLanguage(lang as "vi" | "en" | "ja" | "ko");
      setLang(lang);
      onDone(lang);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Không lưu được ngôn ngữ, thử lại nhé.");
      setBusy(null);
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#BFE6F7] from-0% via-[#DCEFC8] via-58% to-[#6FB544] to-58%">
      <div className="animate-cloud absolute left-[10%] top-[7%] h-[46px] w-[140px] rounded-full bg-white/80" />
      <div className="absolute right-[12%] top-[14%] h-[54px] w-[180px] rounded-full bg-white/60" style={{ animation: "cloud 30s linear infinite alternate-reverse" }} />

      <div className="relative flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <span className="font-baloo text-[46px] font-extrabold leading-[1.1] text-ink">Chọn ngôn ngữ của bạn</span>
          <span className="font-baloo text-lg font-semibold text-[#5A6A55]">Choose your language · 言語を選んでください · 언어를 선택하세요</span>
        </div>

        <div className="grid grid-cols-4 gap-4.5">
          {OPTIONS.map((opt) => (
            <button
              key={opt.lang}
              onClick={() => pick(opt.lang)}
              disabled={busy !== null}
              className="flex w-[170px] flex-col items-center gap-3 rounded-[24px] border-[3px] border-white/90 bg-white/90 px-5 py-7 shadow-[0_6px_0_rgba(0,0,0,.12)] transition-transform hover:-translate-y-1 disabled:opacity-60"
            >
              <span className="text-5xl">{opt.flag}</span>
              <span className="font-baloo text-xl font-extrabold text-ink">{opt.label}</span>
              {busy === opt.lang && <span className="font-baloo text-xs font-bold text-[#8A7A62]">...</span>}
            </button>
          ))}
        </div>

        {err && <div className="font-baloo text-sm font-bold text-[#B3402F]">{err}</div>}
      </div>
    </div>
  );
}
