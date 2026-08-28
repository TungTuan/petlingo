import { useRef, useState } from "react";
import { BackIcon, CoinIcon, GemIcon } from "../components/ui";
import PetPortrait from "../components/PetPortrait";
import FusionCelebration from "../components/FusionCelebration";
import FusionPetPicker from "../components/FusionPetPicker";
import { PETS, RARITY } from "../components/ui/tokens";
import { ApiError, type FusableRarity, type FusePetsResult, type FusionMaterial, type InventoryEntry, type PetStatsState, type PurchasePetResult } from "../lib/api";
import { useT } from "../lib/i18n";

interface ShopProps {
  coins: number;
  gems: number;
  owned: string[];
  petCopies: Record<string, number>;
  petEggs: Record<string, number>;
  petStatsById: Record<string, PetStatsState>;
  activePetId: string;
  shopItems: InventoryEntry[] | null;
  onExit: () => void;
  onBuy: (id: string, currency: "coin" | "gem", price: number) => Promise<PurchasePetResult>;
  onFuse: (rarity: FusableRarity, materials: FusionMaterial[]) => Promise<FusePetsResult>;
  onSelectActive: (id: string) => Promise<unknown>;
  onPurchaseItem: (itemId: string) => Promise<unknown>;
}

/** Pet Shop — matches the reference sheet's "10. Pet Shop" panel. The
 * "Đổi thưởng" button at the end of a lesson lands here so a freshly-earned
 * coin has somewhere to go; the same 40-pet catalog Pet Collection browses,
 * just framed as a purchase flow. Every pet always shows its price + a
 * working Buy button, owned or not — buying a pet again is allowed on
 * purpose, it converts into "Phối pet" fusion material instead of unlocking
 * anything new (see progress.service.ts's purchasePet doc comment), so Shop
 * never shows a blocking "already bought" state. The corner "Đang dùng" tag
 * only marks the current companion — informational, not a purchase gate.
 * "Pets" and "Food" are live; Outfits/Coins stay placeholder tabs explaining
 * where that content actually lives today or that it's not built yet, rather
 * than pretending. Buying used to also be reachable from Bag's old "Cửa
 * hàng" toggle — that's gone now (see Bag.tsx's doc comment) so Shop is the
 * ONE place to spend coin/gem. Shop used to also let you jump from an owned
 * pet straight into Pet Care (a "chăm sóc" shortcut) — removed so Shop stays
 * purchase-only; caring for a pet happens from Pet Collection/Pet Care, not
 * here. */
