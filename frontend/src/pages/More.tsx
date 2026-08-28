import BottomTabs from "../components/BottomTabs";
import type { NavTab, Screen } from "../types/nav";
import { useT } from "../lib/i18n";

interface MoreProps {
  onNavigate: (tab: NavTab) => void;
  onOpen: (screen: Screen) => void;
}

type Tile = { screen: Screen; label: string; desc: string; color: string };

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
  { screen: "parentArea", label: "Parent Area", desc: "Thời gian học, tiến độ, giới hạn giờ", color: "#6C8FE3" },
  { screen: "petCare", label: "Chăm sóc thú cưng", desc: "Cho ăn, tắm, chơi, đổi phụ kiện", color: "#57C6C6" },
  { screen: "rank", label: "Xếp hạng", desc: "Bảng xếp hạng tuần này & bạn bè", color: "#F2A81C" },
  { screen: "questStreak", label: "Nhiệm vụ & Streak", desc: "Nhiệm vụ hôm nay, chuỗi ngày học", color: "#F5822B" },
  { screen: "profile", label: "Hồ sơ & Thành tích", desc: "Huy hiệu, bộ sưu tập pet, bạn bè", color: "#F79BB0" },
  { screen: "premium", label: "Premium", desc: "Mở khoá toàn bộ nội dung", color: "#9B7EDE" },
  { screen: "notifications", label: "Thông báo", desc: "Nhắc học, báo cáo, pet cần chăm", color: "#EF6A5A" },
  { screen: "settings", label: "Cài đặt", desc: "Ngôn ngữ, âm thanh, an toàn", color: "#8A5A3B" },
  { screen: "systemStates", label: "Trạng thái hệ thống", desc: "Mất mạng, hết giờ, lỗi tải (demo)", color: "#4A6B85" },
];

/** More hub — a lightweight glue screen (not in the original bundle) tying every secondary
 * destination together, matching the same visual language as the rest of the app. */
export default function More({ onNavigate, onOpen }: MoreProps) {
  const t = useT();
  return (
    <div className="flex h-full flex-col bg-cream">
      <div className="p-5.5 pb-3">
        <div className="font-baloo text-[26px] font-extrabold">{t("Thêm")}</div>
        <div className="font-baloo text-[13px] font-semibold text-[#8A7A62]">{t("Tất cả tính năng khác của Petlingo")}</div>
      </div>
      <div className="grid flex-1 grid-cols-4 content-start gap-4 overflow-y-auto px-5.5">
        {TILES.map((tile) => (
          <button
            key={tile.screen}
            onClick={() => onOpen(tile.screen)}
            className="flex flex-col items-start gap-2.5 rounded-[22px] border-[3px] border-line2 bg-white p-4.5 text-left shadow-[0_5px_0_#EADAB8] transition-transform hover:-translate-y-1"
          >
            <span className="h-10 w-10 rounded-2xl" style={{ background: tile.color }} />
            <span className="font-baloo text-base font-extrabold">{t(tile.label)}</span>
            <span className="font-baloo text-[12.5px] font-semibold leading-snug text-[#8A7A62]">{t(tile.desc)}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-center px-5.5 py-4.5">
        <BottomTabs active="More" onChange={onNavigate} className="w-[560px]" />
      </div>
    </div>
  );
}
