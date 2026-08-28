import { useState } from "react";
import { BackIcon, StarIcon } from "../components/ui";
import PetPortrait from "../components/PetPortrait";
import type { PetStatsState } from "../lib/api";
import { useT } from "../lib/i18n";

interface ProfileProps {
  childName: string;
  level: number;
  coins: number;
  gems: number;
  streak: number;
  ownedPets: string[];
  activePetId: string;
  activePetName: string;
  petStatsById: Record<string, PetStatsState>;
  onOpenCollection: () => void;
  onExit: () => void;
}

const BADGES: [string, string, string, string, string, boolean][] = [
  ["Words Master", "Học 50 từ mới", "100%", "Hoàn thành", "#FFC93C", true],
  ["Good Listener", "Nghe 100 lần", "100%", "Hoàn thành", "#57C6C6", true],
  ["Game Explorer", "Chơi 20 mini-game", "100%", "Hoàn thành", "#7CC24A", true],
  ["Streak 7", "Học 7 ngày liền", "100%", "Hoàn thành", "#F5822B", true],
  ["Pet Lover", "Mở khoá 20 pet", "60%", "12/20 pet", "#F79BB0", false],
  ["Speaker", "Nói đúng 200 từ", "45%", "90/200 từ", "#6C8FE3", false],
  ["Streak 30", "Học 30 ngày liền", "23%", "7/30 ngày", "#E8A22B", false],
  ["World Traveler", "Mở hết 6 vùng", "50%", "3/6 vùng", "#9B7EDE", false],
];
const FRIENDS: [string, string, string, string][] = [
  ["Minh", "LV.9 · Town", "210", "#7CC24A"],
  ["An", "LV.7 · Forest", "164", "#F79BB0"],
  ["Bảo", "LV.6 · Beach", "132", "#6C8FE3"],
];

