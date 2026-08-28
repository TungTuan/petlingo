import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../lib/api";
import { BackIcon, SegmentedTabs, SpeakerIcon, StarIcon } from "../components/ui";
import { useLang, useT } from "../lib/i18n";
import { exampleFor, loadDictionary, meaningFor, type DictionaryWord } from "../lib/dictionary";
import { speak } from "../lib/tts";

interface DictionaryProps {
  childId: string;
  onExit: () => void;
}

const MAX_RESULTS = 60;

function WordRow({ entry, saved, onToggleSave }: { entry: DictionaryWord; saved: boolean; onToggleSave: () => void }) {
  const { lang } = useLang();
  return (
    <div className="flex items-center gap-3.5 rounded-[18px] border-[3px] border-line2 bg-white p-3.5 shadow-[0_4px_0_#EADAB8]">
      <button
        onClick={() => speak(entry.word)}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-teal shadow-[0_3px_0_#37A0A0] transition-transform active:translate-y-[2px]"
      >
        <SpeakerIcon size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-baloo text-lg font-extrabold">{entry.word}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{entry.phonetic}</span>
        </div>
        <div className="truncate font-baloo text-sm font-bold text-[#5A7080]">{meaningFor(entry, lang)}</div>
        <div className="truncate font-baloo text-[12.5px] font-semibold italic text-[#A2947C]">
          {entry.example} <span className="not-italic">— {exampleFor(entry, lang)}</span>
        </div>
      </div>
      <button onClick={onToggleSave} className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform active:scale-90">
        <StarIcon size={26} color={saved ? "#FFC93C" : "#E4D3BC"} />
      </button>
    </div>
  );
}

/**
 * Từ điển — searches the big offline dictionary bundled with the app (see
 * lib/dictionary.ts; works with the phone offline, unlike every other
 * data-bearing screen here) and lets a child "save" a word into their
 * personal list (real backend-persisted, see /children/:id/saved-words) —
 * that list then feeds Topics.tsx/SrsCard.tsx's real review deck and
 * suggestion chips in MyContent.tsx.
 */
export default function Dictionary({ childId, onExit }: DictionaryProps) {
  const t = useT();
  const [tab, setTab] = useState(0);
  const [words, setWords] = useState<DictionaryWord[] | null>(null);
  const [saved, setSaved] = useState<Set<string> | null>(null);
  const [query, setQuery] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    loadDictionary().then(setWords);
    api
      .listSavedWords(childId)
      .then((r) => setSaved(new Set(r.words)))
      .catch((e) => setErr(e instanceof ApiError ? t(e.message) : t("Không tải được danh sách từ đã lưu.")));
  }, [childId, t]);

  async function toggleSave(word: string) {
    if (!saved) return;
    const isSaved = saved.has(word);
    // Apply immediately — same "don't block the UI on the network" pattern as Settings.tsx's language toggle.
    setSaved((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(word);
      else next.add(word);
      return next;
    });
    try {
      const result = isSaved ? await api.unsaveWord(childId, word) : await api.saveWord(childId, word);
      setSaved(new Set(result.words));
    } catch (e) {
      setErr(e instanceof ApiError ? t(e.message) : t("Không lưu được, thử lại nhé."));
      setSaved((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(word);
        else next.delete(word);
        return next;
      });
    }
  }

  const filtered = useMemo(() => {
    if (!words) return [];
    const q = query.trim().toLowerCase();
    if (!q) return words.slice(0, MAX_RESULTS);
    return words.filter((w) => w.word.toLowerCase().includes(q) || w.vi.toLowerCase().includes(q) || w.ja.includes(q) || w.ko.includes(q)).slice(0, MAX_RESULTS);
  }, [words, query]);

  const savedEntries = useMemo(() => (words && saved ? words.filter((w) => saved.has(w.word)) : []), [words, saved]);

  return (
    <div className="flex h-full flex-col bg-cream-card">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-[#F7EFDD] p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[23px] font-extrabold">{t("Từ điển")}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Tra từ bất kỳ, kể cả khi không có mạng")}</span>
        </div>
        <div className="flex-1" />
        <SegmentedTabs options={[t("Tìm kiếm"), t("Từ đã lưu")]} active={tab} onChange={setTab} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-hidden p-5.5">
        {tab === 0 ? (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Gõ 1 từ tiếng Anh hoặc nghĩa để tìm...")}
              className="rounded-2xl border-[3px] border-line bg-white px-5 py-3.5 font-baloo text-base font-semibold outline-none"
            />
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
              {words === null ? (
                <div className="grid h-full place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải từ điển…")}</div>
              ) : filtered.length === 0 ? (
                <div className="grid h-full place-items-center font-baloo text-base font-bold text-ink/40">{t("Không tìm thấy từ nào.")}</div>
              ) : (
                filtered.map((w) => <WordRow key={w.word} entry={w} saved={saved?.has(w.word) ?? false} onToggleSave={() => toggleSave(w.word)} />)
              )}
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
            {saved === null || words === null ? (
              <div className="grid h-full place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải…")}</div>
            ) : savedEntries.length === 0 ? (
              <div className="grid h-full place-items-center gap-2 text-center font-baloo text-base font-bold text-ink/40">
                {t("Chưa lưu từ nào — bấm vào ngôi sao ở tab Tìm kiếm để lưu nhé.")}
              </div>
            ) : (
              savedEntries.map((w) => <WordRow key={w.word} entry={w} saved onToggleSave={() => toggleSave(w.word)} />)
            )}
          </div>
        )}
        {err && <div className="font-baloo text-sm font-bold text-[#B3402F]">{err}</div>}
      </div>
    </div>
  );
}
