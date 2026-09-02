import type { CSSProperties } from "react";
import { Bird, PawPrint, Sparkles } from "lucide-react";
import { BackIcon } from "../components/ui";
import PetPortrait from "../components/PetPortrait";
import { FLYING_PET_IDS, PETS } from "../components/ui/tokens";
import type { PetStatsState } from "../lib/api";
import { useT } from "../lib/i18n";

interface PetRanchProps {
  owned: string[];
  petCopies: Record<string, number>;
  petStatsById: Record<string, PetStatsState>;
  activePetId: string;
  onSelectActive: (id: string) => Promise<unknown>;
  onExit: () => void;
}

type RanchStyle = CSSProperties & { "--ranch-delay": string; "--ranch-duration": string; "--ranch-distance": string };

export default function PetRanch({ owned, petCopies, petStatsById, activePetId, onSelectActive, onExit }: PetRanchProps) {
  const t = useT();
  const residents = owned.flatMap((petId) => Array.from({ length: Math.max(1, petCopies[petId] ?? 1) }, (_, copyIndex) => ({ petId, copyIndex })));
  const total = residents.length;
  const size = total <= 10 ? 84 : total <= 24 ? 66 : total <= 44 ? 54 : 44;

  return (
    <div className="relative h-full overflow-hidden bg-[#9bd970]">
      <img src="/backgrounds/pet-ranch-v1.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(30,92,117,.12),transparent_28%,rgba(48,91,28,.08))]" />
      <header className="absolute inset-x-0 top-0 z-30 flex items-center gap-3 p-4">
        <button onClick={onExit} className="grid h-12 w-12 place-items-center rounded-full border-2 border-white/80 bg-[#5C7BC9] shadow-[0_4px_0_#43609F]"><BackIcon /></button>
        <div className="rounded-[22px] border-2 border-white/80 bg-white/88 px-5 py-2 shadow-[0_5px_0_rgba(85,113,52,.24)] backdrop-blur-md">
          <div className="flex items-center gap-2 font-baloo text-[22px] font-extrabold leading-none text-[#4C3B2B]"><PawPrint size={22} className="text-[#E77849]" /> {t("Nông trại Pet")}</div>
          <div className="mt-1 font-baloo text-[11px] font-bold text-[#75805D]">{t("Chạm vào một bạn thú để chọn làm bạn đồng hành")}</div>
        </div>
        <div className="ml-auto flex gap-2">
          <div className="flex items-center gap-2 rounded-full border-2 border-white/80 bg-white/88 px-4 py-2 font-baloo text-[13px] font-extrabold text-[#558341] shadow-sm backdrop-blur-md"><PawPrint size={17} /> {total} {t("pet")}</div>
          <div className="flex items-center gap-2 rounded-full border-2 border-white/80 bg-white/88 px-4 py-2 font-baloo text-[13px] font-extrabold text-[#4A88A1] shadow-sm backdrop-blur-md"><Bird size={17} /> {residents.filter(({ petId }) => FLYING_PET_IDS.has(petId)).length} {t("biết bay")}</div>
        </div>
      </header>
      <div className="absolute inset-x-[5%] bottom-[7%] top-[20%] z-10">
        {residents.map(({ petId, copyIndex }, index) => {
          const pet = PETS.find((entry) => entry.id === petId);
          if (!pet) return null;
          const flying = FLYING_PET_IDS.has(petId);
          const columns = Math.max(5, Math.ceil(Math.sqrt(Math.max(total, 1) * 1.75)));
          const row = Math.floor(index / columns);
          const col = index % columns;
          const rows = Math.max(1, Math.ceil(total / columns));
          const x = 4 + (col / Math.max(1, columns - 1)) * 88 + (row % 2) * 2.5;
          const y = flying ? 4 + ((index * 19) % 38) : 40 + (row / Math.max(1, rows - 1)) * 50;
          const style: RanchStyle = { left: `${Math.min(93, x)}%`, top: `${y}%`, width: size, height: size, "--ranch-delay": `${-(index * .83)}s`, "--ranch-duration": `${flying ? 6.5 + index % 4 : 8.5 + index % 5}s`, "--ranch-distance": `${18 + index % 4 * 7}px`, zIndex: flying ? 20 + row : 50 + row };
          const name = petStatsById[petId]?.customName || pet.name;
          return (
            <button key={`${petId}-${copyIndex}`} style={style} onClick={() => void onSelectActive(petId)} className={`ranch-pet absolute -translate-x-1/2 -translate-y-1/2 ${flying ? "ranch-pet-flying" : "ranch-pet-walking"}`} aria-label={`${t("Chọn")} ${name}`}>
              {petId === activePetId && copyIndex === 0 && <Sparkles className="absolute -right-1 -top-2 z-20 text-[#FFD85A] drop-shadow-md" size={22} fill="currentColor" />}
              <span className="ranch-pet-shadow absolute bottom-[4%] left-[14%] h-[13%] w-[72%] rounded-full bg-[#355523]/25 blur-[1px]" />
              <PetPortrait petId={petId} name={name} level={petStatsById[petId]?.level ?? 1} animated mediaAnimated className="relative z-10 h-full w-full drop-shadow-[0_4px_3px_rgba(54,61,27,.25)]" />
              <span className={`absolute -bottom-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/80 px-2 py-0.5 font-baloo text-[9px] font-extrabold shadow-sm ${petId === activePetId && copyIndex === 0 ? "bg-[#FFCF4B] text-[#68450A]" : "bg-white/86 text-[#5B4938]"}`}>{name}{copyIndex > 0 ? ` · ${copyIndex + 1}` : ""}</span>
            </button>
          );
        })}
      </div>
      {total === 0 && <div className="absolute inset-0 z-20 grid place-items-center"><div className="rounded-3xl bg-white/90 px-8 py-5 text-center font-baloo font-extrabold text-[#5B4938] shadow-xl">{t("Nông trại đang chờ những người bạn đầu tiên!")}</div></div>}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/70 bg-[#31542D]/72 px-4 py-1.5 font-baloo text-[10px] font-bold text-white backdrop-blur-sm">{t("Pet có cánh sẽ bay · Pet mặt đất sẽ dạo chơi")}</div>
    </div>
  );
}
