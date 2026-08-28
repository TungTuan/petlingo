import type { FusableRarity, FusionMaterial, PetStatsState } from "../lib/api";
import { useState } from "react";
import PetPortrait from "./PetPortrait";
import { PETS } from "./ui/tokens";

interface FusionPetPickerProps {
  rarity: FusableRarity;
  petCopies: Record<string, number>;
  petEggs: Record<string, number>;
  petStatsById: Record<string, PetStatsState>;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (materials: FusionMaterial[]) => void;
}

export default function FusionPetPicker({ rarity, petCopies, petEggs, petStatsById, busy, onCancel, onConfirm }: FusionPetPickerProps) {
  const [selected, setSelected] = useState<FusionMaterial[]>([]);
  const pets = PETS.filter((pet) => pet.rarity === rarity && (petCopies[pet.id] ?? 0) > 0);
  const materials = pets.flatMap((pet) => [
    { pet, source: "primary" as const, available: 1, level: petStatsById[pet.id]?.level ?? 1 },
    ...((petEggs[pet.id] ?? 0) > 0 ? [{ pet, source: "egg" as const, available: petEggs[pet.id] ?? 0, level: 1 }] : []),
  ]);

  function selectedCount(petKey: string, source: FusionMaterial["source"]) {
    return selected.filter((item) => item.petKey === petKey && item.source === source).length;
  }

  function add(material: FusionMaterial, available: number) {
    if (busy || selected.length >= 3 || selectedCount(material.petKey, material.source) >= available) return;
    setSelected((current) => [...current, material]);
  }

  function remove(material: FusionMaterial) {
    if (busy) return;
    setSelected((current) => {
      const index = current.findLastIndex((item) => item.petKey === material.petKey && item.source === material.source);
      return index < 0 ? current : current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  return (
    <div className="absolute inset-0 z-[110] grid place-items-center bg-[#1B1237]/82 p-5 backdrop-blur-sm">
      <div className="flex max-h-[88%] w-[680px] max-w-[92%] flex-col rounded-[28px] border-4 border-[#E7D8FF] bg-[#FFF9EC] p-5 shadow-[0_10px_0_#7657A6,0_25px_70px_rgba(0,0,0,.38)]">
        <div className="text-center font-baloo text-[26px] font-extrabold text-[#5B3D91]">Chọn 3 pet {rarity}</div>
        <div className="mb-4 text-center font-baloo text-sm font-semibold text-[#806D96]">Chỉ những pet bạn chọn bên dưới mới bị dùng để ghép.</div>
        <div className="grid min-h-0 flex-1 grid-cols-4 gap-3 overflow-y-auto p-1">
          {materials.map(({ pet, source, available, level }) => {
            const picked = selectedCount(pet.id, source);
            const material = { petKey: pet.id, source };
            return (
              <div key={`${pet.id}-${source}`} className="relative flex flex-col items-center rounded-[20px] border-[3px] bg-white p-2" style={{ borderColor: picked ? "#9B72D4" : "#E7D4B2" }}>
                <PetPortrait petId={pet.id} name={pet.name} level={level} motion={false} className="h-[100px] w-[110px]" />
                <div className="font-baloo text-sm font-extrabold text-[#4A3728]">{source === "egg" ? `Trứng ${pet.name}` : `${pet.name} · Lv.${level}`}</div>
                <div className="font-baloo text-[11px] font-bold text-[#88765E]">Có ×{available} · Đã chọn {picked}</div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => remove(material)} disabled={picked === 0 || busy} className="grid h-8 w-8 place-items-center rounded-full bg-[#F2EAFB] font-baloo text-lg font-extrabold text-[#7251A5] disabled:opacity-30">−</button>
                  <button onClick={() => add(material, available)} disabled={selected.length >= 3 || picked >= available || busy} className="grid h-8 w-8 place-items-center rounded-full bg-[#9B72D4] font-baloo text-lg font-extrabold text-white disabled:opacity-30">+</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="font-baloo text-base font-extrabold text-[#7251A5]">Đã chọn: {selected.length}/3</div>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={busy} className="rounded-2xl bg-[#E8DDCC] px-6 py-2.5 font-baloo font-extrabold text-[#6E6047]">Huỷ</button>
            <button onClick={() => onConfirm(selected)} disabled={selected.length !== 3 || busy} className="rounded-2xl bg-[#9B72D4] px-7 py-2.5 font-baloo font-extrabold text-white shadow-[0_4px_0_#704BA8] disabled:opacity-40">{busy ? "Đang ghép…" : "Ghép 3 pet"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
