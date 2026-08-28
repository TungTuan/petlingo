import type { FusePetsResult } from "../lib/api";
import { PETS, RARITY } from "./ui/tokens";
import PetPortrait from "./PetPortrait";

interface FusionCelebrationProps {
  result: FusePetsResult;
  onClose: () => void;
}

export default function FusionCelebration({ result, onClose }: FusionCelebrationProps) {
  const pet = PETS.find((entry) => entry.id === result.petKey);
  const name = pet?.name ?? result.petKey;
  const rarity = result.outputRarity;
  const color = RARITY[rarity].tint;

  return (
    <div className="absolute inset-0 z-[120] grid place-items-center overflow-hidden bg-[#160D36]/90 p-6 backdrop-blur-md">
      <div className="evolution-rays absolute h-[600px] w-[600px] rounded-full" />
      <div className="max-level-burst absolute h-[500px] w-[500px] rounded-full" />
      {Array.from({ length: 28 }, (_, index) => (
        <span
          key={index}
          className="evolution-spark absolute text-3xl"
          style={{ left: `${7 + ((index * 23) % 87)}%`, top: `${7 + ((index * 29) % 82)}%`, animationDelay: `${(index % 7) * 0.11}s`, color }}
        >
          {index % 3 === 0 ? "✦" : index % 3 === 1 ? "★" : "◆"}
        </span>
      ))}

      <div className="relative flex max-h-[92%] w-[560px] max-w-[90%] flex-col items-center rounded-[30px] border-4 border-[#FFE88A] bg-[linear-gradient(180deg,#FFF8D8_0%,#F4E5FF_100%)] px-7 py-5 text-center shadow-[0_9px_0_#B78D34,0_22px_60px_rgba(0,0,0,.45)]">
        <div className="font-baloo text-sm font-extrabold uppercase tracking-[.2em] text-[#8B63C8]">★ Fusion Success ★</div>
        <div className="font-baloo text-[32px] font-extrabold leading-tight text-[#5B3D91]">Chúc mừng!</div>
        <div className="font-baloo text-base font-bold text-[#76569E]">Bạn đã nhận được trứng {rarity}</div>

        <div className="relative grid h-[235px] w-[340px] max-w-full place-items-center">
          <span className="evolution-ring absolute h-[190px] w-[190px] rounded-full border-[6px]" style={{ borderColor: color }} />
          <span className="max-level-ring absolute h-[225px] w-[225px] rounded-full" />
          <span className="max-level-crown absolute -top-1 z-20 text-5xl">♛</span>
          <PetPortrait petId={result.petKey} name={name} level={30} mood="happy" animated className="evolution-pet relative z-10 h-[225px] w-[290px] object-contain" />
        </div>

        <div className="flex items-center gap-2 rounded-full bg-white px-5 py-2 font-baloo text-sm font-extrabold shadow-[0_4px_0_#DDCFF3]" style={{ color }}>
          <span>{name}</span>
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span>{rarity}</span>
          <span className="rounded-full bg-[#FFF4C9] px-3 py-1 text-[#B27B10]">MAX LV Preview</span>
        </div>
        <div className="mt-2 font-baloo text-xs font-semibold text-[#89779F]">Pet trong kho vẫn bắt đầu từ trứng · Level 1</div>

        <button onClick={onClose} className="mt-3 rounded-[18px] bg-[#7CC24A] px-10 py-2.5 font-baloo text-base font-extrabold text-white shadow-[0_5px_0_#4F9228] transition-transform active:translate-y-1 active:shadow-[0_2px_0_#4F9228]">
          Nhận pet!
        </button>
      </div>
    </div>
  );
}