/** Profile & Achievements — matches the reference sheet's "Phần 4 · Hồ sơ" panel. */
export default function Profile({ childName, level, coins, gems, streak, ownedPets, activePetId, activePetName, petStatsById, onOpenCollection, onExit }: ProfileProps) {
  const t = useT();
  const [filter, setFilter] = useState(0);
  const filtered = filter === 0 ? BADGES : BADGES.filter((b) => (filter === 1 ? b[5] : !b[5]));

  return (
    <div className="flex h-full flex-col bg-[#F7F4EE]">
      <div className="flex items-center gap-4.5 border-b-[3px] border-[#D8E8F2] bg-gradient-to-b from-[#CFEAF6] to-[#EAF6FF] p-5.5 pb-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] shrink-0 place-items-center self-start rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="relative grid h-24 w-24 place-items-center rounded-[26px] border-4 border-[#C9E5F7] bg-white">
          <PetPortrait petId={activePetId} name={activePetName} animated level={petStatsById[activePetId]?.level ?? 1} className="h-[82%] w-[82%]" />
          <span className="absolute -bottom-2.5 -right-2.5 rounded-full bg-brand-orange px-3 py-1 font-baloo text-sm font-extrabold text-white shadow-[0_3px_0_#C9631A]">LV.{level}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="font-baloo text-[30px] font-extrabold">{childName}</div>
          <div className="font-baloo text-sm font-semibold text-[#5A7080]">{t("6 tuổi · học cùng Buddy 42 ngày")}</div>
          <div className="mt-0.5 flex gap-2.5">
            {[
              [String(coins), "coin", "#B07A0C"],
              [String(gems), "gem", "#2F8C8C"],
              [String(streak), t("ngày streak"), "#C7551A"],
            ].map(([value, label, color]) => (
              <span key={label} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 font-baloo text-sm font-extrabold shadow-[0_3px_0_rgba(0,0,0,.08)]" style={{ color }}>
                {value}
                <span className="font-semibold text-[#8A9AA6]">{label}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex w-65 flex-col gap-1.5">
          <div className="flex justify-between font-baloo text-[12.5px] font-bold text-[#5A7080]">
            <span>
              {t("Tới")} LV.{level + 1}
            </span>
            <span>80/120 XP</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full border-2 border-[#C9E5F7] bg-white">
            <div className="h-full rounded-full bg-brand-blue" style={{ width: "66%" }} />
          </div>
          <div className="font-baloo text-xs font-semibold text-[#7B8B99]">{t("Còn 3 bài học nữa là lên cấp")}</div>
        </div>
      </div>

      <div className="flex flex-1 gap-5 overflow-hidden p-5.5">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <span className="font-baloo text-xl font-extrabold">{t("Thành tích")}</span>
            <span className="font-baloo text-[13px] font-semibold text-[#8A7A62]">
              {BADGES.filter((b) => b[5]).length}/{BADGES.length} {t("đã đạt")}
            </span>
            <div className="flex-1" />
            <div className="flex gap-0.5 rounded-xl bg-[#F1E7D3] p-1">
              {["Tất cả", "Đã đạt", "Đang làm"].map((label, i) => (
                <button key={label} onClick={() => setFilter(i)} className={`rounded-lg px-4 py-2 font-baloo text-[13px] font-bold ${filter === i ? "bg-[#5C7BC9] text-white" : "text-[#8A7A62]"}`}>
                  {t(label)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid flex-1 grid-cols-4 content-start gap-4 overflow-y-auto">
            {filtered.map(([name, desc, pct, status, bg, doneFlag]) => (
              <div key={name} className="flex flex-col items-center gap-2 rounded-[22px] border-[3px] bg-white p-4 text-center shadow-[0_5px_0_#EADAB8]" style={{ borderColor: doneFlag ? "#CDE7B4" : "#EFDFC2" }}>
                <div
                  className="grid h-[62px] w-[62px] place-items-center rounded-full shadow-[0_4px_0_rgba(0,0,0,.12)]"
                  style={{ background: doneFlag ? bg : "#D8CDBA", animation: doneFlag ? "pop 2.4s ease-in-out infinite" : undefined }}
                >
                  <StarIcon size={32} color="#fff" />
                </div>
                <div className="font-baloo text-[14.5px] font-extrabold">{name}</div>
                <div className="font-baloo text-[11.5px] font-semibold leading-tight text-[#8A7A62]">{t(desc)}</div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F1E7D3]">
                  <div className="h-full rounded-full" style={{ width: pct, background: doneFlag ? "#7CC24A" : bg }} />
                </div>
                <div className="font-baloo text-[11px] font-bold" style={{ color: doneFlag ? "#7CC24A" : bg }}>
                  {t(status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-[280px] flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-[22px] border-[3px] border-line2 bg-white p-4.5">
            <div className="font-baloo text-[18px] font-extrabold">{t("Bộ sưu tập pet")}</div>
            <div className="flex items-baseline gap-2">
              <span className="font-baloo text-[32px] font-extrabold text-brand-orange">{ownedPets.length}</span>
              <span className="font-baloo text-sm font-bold text-[#8A7A62]">/ 40 {t("bạn thú")}</span>
            </div>
            <div className="h-3.5 overflow-hidden rounded-full bg-[#F1E7D3]">
              <div className="h-full rounded-full bg-brand-orange" style={{ width: `${Math.round((ownedPets.length / 40) * 100)}%` }} />
            </div>
            <div className="flex flex-wrap gap-2">
              {["buddy", "mimi", "poppy", "bamboo", "leo", "stella"].map((id, i) => (
                <span key={id} className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-[#EBD9B8]" style={{ background: i < 4 ? "#FFF9EC" : "#F1E7D3" }}>
                  <PetPortrait petId={id} name={id} level={ownedPets.includes(id) ? (petStatsById[id]?.level ?? 1) : undefined} className={`h-4/5 w-4/5 ${ownedPets.includes(id) ? "" : "opacity-40"}`} />
                </span>
              ))}
            </div>
            <button onClick={onOpenCollection} className="font-baloo text-sm font-bold text-brand-orange">
              {t("Xem tất cả 40 bạn thú")}
            </button>
          </div>
          <div className="flex flex-col gap-2.5 rounded-[22px] border-[3px] border-[#EBD9B8] bg-cream-card p-4.5 shadow-[0_5px_0_#E3CFA8]">
            <div className="font-baloo text-[18px] font-extrabold">{t("Bạn bè học cùng")}</div>
            {FRIENDS.map(([name, sub, stars, color]) => (
              <div key={name} className="flex items-center gap-2.5 border-b-2 border-dashed border-[#F1E7D3] py-1.5">
                <span className="h-[34px] w-[34px] shrink-0 rounded-xl" style={{ background: color }} />
                <div className="flex-1 font-baloo text-sm font-bold">
                  {name}
                  <div className="font-baloo text-[11.5px] font-semibold text-[#8A7A62]">{sub}</div>
                </div>
                <span className="font-baloo text-sm font-extrabold text-[#D9930A]">{stars}</span>
              </div>
            ))}
            <div className="font-mono text-[10.5px] leading-relaxed text-[#A2947C]">{t("Chỉ hiện tên do phụ huynh duyệt · không chat tự do")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
