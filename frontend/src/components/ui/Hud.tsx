import type { ReactNode } from "react";
import { useT } from "../../lib/i18n";
import { CoinIcon, GearIcon, GemIcon, HeartIcon, StarIcon } from "./Button";

type ChipKind = "coin" | "gem" | "heart" | "star";

export function CurrencyChip({ kind = "coin", value, className = "" }: { kind?: ChipKind; value: ReactNode; className?: string }) {
  const map: Record<ChipKind, { icon: ReactNode; color: string }> = {
    coin: { icon: <CoinIcon />, color: "text-[#B07A0C]" },
    gem: { icon: <GemIcon />, color: "text-[#2F8C8C]" },
    heart: { icon: <HeartIcon />, color: "text-[#C7455B]" },
    star: { icon: <StarIcon />, color: "text-[#D9930A]" },
  };
  const m = map[kind];
  return (
    <div className={`flex items-center gap-2 rounded-full bg-white px-4 py-2 font-baloo text-base font-extrabold shadow-[0_3px_0_rgba(0,0,0,.12)] ${m.color} ${className}`}>
      {m.icon}
      {value}
    </div>
  );
}

export function HudBar({
  name,
  level,
  hp = "80/100",
  coins,
  gems,
  onSettings,
  className = "",
}: {
  name: string;
  level: number;
  hp?: string;
  coins: number;
  gems: number;
  onSettings?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-[20px] bg-[#79C6EF] p-4 ${className}`}>
      <div className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-4 shadow-[0_3px_0_rgba(0,0,0,.12)]">
        <span className="h-[38px] w-[38px] rounded-full border-2 border-line bg-cream-deep" />
        <span className="font-baloo text-[17px] font-extrabold text-ink">{name}</span>
        <span className="flex items-center gap-1 font-baloo text-[15px] font-extrabold text-[#D9930A]">
          <StarIcon size={17} />
          {level}
        </span>
      </div>
      <div className="flex-1" />
      <CurrencyChip kind="heart" value={hp} />
      <CurrencyChip kind="coin" value={coins} />
      <CurrencyChip kind="gem" value={gems} />
      <button onClick={onSettings} className="grid h-11 w-11 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_3px_0_rgba(0,0,0,.22)]">
        <GearIcon />
      </button>
    </div>
  );
}

export const HeartRow = ({ total = 3, left = 3 }: { total?: number; left?: number }) => (
  <div className="flex gap-2">
    {Array.from({ length: total }, (_, i) => (
      <HeartIcon key={i} size={30} filled={i < left} />
    ))}
  </div>
);

export function XpBar({ level, value, max, className = "" }: { level: number; value: number; max: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between font-baloo text-xs font-bold text-[#8A7A62]">
        <span>LV.{level}</span>
        <span>
          {value}/{max} XP
        </span>
      </div>
      <div className="h-4 overflow-hidden rounded-full border-2 border-[#E1CFAE] bg-[#EFE3CC]">
        <div className="h-full rounded-full bg-[#EF6A5A] shadow-[inset_0_3px_0_rgba(255,255,255,.35)]" style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

export const Streak = ({ days }: { days: number }) => {
  const t = useT();
  return (
    <div className="flex items-center gap-2 rounded-full border-[3px] border-[#FFD9A6] bg-[#FFF1DE] px-4 py-1.5 font-baloo text-base font-extrabold text-[#C7551A]">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#F5822B">
        <path d="M12 2c2.5 4 6 5.6 6 10a6 6 0 01-12 0c0-2.4 1.6-3.6 3-6 .6 1.4 1.6 2 3 2.4-.6-2.4-1-4.4 0-6.4z" />
      </svg>
      {days} {t("ngày")}
    </div>
  );
};

/** Số bay lên khi cộng coin/XP. Đổi `k` (key) mỗi lần trigger. */
export const FloatingGain = ({ k, text }: { k: number | string; text: string }) => (
  <span key={k} className="animate-float-up pointer-events-none absolute -top-1 right-4 font-baloo text-[17px] font-extrabold text-[#D9930A]">
    {text}
  </span>
);
