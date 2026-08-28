import type { ReactNode } from "react";
import { BackIcon } from "./Button";

export interface TabDef {
  label: string;
  color: string;
  square?: boolean;
  icon?: ReactNode;
}

export function TabBar({ tabs, active = 0, onChange, className = "" }: { tabs: TabDef[]; active?: number; onChange: (i: number) => void; className?: string }) {
  return (
    <nav aria-label="Main navigation" className={`relative flex items-center gap-1.5 rounded-[27px] border-2 border-white/20 bg-[linear-gradient(180deg,rgba(47,87,134,.97),rgba(18,48,82,.98))] p-2 shadow-[inset_0_2px_0_rgba(255,255,255,.2),0_7px_0_rgba(15,38,65,.3),0_14px_30px_rgba(20,48,75,.22)] backdrop-blur-xl ${className}`}>
      {tabs.map((t, i) => {
        const on = active === i;
        return (
          <button
            key={t.label}
            onClick={() => onChange(i)}
            type="button"
            aria-label={t.label}
            aria-current={on ? "page" : undefined}
            className={`group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-1.5 py-1.5 transition-all duration-200 active:scale-95 ${on ? "bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_4px_12px_rgba(7,30,55,.18)] ring-1 ring-white/15" : "hover:bg-white/[.07]"}`}
          >
            <span
              aria-hidden="true"
              className={`grid h-11 w-11 place-items-center rounded-[15px] border transition-all duration-200 ${on ? "scale-105 border-white/50 text-white" : "border-white/10 bg-white/[.07] text-white/75 group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white"}`}
              style={on ? { backgroundColor: t.color, boxShadow: `inset 0 1px 0 rgba(255,255,255,.35), 0 5px 14px ${t.color}55` } : undefined}
            >
              {t.icon ?? <span className="h-6 w-6 rounded-lg" style={{ backgroundColor: t.color }} />}
            </span>
            <span className={`font-baloo truncate text-[11px] font-bold leading-none tracking-wide transition-colors sm:text-xs ${on ? "text-white" : "text-white/70 group-hover:text-white/90"}`}>{t.label}</span>
            <span aria-hidden="true" className={`absolute bottom-0 h-1 rounded-full transition-all duration-200 ${on ? "w-6 opacity-100" : "w-0 opacity-0"}`} style={{ backgroundColor: t.color }} />
          </button>
        );
      })}
    </nav>
  );
}

export function SegmentedTabs({ options, active = 0, onChange, className = "" }: { options: string[]; active?: number; onChange: (i: number) => void; className?: string }) {
  return (
    <div className={`flex gap-0.5 rounded-chip bg-[#F1E7D3] p-1 ${className}`}>
      {options.map((o, i) => (
        <button
          key={o}
          onClick={() => onChange(i)}
          className={`rounded-[11px] px-5 py-2.5 font-baloo text-[15px] font-bold ${active === i ? "bg-[#5C7BC9] text-white" : "text-[#8A7A62]"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export interface CategoryItem {
  label: string;
  color: string;
}

export function CategoryRail({ items, active = 0, onChange, className = "" }: { items: CategoryItem[]; active?: number; onChange: (i: number) => void; className?: string }) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {items.map((it, i) => {
        const on = active === i;
        return (
          <button
            key={it.label}
            onClick={() => onChange(i)}
            className={`flex min-w-[160px] items-center gap-2.5 rounded-[18px] border-[3px] px-4 py-3 font-baloo text-base font-bold ${on ? "border-press-orange bg-brand-orange text-white shadow-[0_4px_0_#C9631A]" : "border-line bg-cream-card text-brand-brown shadow-[0_4px_0_#E7D4B2]"}`}
          >
            <span className="h-[26px] w-[26px] rounded-[9px]" style={{ background: on ? "#fff" : it.color }} />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export const BackButton = ({ onClick, className = "" }: { onClick?: () => void; className?: string }) => (
  <button
    onClick={onClick}
    className={`grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_#43609F] ${className}`}
  >
    <BackIcon />
  </button>
);
