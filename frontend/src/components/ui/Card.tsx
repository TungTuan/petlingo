import type { ReactNode } from "react";
import { CheckIcon, LockIcon, PriceButton } from "./Button";
import { RARITY, petSrc, type PetDef } from "./tokens";

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-card border-[3px] border-line2 bg-white p-[18px] shadow-[0_5px_0_#EADAB8] ${className}`}>{children}</div>;
}

export function PetImage({ id, className = "", animate = false }: { id: string; className?: string; animate?: boolean }) {
  return <img src={petSrc(id)} alt={id} className={`object-contain ${animate ? "animate-bob" : ""} ${className}`} />;
}

export function PetCard({
  pet,
  owned = false,
  locked = false,
  onBuy,
}: {
  pet: PetDef;
  owned?: boolean;
  locked?: boolean;
  onBuy?: () => void;
}) {
  const r = RARITY[pet.rarity];
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-[24px] border-[3px] bg-cream-card p-3 shadow-[0_5px_0_#E3CFA8] transition-transform hover:-translate-y-1 ${owned ? "border-[#CDE7B4]" : "border-[#EBD9B8]"}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-baloo text-lg font-extrabold text-ink">{pet.name}</span>
        <span className="rounded-full px-2.5 py-0.5 font-baloo text-[10.5px] font-bold text-white" style={{ background: r.tint }}>
          {pet.rarity}
        </span>
      </div>
      <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-[18px]" style={{ background: r.slot }}>
        <PetImage id={pet.id} animate={owned} className={`h-[86%] w-[86%] ${owned ? "" : "opacity-80 saturate-50"}`} />
        {owned && (
          <span className="absolute right-2 top-2 grid h-[26px] w-[26px] place-items-center rounded-full bg-brand-green shadow-[0_3px_0_#5C9C31]">
            <CheckIcon />
          </span>
        )}
        {locked && (
          <span className="absolute inset-0 grid place-items-center bg-ink/30">
            <LockIcon size={34} />
          </span>
        )}
      </div>
      <span className="font-baloo text-[11.5px] font-semibold text-[#8A7A62]">{pet.species}</span>
      <PriceButton currency={r.currency} price={r.price} owned={owned} onClick={onBuy} />
    </div>
  );
}

export interface StatBarItem {
  label: string;
  value: string;
  color: string;
}

export function StatBars({ items }: { items: StatBarItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((s) => (
        <div key={s.label} className="flex flex-col gap-1.5">
          <div className="flex justify-between font-baloo text-[13px] font-semibold text-[#6E6047]">
            <span>{s.label}</span>
            <span className="font-extrabold">{s.value}</span>
          </div>
          <div className="h-[13px] overflow-hidden rounded-full bg-[#F1E7D3]">
            <div className="h-full rounded-full transition-[width] duration-300" style={{ width: s.value, background: s.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface QuestListItem {
  label: string;
  done: boolean;
}

export function QuestList({ quests, onToggle }: { quests: QuestListItem[]; onToggle: (i: number) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {quests.map((q, i) => (
        <button key={q.label} onClick={() => onToggle(i)} className="flex items-center gap-3 text-left font-baloo text-[15px] font-semibold">
          <span
            className={`grid h-[27px] w-[27px] flex-none place-items-center rounded-[9px] border-[3px] ${q.done ? "border-brand-green bg-brand-green" : "border-line bg-white"}`}
          >
            {q.done && <CheckIcon />}
          </span>
          <span className={q.done ? "text-[#9AA88F] line-through" : "text-ink"}>{q.label}</span>
        </button>
      ))}
    </div>
  );
}
