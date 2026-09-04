import { useEffect, useState } from "react";
import { api, ApiError, type StoryDetail, type StoryListItem } from "../lib/api";
import { BackIcon, SpeakerIcon, TopicIcon } from "../components/ui";
import { speak } from "../lib/tts";
import { useT } from "../lib/i18n";

interface StoryProps {
  onExit: () => void;
  onComplete?: (contentKey: string) => void;
}

/** Story reader — matches the reference sheet's "Phần 6 · Đọc truyện" panel.
 * Now backed by real Story/StoryPage catalog data (see /catalog/stories):
 * shows a picker of every active story first, then reads whichever one was
 * tapped — instead of the single hard-coded "Buddy Goes to the Farm". */
export default function Story({ onExit, onComplete }: StoryProps) {
  const t = useT();
  const [list, setList] = useState<StoryListItem[] | null>(null);
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    api
      .listStories()
      .then((r) => setList(r.stories))
      .catch((err) => setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách truyện, thử lại nhé.")));
  }, [t]);

  async function openStory(id: string) {
    setLoadErr("");
    try {
      const { story } = await api.getStory(id);
      setStory(story);
    } catch (err) {
      setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được truyện, thử lại nhé."));
    }
  }

  if (story) return <StoryReader story={story} onExit={() => setStory(null)} onComplete={() => onComplete?.(story.id)} />;

  return (
    <div className="flex h-full flex-col bg-cream-card">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-[#F7EFDD] p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[23px] font-extrabold">{t("Đọc truyện")}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Chọn 1 truyện để bắt đầu đọc")}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5.5">
        {list === null ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải danh sách truyện…")}</div>
        ) : loadErr && list.length === 0 ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-[#B3402F]">{loadErr}</div>
        ) : (
          <div className="grid grid-cols-4 gap-4.5">
            {list.map((s) => (
              <button
                key={s.id}
                onClick={() => openStory(s.id)}
                className="flex flex-col items-start gap-2.5 rounded-[22px] border-[3px] border-line2 bg-white p-4.5 text-left shadow-[0_5px_0_#EADAB8] transition-transform hover:-translate-y-1"
              >
                <TopicIcon label={`${s.title} ${s.topic} story`} color={s.colorTheme} />
                <span className="font-baloo text-base font-extrabold leading-snug">{s.title}</span>
                <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{s.topic}</span>
                <span className="mt-auto font-baloo text-[11.5px] font-bold text-[#A2947C]">
                  {s._count.pages} {t("trang")}
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

/** The actual page-by-page reader, once a story has been picked. */
function StoryReader({ story, onExit, onComplete }: { story: StoryDetail; onExit: () => void; onComplete?: () => void }) {
  const t = useT();
  const [page, setPage] = useState(0);
  const [showVi, setShowVi] = useState(true);
  const [msg, setMsg] = useState("");
  const [completed, setCompleted] = useState(false);
  const pages = story.pages;
  const p = pages[page]!;
  const isLast = page === pages.length - 1;

  return (
    <div className="flex h-full flex-col bg-cream-card">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-[#F7EFDD] p-3.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[23px] font-extrabold">{story.title}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">
            {t("Truyện tranh · trang")} {page + 1}/{pages.length} · {t("cấp độ A1")}
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          {pages.map((_, i) => (
            <span key={i} className="h-2.5 rounded-full transition-all" style={{ width: i === page ? "34px" : "10px", background: i <= page ? "#F5822B" : "#E4D3BC" }} />
          ))}
        </div>
        <button
          onClick={() => setShowVi((v) => !v)}
          className="rounded-2xl border-[3px] border-line px-4.5 py-2.5 font-baloo text-sm font-bold shadow-[0_4px_0_#E7D4B2]"
          style={{ background: showVi ? "#5C7BC9" : "#fff", color: showVi ? "#fff" : "#8A5A3B" }}
        >
          {t("Tiếng Việt")}
        </button>
      </div>

      <div className="flex flex-1 gap-5 overflow-hidden p-5.5">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden rounded-[24px] border-4 border-line" style={{ background: p.sceneBg }}>
            <div className="animate-cloud absolute left-15 top-8.5 h-12 w-[150px] rounded-full bg-white/75" />
            <div className="absolute inset-x-0 bottom-0 h-[34%]" style={{ background: p.ground }} />
            <div className="relative flex items-end gap-6.5 pb-6.5">
              <img src={`/pets/${p.img1}.webp`} alt="" className="animate-bob h-[210px] w-[210px] object-contain object-bottom" />
              <img src={`/pets/${p.img2}.webp`} alt="" className="h-[170px] w-[170px] object-contain object-bottom" style={{ animation: "bob 4s ease-in-out infinite" }} />
            </div>
            <div className="absolute right-6 top-5.5 rounded-2xl bg-white px-4.5 py-2.5 font-baloo text-[15px] font-extrabold shadow-[0_4px_0_rgba(0,0,0,.12)]">{t(p.label)}</div>
          </div>

          <div className="flex items-center gap-4 rounded-[22px] border-[3px] border-line2 bg-white p-4.5 shadow-[0_5px_0_#EADAB8]">
            <button
              onClick={() => speak(p.en)}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-teal shadow-[0_4px_0_#37A0A0] transition-transform active:translate-y-[3px]"
            >
              <SpeakerIcon />
            </button>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="font-baloo text-[25px] font-extrabold leading-snug">{p.en}</div>
              {showVi && <div className="font-baloo text-base font-semibold text-[#8A7A62]">{p.vi}</div>}
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                setPage((v) => Math.max(0, v - 1));
                setMsg("");
              }}
              disabled={page === 0}
              className="rounded-2xl border-[3px] border-line bg-white px-6.5 py-3.5 font-baloo text-base font-bold text-brand-brown shadow-[0_4px_0_#E7D4B2] disabled:opacity-45"
            >
              {t("Trang trước")}
            </button>
            <button
              onClick={() => {
                if (isLast) {
                  setMsg(t("Đọc xong! +40 coin và") + ` ${pages.reduce((n, pg) => n + pg.words.length, 0)} ` + t("từ mới"));
                  if (!completed) { setCompleted(true); onComplete?.(); }
                }
                else {
                  setPage((v) => v + 1);
                  setMsg("");
                }
              }}
              className="relative overflow-hidden rounded-2xl bg-brand-orange px-8.5 py-3.5 font-baloo text-lg font-extrabold text-white shadow-[0_5px_0_#C9631A] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#C9631A]"
            >
              {isLast ? t("Hoàn thành") : t("Trang sau")}
              {/* Sweep is a thin overlay span, not applied to the whole button — animating
                  `animate-shine` directly on the button (the previous bug here) drags the
                  whole button + its label across the screen every 3.2s instead of a subtle
                  light streak crossing a button that stays put. */}
              <span className="animate-shine pointer-events-none absolute left-0 top-0 h-full w-9 bg-gradient-to-r from-transparent via-white/55 to-transparent" />
            </button>
            <div className="flex-1" />
            <div className="font-baloo text-sm font-bold text-[#4F7C2A]">{msg}</div>
          </div>
        </div>

        <div className="flex w-[250px] flex-col gap-3.5">
          <div className="flex flex-col gap-2.5 rounded-[22px] border-[3px] border-line2 bg-white p-4.5 shadow-[0_5px_0_#EADAB8]">
            <div className="font-baloo text-[18px] font-extrabold">{t("Từ mới trang này")}</div>
            {p.words.map(({ en, vi, color }) => (
              <button
                key={en}
                onClick={() => {
                  speak(en);
                  setMsg(`${t("Đọc")} "${en}"`);
                }}
                className="flex items-center gap-2.5 rounded-2xl border-[3px] bg-cream-card px-3 py-2.5 text-left"
                style={{ borderColor: "#EBD9B8" }}
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                <span className="flex-1">
                  <span className="block font-baloo text-[15.5px] font-extrabold">{en}</span>
                  <span className="block font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{vi}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 rounded-[22px] border-[3px] border-[#CDE7B4] bg-[#EEF9E3] p-4.5">
            <div className="font-baloo text-base font-extrabold text-[#4F7C2A]">{t("Đọc xong nhận")}</div>
            <div className="flex items-center gap-2.5 font-baloo text-base font-extrabold text-[#B07A0C]">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#F2A81C" />
                <circle cx="12" cy="12" r="6.6" fill="#FFE08A" />
              </svg>
              +40 coin
            </div>
            <div className="font-baloo text-[12.5px] font-semibold text-[#4F7C2A]">{t("Và từ mới trong truyện được thêm vào bộ ôn tập của Lily.")}</div>
          </div>
          <div className="mt-auto font-mono text-[10.5px] leading-relaxed text-[#A2947C]">{t("Chạm từ bất kỳ trong câu để nghe phát âm riêng.")}</div>
        </div>
      </div>
    </div>
  );
}
