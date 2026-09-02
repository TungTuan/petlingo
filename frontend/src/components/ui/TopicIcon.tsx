import {
  Apple,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Building2,
  Castle,
  Cat,
  CloudSun,
  Compass,
  GraduationCap,
  HeartPulse,
  Home,
  Languages,
  Leaf,
  Map,
  Music2,
  Palette,
  Plane,
  Rocket,
  School,
  Search,
  ShoppingBasket,
  Sparkles,
  Star,
  TreePine,
  Trophy,
  Waves,
} from "lucide-react";

const RULES: [RegExp, typeof Star][] = [
  [/animal|pet|thú|động vật|cat|dog/i, Cat],
  [/food|fruit|meal|đồ ăn|trái cây|restaurant/i, Apple],
  [/home|house|nhà|family|gia đình/i, Home],
  [/school|lớp|class|study|học/i, School],
  [/forest|nature|rừng|thiên nhiên/i, TreePine],
  [/beach|sea|ocean|biển/i, Waves],
  [/castle|magic|lâu đài|phép thuật/i, Castle],
  [/space|planet|vũ trụ/i, Rocket],
  [/town|city|thành phố/i, Building2],
  [/travel|trip|du lịch/i, Plane],
  [/shop|market|mua sắm/i, ShoppingBasket],
  [/health|body|sức khỏe/i, HeartPulse],
  [/music|song|âm nhạc/i, Music2],
  [/color|art|màu|nghệ thuật/i, Palette],
  [/weather|thời tiết/i, CloudSun],
  [/business|công việc/i, BriefcaseBusiness],
  [/language|word|vocab|từ|english/i, Languages],
  [/story|book|truyện|đọc/i, BookOpen],
  [/quiz|memory|ghi nhớ/i, Brain],
  [/fight|battle|đấu/i, Trophy],
  [/map|world|vùng|khám phá/i, Map],
  [/search|detect|tìm/i, Search],
];

export function TopicIcon({ label, color, size = 44, className = "" }: { label: string; color: string; size?: number; className?: string }) {
  const Icon = RULES.find(([pattern]) => pattern.test(label))?.[1] ?? Compass;
  const iconSize = Math.round(size * 0.5);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[32%] border-2 border-white/80 text-white shadow-[inset_0_-4px_0_rgba(0,0,0,.09),0_3px_0_rgba(64,50,34,.12)] ${className}`}
      style={{ width: size, height: size, backgroundColor: color }}
      aria-hidden="true"
    >
      <Icon size={iconSize} strokeWidth={2.8} />
    </span>
  );
}

export function DecorativeSparkle({ color = "#F2A81C" }: { color?: string }) {
  return <Sparkles size={18} strokeWidth={2.8} style={{ color }} aria-hidden="true" />;
}

export function LearningBadgeIcon() {
  return <GraduationCap size={20} strokeWidth={2.8} aria-hidden="true" />;
}

export function NatureBadgeIcon() {
  return <Leaf size={20} strokeWidth={2.8} aria-hidden="true" />;
}
