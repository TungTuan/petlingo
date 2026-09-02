import BottomTabs from "../components/BottomTabs";
import type { NavTab, Screen } from "../types/nav";
import { useT } from "../lib/i18n";
import { ArrowRight, BookOpen, Sparkles, Star } from "lucide-react";

interface GameHubProps {
  onNavigate: (tab: NavTab) => void;
  onOpen: (screen: Screen) => void;
}

type LearningTile = {
  screen: Screen;
  label: string;
  desc: string;
  category: string;
  icon: string;
  color: string;
  soft: string;
};

const TILES: LearningTile[] = [
  { screen: "worldLessons", label: "Chọn bài học", desc: "Mở khóa bài mới và khám phá các vùng đất tiếng Anh", category: "HÀNH TRÌNH", icon: "🗺️", color: "#62A83E", soft: "#E9F7D9" },
  { screen: "fightRoom", label: "Đấu trường từ vựng", desc: "Thi đấu 1v1, trả lời nhanh và nhận thêm coin", category: "THỬ THÁCH", icon: "⚔️", color: "#E85E56", soft: "#FFE6DE" },
  { screen: "topics", label: "Kho chủ đề", desc: "Học từ vựng theo chủ đề và ôn đúng thời điểm", category: "TỪ VỰNG", icon: "📚", color: "#299E9E", soft: "#DCF7F4" },
  { screen: "miniGame", label: "Memory Match", desc: "Lật thẻ, ghi nhớ và ghép từ với hình ảnh", category: "GHI NHỚ", icon: "🧠", color: "#70AF3D", soft: "#EBF8DB" },
  { screen: "wordCatch", label: "Word Catch", desc: "Bắt đúng từ trước khi chúng rơi khỏi bầu trời", category: "PHẢN XẠ", icon: "🎯", color: "#478CCB", soft: "#E1F1FF" },
  { screen: "flappyDragon", label: "Flappy Dragon", desc: "Vỗ cánh bay qua rừng, vượt mỗi cây nhận 1 coin", category: "PHẢN XẠ", icon: "🐉", color: "#E96838", soft: "#FFE8D7" },
  { screen: "englishShop", label: "English Shop", desc: "Đọc danh sách và tìm đúng món đồ trên kệ", category: "ĐỜI SỐNG", icon: "🛒", color: "#E69A16", soft: "#FFF1CF" },
  { screen: "englishHome", label: "English Home", desc: "Khám phá ngôi nhà và đặt đồ vật đúng vị trí", category: "KHÁM PHÁ", icon: "🏡", color: "#8A67CF", soft: "#F0E8FF" },
  { screen: "wordRpg", label: "Word RPG", desc: "Trả lời đúng để tung kỹ năng và đánh bại quái vật", category: "PHIÊU LƯU", icon: "🏰", color: "#6957C8", soft: "#ECE9FF" },
  { screen: "wordTrain", label: "Word Train", desc: "Ghép chữ và câu để đưa đoàn tàu về đích", category: "GHÉP TỪ", icon: "🚂", color: "#3476A9", soft: "#E1F1FA" },
  { screen: "englishDetective", label: "English Detective", desc: "Tìm manh mối, hỏi nghi phạm và phá án", category: "SUY LUẬN", icon: "🔎", color: "#454866", soft: "#E9EAF2" },
  { screen: "echoParrot", label: "Vẹt Con Tập Nói", desc: "Nghe, nói lại và luyện phát âm cùng vẹt con", category: "NGHE & NÓI", icon: "🦜", color: "#E97029", soft: "#FFEAD9" },
  { screen: "chatBuddy", label: "Trò Chuyện Cùng Bạn Thú", desc: "Trả lời pet qua nhiều lượt như đang trò chuyện thật", category: "HỘI THOẠI", icon: "💬", color: "#D9506B", soft: "#FCE4E9" },
  // Moved here from More.tsx on request — these 3 are content the child
  // actually studies/reads, so they belong in "Học tập" (this screen's own
  // name/tab) rather than the account/management grab-bag in More.
  { screen: "story", label: "Đọc truyện", desc: "Truyện tranh song ngữ có âm thanh", category: "ĐỌC HIỂU", icon: "📖", color: "#8A67CF", soft: "#F0E8FF" },
  { screen: "dictionary", label: "Từ điển", desc: "Tra từ bất kỳ, lưu lại để ôn tập sau", category: "TRA CỨU", icon: "📔", color: "#E69A16", soft: "#FFF1CF" },
  { screen: "myContent", label: "Nội dung của tôi", desc: "Tự soạn bài học riêng cho con bạn", category: "PHỤ HUYNH", icon: "✍️", color: "#D9678F", soft: "#FCE6EE" },
];

