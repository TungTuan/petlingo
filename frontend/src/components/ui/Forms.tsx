import type { InputHTMLAttributes, ReactNode } from "react";
import { useT } from "../../lib/i18n";
import { CheckIcon } from "./Button";

export function TextField({ label, className = "", ...rest }: { label: ReactNode; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex flex-col gap-1.5 font-baloo text-[13px] font-bold text-[#8A7A62] ${className}`}>
      {label}
      <input className="rounded-[16px] border-[3px] border-line bg-cream-card px-4 py-3.5 font-baloo text-[17px] font-bold text-ink outline-none focus:border-brand-orange" {...rest} />
    </label>
  );
}

export function AgePicker({
  options = ["4-6", "7-9", "10-12", "13+"],
  value = 1,
  onChange,
}: {
  options?: string[];
  value?: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex gap-2.5">
      {options.map((o, i) => (
        <button
          key={o}
          onClick={() => onChange(i)}
          className={`flex-1 rounded-[16px] border-[3px] py-3.5 font-baloo text-[17px] font-extrabold ${value === i ? "border-brand-orange bg-[#FFF1DE] text-[#C7551A] shadow-[0_4px_0_#F5822B]" : "border-line bg-cream-card text-brand-brown shadow-[0_4px_0_#E7D4B2]"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** Khối thông tin phụ huynh — hiện khi tuổi < 13. */
export function ParentInfoBlock({ consent, onToggleConsent }: { consent: boolean; onToggleConsent: () => void }) {
  const t = useT();
  return (
    <div className="animate-slide-down flex flex-col gap-3 rounded-[20px] border-[3px] border-[#C9E5F7] bg-[#EAF6FF] p-4">
      <div className="flex items-center gap-2 font-baloo text-base font-extrabold text-[#3E7FB0]">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#5C7BC9] font-baloo text-[15px] font-extrabold text-white">!</span>
        {t("Thông tin phụ huynh (bắt buộc)")}
      </div>
      <div className="flex gap-2.5">
        <input placeholder={t("Email bố/mẹ")} className="flex-1 rounded-chip border-[3px] border-[#C9E5F7] bg-white px-3.5 py-3 font-baloo font-semibold outline-none" />
        <input placeholder={t("Số điện thoại")} className="w-[170px] rounded-chip border-[3px] border-[#C9E5F7] bg-white px-3.5 py-3 font-baloo font-semibold outline-none" />
      </div>
      <button onClick={onToggleConsent} className="flex items-start gap-2.5 text-left font-baloo text-[13px] font-semibold leading-snug text-[#5A7080]">
        <span
          className={`grid h-[26px] w-[26px] flex-none place-items-center rounded-[9px] border-[3px] ${consent ? "border-brand-green bg-brand-green" : "border-[#C9E5F7] bg-white"}`}
        >
          {consent && <CheckIcon />}
        </span>
        {t("Tôi là phụ huynh, đồng ý điều khoản và cho phép trẻ dùng app (không quảng cáo, không mua trong app).")}
      </button>
    </div>
  );
}

export function Toggle({ label, on, onChange }: { label: ReactNode; on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="flex items-center justify-between gap-3 text-left font-baloo text-[15px] font-bold text-ink">
      {label}
      <span className={`relative h-8 w-14 flex-none rounded-full transition-colors ${on ? "bg-brand-green" : "bg-[#E4D3BC]"}`}>
        <span className={`absolute top-[3px] h-[26px] w-[26px] rounded-full bg-white shadow transition-[left] ${on ? "left-[27px]" : "left-[3px]"}`} />
      </span>
    </button>
  );
}

export function LanguageTile({
  label,
  native,
  flag,
  active,
  onClick,
}: {
  label: string;
  native: string;
  flag: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-[190px] flex-col items-center gap-2.5 rounded-[26px] border-4 p-5 transition-transform hover:-translate-y-0.5 ${active ? "border-brand-orange bg-[#FFF1DE] shadow-[0_6px_0_#F5822B]" : "border-line bg-cream-card shadow-[0_6px_0_#E7D4B2]"}`}
    >
      <span className="h-[52px] w-[76px] rounded-xl border-[3px] border-black/5" style={{ background: flag }} />
      <span className="font-baloo text-[22px] font-extrabold text-ink">{label}</span>
      <span className="font-baloo text-[13px] font-semibold text-[#8A7A62]">{native}</span>
    </button>
  );
}
