import { useEffect, useState } from "react";
import { BackIcon, TopicIcon } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { loadDictionary, type DictionaryWord } from "../lib/dictionary";
import { useT } from "../lib/i18n";

interface TopicsProps {
  childId: string;
  onStartReview: (words: DictionaryWord[]) => void;
  onExit: () => void;
}

/** Topics (adult SRS hub) — matches the reference sheet's "Phần 3 · Chủ đề"
 * panel, but now backed by REAL data instead of 6 hardcoded fake topic cards
 * (Travel/Business/Daily life/Food/Health/IELTS 700 — none of them did
 * anything when tapped). The only real "topic" today is "Từ đã lưu": every
 * word the child bookmarked from Từ điển (see Dictionary.tsx/
 * /children/:id/saved-words), reviewed here as real flashcards. The old fake
 * "Lịch ôn tập" schedule panel is gone too — there's no real spaced-
 * repetition scheduling built yet (see SrsCard.tsx's doc comment), so
 * showing invented "due in 10m/1d/3d" counts would just be more fakery. */
export default function Topics({ childId, onStartReview, onExit }: TopicsProps) {
  const t = useT();
  const [words, setWords] = useState<DictionaryWord[] | null>(null);
  const [savedWords, setSavedWords] = useState<string[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadDictionary().then(setWords);
    api
      .listSavedWords(childId)
      .then((r) => setSavedWords(r.words))
      .catch((e) => setErr(e instanceof ApiError ? t(e.message) : t("Không tải được danh sách từ đã lưu.")));
  }, [childId, t]);

  const entries = words && savedWords ? words.filter((w) => savedWords.includes(w.word)) : null;
  const loading = entries === null;
  const count = entries?.length ?? 0;

  return (
    <div className="flex h-full flex-col bg-[#F7F4EE]">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-white p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[27px] font-extrabold">{t("Chủ đề của bạn")}</span>
          <span className="font-baloo text-[13.5px] font-semibold text-[#8A7A62]">{t("Chế độ người lớn · spaced repetition")}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 rounded-full border-[3px] border-[#C9E5F7] bg-[#EAF6FF] px-4.5 py-2 font-baloo text-base font-extrabold text-[#3E7FB0]">
          {count} {t("từ đã lưu")}
        </div>
      </div>

      <div className="grid flex-1 place-items-center p-5.5">
        {loading ? (
          <div className="font-baloo text-base font-bold text-ink/40">{t("Đang tải…")}</div>
        ) : (
          <div className="flex w-[420px] flex-col gap-4 rounded-[24px] border-[3px] border-line2 bg-white p-6 shadow-[0_6px_0_#EADAB8]">
            <div className="flex items-center gap-3.5">
              <TopicIcon label="Từ vựng đã lưu" color="#57C6C6" size={46} />
              <div>
                <div className="font-baloo text-xl font-extrabold">{t("Từ đã lưu")}</div>
                <div className="font-baloo text-[13px] font-semibold text-[#8A7A62]">
                  {count} {t("từ")}
                </div>
              </div>
            </div>
            {count === 0 ? (
              <div className="font-baloo text-sm font-semibold leading-relaxed text-[#8A7A62]">
                {t("Chưa lưu từ nào — vào Từ điển (ở màn More) và bấm ngôi sao cạnh 1 từ để lưu nhé.")}
              </div>
            ) : (
              <button
                onClick={() => onStartReview(entries)}
                className="relative overflow-hidden rounded-2xl bg-brand-orange px-9.5 py-4 font-baloo text-lg font-extrabold text-white shadow-[0_5px_0_#C9631A] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#C9631A]"
              >
                {t("Bắt đầu ôn")}
                <span className="animate-shine pointer-events-none absolute left-0 top-0 h-full w-9 bg-gradient-to-r from-transparent via-white/55 to-transparent" />
              </button>
            )}
          </div>
        )}
        {err && <div className="mt-3 font-baloo text-sm font-bold text-[#B3402F]">{err}</div>}
      </div>
    </div>
  );
}
