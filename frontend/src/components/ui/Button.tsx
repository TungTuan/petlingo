import type { ButtonHTMLAttributes } from "react";
import { useT } from "../../lib/i18n";

type Tone = "orange" | "green" | "blue" | "purple";

const TONE: Record<Tone, string> = {
  orange: "bg-brand-orange shadow-[0_5px_0_#C9631A] active:shadow-[0_1px_0_#C9631A]",
  green: "bg-brand-green shadow-[0_5px_0_#5C9C31] active:shadow-[0_1px_0_#5C9C31]",
  blue: "bg-brand-blue shadow-[0_5px_0_#43609F] active:shadow-[0_1px_0_#43609F]",
  purple: "bg-brand-purple shadow-[0_5px_0_#7A5EBC] active:shadow-[0_1px_0_#7A5EBC]",
};

interface ChunkyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  shine?: boolean;
}

/** Nút chính, có hiệu ứng lún khi nhấn. */
export function ChunkyButton({ tone = "orange", shine = false, disabled, className = "", children, ...rest }: ChunkyButtonProps) {
  return (
    <button
      disabled={disabled}
      className={[
        "relative overflow-hidden rounded-[18px] px-8 py-3.5 font-baloo text-[17px] font-extrabold text-white",
        "transition-transform active:translate-y-1 disabled:cursor-not-allowed",
        disabled ? "bg-[#E9DFCB] text-[#B3A691] shadow-none" : TONE[tone],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
      {shine && !disabled && (
        <span className="animate-shine pointer-events-none absolute left-0 top-0 h-full w-9 bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      )}
    </button>
  );
}

export function SoftButton({ className = "", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-[18px] border-[3px] border-line bg-cream-card px-6 py-2.5 font-baloo text-base font-bold text-brand-brown shadow-[0_4px_0_#E7D4B2] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_#E7D4B2] ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  size?: number;
}

export function IconButton({ tone = "blue", size = 52, className = "", children, ...rest }: IconButtonProps) {
  return (
    <button
      style={{ width: size, height: size }}
      className={`grid place-items-center rounded-2xl transition-transform active:translate-y-1 ${TONE[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

interface PriceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  currency?: "coin" | "gem";
  price: number;
  owned?: boolean;
}

/** Nút giá: coin (vàng), gem (hồng), free (xanh). */
export function PriceButton({ currency = "coin", price, owned = false, className = "", ...rest }: PriceButtonProps) {
  const t = useT();
  const skin = owned
    ? "bg-brand-green text-white shadow-[0_4px_0_#5C9C31]"
    : currency === "gem"
      ? "bg-[#FBC6D4] text-[#8E3B55] shadow-[0_4px_0_#E293A9]"
      : "bg-[#FFD75E] text-[#7A5410] shadow-[0_4px_0_#D9A517]";
  return (
    <button
      className={`flex w-full items-center justify-center gap-2 rounded-[15px] py-2.5 font-baloo text-[17px] font-extrabold transition-transform active:translate-y-[3px] ${skin} ${className}`}
      {...rest}
    >
      {!owned && (currency === "gem" ? <GemIcon /> : <CoinIcon />)}
      {owned ? t("Đang dùng") : price === 0 ? "Free" : price}
    </button>
  );
}

export const CoinIcon = ({ size = 19 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#F2A81C" />
    <circle cx="12" cy="12" r="6.6" fill="#FFE08A" />
  </svg>
);
export const GemIcon = ({ size = 19 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <polygon points="12,3 20,10 12,21 4,10" fill="#57C6C6" />
    <polygon points="12,3 16,10 12,21" fill="#8FE3E3" />
  </svg>
);
export const HeartIcon = ({ size = 19, filled = true }: { size?: number; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#EF6A5A" : "#E4D3BC"}>
    <path d="M12 21s-8-5.1-8-10.2A4.8 4.8 0 0112 8a4.8 4.8 0 018 2.8C20 15.9 12 21 12 21z" />
  </svg>
);
export const StarIcon = ({ size = 19, color = "#FFC93C" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <polygon points="12,3 14.7,9.2 21.4,9.8 16.4,14.2 17.9,20.8 12,17.3 6.1,20.8 7.6,14.2 2.6,9.8 9.3,9.2" />
  </svg>
);
export const GearIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
    <circle cx="12" cy="12" r="3.4" />
    <circle cx="12" cy="12" r="8.6" strokeDasharray="2.6 3.4" />
  </svg>
);
export const BackIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 6l-6 6 6 6" />
  </svg>
);
export const CheckIcon = ({ size = 15, color = "#fff" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4.5 4.5L19 7" />
  </svg>
);
export const LockIcon = ({ size = 18, color = "#fff" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <rect x="5" y="10" width="14" height="10" rx="2.5" />
    <path d="M8 10V8a4 4 0 018 0v2" stroke={color} strokeWidth="2.4" fill="none" />
  </svg>
);
export const SpeakerIcon = ({ size = 24, color = "#fff" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M4 9h3l5-4v14l-5-4H4z" />
    <path d="M17 8a5 5 0 010 8" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
  </svg>
);
