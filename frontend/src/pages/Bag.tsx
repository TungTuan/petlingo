import { useEffect, useState } from "react";
import type { InventoryEntry, ItemEffect, UseItemResult } from "../lib/api";
import { BackIcon } from "../components/ui";
import { useT } from "../lib/i18n";

interface BagProps {
  coins: number;
  gems: number;
  inventory: InventoryEntry[] | null;
  onUseItem: (itemId: string) => Promise<UseItemResult>;
  onExit: () => void;
}

const SLOT_BG: Record<string, string> = { food: "#FFF3E0", toy: "#EEF9E3", accessory: "#F2EBFB", special: "#E9F1FA" };
const TABS: { key: "food" | "toy" | "accessory" | "special"; label: string }[] = [
  { key: "food", label: "Đồ ăn" },
  { key: "toy", label: "Đồ chơi" },
  { key: "accessory", label: "Phụ kiện" },
  { key: "special", label: "Vật phẩm" },
];
const EFFECT_LABEL: Record<ItemEffect["stat"], { label: string; color: string }> = {
  hunger: { label: "Đồ ăn", color: "#FFC93C" },
  health: { label: "Sức khoẻ", color: "#EF6A5A" },
  happiness: { label: "Vui vẻ", color: "#7CC24A" },
  coins: { label: "Coin", color: "#B07A0C" },
  experience: { label: "XP pet", color: "#9B7EDE" },
  resetLevel: { label: "Reset level", color: "#57C6C6" },
};

/** Bag / Inventory — matches the reference sheet's "Phần 4 · Kho đồ" panel.
 * Backed by real per-child ChildItem rows now (see /children/:id/items).
 * Purely a viewer + "Dùng ngay" now — buying used to also happen here via a
 * "Cửa hàng ⇄ Túi đồ" toggle, which duplicated Shop.tsx's whole purpose;
 * removed so there's exactly ONE place to spend coin/gem (Shop) and ONE
 * place to see/use what a child already owns (here). */
