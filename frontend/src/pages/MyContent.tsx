import { createContext, useContext, useEffect, useState } from "react";
import {
  api,
  ApiError,
  type AdminQuestion,
  type CatalogWorld,
  type MyContentQuota,
  type MyLesson,
  type MyMiniGameTopic,
  type MyMiniGameWord,
  type MyStory,
  type MyStoryPage,
  type MyWordCatchRound,
  type MyWordCatchTopic,
} from "../lib/api";
import { BackIcon, ChunkyButton, SoftButton } from "../components/ui";
import { PETS } from "../components/ui/tokens";
import { loadDictionary, type DictionaryWord } from "../lib/dictionary";
import { useT } from "../lib/i18n";

interface MyContentProps {
  childId: string;
  onExit: () => void;
  onOpenPremium: () => void;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Loads the child's saved-word entries (see Dictionary.tsx) joined against the
 * bundled offline dictionary, for the suggestion chips below. A failed fetch
 * just hides the chips — they're a nice-to-have shortcut, never a blocker. */
function useSavedWordEntries(childId: string): DictionaryWord[] | null {
  const [entries, setEntries] = useState<DictionaryWord[] | null>(null);
  useEffect(() => {
    let alive = true;
    setEntries(null);
    Promise.all([loadDictionary(), api.listSavedWords(childId)])
      .then(([dict, r]) => {
        if (!alive) return;
        const saved = new Set(r.words);
        setEntries(dict.filter((w) => saved.has(w.word)));
      })
      .catch(() => {
        if (alive) setEntries([]);
      });
    return () => {
      alive = false;
    };
  }, [childId]);
  return entries;
}

/** A row of clickable chips built from the child's saved words (Từ điển →
 * ngôi sao) so a parent can quickly reuse vocabulary the child already
 * bookmarked instead of retyping it, right above the add-word forms below. */
function SavedWordChips({ entries, onPick }: { entries: DictionaryWord[] | null; onPick: (entry: DictionaryWord) => void }) {
  const t = useT();
  if (!entries || entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5 border-b-2 border-dashed border-[#F1E7D3] pb-3">
      <span className="font-baloo text-[11.5px] font-bold text-[#A2947C]">{t("Gợi ý từ Từ điển đã lưu — bấm để điền nhanh")}</span>
      <div className="flex flex-wrap gap-1.5">
        {entries.map((w) => (
          <button
            key={w.word}
            onClick={() => onPick(w)}
            className="rounded-full border-2 border-[#DDCFF5] bg-[#F1EAFB] px-3 py-1 font-baloo text-[12.5px] font-bold text-[#6E56A8] hover:bg-[#E7DBFA]"
          >
            {w.word}
          </button>
        ))}
      </div>
    </div>
  );
}

type Tab = "lessons" | "stories" | "minigame" | "wordcatch";
type QuotaKind = "lesson" | "story" | "miniGameTopic" | "wordCatchTopic";

// Shared across all 4 tabs so creating/deleting in one updates the "x/5"
// badge everywhere without prop-drilling through 3 layers of manager
// components — see premium.service.ts on the backend for what it counts.
const QuotaContext = createContext<{ quota: MyContentQuota | null; refreshQuota: () => void; onOpenPremium: () => void } | null>(null);
function useQuota() {
  const ctx = useContext(QuotaContext);
  if (!ctx) throw new Error("useQuota must be used inside MyContent");
  return ctx;
}

/** "3/5" badge +, once at the limit, an upsell banner in place of the create form. */
function QuotaGate({ kind, itemLabel }: { kind: QuotaKind; itemLabel: string }) {
  const t = useT();
  const { quota, onOpenPremium } = useQuota();
  if (!quota || quota.isPremium) return null;
  const count = quota.counts[kind];
  const atLimit = count >= quota.limit;
  return (
    <div className="flex items-center gap-2">
      <span className={`font-baloo text-[11.5px] font-bold ${atLimit ? "text-[#B3402F]" : "text-[#A2947C]"}`}>
        {count}/{quota.limit} {itemLabel}
      </span>
      {atLimit && (
        <button onClick={onOpenPremium} className="font-baloo text-[11.5px] font-bold text-brand-purple underline">
          {t("Mở Premium để tạo không giới hạn")}
        </button>
      )}
    </div>
  );
}

/**
 * Self-serve content authoring — a parent creates their own Lesson/Story/
 * Memory Match topic/Word Catch topic, visible only to their own kids (see
 * backend's /my/* routes + catalog.service.ts's viewer-scoped reads). Kept
 * deliberately simpler than the separate /admin panel: no key/order/isActive
 * fiddling, just the content that actually matters to a parent.
 */
export default function MyContent({ childId, onExit, onOpenPremium }: MyContentProps) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("lessons");
  const [quota, setQuota] = useState<MyContentQuota | null>(null);

  function refreshQuota() {
    api.getMyQuota().then(setQuota).catch(() => {}); // quota display is a nice-to-have — a failed fetch just hides the badges, never blocks the screen
  }
  useEffect(refreshQuota, []);

  const TABS: { key: Tab; label: string }[] = [
    { key: "lessons", label: t("Bài học") },
    { key: "stories", label: t("Đọc truyện") },
    { key: "minigame", label: "Memory Match" },
    { key: "wordcatch", label: "Word Catch" },
  ];

  return (
    <div className="flex h-full flex-col bg-cream">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-white p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-2xl font-extrabold">{t("Nội dung của tôi")}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Tự soạn bài học riêng cho con bạn — chỉ con bạn nhìn thấy.")}</span>
        </div>
        <div className="ml-4 flex gap-0.5 rounded-2xl bg-[#F1E7D3] p-1">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`rounded-[11px] px-4.5 py-2.5 font-baloo text-[14.5px] font-bold ${tab === tb.key ? "bg-[#5C7BC9] text-white" : "text-[#8A7A62]"}`}
            >
              {tb.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {quota?.isPremium && (
          <span className="rounded-full bg-[#F1EAFB] px-3.5 py-1.5 font-baloo text-[12.5px] font-extrabold text-[#6E56A8]">✨ {t("Premium — không giới hạn")}</span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-5.5">
        <QuotaContext.Provider value={{ quota, refreshQuota, onOpenPremium }}>
          {tab === "lessons" && <LessonsManager />}
          {tab === "stories" && <StoriesManager />}
          {tab === "minigame" && <MiniGameManager childId={childId} />}
          {tab === "wordcatch" && <WordCatchManager childId={childId} />}
        </QuotaContext.Provider>
      </div>
    </div>
  );
}

// ---- Shared bits -----------------------------------------------------------

function Column({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden rounded-[22px] border-[3px] border-line2 bg-white p-4.5 shadow-[0_5px_0_#EADAB8]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-baloo text-base font-extrabold">{title}</span>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">{children}</div>
    </div>
  );
}

function Row({ active, onClick, title, sub, onDelete }: { active?: boolean; onClick?: () => void; title: string; sub?: string; onDelete?: () => void }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border-[3px] px-3.5 py-2.5 text-left transition-colors ${active ? "border-brand-orange bg-[#FFF1DE]" : "border-[#EFDFC2] bg-cream-card hover:bg-white"}`}
    >
      <button onClick={onClick} className="flex flex-1 flex-col items-start gap-0.5 text-left disabled:cursor-default" disabled={!onClick}>
        <span className="font-baloo text-sm font-extrabold">{title}</span>
        {sub && <span className="font-baloo text-[11.5px] font-bold text-[#A2947C]">{sub}</span>}
      </button>
      {onDelete && (
        <button onClick={onDelete} className="shrink-0 rounded-full px-2 py-1 font-baloo text-xs font-bold text-[#B3402F] hover:bg-[#FDF0EC]" title="Xoá">
          ✕
        </button>
      )}
    </div>
  );
}

function ErrorLine({ text }: { text: string }) {
  if (!text) return null;
  return <div className="rounded-xl bg-[#FDF0EC] px-3 py-2 font-baloo text-[13px] font-bold text-[#B3402F]">{text}</div>;
}

// ---- Lessons ----------------------------------------------------------------

function LessonsManager() {
  const t = useT();
  const { quota, refreshQuota } = useQuota();
  const atLimit = !!quota && !quota.isPremium && quota.counts.lesson >= quota.limit;
  const [worlds, setWorlds] = useState<CatalogWorld[] | null>(null);
  const [worldId, setWorldId] = useState("");
  const [lessons, setLessons] = useState<MyLesson[] | null>(null);
  const [selected, setSelected] = useState<MyLesson | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);
  const [error, setError] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const [qPrompt, setQPrompt] = useState("");
  const [qHint, setQHint] = useState("");
  const [qOptions, setQOptions] = useState(["", ""]);
  const [qAnswer, setQAnswer] = useState("");
  const [qBusy, setQBusy] = useState(false);

  useEffect(() => {
    api
      .listWorlds()
      .then((r) => {
        setWorlds(r.worlds);
        if (r.worlds[0]) setWorldId(r.worlds[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách vùng, thử lại nhé.")));
  }, [t]);

  useEffect(() => {
    if (!worldId) return;
    setSelected(null);
    setQuestions(null);
    api
      .myListLessons(worldId)
      .then((r) => setLessons(r.lessons))
      .catch((err) => setError(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách bài học, thử lại nhé.")));
  }, [worldId, t]);

  function pick(lesson: MyLesson) {
    setSelected(lesson);
    setQuestions(null);
    api
      .myListQuestions(lesson.id)
      .then((r) => setQuestions(r.questions))
      .catch((err) => setError(err instanceof ApiError ? t(err.message) : t("Không tải được câu hỏi, thử lại nhé.")));
  }

  async function createLesson() {
    if (!newTitle.trim() || !worldId) return;
    setBusy(true);
    setError("");
    try {
      await api.myCreateLesson({ worldId, title: newTitle.trim() });
      setNewTitle("");
      const r = await api.myListLessons(worldId);
      setLessons(r.lessons);
      refreshQuota();
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không tạo được bài học, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  async function deleteLesson(l: MyLesson) {
    setError("");
    try {
      await api.myDeleteLesson(l.id);
      if (selected?.id === l.id) {
        setSelected(null);
        setQuestions(null);
      }
      const r = await api.myListLessons(worldId);
      setLessons(r.lessons);
      refreshQuota();
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không xoá được bài học, thử lại nhé."));
    }
  }

  function setOption(i: number, value: string) {
    setQOptions((opts) => opts.map((o, idx) => (idx === i ? value : o)));
  }

  async function addQuestion() {
    const cleanOptions = qOptions.map((o) => o.trim()).filter(Boolean);
    if (!selected || !qPrompt.trim() || cleanOptions.length < 2 || !qAnswer.trim() || !cleanOptions.includes(qAnswer.trim())) {
      setError(t("Cần: câu hỏi, ít nhất 2 lựa chọn, và đáp án phải nằm trong danh sách lựa chọn."));
      return;
    }
    setQBusy(true);
    setError("");
    try {
      await api.myCreateQuestion(selected.id, { prompt: qPrompt.trim(), hint: qHint.trim() || undefined, options: cleanOptions, answer: qAnswer.trim(), order: questions?.length ?? 0 });
      setQPrompt("");
      setQHint("");
      setQOptions(["", ""]);
      setQAnswer("");
      const [{ questions: qs }, { lessons: ls }] = await Promise.all([api.myListQuestions(selected.id), api.myListLessons(worldId)]);
      setQuestions(qs);
      setLessons(ls);
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không thêm được câu hỏi, thử lại nhé."));
    } finally {
      setQBusy(false);
    }
  }

  async function deleteQuestion(q: AdminQuestion) {
    if (!selected) return;
    setError("");
    try {
      await api.myDeleteQuestion(q.id);
      const [{ questions: qs }, { lessons: ls }] = await Promise.all([api.myListQuestions(selected.id), api.myListLessons(worldId)]);
      setQuestions(qs);
      setLessons(ls);
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không xoá được câu hỏi, thử lại nhé."));
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="font-baloo text-sm font-bold text-[#8A7A62]">{t("Vùng")}:</span>
        <select value={worldId} onChange={(e) => setWorldId(e.target.value)} className="rounded-xl border-[3px] border-line bg-white px-3 py-2 font-baloo text-sm font-bold text-ink outline-none">
          {worlds?.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <ErrorLine text={error} />
      <div className="flex min-h-0 flex-1 gap-4">
        <Column title={t("Bài học của bạn")} action={<QuotaGate kind="lesson" itemLabel={t("bài học")} />}>
          {lessons?.length === 0 && <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chưa có bài học nào.")}</div>}
          {lessons?.map((l) => (
            <Row key={l.id} active={selected?.id === l.id} onClick={() => pick(l)} title={l.title} sub={`${l._count.questions} ${t("câu")}`} onDelete={() => deleteLesson(l)} />
          ))}
          {atLimit ? (
            <div className="mt-auto rounded-xl border-2 border-dashed border-[#DDCFF5] bg-[#F1EAFB] px-3 py-2.5 font-baloo text-[12.5px] font-semibold text-[#6E56A8]">{t("Đã đạt giới hạn miễn phí")}</div>
          ) : (
            <div className="mt-auto flex gap-2 border-t-2 border-dashed border-[#F1E7D3] pt-3">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t("Tên bài học mới")}
                className="flex-1 rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange"
              />
              <SoftButton onClick={createLesson} disabled={busy || !newTitle.trim()}>
                {busy ? "…" : "+"}
              </SoftButton>
            </div>
          )}
        </Column>

        <Column title={selected ? `${t("Câu hỏi")} · ${selected.title}` : t("Câu hỏi")}>
          {!selected ? (
            <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chọn 1 bài học bên trái.")}</div>
          ) : (
            <>
              {questions?.length === 0 && <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chưa có câu hỏi nào.")}</div>}
              {questions?.map((q) => (
                <div key={q.id} className="flex flex-col gap-1.5 rounded-2xl border-[3px] border-[#EFDFC2] bg-cream-card px-3.5 py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="flex-1 font-baloo text-sm font-extrabold">{q.prompt}</span>
                    <button onClick={() => deleteQuestion(q)} className="shrink-0 rounded-full px-2 py-1 font-baloo text-xs font-bold text-[#B3402F] hover:bg-[#FDF0EC]">
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((o) => (
                      <span key={o} className={`rounded-full px-2.5 py-0.5 font-baloo text-[11.5px] font-bold ${o === q.answer ? "bg-[#EEF9E3] text-[#4F7C2A]" : "bg-white text-[#A2947C]"}`}>
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-auto flex flex-col gap-2 border-t-2 border-dashed border-[#F1E7D3] pt-3">
                <input value={qPrompt} onChange={(e) => setQPrompt(e.target.value)} placeholder={t("Câu hỏi (VD: Find the flower!)")} className="rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
                <input value={qHint} onChange={(e) => setQHint(e.target.value)} placeholder={t("Gợi ý (tuỳ chọn)")} className="rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
                {qOptions.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="lesson-answer" checked={o !== "" && o === qAnswer} onChange={() => setQAnswer(o)} />
                    <input
                      value={o}
                      onChange={(e) => setOption(i, e.target.value)}
                      placeholder={`${t("Lựa chọn")} ${i + 1}`}
                      className="flex-1 rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange"
                    />
                    {qOptions.length > 2 && (
                      <button onClick={() => setQOptions((opts) => opts.filter((_, idx) => idx !== i))} className="text-[#A2947C] hover:text-[#B3402F]">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {qOptions.length < 6 && (
                  <button onClick={() => setQOptions((opts) => [...opts, ""])} className="w-fit font-baloo text-xs font-bold text-brand-orange">
                    + {t("Thêm lựa chọn")}
                  </button>
                )}
                <ChunkyButton tone="green" onClick={addQuestion} disabled={qBusy} className="py-2.5 text-sm">
                  {qBusy ? t("Đang lưu…") : `+ ${t("Thêm câu hỏi")}`}
                </ChunkyButton>
              </div>
            </>
          )}
        </Column>
      </div>
    </div>
  );
}

// ---- Stories ------------------------------------------------------------

const SCENE_PRESETS: [string, string][] = [
  ["#DCEFC8", "#8CC85A"],
  ["#CFEAF6", "#7FBEE0"],
  ["#FFE9C9", "#E8B96A"],
  ["#FDF0EC", "#F6C3BB"],
  ["#F1EAFB", "#DDCFF5"],
];

function StoriesManager() {
  const t = useT();
  const { quota, refreshQuota } = useQuota();
  const atLimit = !!quota && !quota.isPremium && quota.counts.story >= quota.limit;
  const [stories, setStories] = useState<MyStory[] | null>(null);
  const [selected, setSelected] = useState<MyStory | null>(null);
  const [pages, setPages] = useState<MyStoryPage[] | null>(null);
  const [error, setError] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [busy, setBusy] = useState(false);

  const [pEn, setPEn] = useState("");
  const [pVi, setPVi] = useState("");
  const [pImg1, setPImg1] = useState(PETS[0]!.id);
  const [pImg2, setPImg2] = useState(PETS[1]!.id);
  const [pLabel, setPLabel] = useState("");
  const [pWords, setPWords] = useState<{ en: string; vi: string }[]>([{ en: "", vi: "" }]);
  const [pBusy, setPBusy] = useState(false);

  function reloadStories() {
    return api.myListStories().then((r) => setStories(r.stories));
  }
  useEffect(() => {
    reloadStories().catch((err) => setError(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách truyện, thử lại nhé.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(story: MyStory) {
    setSelected(story);
    setPages(null);
    api
      .myListStoryPages(story.id)
      .then((r) => setPages(r.pages))
      .catch((err) => setError(err instanceof ApiError ? t(err.message) : t("Không tải được các trang truyện, thử lại nhé.")));
  }

  async function createStory() {
    if (!newTitle.trim() || !newTopic.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.myCreateStory({ title: newTitle.trim(), topic: newTopic.trim() });
      setNewTitle("");
      setNewTopic("");
      await reloadStories();
      refreshQuota();
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không tạo được truyện, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  async function deleteStory(s: MyStory) {
    setError("");
    try {
      await api.myDeleteStory(s.id);
      if (selected?.id === s.id) {
        setSelected(null);
        setPages(null);
      }
      await reloadStories();
      refreshQuota();
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không xoá được truyện, thử lại nhé."));
    }
  }

  async function addPage() {
    if (!selected || !pEn.trim() || !pVi.trim() || !pLabel.trim()) {
      setError(t("Cần điền câu tiếng Anh, câu tiếng Việt và tên bối cảnh."));
      return;
    }
    const words = pWords.filter((w) => w.en.trim() && w.vi.trim()).map((w, i) => ({ en: w.en.trim(), vi: w.vi.trim(), color: SCENE_PRESETS[i % SCENE_PRESETS.length]![1] }));
    const [sceneBg, ground] = SCENE_PRESETS[(pages?.length ?? 0) % SCENE_PRESETS.length]!;
    setPBusy(true);
    setError("");
    try {
      await api.myCreateStoryPage(selected.id, { en: pEn.trim(), vi: pVi.trim(), img1: pImg1, img2: pImg2, label: pLabel.trim(), sceneBg, ground, words, order: pages?.length ?? 0 });
      setPEn("");
      setPVi("");
      setPLabel("");
      setPWords([{ en: "", vi: "" }]);
      const [{ pages: ps }] = await Promise.all([api.myListStoryPages(selected.id), reloadStories()]);
      setPages(ps);
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không thêm được trang truyện, thử lại nhé."));
    } finally {
      setPBusy(false);
    }
  }

  async function deletePage(p: MyStoryPage) {
    if (!selected) return;
    setError("");
    try {
      await api.myDeleteStoryPage(p.id);
      const [{ pages: ps }] = await Promise.all([api.myListStoryPages(selected.id), reloadStories()]);
      setPages(ps);
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không xoá được trang truyện, thử lại nhé."));
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <ErrorLine text={error} />
      <div className="flex min-h-0 flex-1 gap-4">
        <Column title={t("Truyện của bạn")} action={<QuotaGate kind="story" itemLabel={t("truyện")} />}>
          {stories?.length === 0 && <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chưa có truyện nào.")}</div>}
          {stories?.map((s) => (
            <Row key={s.id} active={selected?.id === s.id} onClick={() => pick(s)} title={s.title} sub={`${s.topic} · ${s._count.pages} ${t("trang")}`} onDelete={() => deleteStory(s)} />
          ))}
          {atLimit ? (
            <div className="mt-auto rounded-xl border-2 border-dashed border-[#DDCFF5] bg-[#F1EAFB] px-3 py-2.5 font-baloo text-[12.5px] font-semibold text-[#6E56A8]">{t("Đã đạt giới hạn miễn phí")}</div>
          ) : (
            <div className="mt-auto flex flex-col gap-2 border-t-2 border-dashed border-[#F1E7D3] pt-3">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t("Tên truyện")} className="rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
              <input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder={t("Chủ đề (VD: Gia đình)")} className="rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
              <ChunkyButton tone="purple" onClick={createStory} disabled={busy || !newTitle.trim() || !newTopic.trim()} className="py-2.5 text-sm">
                {busy ? t("Đang lưu…") : `+ ${t("Tạo truyện mới")}`}
              </ChunkyButton>
            </div>
          )}
        </Column>

        <Column title={selected ? `${t("Các trang")} · ${selected.title}` : t("Các trang")}>
          {!selected ? (
            <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chọn 1 truyện bên trái.")}</div>
          ) : (
            <>
              {pages?.length === 0 && <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chưa có trang nào.")}</div>}
              {pages?.map((p, i) => (
                <div key={p.id} className="flex flex-col gap-1 rounded-2xl border-[3px] border-[#EFDFC2] bg-cream-card px-3.5 py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 font-baloo text-[11px] font-bold text-[#A2947C]">#{i + 1}</span>
                    <span className="flex-1 font-baloo text-sm font-extrabold">{p.en}</span>
                    <button onClick={() => deletePage(p)} className="shrink-0 rounded-full px-2 py-1 font-baloo text-xs font-bold text-[#B3402F] hover:bg-[#FDF0EC]">
                      ✕
                    </button>
                  </div>
                  <span className="font-baloo text-[12px] font-semibold text-[#8A7A62]">{p.vi}</span>
                </div>
              ))}
              <div className="mt-auto flex flex-col gap-2 border-t-2 border-dashed border-[#F1E7D3] pt-3">
                <input value={pEn} onChange={(e) => setPEn(e.target.value)} placeholder={t("Câu tiếng Anh (VD: Buddy sees a star.)")} className="rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
                <input value={pVi} onChange={(e) => setPVi(e.target.value)} placeholder={t("Câu tiếng Việt")} className="rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
                <div className="flex gap-2">
                  <select value={pImg1} onChange={(e) => setPImg1(e.target.value)} className="flex-1 rounded-xl border-[3px] border-line bg-white px-2 py-2 font-baloo text-[13px] font-bold text-ink outline-none">
                    {PETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <select value={pImg2} onChange={(e) => setPImg2(e.target.value)} className="flex-1 rounded-xl border-[3px] border-line bg-white px-2 py-2 font-baloo text-[13px] font-bold text-ink outline-none">
                    {PETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input value={pLabel} onChange={(e) => setPLabel(e.target.value)} placeholder={t("Tên bối cảnh (VD: Sân sau nhà)")} className="rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
                <span className="font-baloo text-[11.5px] font-bold text-[#A2947C]">{t("Từ mới trang này")} (en / vi)</span>
                {pWords.map((w, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={w.en}
                      onChange={(e) => setPWords((ws) => ws.map((it, idx) => (idx === i ? { ...it, en: e.target.value } : it)))}
                      placeholder="star"
                      className="flex-1 rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange"
                    />
                    <input
                      value={w.vi}
                      onChange={(e) => setPWords((ws) => ws.map((it, idx) => (idx === i ? { ...it, vi: e.target.value } : it)))}
                      placeholder="ngôi sao"
                      className="flex-1 rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange"
                    />
                  </div>
                ))}
                {pWords.length < 4 && (
                  <button onClick={() => setPWords((ws) => [...ws, { en: "", vi: "" }])} className="w-fit font-baloo text-xs font-bold text-brand-orange">
                    + {t("Thêm từ")}
                  </button>
                )}
                <ChunkyButton tone="purple" onClick={addPage} disabled={pBusy} className="py-2.5 text-sm">
                  {pBusy ? t("Đang lưu…") : `+ ${t("Thêm trang")}`}
                </ChunkyButton>
              </div>
            </>
          )}
        </Column>
      </div>
    </div>
  );
}

// ---- Memory Match -----------------------------------------------------

const EMOJI_PRESETS = ["🍎", "🍌", "🍊", "🍇", "🐄", "🐴", "🐷", "🐑", "🔴", "🔵", "🟡", "🟢", "☀️", "🌧️", "☁️", "❄️", "📖", "✏️", "🎒", "🪑", "👩", "👨", "👶", "👵", "🚗", "🚌", "🚲", "✈️"];

function MiniGameManager({ childId }: { childId: string }) {
  const t = useT();
  const { quota, refreshQuota } = useQuota();
  const atLimit = !!quota && !quota.isPremium && quota.counts.miniGameTopic >= quota.limit;
  const savedEntries = useSavedWordEntries(childId);
  const [topics, setTopics] = useState<MyMiniGameTopic[] | null>(null);
  const [selected, setSelected] = useState<MyMiniGameTopic | null>(null);
  const [words, setWords] = useState<MyMiniGameWord[] | null>(null);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const [wEn, setWEn] = useState("");
  const [wVi, setWVi] = useState("");
  const [wImg, setWImg] = useState(EMOJI_PRESETS[0]!);
  const [wBusy, setWBusy] = useState(false);

  function reload() {
    return api.myListMiniGameTopics().then((r) => setTopics(r.topics));
  }
  useEffect(() => {
    reload().catch((err) => setError(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách chủ đề, thử lại nhé.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(topic: MyMiniGameTopic) {
    setSelected(topic);
    setWords(null);
    api
      .myListMiniGameWords(topic.id)
      .then((r) => setWords(r.words))
      .catch((err) => setError(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách từ, thử lại nhé.")));
  }

  async function createTopic() {
    if (!newName.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.myCreateMiniGameTopic({ name: newName.trim() });
      setNewName("");
      await reload();
      refreshQuota();
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không tạo được chủ đề, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  async function deleteTopic(tp: MyMiniGameTopic) {
    setError("");
    try {
      await api.myDeleteMiniGameTopic(tp.id);
      if (selected?.id === tp.id) {
        setSelected(null);
        setWords(null);
      }
      await reload();
      refreshQuota();
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không xoá được chủ đề, thử lại nhé."));
    }
  }

  async function addWord() {
    if (!selected || !wEn.trim() || !wVi.trim()) return;
    if ((words?.length ?? 0) >= 8) {
      setError(t("Mỗi chủ đề tối đa 8 cặp từ (4 hàng x 2 cột khi chơi)."));
      return;
    }
    setWBusy(true);
    setError("");
    try {
      await api.myCreateMiniGameWord(selected.id, { en: wEn.trim(), vi: wVi.trim(), img: wImg, order: words?.length ?? 0 });
      setWEn("");
      setWVi("");
      const [{ words: ws }] = await Promise.all([api.myListMiniGameWords(selected.id), reload()]);
      setWords(ws);
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không thêm được từ, thử lại nhé."));
    } finally {
      setWBusy(false);
    }
  }

  async function deleteWord(w: MyMiniGameWord) {
    if (!selected) return;
    setError("");
    try {
      await api.myDeleteMiniGameWord(w.id);
      const [{ words: ws }] = await Promise.all([api.myListMiniGameWords(selected.id), reload()]);
      setWords(ws);
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không xoá được từ, thử lại nhé."));
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <ErrorLine text={error} />
      <div className="flex min-h-0 flex-1 gap-4">
        <Column title={t("Chủ đề của bạn")} action={<QuotaGate kind="miniGameTopic" itemLabel={t("chủ đề")} />}>
          {topics?.length === 0 && <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chưa có chủ đề nào.")}</div>}
          {topics?.map((tp) => (
            <Row key={tp.id} active={selected?.id === tp.id} onClick={() => pick(tp)} title={tp.name} sub={`${tp._count.words} ${t("cặp từ")}`} onDelete={() => deleteTopic(tp)} />
          ))}
          {atLimit ? (
            <div className="mt-auto rounded-xl border-2 border-dashed border-[#DDCFF5] bg-[#F1EAFB] px-3 py-2.5 font-baloo text-[12.5px] font-semibold text-[#6E56A8]">{t("Đã đạt giới hạn miễn phí")}</div>
          ) : (
            <div className="mt-auto flex gap-2 border-t-2 border-dashed border-[#F1E7D3] pt-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("Tên chủ đề mới")} className="flex-1 rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
              <SoftButton onClick={createTopic} disabled={busy || !newName.trim()}>
                {busy ? "…" : "+"}
              </SoftButton>
            </div>
          )}
        </Column>

        <Column title={selected ? `${t("Từ")} · ${selected.name}` : t("Từ")}>
          {!selected ? (
            <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chọn 1 chủ đề bên trái.")}</div>
          ) : (
            <>
              {words?.length === 0 && <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chưa có từ nào.")}</div>}
              {words?.map((w) => (
                <div key={w.id} className="flex items-center gap-2.5 rounded-2xl border-[3px] border-[#EFDFC2] bg-cream-card px-3.5 py-2.5">
                  <span className="text-2xl leading-none">{w.img}</span>
                  <span className="flex-1 font-baloo text-sm font-extrabold">
                    {w.en} <span className="font-semibold text-[#A2947C]">— {w.vi}</span>
                  </span>
                  <button onClick={() => deleteWord(w)} className="shrink-0 rounded-full px-2 py-1 font-baloo text-xs font-bold text-[#B3402F] hover:bg-[#FDF0EC]">
                    ✕
                  </button>
                </div>
              ))}
              <div className="mt-auto flex flex-col gap-2 border-t-2 border-dashed border-[#F1E7D3] pt-3">
                <SavedWordChips
                  entries={savedEntries}
                  onPick={(w) => {
                    setWEn(capitalize(w.word));
                    setWVi(w.vi);
                  }}
                />
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_PRESETS.map((e) => (
                    <button key={e} onClick={() => setWImg(e)} className={`grid h-9 w-9 place-items-center rounded-xl border-2 text-lg ${wImg === e ? "border-brand-orange bg-[#FFF1DE]" : "border-line bg-white"}`}>
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={wEn} onChange={(e) => setWEn(e.target.value)} placeholder="Star" className="flex-1 rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
                  <input value={wVi} onChange={(e) => setWVi(e.target.value)} placeholder="ngôi sao" className="flex-1 rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
                </div>
                <ChunkyButton tone="green" onClick={addWord} disabled={wBusy} className="py-2.5 text-sm">
                  {wBusy ? t("Đang lưu…") : `+ ${t("Thêm từ")}`}
                </ChunkyButton>
              </div>
            </>
          )}
        </Column>
      </div>
    </div>
  );
}

// ---- Word Catch ---------------------------------------------------------

function WordCatchManager({ childId }: { childId: string }) {
  const t = useT();
  const { quota, refreshQuota } = useQuota();
  const atLimit = !!quota && !quota.isPremium && quota.counts.wordCatchTopic >= quota.limit;
  const savedEntries = useSavedWordEntries(childId);
  const [topics, setTopics] = useState<MyWordCatchTopic[] | null>(null);
  const [selected, setSelected] = useState<MyWordCatchTopic | null>(null);
  const [rounds, setRounds] = useState<MyWordCatchRound[] | null>(null);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const [rVi, setRVi] = useState("");
  const [rOptions, setROptions] = useState(["", "", "", ""]);
  const [rAnswer, setRAnswer] = useState("");
  const [rBusy, setRBusy] = useState(false);

  function reload() {
    return api.myListWordCatchTopics().then((r) => setTopics(r.topics));
  }
  useEffect(() => {
    reload().catch((err) => setError(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách chủ đề, thử lại nhé.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(topic: MyWordCatchTopic) {
    setSelected(topic);
    setRounds(null);
    api
      .myListWordCatchRounds(topic.id)
      .then((r) => setRounds(r.rounds))
      .catch((err) => setError(err instanceof ApiError ? t(err.message) : t("Không tải được các lượt chơi, thử lại nhé.")));
  }

  async function createTopic() {
    if (!newName.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.myCreateWordCatchTopic({ name: newName.trim() });
      setNewName("");
      await reload();
      refreshQuota();
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không tạo được chủ đề, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  async function deleteTopic(tp: MyWordCatchTopic) {
    setError("");
    try {
      await api.myDeleteWordCatchTopic(tp.id);
      if (selected?.id === tp.id) {
        setSelected(null);
        setRounds(null);
      }
      await reload();
      refreshQuota();
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không xoá được chủ đề, thử lại nhé."));
    }
  }

  function setOption(i: number, value: string) {
    setROptions((opts) => opts.map((o, idx) => (idx === i ? value : o)));
  }

  async function addRound() {
    const cleanOptions = rOptions.map((o) => o.trim()).filter(Boolean);
    if (!selected || !rVi.trim() || cleanOptions.length < 2 || !rAnswer.trim() || !cleanOptions.includes(rAnswer.trim())) {
      setError(t("Cần: nghĩa tiếng Việt, ít nhất 2 lựa chọn, và đáp án phải nằm trong danh sách lựa chọn."));
      return;
    }
    setRBusy(true);
    setError("");
    try {
      await api.myCreateWordCatchRound(selected.id, { vi: rVi.trim(), options: cleanOptions, answer: rAnswer.trim(), order: rounds?.length ?? 0 });
      setRVi("");
      setROptions(["", "", "", ""]);
      setRAnswer("");
      const [{ rounds: rs }] = await Promise.all([api.myListWordCatchRounds(selected.id), reload()]);
      setRounds(rs);
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không thêm được lượt chơi, thử lại nhé."));
    } finally {
      setRBusy(false);
    }
  }

  async function deleteRound(r: MyWordCatchRound) {
    if (!selected) return;
    setError("");
    try {
      await api.myDeleteWordCatchRound(r.id);
      const [{ rounds: rs }] = await Promise.all([api.myListWordCatchRounds(selected.id), reload()]);
      setRounds(rs);
    } catch (err) {
      setError(err instanceof ApiError ? t(err.message) : t("Không xoá được lượt chơi, thử lại nhé."));
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <ErrorLine text={error} />
      <div className="flex min-h-0 flex-1 gap-4">
        <Column title={t("Chủ đề của bạn")} action={<QuotaGate kind="wordCatchTopic" itemLabel={t("chủ đề")} />}>
          {topics?.length === 0 && <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chưa có chủ đề nào.")}</div>}
          {topics?.map((tp) => (
            <Row key={tp.id} active={selected?.id === tp.id} onClick={() => pick(tp)} title={tp.name} sub={`${tp._count.rounds} ${t("lượt chơi")}`} onDelete={() => deleteTopic(tp)} />
          ))}
          {atLimit ? (
            <div className="mt-auto rounded-xl border-2 border-dashed border-[#DDCFF5] bg-[#F1EAFB] px-3 py-2.5 font-baloo text-[12.5px] font-semibold text-[#6E56A8]">{t("Đã đạt giới hạn miễn phí")}</div>
          ) : (
            <div className="mt-auto flex gap-2 border-t-2 border-dashed border-[#F1E7D3] pt-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("Tên chủ đề mới")} className="flex-1 rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
              <SoftButton onClick={createTopic} disabled={busy || !newName.trim()}>
                {busy ? "…" : "+"}
              </SoftButton>
            </div>
          )}
        </Column>

        <Column title={selected ? `${t("Lượt chơi")} · ${selected.name}` : t("Lượt chơi")}>
          {!selected ? (
            <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chọn 1 chủ đề bên trái.")}</div>
          ) : (
            <>
              {rounds?.length === 0 && <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chưa có lượt chơi nào.")}</div>}
              {rounds?.map((r) => (
                <div key={r.id} className="flex flex-col gap-1.5 rounded-2xl border-[3px] border-[#EFDFC2] bg-cream-card px-3.5 py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="flex-1 font-baloo text-sm font-extrabold">{r.vi}</span>
                    <button onClick={() => deleteRound(r)} className="shrink-0 rounded-full px-2 py-1 font-baloo text-xs font-bold text-[#B3402F] hover:bg-[#FDF0EC]">
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.options.map((o) => (
                      <span key={o} className={`rounded-full px-2.5 py-0.5 font-baloo text-[11.5px] font-bold ${o === r.answer ? "bg-[#EEF9E3] text-[#4F7C2A]" : "bg-white text-[#A2947C]"}`}>
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-auto flex flex-col gap-2 border-t-2 border-dashed border-[#F1E7D3] pt-3">
                <SavedWordChips
                  entries={savedEntries}
                  onPick={(w) => {
                    setRVi(w.vi);
                    setROptions((opts) => opts.map((o, i) => (i === 0 ? capitalize(w.word) : o)));
                    setRAnswer(capitalize(w.word));
                  }}
                />
                <input value={rVi} onChange={(e) => setRVi(e.target.value)} placeholder={t("Nghĩa tiếng Việt (VD: con chó)")} className="rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange" />
                {rOptions.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="wc-answer" checked={o !== "" && o === rAnswer} onChange={() => setRAnswer(o)} />
                    <input
                      value={o}
                      onChange={(e) => setOption(i, e.target.value)}
                      placeholder={i === 0 ? t("Đáp án đúng (VD: Dog)") : `${t("Lựa chọn")} ${i + 1}`}
                      className="flex-1 rounded-xl border-[3px] border-line bg-cream-card px-3 py-2 font-baloo text-sm font-bold text-ink outline-none focus:border-brand-orange"
                    />
                  </div>
                ))}
                <ChunkyButton tone="green" onClick={addRound} disabled={rBusy} className="py-2.5 text-sm">
                  {rBusy ? t("Đang lưu…") : `+ ${t("Thêm lượt chơi")}`}
                </ChunkyButton>
              </div>
            </>
          )}
        </Column>
      </div>
    </div>
  );
}
