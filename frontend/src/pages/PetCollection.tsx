import { useState } from "react";
import { BackIcon, CoinIcon, GemIcon } from "../components/ui";
import PetPortrait from "../components/PetPortrait";
import FusionCelebration from "../components/FusionCelebration";
import FusionPetPicker from "../components/FusionPetPicker";
import { PETS, RARITY, type Rarity } from "../components/ui/tokens";
import { ApiError, type FusableRarity, type FusePetsResult, type FusionMaterial, type PetStatsState } from "../lib/api";
import { useT } from "../lib/i18n";

interface PetCollectionProps {
  coins: number;
  gems: number;
  owned: string[];
  petCopies: Record<string, number>;
  petEggs: Record<string, number>;
  activePetId: string;
  petStatsById: Record<string, PetStatsState>;
  onExit: () => void;
  onBuy: (id: string, currency: "coin" | "gem", price: number) => Promise<unknown>;
  onSelectActive: (id: string) => Promise<unknown>;
  onFuse: (rarity: FusableRarity, materials: FusionMaterial[]) => Promise<FusePetsResult>;
}

const FILTERS: (Rarity | "All")[] = ["All", "Common", "Rare", "Epic", "Legendary"];

// Mirrors backend's petFusion.service.ts FUSION_RECIPES exactly — kept here
// (not derived) since the frontend needs the "need" count to show live
// eligibility ("2/3 sẵn sàng") before the child ever taps the button.
const FUSION_RECIPES: { rarity: FusableRarity; need: number; outputRarity: Rarity }[] = [
  { rarity: "Common", need: 3, outputRarity: "Rare" },
  { rarity: "Rare", need: 3, outputRarity: "Epic" },
  { rarity: "Epic", need: 3, outputRarity: "Legendary" },
];

