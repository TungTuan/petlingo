import BottomTabs from "../components/BottomTabs";
import type { NavTab, Screen } from "../types/nav";
import { useT } from "../lib/i18n";
import type { ReactNode } from "react";
import { Bell, ChevronRight, Crown, HeartPulse, Medal, Settings as SettingsIcon, ShieldCheck, Sparkles, Stethoscope, Trees, UserRound } from "lucide-react";

interface MoreProps {
  onNavigate: (tab: NavTab) => void;
  onOpen: (screen: Screen) => void;
}

type Tile = { screen: Screen; label: string; desc: string; color: string; soft: string; icon: ReactNode; group: "Của bé" | "Gia đình" | "Hệ thống" };

// Mini-game/Đấu trường/Chủ đề tiles moved out to GameHub.tsx (new "Game" tab,
// now branded "Học tập" — see BottomTabs.tsx) — this list is now scoped to
// non-game utility/management screens only. Đọc truyện/Từ điển/Nội dung của
// tôi USED to live here too, but moved into that "Học tập" tab's own tile
// grid instead (see GameHub.tsx) since that's the screen actually named
// "Học tập" in the app today — a same-named section header in here instead
// would've just duplicated/confused that destination. Battle Pass ALSO used
// to have a tile here, moved to Home.tsx instead (the "Quà" gift-box button,
// which used to do nothing at all) on request — a seasonal reward ladder is
// meant to stay visible/front-and-center, not buried behind "...".
const TILES: Tile[] = [
  { screen: "petCare", label: "Chăm sóc thú cưng", desc: "Cho ăn, tắm và vui chơi cùng pet", color: "#2FA9A5", soft: "#DDF6F2", icon: <Stethoscope />, group: "Của bé" },
  { screen: "petRanch", label: "Nông trại Pet", desc: "Xem tất cả bạn thú đi bộ và bay cùng nhau", color: "#65A947", soft: "#E6F6D8", icon: <Trees />, group: "Của bé" },
  { screen: "rank", label: "Xếp hạng", desc: "Thành tích tuần này và bạn bè", color: "#D99413", soft: "#FFF1CC", icon: <Medal />, group: "Của bé" },
  { screen: "questStreak", label: "Nhiệm vụ & Streak", desc: "Giữ chuỗi ngày học và nhận quà", color: "#E96E25", soft: "#FFE8D8", icon: <Sparkles />, group: "Của bé" },
  { screen: "profile", label: "Hồ sơ & Thành tích", desc: "Huy hiệu, bộ sưu tập và tiến độ", color: "#DF6E98", soft: "#FCE4EE", icon: <UserRound />, group: "Của bé" },
  { screen: "premium", label: "PetLingo Premium", desc: "Mở khoá toàn bộ hành trình học", color: "#8968CD", soft: "#EEE7FC", icon: <Crown />, group: "Gia đình" },
  { screen: "parentArea", label: "Khu vực phụ huynh", desc: "Theo dõi thời gian học và tiến độ", color: "#5C7BC9", soft: "#E4EAFA", icon: <ShieldCheck />, group: "Gia đình" },
  { screen: "notifications", label: "Thông báo", desc: "Nhắc học và cập nhật từ PetLingo", color: "#E45858", soft: "#FCE4E1", icon: <Bell />, group: "Hệ thống" },
  { screen: "settings", label: "Cài đặt", desc: "Ngôn ngữ, âm thanh và an toàn", color: "#786052", soft: "#EEE6E0", icon: <SettingsIcon />, group: "Hệ thống" },
  { screen: "systemStates", label: "Trạng thái hệ thống", desc: "Kiểm tra kết nối và trạng thái ứng dụng", color: "#4A7188", soft: "#DFEBF0", icon: <HeartPulse />, group: "Hệ thống" },
];

/** More hub — a lightweight glue screen (not in the original bundle) tying every secondary
 * destination together, matching the same visual language as the rest of the app. */
export default function More({ onNavigate, onOpen }: MoreProps) {
  const t = useT();
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#F4F8F5]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[linear-gradient(135deg,#DDF5EF_0%,#E8F0FF_58%,#FFF4DD_100%)]" />
      <div className="relative flex-1 overflow-y-auto px-5.5 pb-5">
        <header className="flex items-center justify-between py-5">
          <div>
            <div className="font-baloo text-[29px] font-extrabold leading-none text-[#3F352D]">{t("Khám phá thêm")}</div>
            <div className="mt-2 font-baloo text-[13px] font-semibold text-[#766B60]">{t("Quản lý hành trình học và mọi tiện ích của PetLingo")}</div>
          </div>
          <div className="flex items-center gap-2 rounded-full border-2 border-white bg-white/75 px-4 py-2 font-baloo text-[12px] font-extrabold text-[#438C79] shadow-sm">
            <Sparkles size={17} /> {t("Góc tiện ích")}
          </div>
        </header>

        <div className="space-y-4">
          {(["Của bé", "Gia đình", "Hệ thống"] as const).map((group) => (
            <section key={group} className="rounded-[27px] border-2 border-white bg-white/65 p-3.5 shadow-[0_6px_0_#DCE7DF] backdrop-blur-sm">
              <div className="mb-2.5 flex items-center gap-2 px-1 font-baloo text-[15px] font-extrabold text-[#51453B]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#55B89E]" /> {t(group)}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {TILES.filter((tile) => tile.group === group).map((tile) => (
                  <button
                    key={tile.screen}
                    onClick={() => onOpen(tile.screen)}
                    className="group flex min-h-[92px] items-center gap-3 rounded-[21px] border-2 border-white bg-white p-3 text-left shadow-[0_4px_0_#E2E8E3] transition-all hover:-translate-y-1 hover:shadow-[0_6px_0_#D8E2DA]"
                  >
                    <span className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-[18px] border-2 border-white shadow-[inset_0_-4px_0_rgba(0,0,0,.07)]" style={{ background: tile.soft, color: tile.color }}>
                      <span className="[&>svg]:h-7 [&>svg]:w-7 [&>svg]:stroke-[2.6]">{tile.icon}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-baloo text-[14px] font-extrabold leading-tight text-[#453A31]">{t(tile.label)}</span>
                      <span className="mt-1 line-clamp-2 block font-baloo text-[10.5px] font-semibold leading-snug text-[#897B6E]">{t(tile.desc)}</span>
                    </span>
                    <ChevronRight size={19} strokeWidth={3} className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: tile.color }} />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <div className="flex justify-center px-5.5 py-4.5">
        <BottomTabs active="More" onChange={onNavigate} className="w-[560px]" />
      </div>
    </div>
  );
}
