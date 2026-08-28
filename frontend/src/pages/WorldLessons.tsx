import { useEffect, useState } from "react";
import { api, ApiError, type CatalogWorld } from "../lib/api";
import { BackIcon } from "../components/ui";
import { useT } from "../lib/i18n";

interface WorldLessonsProps {
  onSelectWorld: (worldKey: string) => void;
  onExit: () => void;
}

/**
 * "Chọn bài học" — a lightweight world picker, added specifically so the 5
 * lessons seeded for Town/Beach/School/Castle/Space (see prisma/seed.ts's
 * WORLD_LESSONS, TASKS.md) are actually reachable somewhere: "Học ngay" on
 * Home always plays Forest, and there's been no other way to pick a
 * different world's lesson since WorldMap.tsx was dropped (replaced by the
 * "Game" tab). Deliberately NOT a revival of the old zone-map UI (no
 * unlock/star/progress visuals) — just a plain list, one tap = go study that
 * world's lesson via the exact same flow "Học ngay" already uses.
 */
export default function WorldLessons({ onSelectWorld, onExit }: WorldLessonsProps) {
  const t = useT();
  const [worlds, setWorlds] = useState<CatalogWorld[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .listWorlds()
      .then((r) => setWorlds(r.worlds))
      .catch((e) => setErr(e instanceof ApiError ? t(e.message) : t("Không tải được danh sách bài học, thử lại nhé.")));
  }, [t]);

  return (
    <div className="flex h-full flex-col bg-cream">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-white p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[26px] font-extrabold">{t("Chọn bài học")}</span>
          <span className="font-baloo text-[13px] font-semibold text-[#8A7A62]">{t("Chọn 1 vùng để bắt đầu học")}</span>
        </div>
      </div>

      <div className="grid flex-1 place-items-center p-5.5">
        {worlds === null ? (
          <div className="font-baloo text-base font-bold text-ink/40">{t("Đang tải…")}</div>
        ) : (
          <div className="grid grid-cols-3 gap-4.5">
            {worlds.map((w) => (
              <button
                key={w.id}
                onClick={() => onSelectWorld(w.key)}
                className="flex w-[220px] flex-col items-start gap-2.5 rounded-[22px] border-[3px] border-line2 bg-white p-4.5 text-left shadow-[0_5px_0_#EADAB8] transition-transform hover:-translate-y-1"
              >
                <span className="h-10 w-10 rounded-2xl" style={{ background: w.colorTheme }} />
                <span className="font-baloo text-base font-extrabold">{w.name}</span>
                <span className="font-baloo text-[12.5px] font-semibold leading-snug text-[#8A7A62]">{w.topic}</span>
              </button>
            ))}
          </div>
        )}
        {err && <div className="mt-3 font-baloo text-sm font-bold text-[#B3402F]">{err}</div>}
      </div>
    </div>
  );
}