/** Pet Collection — matches the reference sheet's "40 bạn thú" gallery page. */
export default function PetCollection({ coins, gems, owned, petCopies, petEggs, activePetId, petStatsById, onExit, onBuy, onSelectActive, onFuse }: PetCollectionProps) {
  const t = useT();
  const [filter, setFilter] = useState<Rarity | "All">("All");
  const [msg, setMsg] = useState(t("Chạm nút giá để mở khoá"));
  const [fusingRarity, setFusingRarity] = useState<FusableRarity | null>(null);
  const [fusionMsg, setFusionMsg] = useState("");
  const [fusionReward, setFusionReward] = useState<FusePetsResult | null>(null);
  const [pendingFusionRarity, setPendingFusionRarity] = useState<FusableRarity | null>(null);

  const shown = filter === "All" ? PETS : PETS.filter((p) => p.rarity === filter);

  function ownedCount(rarity: Rarity): number {
    return PETS.filter((p) => p.rarity === rarity).reduce((sum, pet) => sum + (petCopies[pet.id] ?? 0), 0);
  }

  async function fuse(rarity: FusableRarity, materials: FusionMaterial[]) {
    if (fusingRarity) return;
    setFusingRarity(rarity);
    setFusionMsg("");
    try {
      const result = await onFuse(rarity, materials);
      setPendingFusionRarity(null);
      setFusionReward(result);
    } catch (err) {
      setFusionMsg(err instanceof ApiError ? t(err.message) : t("Không phối được, thử lại nhé."));
    } finally {
      setFusingRarity(null);
    }
  }

  async function buy(id: string, name: string, rarity: Rarity) {
    const r = RARITY[rarity];
    if (owned.includes(id)) {
      if (id === activePetId) {
        setMsg(`${t("Đang dùng")} ${name}`);
      } else {
        try {
          await onSelectActive(id);
          setMsg(`${t("Đã chọn")} ${name} ${t("làm bạn đồng hành")}`);
        } catch {
          setMsg(t("Có lỗi xảy ra, thử lại nhé."));
        }
      }
      return;
    }
    const have = r.currency === "gem" ? gems : coins;
    if (have < r.price) {
      setMsg(`${t("Chưa đủ")} ${r.currency === "gem" ? "gem" : "coin"} ${t("cho")} ${name}`);
      return;
    }
    try {
      await onBuy(id, r.currency, r.price);
      setMsg(`${t("Đã mở khoá")} ${name}!`);
    } catch (error) {
      setMsg(error instanceof ApiError && error.code === "INSUFFICIENT_FUNDS" ? t("Chưa đủ tiền để mở khoá.") : t("Có lỗi xảy ra, thử lại nhé."));
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-cream">
      <header className="flex items-end gap-5 border-b-[3px] border-dashed border-line p-5.5">
        <button onClick={onExit} className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon size={22} />
        </button>
        <div>
          <div className="font-baloo text-[26px] font-extrabold">{t("Pet Collection — 40 bạn thú")}</div>
          <div className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Đã tách nền trong suốt · phân 4 bậc rarity · giá theo coin / gem")}</div>
        </div>
        <div className="ml-auto flex gap-3">
          <div className="rounded-2xl border-[3px] border-line2 bg-white px-4.5 py-2 text-center">
            <div className="font-baloo text-lg font-extrabold text-brand-orange">{PETS.length}</div>
            <div className="font-baloo text-[10px] font-semibold text-[#8A7A62]">{t("tổng")}</div>
          </div>
          <div className="rounded-2xl border-[3px] border-line2 bg-white px-4.5 py-2 text-center">
            <div className="font-baloo text-lg font-extrabold text-brand-green">{owned.length}</div>
            <div className="font-baloo text-[10px] font-semibold text-[#8A7A62]">{t("đã mở")}</div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border-[3px] border-[#EBD9B8] bg-cream-card px-4.5 py-2.5 font-baloo text-base font-extrabold text-[#B07A0C]">
            <CoinIcon size={19} />
            {coins}
          </div>
          <div className="flex items-center gap-2 rounded-2xl border-[3px] border-[#EBD9B8] bg-cream-card px-4.5 py-2.5 font-baloo text-base font-extrabold text-[#2F8C8C]">
            <GemIcon size={19} />
            {gems}
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2.5 px-5.5 pt-3.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-full border-[3px] px-5 py-2 font-baloo text-sm font-bold"
            style={
              filter === f
                ? { borderColor: "#F5822B", background: "#F5822B", color: "#fff", boxShadow: "0 4px 0 #F5822B" }
                : { borderColor: "#E7D4B2", background: "#FFF9EC", color: "#8A5A3B", boxShadow: "0 4px 0 #E7D4B2" }
            }
          >
            {f === "All" ? "All" : f}
          </button>
        ))}
        <div className="ml-auto font-baloo text-[13px] font-semibold text-[#8A7A62]">{msg}</div>
      </div>

      <div className="flex gap-3.5 px-5.5 pt-3.5">
        {FUSION_RECIPES.map(({ rarity, need, outputRarity }) => {
          const available = ownedCount(rarity);
          const ready = available >= need;
          return (
            <div
              key={rarity}
              className="flex flex-1 items-center gap-3 rounded-[20px] border-[3px] bg-white p-3.5"
              style={{ borderColor: ready ? "#7CC24A" : "#EFDFC2" }}
            >
              <span className="rounded-full px-2.5 py-1 font-baloo text-[11px] font-bold text-white" style={{ background: RARITY[rarity].tint }}>
                {rarity}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-baloo text-[13px] font-bold text-[#4A3728]">
                  {t("Phối")} {need} {rarity} → 1 {t("trứng")} {outputRarity}
                </div>
                <div className="font-baloo text-[11.5px] font-semibold text-[#8A7A62]">
                  {Math.min(available, need)}/{need} {t("sẵn sàng")}
                </div>
              </div>
              <button
                onClick={() => setPendingFusionRarity(rarity)}
                disabled={!ready || fusingRarity !== null}
                className="shrink-0 rounded-2xl px-4 py-2 font-baloo text-[13px] font-extrabold text-white transition-transform active:translate-y-[2px] disabled:opacity-40"
                style={{ background: ready ? "#7CC24A" : "#B3A691", boxShadow: `0 3px 0 ${ready ? "#5C9C31" : "#8A7A62"}` }}
              >
                {fusingRarity === rarity ? "…" : t("Phối ngay")}
              </button>
            </div>
          );
        })}
      </div>
      {fusionMsg && <div className="px-5.5 pt-2.5 font-baloo text-[13px] font-bold text-[#6E56A8]">{fusionMsg}</div>}

      <div className="grid flex-1 grid-cols-8 content-start gap-4.5 overflow-y-auto p-5.5">
        {shown.map((p) => {
          const isOwned = owned.includes(p.id);
          const isActive = p.id === activePetId;
          return (
            <div
              key={p.id}
              className="flex flex-col items-center gap-2 rounded-[24px] border-[3px] bg-cream-card p-3 shadow-[0_5px_0_#E3CFA8] transition-transform hover:-translate-y-1"
              style={{ borderColor: isActive ? "#F5822B" : isOwned ? "#CDE7B4" : "#EBD9B8" }}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-baloo text-[15px] font-extrabold">{p.name}</span>
                <span className="rounded-full px-2 py-0.5 font-baloo text-[9px] font-bold text-white" style={{ background: p.tint }}>
                  {p.rarity}
                </span>
              </div>
              <div className="relative grid aspect-square w-full place-items-center rounded-2xl" style={{ background: p.slot }}>
                <div className="absolute inset-x-[18%] bottom-[8%] h-[11%] rounded-[50%] bg-black/10 blur-sm" />
                <PetPortrait
                  petId={p.id}
                  name={p.name}
                  animated={isOwned}
                  level={isOwned ? (petStatsById[p.id]?.level ?? 1) : undefined}
                  className={`relative h-[88%] w-[88%] drop-shadow-[0_7px_6px_rgba(80,57,28,.16)] ${isOwned ? "" : "opacity-75 saturate-50"}`}
                />
                {isOwned && (
                  <span className="absolute right-1.5 top-1.5 grid h-[22px] w-[22px] place-items-center rounded-full shadow-[0_3px_0_#5C9C31]" style={{ background: isActive ? "#F5822B" : "#7CC24A" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4.5 4.5L19 7" />
                    </svg>
                  </span>
                )}
                {isOwned && <span className="absolute left-1.5 top-1.5 rounded-full bg-[#59422F] px-2 py-0.5 font-baloo text-[10px] font-extrabold text-white">×{petCopies[p.id] ?? 1}</span>}
              </div>
              <div className="font-baloo text-[10px] font-semibold text-[#8A7A62]">{t(p.species)}</div>
              <button
                onClick={() => buy(p.id, p.name, p.rarity)}
                disabled={isActive}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl py-2 font-baloo text-sm font-extrabold transition-transform active:translate-y-[3px] disabled:active:translate-y-0"
                style={
                  isActive
                    ? { background: "#F5822B", color: "#fff", boxShadow: "0 4px 0 #C9631A" }
                    : isOwned
                      ? { background: "#7CC24A", color: "#fff", boxShadow: "0 4px 0 #5C9C31" }
                      : p.currency === "gem"
                        ? { background: "#FBC6D4", color: "#8E3B55", boxShadow: "0 4px 0 #E293A9" }
                        : { background: "#FFD75E", color: "#7A5410", boxShadow: "0 4px 0 #D9A517" }
                }
              >
                {isActive ? t("Đang dùng") : isOwned ? t("Chọn") : p.currency === "gem" ? <GemIcon size={14} /> : <CoinIcon size={14} />}
                {!isOwned && p.price}
              </button>
            </div>
          );
        })}
      </div>
      {fusionReward && <FusionCelebration result={fusionReward} onClose={() => setFusionReward(null)} />}
      {pendingFusionRarity && (
        <FusionPetPicker
          rarity={pendingFusionRarity}
          petCopies={petCopies}
          petEggs={petEggs}
          petStatsById={petStatsById}
          busy={fusingRarity !== null}
          onCancel={() => setPendingFusionRarity(null)}
          onConfirm={(materials) => fuse(pendingFusionRarity, materials)}
        />
      )}
    </div>
  );
}