export default function Shop({ coins, gems, owned, petCopies, petEggs, petStatsById, activePetId, shopItems, onExit, onBuy, onFuse, onSelectActive, onPurchaseItem }: ShopProps) {
  const t = useT();
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState("");
  const [itemBusyId, setItemBusyId] = useState<string | null>(null);
  const [fusingRarity, setFusingRarity] = useState<FusableRarity | null>(null);
  const [fusionReward, setFusionReward] = useState<FusePetsResult | null>(null);
  const [pendingFusionRarity, setPendingFusionRarity] = useState<FusableRarity | null>(null);
  const [selectingPetId, setSelectingPetId] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const TABS = [
    { label: "Pets", dot: "#F79BB0", note: "" },
    { label: "Fusion", dot: "#9B72D4", note: "" },
    { label: "Food", dot: "#7CC24A", note: "" },
    { label: "Outfits", dot: "#57C6C6", note: t("Phụ kiện cho pet đã có sẵn trong Kho đồ (tab Bag) và trang Pet Care — ghé đó để mặc đồ cho bạn thú nhé.") },
    { label: "Coins", dot: "#FFC93C", note: t("Nạp thêm coin bằng tiền thật đang được chuẩn bị — sắp ra mắt! Hiện tại coin chỉ kiếm được từ học bài và điểm danh.") },
  ];

  const fusionRecipes: { input: FusableRarity; output: "Rare" | "Epic" | "Legendary" }[] = [
    { input: "Common", output: "Rare" },
    { input: "Rare", output: "Epic" },
    { input: "Epic", output: "Legendary" },
  ];

  function copiesForRarity(rarity: FusableRarity) {
    return PETS.filter((pet) => pet.rarity === rarity).reduce((sum, pet) => sum + (petCopies[pet.id] ?? 0), 0);
  }

  async function fusePet(rarity: FusableRarity, materials: FusionMaterial[]) {
    if (fusingRarity) return;
    setFusingRarity(rarity);
    try {
      const result = await onFuse(rarity, materials);
      setPendingFusionRarity(null);
      setFusionReward(result);
    } catch (error) {
      popToast(error instanceof ApiError ? t(error.message) : t("Không ghép được, thử lại nhé."));
    } finally {
      setFusingRarity(null);
    }
  }

  function popToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1800);
  }

  async function buyPet(id: string, currency: "coin" | "gem", price: number) {
    if (currency === "gem" && gems < price) {
      popToast(t("Không đủ gem — nhờ bố mẹ mở trong Parent Area."));
      return;
    }
    if (currency === "coin" && coins < price) {
      popToast(t("Chưa đủ coin — học thêm 1 bài nhé!"));
      return;
    }
    try {
      const result = await onBuy(id, currency, price);
      popToast(result.isDuplicate ? t(`Đã mua thêm! Hiện có ×${result.quantity}`) : t("Nhận được một quả trứng mới!"));
    } catch (error) {
      popToast(error instanceof ApiError && error.code === "INSUFFICIENT_FUNDS" ? t("Chưa đủ tiền để mở khoá.") : t("Có lỗi xảy ra, thử lại nhé."));
    }
  }

  async function selectPet(id: string, name: string) {
    if (selectingPetId || id === activePetId) return;
    setSelectingPetId(id);
    try {
      await onSelectActive(id);
      popToast(t(`Đã chọn ${name} làm pet đồng hành!`));
    } catch {
      popToast(t("Không thể chọn pet, thử lại nhé."));
    } finally {
      setSelectingPetId(null);
    }
  }

  async function buyItem(itemId: string, name: string, currency: "coin" | "gem", price: number) {
    if (itemBusyId) return;
    if ((currency === "gem" && gems < price) || (currency === "coin" && coins < price)) {
      popToast(currency === "gem" ? t("Không đủ gem — nhờ bố mẹ mở trong Parent Area.") : t("Chưa đủ coin — học thêm 1 bài nhé!"));
      return;
    }
    setItemBusyId(itemId);
    try {
      await onPurchaseItem(itemId);
      popToast(t(`Đã mua ${name}`));
    } catch {
      popToast(t("Không mua được, thử lại nhé."));
    } finally {
      setItemBusyId(null);
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-cream">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-[#F7EFDD] p-4">
        <button
          onClick={onExit}
          className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_#43609F]"
        >
          <BackIcon />
        </button>
        <div className="flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 24 24">
            <ellipse cx="12" cy="15" rx="6" ry="5" fill="#F79BB0" />
            <circle cx="6" cy="8.5" r="2.5" fill="#F79BB0" />
            <circle cx="11" cy="6" r="2.6" fill="#F79BB0" />
            <circle cx="16.5" cy="7.6" r="2.5" fill="#F79BB0" />
          </svg>
          <span className="font-baloo text-[26px] font-extrabold">Pet Shop</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-[17px] font-extrabold text-[#B07A0C] shadow-[0_3px_0_#E3CFA8]">
          <CoinIcon size={20} />
          {coins}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-[17px] font-extrabold text-[#2F8C8C] shadow-[0_3px_0_#E3CFA8]">
          <GemIcon size={20} />
          {gems}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-5 p-5.5">
        <div className="flex w-[190px] flex-col gap-2.5">
          {TABS.map((tb, i) => (
            <button
              key={tb.label}
              onClick={() => setTab(i)}
              className="flex items-center gap-2.5 rounded-[18px] border-[3px] px-4 py-3 font-baloo text-base font-bold"
              style={
                tab === i
                  ? { borderColor: "#C9631A", background: "#F5822B", color: "#fff", boxShadow: "0 4px 0 #C9631A" }
                  : { borderColor: "#E7D4B2", background: "#FFF9EC", color: "#8A5A3B", boxShadow: "0 4px 0 #E7D4B2" }
              }
            >
              <span className="h-[26px] w-[26px] rounded-[9px]" style={{ background: tab === i ? "#fff" : tb.dot }} />
              {tb.label}
            </button>
          ))}
          <div className="mt-auto rounded-[18px] border-[3px] border-[#DDCFF5] bg-[#F1EAFB] p-3.5 font-baloo text-[12.5px] font-semibold leading-snug text-[#6E56A8]">
            {t("Mua bằng coin kiếm được từ bài học. Gem chỉ mở trong Parent Area.")}
          </div>
        </div>

        {tab === 0 ? (
          <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-3 content-start gap-4.5 overflow-y-auto">
            {PETS.map((p) => {
              const isOwned = owned.includes(p.id);
              const isActive = p.id === activePetId;
              return (
                <div key={p.id} className="flex flex-col items-center gap-2 rounded-[24px] border-[3px] border-[#EBD9B8] bg-cream-card p-3 shadow-[0_5px_0_#E3CFA8] transition-transform hover:-translate-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-baloo text-xl font-extrabold">{p.name}</span>
                    <span className="rounded-full px-3 py-0.5 font-baloo text-[11px] font-bold text-white" style={{ background: RARITY[p.rarity].tint }}>
                      {p.rarity}
                    </span>
                  </div>
                  <div className="relative grid aspect-square w-full place-items-center rounded-[18px] border-2 border-dashed border-[#DFC9A2] bg-[#F5EBD8]">
                    <div className="absolute inset-x-[16%] bottom-[7%] h-[12%] rounded-[50%] bg-black/10 blur-sm" />
                    <PetPortrait petId={p.id} name={p.name} animated level={30} className="relative h-[82%] w-[82%] drop-shadow-[0_8px_7px_rgba(80,57,28,.18)]" />
                    {isActive && (
                      <div className="absolute right-2 top-2 rounded-full bg-brand-green px-3 py-1 font-baloo text-xs font-extrabold text-white shadow-[0_3px_0_#5C9C31]">
                        {t("Đang dùng")}
                      </div>
                    )}
                    {isOwned && <div className="absolute left-2 top-2 rounded-full bg-[#59422F] px-2.5 py-1 font-baloo text-xs font-extrabold text-white shadow-[0_3px_0_#342419]">×{petCopies[p.id] ?? 1}</div>}
                  </div>
                  <div className="flex w-full gap-2">
                  {isOwned && (
                    <button
                      onClick={() => selectPet(p.id, p.name)}
                      disabled={isActive || selectingPetId !== null}
                      className="flex flex-1 items-center justify-center rounded-2xl bg-[#7CC24A] py-2.5 font-baloo text-sm font-extrabold text-white shadow-[0_4px_0_#5C9C31] transition-transform active:translate-y-[3px] disabled:opacity-55"
                    >
                      {selectingPetId === p.id ? "…" : isActive ? t("Đang dùng") : t("Chọn pet")}
                    </button>
                  )}
                  <button
                    onClick={() => buyPet(p.id, RARITY[p.rarity].currency, p.price)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 font-baloo text-[15px] font-extrabold transition-transform active:translate-y-[3px]"
                    style={
                      p.rarity === "Common"
                        ? { background: "#EEF9E3", color: "#4F7C2A", boxShadow: "0 4px 0 #CDE7B4" }
                        : RARITY[p.rarity].currency === "gem"
                          ? { background: "#FBC6D4", color: "#8E3B55", boxShadow: "0 4px 0 #E293A9" }
                          : { background: "#FFD75E", color: "#7A5410", boxShadow: "0 4px 0 #D9A517" }
                    }
                  >
                    {RARITY[p.rarity].currency === "gem" ? <GemIcon size={16} /> : <CoinIcon size={16} />}
                    {p.price}
                  </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : tab === 1 ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[28px] border-[3px] border-[#DDCFF5] bg-[#F8F3FF] p-6">
            <div className="mb-5 text-center">
              <div className="font-baloo text-[28px] font-extrabold text-[#604593]">Pet Fusion Lab</div>
              <div className="font-baloo text-sm font-semibold text-[#8069A9]">{t("Ghép 3 pet cùng bậc để nhận 1 trứng ngẫu nhiên ở bậc cao hơn")}</div>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {fusionRecipes.map(({ input, output }) => {
                const count = copiesForRarity(input);
                const ready = count >= 3;
                return (
                  <div key={input} className="flex flex-col items-center rounded-[26px] border-[3px] border-white bg-white/80 p-5 shadow-[0_6px_0_#DDCFF5]">
                    <div className="mb-3 text-6xl">🥚</div>
                    <div className="font-baloo text-xl font-extrabold text-[#4A3728]">3 {input} → 1 {output}</div>
                    <div className="my-3 h-3 w-full overflow-hidden rounded-full bg-[#E9E0F5]">
                      <div className="h-full rounded-full bg-[#9B72D4] transition-all" style={{ width: `${Math.min(100, (count / 3) * 100)}%` }} />
                    </div>
                    <div className="mb-4 font-baloo text-sm font-bold text-[#8069A9]">{Math.min(count, 3)}/3 {t("pet sẵn sàng")}</div>
                    <button
                      onClick={() => setPendingFusionRarity(input)}
                      disabled={!ready || fusingRarity !== null}
                      className="w-full rounded-2xl py-3 font-baloo text-base font-extrabold text-white disabled:opacity-40"
                      style={{ background: ready ? "#9B72D4" : "#B9AFC8", boxShadow: `0 4px 0 ${ready ? "#704BA8" : "#91869F"}` }}
                    >
                      {fusingRarity === input ? t("Đang ghép…") : t("Ghép ngay")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : tab === 2 ? (
          <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-4 content-start gap-4.5 overflow-y-auto">
            {shopItems === null ? (
              <div className="col-span-4 grid place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải…")}</div>
            ) : shopItems.length === 0 ? (
              <div className="col-span-4 grid place-items-center font-baloo text-base font-bold text-ink/40">{t("Chưa có vật phẩm nào trong mục này")}</div>
            ) : (
              shopItems.map(({ item }) => (
                <div key={item.id} className="flex flex-col items-center gap-2 rounded-[24px] border-[3px] border-[#EBD9B8] bg-cream-card p-3 shadow-[0_5px_0_#E3CFA8] transition-transform hover:-translate-y-1">
                  <span className="font-baloo text-base font-extrabold">{t(item.name)}</span>
                  <span className="grid aspect-square w-full place-items-center rounded-[18px] border-2 border-dashed border-[#DFC9A2] bg-[#F5EBD8]">
                    {item.imagePath ? <img src={item.imagePath} alt="" className="h-[70%] w-[70%] object-contain" /> : <span className="h-11 w-11 shadow-[inset_0_-5px_0_rgba(0,0,0,.12)]" style={{ borderRadius: item.radius, background: item.color }} />}
                  </span>
                  <span className="min-h-[2.6em] font-baloo text-[11.5px] font-semibold leading-snug text-[#8A7A62]">{t(item.description)}</span>
                  <button
                    onClick={() => buyItem(item.id, item.name, item.currency, item.price)}
                    disabled={itemBusyId === item.id}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 font-baloo text-[15px] font-extrabold transition-transform active:translate-y-[3px] disabled:opacity-60"
                    style={item.currency === "gem" ? { background: "#FBC6D4", color: "#8E3B55", boxShadow: "0 4px 0 #E293A9" } : { background: "#FFD75E", color: "#7A5410", boxShadow: "0 4px 0 #D9A517" }}
                  >
                    {item.currency === "gem" ? <GemIcon size={16} /> : <CoinIcon size={16} />}
                    {item.price}
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[24px] border-4 border-dashed border-line bg-cream-card p-8 text-center">
            <span className="h-14 w-14 rounded-2xl" style={{ background: TABS[tab]!.dot }} />
            <div className="font-baloo text-xl font-extrabold text-brand-brown">{TABS[tab]!.label}</div>
            <div className="max-w-[420px] font-baloo text-[15px] font-semibold leading-relaxed text-[#8A7A62]">{TABS[tab]!.note}</div>
            <button onClick={() => setTab(0)} className="mt-2 rounded-2xl bg-brand-orange px-6 py-3 font-baloo text-base font-extrabold text-white shadow-[0_4px_0_#C9631A] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#C9631A]">
              {t("Xem Pets")}
            </button>
          </div>
        )}
      </div>

      <div className="px-5.5 pb-4 font-mono text-[11px] text-[#A2947C]">{t("* Giá có thể khác theo khu vực · trẻ em không thấy mục mua bằng tiền thật")}</div>

      {toast && (
        <div className="animate-pop absolute bottom-9.5 left-1/2 -translate-x-1/2 rounded-full bg-ink px-6.5 py-3.5 font-baloo text-base font-bold text-white shadow-[0_6px_18px_rgba(0,0,0,.24)]">{toast}</div>
      )}
      {fusionReward && <FusionCelebration result={fusionReward} onClose={() => setFusionReward(null)} />}
      {pendingFusionRarity && (
        <FusionPetPicker
          rarity={pendingFusionRarity}
          petCopies={petCopies}
          petEggs={petEggs}
          petStatsById={petStatsById}
          busy={fusingRarity !== null}
          onCancel={() => setPendingFusionRarity(null)}
          onConfirm={(materials) => fusePet(pendingFusionRarity, materials)}
        />
      )}
    </div>
  );
}
