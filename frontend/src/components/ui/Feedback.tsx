import type { ReactNode } from "react";
import { useT } from "../../lib/i18n";
import { ChunkyButton, CoinIcon, SoftButton, StarIcon } from "./Button";

export function SpeechBubble({ children, tail = "bottom", className = "" }: { children: ReactNode; tail?: "bottom" | "left"; className?: string }) {
  return (
    <div className={`relative rounded-[22px] border-[3px] border-line bg-white px-6 py-3 font-baloo text-lg font-bold text-ink shadow-[0_4px_0_#E7D4B2] ${className}`}>
      {children}
      <span
        className={`absolute h-[18px] w-[18px] rotate-45 bg-white ${tail === "bottom" ? "bottom-[-12px] left-8 border-b-[3px] border-r-[3px]" : "left-[-11px] top-9 border-b-[3px] border-l-[3px]"} border-line`}
      />
    </div>
  );
}

export function Toast({ tone = "success", children }: { tone?: "success" | "error" | "dark"; children: ReactNode }) {
  const skin = {
    success: "bg-[#EEF9E3] border-[#CDE7B4] text-[#4F7C2A]",
    error: "bg-[#FDE7E4] border-[#F6C3BB] text-[#B3402F]",
    dark: "bg-ink border-ink text-white",
  }[tone];
  return <div className={`animate-pop rounded-[18px] border-[3px] px-6 py-3 font-baloo text-base font-extrabold ${skin}`}>{children}</div>;
}

export function RewardModal({
  coins = 50,
  xp = 30,
  score,
  onContinue,
  children,
}: {
  coins?: number;
  xp?: number;
  score?: string;
  onContinue: () => void;
  children?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-ink/40">
      <div className="animate-pop flex w-[92%] max-w-[620px] flex-col items-center gap-4 rounded-[30px] border-4 border-line2 bg-cream-card p-8 shadow-[0_14px_40px_rgba(0,0,0,.24)]">
        <div className="font-baloo text-3xl font-extrabold text-[#C7551A]">{t("Hoàn thành!")}</div>
        <div className="grid h-[120px] w-[120px] place-items-center rounded-full bg-[#FFF3D6]">
          <StarIcon size={72} />
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-baloo font-extrabold text-[#B07A0C]">
            <CoinIcon />+{coins}
          </span>
          <span className="rounded-full bg-white px-4 py-2 font-baloo font-extrabold text-[#4F7C2A]">+{xp} XP</span>
          {score && <span className="rounded-full bg-white px-4 py-2 font-baloo font-extrabold text-[#3E7FB0]">{score}</span>}
        </div>
        {children}
        <ChunkyButton tone="green" className="w-full" onClick={onContinue}>
          {t("Tiếp tục")}
        </ChunkyButton>
      </div>
    </div>
  );
}

/** Cổng phụ huynh: bắt giải phép tính trước khi vào khu quản lý. */
export function ParentGate({ question = "7 × 3", onCancel, onConfirm }: { question?: string; onCancel: () => void; onConfirm: () => void }) {
  const t = useT();
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-ink/30">
      <div className="flex w-[360px] flex-col gap-3 rounded-card border-[3px] border-line2 bg-white p-6 shadow-[0_8px_24px_rgba(74,55,40,.2)]">
        <div className="font-baloo text-xl font-extrabold text-ink">{t("Xác nhận phụ huynh")}</div>
        <div className="font-baloo text-sm font-semibold text-[#6E6047]">
          {t("Nhập kết quả:")} <b>{question}</b> {t("để tiếp tục.")}
        </div>
        <input placeholder={t("Nhập số")} className="w-full rounded-chip border-[3px] border-line bg-cream-card px-4 py-3 font-baloo text-base font-bold text-ink outline-none" />
        <div className="flex gap-3">
          <SoftButton className="flex-1" onClick={onCancel}>
            {t("Huỷ")}
          </SoftButton>
          <ChunkyButton className="flex-1" onClick={onConfirm}>
            {t("Xác nhận")}
          </ChunkyButton>
        </div>
      </div>
    </div>
  );
}
