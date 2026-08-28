import PetPortrait from "./PetPortrait";
import { getPetEvolutionStage } from "../lib/petEvolution";

interface PetEvolutionCelebrationProps {
  petId: string;
  petName: string;
  fromLevel: number;
  toLevel: number;
  onClose: () => void;
}

const STAGE_NAME = { egg: "Trứng", mini: "Pet mini", medium: "Pet trung bình", large: "Pet lớn" } as const;

export default function PetEvolutionCelebration({ petId, petName, fromLevel, toLevel, onClose }: PetEvolutionCelebrationProps) {
  const stage = getPetEvolutionStage(toLevel);
  const isMaxLevel = toLevel >= 30;
  return (
    <div className={`absolute inset-0 z-[100] grid place-items-center overflow-hidden backdrop-blur-md ${isMaxLevel ? "bg-[#130B35]/92" : "bg-[#17295A]/88"}`}>
      <div className="evolution-rays absolute h-[760px] w-[760px] rounded-full" />
      {isMaxLevel && <div className="max-level-burst absolute h-[650px] w-[650px] rounded-full" />}
      {Array.from({ length: isMaxLevel ? 30 : 18 }, (_, i) => (
        <span key={i} className={`evolution-spark absolute ${isMaxLevel ? "text-3xl" : "text-2xl"}`} style={{ left: `${8 + ((i * 19) % 84)}%`, top: `${8 + ((i * 31) % 76)}%`, animationDelay: `${(i % 6) * 0.13}s` }}>
          {i % 3 === 0 ? "✦" : i % 3 === 1 ? "★" : "◆"}
        </span>
      ))}
      <div className={`relative flex w-[760px] flex-col items-center rounded-[38px] border-4 px-12 py-8 shadow-[0_12px_0_#B78D34,0_28px_80px_rgba(0,0,0,.4)] ${isMaxLevel ? "border-[#FFD75E] bg-[linear-gradient(180deg,#FFF5B8,#F2D9FF)]" : "border-[#FFE88A] bg-[linear-gradient(180deg,#FFF8D8,#F5E7FF)]"}`}>
        <div className="font-baloo text-[19px] font-extrabold uppercase tracking-[.2em] text-[#8B63C8]">{isMaxLevel ? "★ Max Level Unlocked ★" : "Pet Evolution"}</div>
        <div className="font-baloo text-[38px] font-extrabold text-[#5B3D91]">{isMaxLevel ? `${petName} đã đạt sức mạnh tối đa!` : `${petName} đã biến hình!`}</div>
        <div className="relative my-2 grid h-[292px] w-[430px] place-items-center">
          <span className="evolution-ring absolute h-[260px] w-[260px] rounded-full border-[7px] border-[#FFD75E]" />
          {isMaxLevel && <><span className="max-level-ring absolute h-[300px] w-[300px] rounded-full" /><span className="max-level-crown absolute -top-2 z-20 text-6xl">♛</span></>}
          <PetPortrait petId={petId} name={petName} level={toLevel} mood="happy" className={`evolution-pet relative z-10 object-contain ${stage === "large" ? "h-[290px] w-[360px]" : "h-[250px] w-[320px]"}`} />
        </div>
        <div className="flex items-center gap-4 rounded-full bg-white px-7 py-2.5 font-baloo text-lg font-extrabold text-[#7155B5] shadow-[0_4px_0_#DDCFF3]">
          <span>Cấp {fromLevel}</span><span className="text-2xl text-[#F2A81C]">➜</span><span>Cấp {toLevel}</span><span className="rounded-full bg-[#F3EDFF] px-4 py-1">{isMaxLevel ? "MAX · Pet lớn" : STAGE_NAME[stage]}</span>
        </div>
        <button onClick={onClose} className="mt-5 rounded-[20px] bg-[#7CC24A] px-12 py-3.5 font-baloo text-xl font-extrabold text-white shadow-[0_6px_0_#4F9228] transition-transform active:translate-y-1 active:shadow-[0_2px_0_#4F9228]">
          Tuyệt vời!
        </button>
      </div>
    </div>
  );
}
