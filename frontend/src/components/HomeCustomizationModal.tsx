import { Check, CloudRain, LockKeyhole, Palette, Snowflake, X } from "lucide-react";
import type { ReactNode } from "react";
import type { InventoryEntry } from "../lib/api";
import { HOME_BACKGROUNDS, type HomeBackgroundId, type HomeCustomization, type HomeWeatherMode } from "../lib/homeCustomization";
import { CoinIcon, GemIcon } from "./ui";

interface Props {
  value: HomeCustomization;
  coins: number;
  gems: number;
  shopItems: InventoryEntry[];
  ownedItemKeys: Set<string>;
  busyItemKey: string | null;
  onChange: (value: HomeCustomization) => void;
  onPurchase: (item: InventoryEntry) => Promise<void>;
  onClose: () => void;
}

export default function HomeCustomizationModal({ value, coins, gems, shopItems, ownedItemKeys, busyItemKey, onChange, onPurchase, onClose }: Props) {
  const shopByKey = new Map(shopItems.map((entry) => [entry.item.key, entry]));

  const selectBackground = (id: HomeBackgroundId, itemKey: string | null) => {
    if (itemKey && !ownedItemKeys.has(itemKey)) return;
    onChange({ ...value, backgroundId: id });
  };

  return (
    <div className="absolute inset-0 z-[80] grid place-items-center bg-[#17324A]/55 p-5 backdrop-blur-[3px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex max-h-[90%] w-[780px] flex-col overflow-hidden rounded-[30px] border-4 border-white bg-[#FFF9EC] shadow-[0_10px_0_#B88B55,0_24px_60px_rgba(21,46,68,.35)]">
        <header className="flex items-center gap-3 bg-[linear-gradient(135deg,#F5822B,#F4B23E)] px-5 py-4 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/22"><Palette size={29} strokeWidth={2.7} /></span>
          <div className="flex-1">
            <h2 className="font-baloo text-[24px] font-extrabold leading-tight">Sơn lại thế giới của pet</h2>
            <p className="font-baloo text-sm font-semibold text-white/90">Chọn khung cảnh, thời gian và thời tiết yêu thích</p>
          </div>
          <div className="flex gap-2 font-baloo text-sm font-extrabold">
            <span className="flex items-center gap-1.5 rounded-full bg-[#123E6A]/75 px-3 py-2"><CoinIcon size={17} />{coins}</span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#123E6A]/75 px-3 py-2"><GemIcon size={17} />{gems}</span>
          </div>
          <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/20 transition-transform hover:rotate-6 active:scale-90" aria-label="Đóng"><X size={26} /></button>
        </header>

        <div className="overflow-y-auto p-5">
          <h3 className="mb-3 font-baloo text-lg font-extrabold text-[#4A3728]">Phông nền</h3>
          <div className="grid grid-cols-4 gap-3">
            {HOME_BACKGROUNDS.map((bg) => {
              const entry = bg.itemKey ? shopByKey.get(bg.itemKey) : null;
              const owned = !bg.itemKey || ownedItemKeys.has(bg.itemKey);
              const selected = value.backgroundId === bg.id;
              return (
                <article key={bg.id} className={`overflow-hidden rounded-[20px] border-[3px] bg-white shadow-[0_4px_0_#DFCBA7] transition-transform ${selected ? "border-[#F5822B] -translate-y-1" : "border-[#E8D9BD]"}`}>
                  <button onClick={() => selectBackground(bg.id, bg.itemKey)} className="relative block h-[92px] w-full overflow-hidden text-left">
                    <span className={`absolute inset-0 bg-cover bg-center ${bg.previewClass}`} />
                    <span className="absolute inset-0" style={{ background: bg.overlay }} />
                    <span className="absolute left-2 top-2 text-2xl drop-shadow">{bg.icon}</span>
                    {selected && <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[#7CC24A] text-white shadow"><Check size={18} strokeWidth={3.5} /></span>}
                    {!owned && <span className="absolute inset-0 grid place-items-center bg-[#26364D]/36 text-white"><LockKeyhole size={28} /></span>}
                  </button>
                  <div className="p-2.5">
                    <div className="truncate font-baloo text-sm font-extrabold text-[#4A3728]">{bg.name}</div>
                    <div className="truncate font-baloo text-[10px] font-semibold text-[#8A7A62]">{bg.description}</div>
                    {!owned && entry && (
                      <button disabled={busyItemKey !== null} onClick={() => void onPurchase(entry)} className={`mt-2 flex w-full items-center justify-center gap-1 rounded-xl py-1.5 font-baloo text-xs font-extrabold disabled:opacity-55 ${entry.item.currency === "gem" ? "bg-[#E4D7FF] text-[#6945A2]" : "bg-[#FFE18A] text-[#7A5410]"}`}>
                        {entry.item.currency === "gem" ? <GemIcon size={14} /> : <CoinIcon size={14} />}{busyItemKey === entry.item.key ? "..." : entry.item.price}
                      </button>
                    )}
                    {!owned && !entry && <div className="mt-2 rounded-xl bg-[#EEE7DA] py-1.5 text-center font-baloo text-[10px] font-bold text-[#8A7A62]">Đang tải...</div>}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5">
            <OptionGroup title="Hiệu ứng thời tiết · bấm lại để tắt" options={[{ id: "rain", label: "Mưa gió", icon: <CloudRain size={22} /> }, { id: "snow", label: "Tuyết rơi", icon: <Snowflake size={22} /> }]} value={value.weather} onChange={(weather) => onChange({ ...value, weather: value.weather === weather ? "none" : weather as HomeWeatherMode })} />
          </div>
        </div>
      </section>
    </div>
  );
}

function OptionGroup({ title, options, value, onChange }: { title: string; options: { id: string; label: string; icon: ReactNode }[]; value: string; onChange: (id: string) => void }) {
  return <div className="rounded-[20px] border-2 border-[#E8D9BD] bg-white p-3.5"><div className="mb-2.5 font-baloo text-base font-extrabold text-[#4A3728]">{title}</div><div className="flex gap-2">{options.map((option) => <button key={option.id} onClick={() => onChange(option.id)} className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3 font-baloo text-sm font-extrabold transition-transform active:scale-95 ${value === option.id ? "border-[#F5822B] bg-[#FFF1DE] text-[#C7551A]" : "border-[#E8D9BD] bg-[#FFFDF8] text-[#78654F]"}`}>{option.icon}{option.label}</button>)}</div></div>;
}
