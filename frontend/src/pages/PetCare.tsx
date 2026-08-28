import { Fragment, useState } from "react";
import type { CareAction, CareResult, InventoryEntry, PetStatsState, UseItemResult } from "../lib/api";
import { BackIcon, CoinIcon, HeartIcon } from "../components/ui";
import { useT } from "../lib/i18n";
import PetPortrait from "../components/PetPortrait";
import { getPetMood } from "../lib/petEvolution";
import { Bath, Bone, Gamepad2, MoonStar, ShowerHead, Sparkles, Utensils } from "lucide-react";

interface PetCareProps {
  coins: number;
  gems: number;
  petIds: string[];
  petNames: string[];
  /** Spare, un-leveled duplicate copies per species — "Đổi bạn thú" shows these
   * as a separate "Trứng {name}" tile next to the real pet instead of folding
   * them into one card with a quantity badge (see doc comment below). */
  petEggs: Record<string, number>;
  selectedPet: number;
  onSelectPet: (i: number) => Promise<unknown>;
  petStats: PetStatsState | null;
  petStatsById: Record<string, PetStatsState>;
  inventory: InventoryEntry[] | null;
  shopItems: InventoryEntry[] | null;
  onPurchaseItem: (itemId: string) => Promise<unknown>;
  onCareAction: (action: CareAction) => Promise<CareResult>;
  onUseItem: (itemId: string) => Promise<UseItemResult>;
  onExit: () => void;
}

const ITEM_ICON: Record<string, string> = {
  "tao": "🍎", "banh-mi": "🥖", "sua": "🥛", "ca-rot": "🥕", "keo": "🍬", "xuong": "🦴",
  "dua-hau": "🍉", "trung-luoc": "🥚", "pho-mai": "🧀", "mat-ong": "🍯", "sup-bi-do": "🥣", "ca-hoi-tuoi": "🐟",
  "bong": "⚽", "chuot-bong": "🐭", "dem-ngu": "🛏️",
  "test-lam-doi": "😩",
};

/** Pet Care — matches the reference sheet's "Phần 3 · Pet Care" panel. Stats/actions are now
 * backed by PetStats + careForPet() on the server instead of resetting on every reload. */