export default function Bag({ coins, gems, inventory, onUseItem, onExit }: BagProps) {
  const t = useT();
  const [tab, setTab] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const tabKey = TABS[tab]!.key;
  const items = (inventory ?? []).filter((e) => e.item.category === tabKey);
  const chosen = items.find((e) => e.item.id === selectedId) ?? items[0] ?? null;

  useEffect(() => {
    setSelectedId(null);
    setMsg("");
  }, [tab]);

  async function useChosen() {
    if (!chosen || busy) return;
    setBusy(true);
    try {
      const result = await onUseItem(chosen.item.id);
      setMsg(t(result.message));
    } catch (err) {
      setMsg(err instanceof Error ? t(err.message) : t("Không dùng được, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-cream">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-[#F7EFDD] p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <span className="font-baloo text-[26px] font-extrabold">{t("Kho đồ")}</span>
        <div className="ml-3 flex gap-0.5 rounded-2xl bg-[#F1E7D3] p-1">
          {TABS.map((tb, i) => (
            <button key={tb.key} onClick={() => setTab(i)} className={`relative rounded-[11px] px-5 py-2.5 font-baloo text-[14.5px] font-bold ${tab === i ? "bg-[#5C7BC9] text-white" : "text-[#8A7A62]"}`}>
              {t(tb.label)}
              {tb.key === "special" && <span className="absolute -right-2 -top-2 rounded-full bg-[#EF6A5A] px-2 py-0.5 font-baloo text-[9px] font-extrabold uppercase text-white shadow-[0_2px_0_#B93E34]">Mới</span>}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#B07A0C] shadow-[0_3px_0_#E3CFA8]">
          <svg width="19" height="19" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#F2A81C" />
            <circle cx="12" cy="12" r="6.6" fill="#FFE08A" />
          </svg>
          {coins}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#357EAF] shadow-[0_3px_0_#C9E5F4]">💎 {gems}</div>
        <div className="font-baloo text-[13px] font-bold text-[#8A7A62]">
          {items.length}/20 {t("ô")}
        </div>
      </div>

      <div className="flex flex-1 gap-5 p-5.5">
        {inventory === null ? (
          <div className="grid flex-1 place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải kho đồ…")}</div>
        ) : items.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-[24px] border-4 border-dashed border-line font-baloo text-base font-bold text-ink/40">{t("Chưa có vật phẩm nào trong mục này")}</div>
        ) : (
          <div className="grid flex-1 auto-rows-min grid-cols-5 content-start gap-4">
            {items.map(({ item, quantity }) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  setMsg("");
                }}
                className="relative flex flex-col items-center gap-2 rounded-[20px] border-[3px] p-3 transition-transform hover:-translate-y-1"
                style={{ borderColor: chosen?.item.id === item.id ? "#F5822B" : "#EBD9B8", background: chosen?.item.id === item.id ? "#FFF1DE" : "#fff", boxShadow: `0 5px 0 ${chosen?.item.id === item.id ? "#F5822B" : "#EBD9B8"}` }}
              >
                <span className="grid aspect-square w-full place-items-center rounded-2xl" style={{ background: SLOT_BG[tabKey] }}>
                  {item.imagePath ? <img src={item.imagePath} alt="" className="h-16 w-16 object-contain" /> : <span className="h-11 w-11 shadow-[inset_0_-5px_0_rgba(0,0,0,.12)]" style={{ borderRadius: item.radius, background: item.color }} />}
                </span>
                <span className="font-baloo text-sm font-extrabold">{t(item.name)}</span>
                <span className="absolute right-2 top-1.5 font-baloo text-[13px] font-extrabold text-[#8A7A62]">x{quantity}</span>
              </button>
            ))}
          </div>
        )}

        {chosen && (
          <div className="flex w-[300px] flex-col gap-3.5 rounded-[24px] border-[3px] border-line2 bg-white p-5 shadow-[0_5px_0_#EADAB8]">
            <div className="font-baloo text-[22px] font-extrabold">{t(chosen.item.name)}</div>
            <div className="grid h-[150px] place-items-center rounded-[20px]" style={{ background: SLOT_BG[tabKey] }}>
              {chosen.item.imagePath ? <img src={chosen.item.imagePath} alt={chosen.item.name} className="animate-bob h-32 w-32 object-contain" /> : <span className="animate-bob h-19 w-19 shadow-[inset_0_-7px_0_rgba(0,0,0,.12)]" style={{ borderRadius: chosen.item.radius, background: chosen.item.color }} />}
            </div>
            <div className="font-baloo text-[13.5px] font-semibold leading-snug text-[#6E6047]">{t(chosen.item.description)}</div>
            <div className="flex flex-col gap-2">
              {chosen.item.effects.length === 0 ? (
                <div className="font-baloo text-[13px] font-semibold text-[#A2947C]">{t("Chỉ để trang trí / lưu niệm")}</div>
              ) : (
                chosen.item.effects.map((e) => {
                  const meta = EFFECT_LABEL[e.stat];
                  return (
                    <div key={e.stat} className="flex items-center justify-between font-baloo text-[13.5px] font-bold">
                      <span className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full" style={{ background: meta.color }} />
                        {t(meta.label)}
                      </span>
                      <span style={{ color: meta.color }}>
                        {e.delta > 0 ? "+" : ""}
                        {e.delta}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <button
              onClick={useChosen}
              disabled={busy}
              className="mt-auto rounded-2xl bg-brand-green py-3.5 font-baloo text-lg font-extrabold text-white shadow-[0_5px_0_#5C9C31] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#5C9C31] disabled:opacity-60"
            >
              {busy ? t("Đang xử lý…") : t("Dùng ngay")}
            </button>
            <div className="min-h-[18px] font-baloo text-[13px] font-bold text-[#8A7A62]">{msg}</div>
          </div>
        )}
      </div>
    </div>
  );
}