export default function GameHub({ onNavigate, onOpen }: GameHubProps) {
  const t = useT();
  const featured = TILES[0];

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#EAF8F6]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[230px] bg-[linear-gradient(180deg,#BEEEF2_0%,#EAF8F6_100%)]" />
      <div className="pointer-events-none absolute left-[7%] top-10 text-5xl opacity-70">☁️</div>
      <div className="pointer-events-none absolute right-[9%] top-16 text-4xl opacity-60">☁️</div>

      <main className="relative flex-1 overflow-y-auto px-5.5 pb-5">
        <header className="flex items-end justify-between pb-4 pt-5">
          <div>
            <div className="mb-1 flex items-center gap-2 font-baloo text-[13px] font-extrabold uppercase tracking-[0.14em] text-[#278A8A]">
              <BookOpen size={17} strokeWidth={3} /> {t("Góc khám phá")}
            </div>
            <h1 className="font-baloo text-[30px] font-extrabold leading-none text-[#3F352D]">{t("Học tập")}</h1>
            <p className="mt-2 font-baloo text-[14px] font-semibold text-[#706559]">{t("Hôm nay bạn muốn khám phá điều gì?")}</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border-2 border-white/80 bg-white/75 px-4 py-2 font-baloo text-[13px] font-extrabold text-[#E59A18] shadow-sm sm:flex">
            <Star size={18} fill="#FFD85B" strokeWidth={2.5} /> {t("Mỗi bài học là một chuyến phiêu lưu")}
          </div>
        </header>

        <button
          onClick={() => onOpen(featured.screen)}
          className="group relative mb-5 flex min-h-[150px] w-full overflow-hidden rounded-[32px] border-[3px] border-white bg-[linear-gradient(120deg,#63B947_0%,#8DD05A_56%,#BCE87C_100%)] p-5 text-left shadow-[0_9px_0_#B6D8C6] transition-transform hover:-translate-y-1"
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] bg-[#70B445]/45 [clip-path:ellipse(65%_70%_at_50%_100%)]" />
          <div className="relative z-10 max-w-[62%]">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 font-baloo text-[11px] font-extrabold tracking-wide text-[#4A8E33]">
              <Sparkles size={13} /> {t("GỢI Ý HÔM NAY")}
            </div>
            <h2 className="font-baloo text-[24px] font-extrabold text-white drop-shadow-sm">{t(featured.label)}</h2>
            <p className="mt-1 font-baloo text-[13px] font-semibold leading-snug text-white/90">{t(featured.desc)}</p>
            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#FFF8E9] px-4 py-2 font-baloo text-[13px] font-extrabold text-[#4D8C35] shadow-[0_3px_0_#D7CDAF]">
              {t("Bắt đầu khám phá")} <ArrowRight size={16} strokeWidth={3} />
            </span>
          </div>
          <div className="absolute bottom-1 right-[5%] text-[88px] leading-none drop-shadow-[0_8px_3px_rgba(49,105,44,0.25)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">{featured.icon}</div>
        </button>

        <section className="rounded-[30px] border-[3px] border-white/90 bg-white/55 p-4 shadow-[0_7px_0_#CFE6DF] backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <h2 className="font-baloo text-[20px] font-extrabold text-[#493C32]">{t("Bản đồ học tập")}</h2>
              <p className="font-baloo text-[12px] font-semibold text-[#897A6C]">{t("Chạm vào một khu vực để bắt đầu")}</p>
            </div>
            <span className="rounded-full bg-[#DFF3EE] px-3 py-1 font-baloo text-[11px] font-extrabold text-[#338A78]">{TILES.length - 1} {t("hoạt động")}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TILES.slice(1).map((tile, index) => (
              <button
                key={tile.screen}
                onClick={() => onOpen(tile.screen)}
                className="group relative flex min-h-[112px] items-center gap-3 overflow-hidden rounded-[24px] border-2 border-white bg-white/95 p-3 text-left shadow-[0_5px_0_#DFE8E2] transition-all hover:-translate-y-1 hover:shadow-[0_7px_0_#D5E2DA]"
              >
                <span className="absolute -right-5 -top-7 h-20 w-20 rounded-full opacity-55" style={{ backgroundColor: tile.soft }} />
                <span
                  className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[50%_44%_48%_42%] border-[3px] border-white text-[38px] shadow-[0_4px_0_rgba(70,60,45,0.12)] transition-transform group-hover:rotate-[-4deg] group-hover:scale-105"
                  style={{ backgroundColor: tile.soft }}
                >
                  {tile.icon}
                  <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white font-baloo text-[10px] font-extrabold text-white" style={{ backgroundColor: tile.color }}>{index + 1}</span>
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block font-baloo text-[9px] font-extrabold tracking-[0.12em]" style={{ color: tile.color }}>{t(tile.category)}</span>
                  <span className="mt-0.5 block font-baloo text-[15px] font-extrabold leading-tight text-[#44382F]">{t(tile.label)}</span>
                  <span className="mt-1 line-clamp-2 block font-baloo text-[11px] font-semibold leading-snug text-[#8A7A6A]">{t(tile.desc)}</span>
                </span>
                <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white transition-transform group-hover:translate-x-0.5" style={{ backgroundColor: tile.color }}>
                  <ArrowRight size={15} strokeWidth={3} />
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <div className="relative flex justify-center bg-gradient-to-t from-[#EAF8F6] via-[#EAF8F6] to-transparent px-5.5 py-4">
        <BottomTabs active="Game" onChange={onNavigate} className="w-[560px]" />
      </div>
    </div>
  );
}