export default function PetCare({ coins, gems, petIds, petNames, petEggs, selectedPet, onSelectPet, petStats, petStatsById, inventory, shopItems, onPurchaseItem, onCareAction, onUseItem, onExit }: PetCareProps) {
  const t = useT();
  const ACTION_STYLE: Record<CareAction, { label: string; bg: string; shadow: string; icon: React.ReactNode }> = {
    feed: { label: t("Cho ăn"), bg: "#FFC93C", shadow: "#D9A517", icon: <Utensils size={30} strokeWidth={2.8} /> },
    bathe: { label: t("Tắm"), bg: "#57C6C6", shadow: "#37A0A0", icon: <Bath size={30} strokeWidth={2.8} /> },
    play: { label: t("Chơi"), bg: "#7CC24A", shadow: "#5C9C31", icon: <Gamepad2 size={30} strokeWidth={2.8} /> },
    sleep: { label: t("Ngủ"), bg: "#9B7EDE", shadow: "#7A5EBC", icon: <MoonStar size={30} strokeWidth={2.8} /> },
    pat: { label: t("Vuốt ve"), bg: "#F79BB0", shadow: "#E293A9", icon: <Sparkles size={30} strokeWidth={2.8} /> },
  };
  const [pats, setPats] = useState(0);
  const [msg, setMsg] = useState(t("Cho ăn để tăng chỉ số, chơi để tăng vui vẻ"));
  const [bathing, setBathing] = useState(false);
  const [busyAction, setBusyAction] = useState<CareAction | null>(null);
  const [feedFx, setFeedFx] = useState(0);
  const [xpGain, setXpGain] = useState(0);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [selectingPetId, setSelectingPetId] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);

  const petId = petIds[selectedPet]!;
  const petName = petNames[selectedPet]!;
  const health = petStats?.health ?? 70;
  const hunger = petStats?.hunger ?? 70;
  const happiness = petStats?.happiness ?? 70;
  const petLevel = petStats?.level ?? 1;
  const petXp = petStats?.experience ?? 0;
  const xpInLevel = petXp % 100;
  const foodItems = (inventory ?? []).filter(({ item, quantity }) => item.category === "food" && quantity > 0);
  const selectedFood = foodItems.find(({ item }) => item.id === selectedFoodId) ?? null;
  const resetShopItem = (shopItems ?? []).find(({ item }) => item.key === "dong-ho-tai-sinh") ?? null;
  const resetOwned = (inventory ?? []).find(({ item }) => item.key === "dong-ho-tai-sinh") ?? null;
  const orderedPets = petIds
    // Keep a stable visual order. Moving the newly selected pet to index 0
    // remounted/reflowed most cards and caused a noticeable blink.
    .map((id, index) => ({ id, index, name: petNames[index]! }));
  const petSpeech = hunger <= 30
    ? t("Mình hơi đói rồi!")
    : hunger >= 100
      ? t("Mình no căng rồi, chơi với mình nhé!")
      : happiness <= 35
        ? t("Chơi với mình nhé!")
        : t("Hôm nay mình thấy rất tuyệt!");

  async function runAction(action: CareAction) {
    if (busyAction) return;
    if (action === "feed" && !selectedFood) {
      setMsg(foodItems.length === 0 ? t("Kho đã hết đồ ăn — hãy mua thêm trong Shop.") : t("Hãy chọn một món ăn trước nhé!"));
      return;
    }
    if (action === "feed" && selectedFood) {
      const givesExperience = selectedFood.item.effects.some((effect) => effect.stat === "experience" && effect.delta > 0);
      const hungerDelta = selectedFood.item.effects.filter((effect) => effect.stat === "hunger").reduce((sum, effect) => sum + effect.delta, 0);
      if (givesExperience && petLevel >= 30) {
        setMsg(t("Pet đã lớn rồi! Hãy dành món tăng cấp cho pet khác nhé."));
        return;
      }
      // Chỉ chặn khi món ăn thực sự "phí" — không tăng XP và cũng không giúp
      // gì thêm cho đồ ăn (hungerDelta > 0). Món có hungerDelta <= 0 (như vật
      // phẩm test làm đói) không bao giờ bị chặn ở đây — pet no thì dùng vẫn có
      // tác dụng (làm đói đi), không hề "phí".
      if (!givesExperience && hungerDelta > 0 && hunger >= 100) {
        setMsg(t("Pet đã no rồi! Chơi hoặc học thêm trước khi cho ăn tiếp nhé."));
        return;
      }
    }
    setBusyAction(action);
    if (action === "bathe") setBathing(true);
    if (action === "pat") setPats((p) => p + 1);
    const beforeXp = petStats?.experience ?? 0;
    if (action === "feed") setFeedFx((n) => n + 1);
    try {
      if (action === "feed" && selectedFood) {
        const result = await onUseItem(selectedFood.item.id);
        const nextStats = result.petStats;
        if (nextStats) {
          setXpGain(Math.max(0, nextStats.experience - beforeXp));
          window.setTimeout(() => setXpGain(0), 1600);
        }
        setMsg(`${t("Đã cho ăn")} ${t(selectedFood.item.name)} · ${t(result.message)}`);
        if (selectedFood.quantity <= 1) setSelectedFoodId(null);
        return;
      }
      const result = await onCareAction(action);
      if (action === "feed") {
        setXpGain(Math.max(0, result.petStats.experience - beforeXp));
        window.setTimeout(() => setXpGain(0), 1600);
      }
      setMsg(action === "pat" ? `${petName} ${t(result.message).toLowerCase()}` : t(result.message));
    } catch (err) {
      setMsg(err instanceof Error ? t(err.message) : t("Không thực hiện được, thử lại nhé."));
    } finally {
      setBusyAction(null);
      if (action === "bathe") setTimeout(() => setBathing(false), 3200);
    }
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#F7DFC0] from-0% via-[#FBEFD6] via-46% to-[#DFC79C] to-46%">
      <div className="flex items-center gap-3 p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <span className="font-baloo text-[26px] font-extrabold">Pet Care</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-baloo text-base font-extrabold text-[#C7455B] shadow-[0_3px_0_rgba(0,0,0,.12)]">
          <HeartIcon size={19} />
          {health}/100
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-baloo text-base font-extrabold text-[#B07A0C] shadow-[0_3px_0_rgba(0,0,0,.12)]">
          <CoinIcon size={19} />
          {coins}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 gap-4 px-5.5 pb-5">
        <div className="flex min-h-0 w-[270px] flex-none flex-col gap-3">
          <div className="flex flex-none flex-col gap-2.5 rounded-[22px] border-[3px] border-line2 bg-white/94 p-3.5 shadow-[0_5px_0_rgba(0,0,0,.1)]">
            <div className="font-baloo text-[18px] font-extrabold">{t("Chỉ số")}</div>
            <div className="rounded-2xl bg-[#F3EDFF] p-3">
              <div className="mb-1.5 flex justify-between font-baloo text-[13px] font-extrabold text-[#7155B5]">
                <span>{t("Cấp")} {petLevel}</span>
                <span>{petLevel >= 30 ? "MAX" : `${xpInLevel}/100 XP`} · {petXp} XP</span>
              </div>
              <div className="h-3.5 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-gradient-to-r from-[#9B7EDE] to-[#65BDF2] transition-[width] duration-300" style={{ width: `${petLevel >= 30 ? 100 : xpInLevel}%` }} />
              </div>
            </div>
            {[
              [t("Sức khoẻ"), health, "#EF6A5A"],
              [t("Đồ ăn"), hunger, "#FFC93C"],
              [t("Vui vẻ"), happiness, "#7CC24A"],
            ].map(([label, value, color]) => (
              <div key={label as string} className="flex flex-col gap-1">
                <div className="flex justify-between font-baloo text-[13px] font-bold text-[#8A7A62]">
                  <span>{label}</span>
                  <span>{value}%</span>
                </div>
                <div className="h-3.5 overflow-hidden rounded-full bg-[#F1E7D3]">
                  <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${value}%`, background: color as string }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 rounded-[22px] border-[3px] border-line2 bg-white/94 p-3.5 shadow-[0_5px_0_rgba(0,0,0,.1)]">
            <div className="flex items-center justify-between gap-2 font-baloo text-[18px] font-extrabold"><span className="flex items-center gap-2"><Bone size={20} />{t("Chọn đồ ăn")}</span>{selectedFood && <span className="rounded-full bg-[#FFF0B8] px-2 py-1 text-[10px] text-[#9A6B00]">✓ {t("Đã chọn")}</span>}</div>
            {foodItems.length === 0 ? (
              <div className="grid flex-1 place-items-center rounded-xl border-2 border-dashed border-[#E4D3BC] px-3 text-center font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Kho đã hết đồ ăn — ghé Shop để mua thêm.")}</div>
            ) : (
              <div className="grid min-h-0 grid-cols-3 gap-2 overflow-y-auto pr-1">
                {foodItems.map(({ item, quantity }) => (
                  <button key={item.id} onClick={() => setSelectedFoodId(item.id)} className="relative grid aspect-square min-h-[62px] place-items-center overflow-hidden rounded-2xl border-[3px] transition-transform active:scale-95" style={{ borderColor: selectedFoodId === item.id ? "#F2A81C" : "#E7D4B2", background: selectedFoodId === item.id ? "#FFF3C9" : "#FFF9EC", boxShadow: selectedFoodId === item.id ? "0 3px 0 #D9A517" : "none" }} title={`${item.name} · ${item.effects.map((effect) => `+${effect.delta} ${effect.stat}`).join(", ")}`}>
                    {item.imagePath ? <img src={item.imagePath} alt={item.name} className="h-[82%] w-[82%] object-contain" /> : <span className="text-[30px]">{ITEM_ICON[item.key] ?? (item.category === "food" ? "🍖" : item.category === "toy" ? "🧸" : "🎁")}</span>}
                    <span className="absolute right-1 top-1 rounded-full bg-[#5B4A33]/80 px-1.5 font-baloo text-[10px] font-extrabold text-white">x{quantity}</span>
                    {selectedFoodId === item.id && <span className="absolute bottom-0.5 left-1 grid h-5 w-5 place-items-center rounded-full bg-[#7CC24A] text-[12px] font-black text-white">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-end gap-2.5">
          <div className="relative rounded-[20px] border-[3px] border-line bg-white px-5.5 py-2.5 font-baloo text-[17px] font-bold shadow-[0_4px_0_#E7D4B2]">
            {petSpeech}
            <span className="absolute bottom-[-12px] left-[30px] h-[18px] w-[18px] rotate-45 border-b-[3px] border-r-[3px] border-line bg-white" />
          </div>
          <button onClick={() => runAction("pat")} className="relative grid place-items-center border-none bg-none p-0">
            {bathing && (
              <span className="pet-shower pointer-events-none absolute inset-x-[-18px] top-[-18px] z-20 h-[310px] overflow-hidden rounded-[42px]">
                <span className="pet-shower-fixture absolute left-1/2 top-[-10px] h-[88px] w-[210px] -translate-x-1/2">
                  <span className="absolute right-[-4px] top-0 h-[18px] w-[108px] rounded-l-full border-[4px] border-[#4B8AA9] bg-gradient-to-b from-[#DDF6FF] to-[#75BDD9] shadow-[inset_0_3px_0_rgba(255,255,255,.75)]" />
                  <span className="absolute right-[-4px] top-0 h-[57px] w-[18px] rounded-b-full border-[4px] border-[#4B8AA9] border-t-0 bg-[#75BDD9]" />
                  <span className="absolute left-[42px] top-[9px] rotate-[14deg] text-[#DDF6FF] drop-shadow-[0_5px_0_#4B8AA9]">
                    <ShowerHead size={84} strokeWidth={2.4} fill="#8ED5ED" stroke="#397B9C" />
                  </span>
                </span>
                <span className="absolute left-[46%] top-[61px] h-[212px] w-[205px] -translate-x-1/2 bg-gradient-to-b from-[#BDEEFF]/30 to-transparent [clip-path:polygon(27%_0,70%_0,100%_100%,0_100%)]" />
                {Array.from({ length: 22 }, (_, index) => (
                  <span
                    key={index}
                    className="pet-rain-drop absolute top-[65px] rounded-full bg-[#62C5EE] shadow-[0_0_5px_rgba(255,255,255,.9)]"
                    style={{
                      left: `${17 + ((index * 37) % 60)}%`,
                      width: index % 3 === 0 ? 5 : 3,
                      height: index % 4 === 0 ? 19 : 13,
                      animationDelay: `${-(index % 9) * 0.09}s`,
                      animationDuration: `${0.68 + (index % 5) * 0.07}s`,
                    }}
                  />
                ))}
                {Array.from({ length: 8 }, (_, index) => (
                  <span
                    key={`bubble-${index}`}
                    className="pet-bath-bubble absolute bottom-5 rounded-full border-2 border-white/90 bg-[#C8F3FF]/55"
                    style={{
                      left: `${18 + ((index * 19) % 68)}%`,
                      width: 12 + (index % 3) * 5,
                      height: 12 + (index % 3) * 5,
                      animationDelay: `${index * 0.11}s`,
                    }}
                  />
                ))}
                <span className="pet-bath-splash absolute bottom-2 left-1/2 h-7 w-[225px] -translate-x-1/2 rounded-[50%] border-t-4 border-[#8BDAF8]/80" />
              </span>
            )}
            <span className="pet-ground-shadow absolute bottom-2.5 h-11 w-[250px] rounded-[50%] bg-black/[.14]" />
            <div className={`relative grid place-items-center ${petLevel >= 30 ? "pet-max-preview" : ""}`}>
              <PetPortrait
                petId={petId}
                name={petName}
                level={petStats?.level ?? 1}
                mood={getPetMood(hunger)}
                animated
                motion={!bathing}
                mediaAnimated={!bathing}
                className="relative z-10 h-[300px] w-[300px] drop-shadow-[0_6px_6px_rgba(0,0,0,.14)]"
              />
            </div>
            {feedFx > 0 && busyAction === "feed" && <span key={feedFx} className="feed-fly pointer-events-none absolute bottom-8 left-[-60px] z-20 text-[58px]">🍪</span>}
            {xpGain > 0 && <span className="xp-pop pointer-events-none absolute right-2 top-8 z-20 rounded-full bg-[#8E6AD1] px-4 py-2 font-baloo text-xl font-extrabold text-white shadow-[0_4px_0_#61449C]">+{xpGain} XP</span>}
            {busyAction === "feed" && <span className="feed-glow pointer-events-none absolute h-[270px] w-[270px] rounded-full" />}
            {pats > 0 && (
              <span key={pats} className="animate-float-up pointer-events-none absolute right-15 top-7.5 font-baloo text-[34px] font-extrabold text-[#EF6A5A]">
                ♥
              </span>
            )}
          </button>
          <div className="flex gap-3.5">
            {(["feed", "bathe", "play", "sleep"] as CareAction[]).map((action) => {
              const s = ACTION_STYLE[action];
              return (
                <button
                  key={action}
                  onClick={() => runAction(action)}
                  disabled={busyAction !== null}
                  className="flex w-[104px] flex-col items-center gap-1.5 rounded-[22px] py-3.5 transition-transform active:translate-y-1 disabled:opacity-60"
                  style={{ background: s.bg, boxShadow: `0 5px 0 ${s.shadow}` }}
                >
                  <span className="grid h-[34px] w-[34px] place-items-center text-white">{s.icon}</span>
                  <span className="font-baloo text-[15px] font-extrabold text-white">{s.label}</span>
                  {action === "feed" && selectedFood && <span className="max-w-[90px] truncate px-1 font-baloo text-[9px] font-bold text-[#725400]">{t(selectedFood.item.name)}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-0 w-[280px] flex-none flex-col gap-3">
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-[22px] border-[3px] border-line2 bg-white/94 p-3.5 shadow-[0_5px_0_rgba(0,0,0,.1)]">
            <div className="flex items-center justify-between font-baloo text-[18px] font-extrabold"><span>{t("Đổi bạn thú")}</span><span className="rounded-full bg-[#F3EDFF] px-2.5 py-1 text-[11px] text-[#7155B5]">{petIds.length} pet</span></div>
            <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2.5 overflow-y-auto pr-1.5">
              {orderedPets.map(({ id, index, name }) => {
                const eggs = petEggs[id] ?? 0;
                return (
                  <Fragment key={id}>
                    <button
                      disabled={selectingPetId !== null}
                      onClick={async () => {
                        if (id === petId || selectingPetId) return;
                        setSelectingPetId(id);
                        setMsg(`${t("Đang chọn")} ${name}…`);
                        try {
                          await onSelectPet(index);
                          setSelectedFoodId(null);
                          setMsg(`${t("Đang chăm")} ${name}`);
                        } catch (error) {
                          setMsg(error instanceof Error ? t(error.message) : t("Không thể chọn pet, thử lại nhé."));
                        } finally {
                          setSelectingPetId(null);
                        }
                      }}
                      className="relative grid min-h-[100px] place-items-center overflow-hidden rounded-2xl border-[3px] disabled:cursor-wait disabled:opacity-70"
                      style={{ borderColor: selectedPet === index ? "#F5822B" : "#E7D4B2", background: selectedPet === index ? "#FFF1DE" : "#fff", boxShadow: `0 4px 0 ${selectedPet === index ? "#F5822B" : "#E7D4B2"}` }}
                    >
                      <PetPortrait petId={id} name={name} level={id === petId ? petLevel : (petStatsById[id]?.level ?? 1)} className="h-[92px] w-[108px] object-contain" />
                      {selectingPetId === id && <span className="absolute inset-0 z-10 grid place-items-center bg-white/65 font-baloo text-[11px] font-extrabold text-[#7155B5]">Đang chọn…</span>}
                      <span className="absolute bottom-1.5 rounded-full bg-white/85 px-2 font-baloo text-[10px] font-extrabold capitalize text-[#6E6047]">{name}</span>
                    </button>
                    {/* Spare duplicate copies — a SEPARATE tile from the real pet above
                        (not a "×N" badge glued onto it) so "1 leveled dog" and "6 unhatched
                        dog eggs" read as two different kinds of thing, matching the same
                        primary/egg split Pet Collection's fusion picker already uses. */}
                    {eggs > 0 && (
                      <button
                        onClick={() => setMsg(t("Trứng chưa nở — ghé Pet Collection để phối lên bậc cao hơn."))}
                        className="relative grid min-h-[100px] place-items-center overflow-hidden rounded-2xl border-[3px] border-dashed border-[#E7D4B2] bg-[#FBF6EA]"
                      >
                        <PetPortrait petId={id} name={name} level={1} className="h-[92px] w-[108px] object-contain opacity-80 saturate-[.7]" />
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-[#59422F] px-2 py-0.5 font-baloo text-[10px] font-extrabold text-white shadow-[0_2px_0_#342419]">×{eggs}</span>
                        <span className="absolute bottom-1.5 rounded-full bg-white/85 px-2 font-baloo text-[10px] font-extrabold capitalize text-[#6E6047]">{t("Trứng")} {name}</span>
                      </button>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
          <div className="flex flex-none flex-col gap-2 rounded-[22px] border-[3px] border-line2 bg-white/94 p-3 shadow-[0_5px_0_rgba(0,0,0,.1)]">
            {resetShopItem && (
              <div className="mt-1 flex items-center gap-2 rounded-2xl border-2 border-[#DDCFF5] bg-[#F7F1FF] p-2">
                <img src={resetShopItem.item.imagePath} alt={resetShopItem.item.name} className="h-11 w-11 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-baloo text-[12px] font-extrabold text-[#5B3D91]">{t(resetShopItem.item.name)}</div>
                  <div className="font-baloo text-[10px] font-bold text-[#8B76A8]">Reset pet về Lv.1</div>
                </div>
                <button
                  disabled={resetBusy}
                  title={`Bạn có ${gems.toLocaleString()} kim cương`}
                  onClick={async () => {
                    setResetBusy(true);
                    try {
                      if (resetOwned) {
                        await onUseItem(resetOwned.item.id);
                        setMsg(`${petName} đã trở về Level 1!`);
                      } else {
                        await onPurchaseItem(resetShopItem.item.id);
                        setMsg(t("Đã mua Đồng hồ tái sinh — nhấn Dùng để reset pet."));
                      }
                    } catch (error) {
                      setMsg(error instanceof Error ? t(error.message) : t("Không thể xử lý vật phẩm."));
                    } finally {
                      setResetBusy(false);
                    }
                  }}
                  className="shrink-0 rounded-xl bg-[#8E6AD1] px-3 py-2 font-baloo text-[11px] font-extrabold text-white shadow-[0_3px_0_#6748A6] disabled:opacity-60"
                >
                  {resetBusy ? "…" : resetOwned ? `Dùng · x${resetOwned.quantity}` : `💎 ${resetShopItem.item.price}`}
                </button>
              </div>
            )}
          </div>
          <div className="mt-auto rounded-2xl bg-white/80 px-3 py-2.5 font-baloo text-[13px] font-semibold text-brand-brown">{msg}</div>
        </div>
      </div>
    </div>
  );
}
