import type { CatalogLesson } from "../lib/api";
import { BackIcon, TopicIcon } from "../components/ui";
import { BookOpen, ChevronRight, Clock3, Sparkles } from "lucide-react";
import { useT } from "../lib/i18n";

const WORLD_META: Record<string, { name: string; color: string; soft: string }> = {
  forest: { name: "Khu rừng xanh", color: "#68A743", soft: "#EAF6DD" },
  town: { name: "Thị trấn vui vẻ", color: "#D67B42", soft: "#FCE8DA" },
  beach: { name: "Bãi biển nắng", color: "#3E9FC1", soft: "#DDF3FA" },
  school: { name: "Ngôi trường", color: "#5C7BC9", soft: "#E4EAF9" },
  castle: { name: "Lâu đài phép thuật", color: "#8D67C8", soft: "#EEE6FA" },
  space: { name: "Trạm vũ trụ", color: "#4B557D", soft: "#E4E7F1" },
  ielts: { name: "Học viện IELTS", color: "#3D7FC4", soft: "#E2F0FF" },
  toeic: { name: "Văn phòng TOEIC", color: "#D66B45", soft: "#FCE8DE" },
};

export default function LessonPicker({ lessons, worldKey, onPick, onExit }: { lessons: CatalogLesson[]; worldKey: string; onPick: (id: string) => void; onExit: () => void }) {
  const t = useT();
  const meta = WORLD_META[worldKey] ?? WORLD_META.forest!;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#F4F8EF]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[205px]" style={{ background: `linear-gradient(180deg, ${meta.soft}, #F4F8EF)` }} />
      <header className="relative flex items-center gap-4 px-5 py-4.5">
        <button onClick={onExit} aria-label={t("Quay lại")} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]"><BackIcon /></button>
        <div>
          <div className="flex items-center gap-2 font-baloo text-[11px] font-extrabold uppercase tracking-[0.13em]" style={{ color: meta.color }}><Sparkles size={15} /> {t("Hành trình học tập")}</div>
          <h1 className="font-baloo text-[27px] font-extrabold leading-tight text-[#41362E]">{t("Chọn một bài học")}</h1>
          <p className="font-baloo text-[12px] font-semibold text-[#807367]">{t(meta.name)} · {lessons.length} {t("bài học")}</p>
        </div>
        <div className="ml-auto hidden items-center gap-2 rounded-full border-2 border-white bg-white/75 px-4 py-2 font-baloo text-[12px] font-extrabold text-[#568A45] sm:flex"><BookOpen size={18} /> {t("Học từng bước, tiến bộ mỗi ngày")}</div>
      </header>

      <main className="relative flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3">
          {lessons.map((lesson, index) => {
            const cefrLevel = lesson.title.match(/\b(A1|A2|B1|B2|C1|C2)\b/i)?.[1]?.toUpperCase();
            // Read the REAL difficulty straight off the title's own
            // "(Trung bình)"/"(Khó)" suffix (seed.ts always writes one, no
            // suffix = "Dễ") instead of guessing from position in the list —
            // guessing by index used to contradict the title text itself
            // (e.g. card #3 "Bài 3: Thiên nhiên kỳ diệu (Khó)" was badged
            // "Dễ" just because it was the 3rd card).
            const tier = /\(Khó\)/i.test(lesson.title) ? "hard" : /\(Trung bình\)/i.test(lesson.title) ? "medium" : "easy";
            const level = cefrLevel ?? (tier === "hard" ? t("Khó") : tier === "medium" ? t("Trung bình") : t("Dễ"));
            const tierColor = tier === "hard" ? "#916DCA" : tier === "medium" ? "#E79532" : "#72B648";
            return (
              <button key={lesson.id} onClick={() => onPick(lesson.id)} className="group relative flex min-h-[126px] items-center gap-3.5 overflow-hidden rounded-[25px] border-[3px] border-white bg-white/94 p-4 text-left shadow-[0_6px_0_#DDE5D7] transition-all hover:-translate-y-1 hover:shadow-[0_8px_0_#D4DFCE]">
                <span className="absolute -right-7 -top-8 h-24 w-24 rounded-full opacity-60" style={{ background: meta.soft }} />
                <div className="relative">
                  <TopicIcon label={`${lesson.title} ${meta.name}`} color={meta.color} size={64} />
                  <span className="absolute -left-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white font-baloo text-[10px] font-extrabold text-white" style={{ background: tierColor }}>{index + 1}</span>
                </div>
                <span className="relative min-w-0 flex-1">
                  <span className="mb-1 inline-flex rounded-full px-2 py-0.5 font-baloo text-[9px] font-extrabold uppercase tracking-wide" style={{ color: meta.color, background: meta.soft }}>{level}</span>
                  <span className="block font-baloo text-[15px] font-extrabold leading-snug text-[#443930]">{lesson.title}</span>
                  <span className="mt-1 flex items-center gap-1.5 font-baloo text-[10.5px] font-bold text-[#948779]"><Clock3 size={13} /> {t("Khoảng 3 phút")}</span>
                  {lesson.isOwn && <span className="mt-1 inline-block rounded-full bg-[#F1EAFB] px-2 py-0.5 font-baloo text-[9px] font-bold text-[#6E56A8]">{t("Của bạn")}</span>}
                </span>
                <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-white transition-transform group-hover:translate-x-1" style={{ background: meta.color }}><ChevronRight size={18} strokeWidth={3} /></span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
