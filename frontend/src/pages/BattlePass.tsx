import { useEffect, useState } from "react";
import { BackIcon, CoinIcon, GemIcon } from "../components/ui";
import { useT } from "../lib/i18n";
import { api, ApiError, type BattlePassRewardKind, type BattlePassState } from "../lib/api";

interface BattlePassProps {
  childId: string;
  coins: number;
  gems: number;
  /** Claiming a tier can grant coins/gems/pets — the coin/gem HUD numbers up
   * top come from App.tsx's own `progress` state, not this screen's local
   * Battle Pass state, so they need an explicit refresh after every claim. */
  onRefreshProgress: () => void;
  onExit: () => void;
}

const REWARD_ICON: Record<BattlePassRewardKind, string> = {
  coins: "🪙",
  gems: "💎",
  commonShards: "🧩",
  rareShards: "🧩",
  epicShards: "🧩",
  petEggCommon: "🥚",
  petEggRare: "🥚",
  petEggEpic: "🥚",
  petEggLegendary: "🥚",
  item: "🎁",
};

function rewardLabel(kind: BattlePassRewardKind, amount: number): string {
  if (kind.startsWith("petEgg")) return "?";
  return `×${amount}`;
}

function daysLeft(endsAt: string): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000));
}

/** Battle Pass — seasonal 30-tier ladder, tách riêng hoàn toàn khỏi Premium
 * (xem backend's schema.prisma's doc comment). 2 track song song: "Miễn phí"
 * (ai cũng nhận được khi đủ XP) và "VIP" (cần mua gói VIP mùa riêng). XP đến
 * từ làm ĐỦ nhiệm vụ hằng ngày (+120đ/ngày) — không có cách nào khác để tăng
 * XP, tránh biến thành "trả tiền mua XP" trá hình. */
export default function BattlePass({ childId, coins, gems, onRefreshProgress, onExit }: BattlePassProps) {
  const t = useT();
  const [state, setState] = useState<BattlePassState | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setState(await api.getBattlePass(childId));
    } catch (err) {
      setMsg(err instanceof ApiError ? t(err.message) : t("Không tải được Battle Pass, thử lại nhé."));
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  async function claim(tier: number, track: "free" | "vip") {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const result = await api.claimBattlePassTier(childId, tier, track);
      setState(result.state);
      onRefreshProgress();
      setMsg(t("Đã nhận thưởng!"));
    } catch (err) {
      setMsg(err instanceof ApiError ? t(err.message) : t("Không nhận được thưởng, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  async function claimAll() {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const result = await api.claimAllBattlePass(childId);
      setState(result.state);
      if (result.claimed.length > 0) onRefreshProgress();
      setMsg(result.claimed.length > 0 ? `${t("Đã nhận")} ${result.claimed.length} ${t("phần quà!")}` : t("Chưa có phần quà nào mới để nhận."));
    } catch (err) {
      setMsg(err instanceof ApiError ? t(err.message) : t("Không nhận được thưởng, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  async function buyVip() {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      setState(await api.activateVipSeason(childId));
      setMsg(t("Đã mở VIP mùa này!"));
    } catch (err) {
      setMsg(err instanceof ApiError ? t(err.message) : t("Không mở được VIP, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  const header = (
    <div className="flex items-center gap-3.5 border-b-[3px] border-[#3A2E5C] bg-[#241A3D] p-4">
      <button onClick={onExit} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
        <BackIcon />
      </button>
      <span className="font-baloo text-[26px] font-extrabold text-[#FFD75E]">Battle Pass</span>
      <div className="flex-1" />
      <div className="flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#B07A0C] shadow-[0_3px_0_rgba(0,0,0,.2)]">
        <CoinIcon size={19} />
        {coins}
      </div>
      <div className="flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-base font-extrabold text-[#357EAF] shadow-[0_3px_0_rgba(0,0,0,.2)]">
        <GemIcon size={19} />
        {gems}
      </div>
    </div>
  );

  if (!state) {
    return (
      <div className="flex h-full flex-col bg-[#1B1237]">
        {header}
        <div className="grid flex-1 place-items-center font-baloo text-lg font-bold text-white/50">{msg || t("Đang tải…")}</div>
      </div>
    );
  }

  if (!state.season) {
    return (
      <div className="flex h-full flex-col bg-[#1B1237]">
        {header}
        <div className="grid flex-1 place-items-center px-8 text-center font-baloo text-lg font-bold text-white/60">
          {t("Hiện chưa có mùa Battle Pass nào — quay lại sau nhé!")}
        </div>
      </div>
    );
  }

  const maxXp = state.tiers.length > 0 ? state.tiers[state.tiers.length - 1]!.xpRequired : 0;
  const pct = maxXp > 0 ? Math.min(100, (state.xp / maxXp) * 100) : 0;
  const hasUnclaimed = state.tiers.some((t) => (state.xp >= t.xpRequired && !t.freeClaimed) || (state.hasVip && state.xp >= t.xpRequired && !t.vipClaimed));

  return (
    <div className="flex h-full flex-col bg-[#1B1237]">
      {header}

      <div className="flex items-center gap-4 border-b-[3px] border-[#3A2E5C] bg-[#241A3D] px-5.5 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between font-baloo text-sm font-bold text-white/85">
            <span>{state.season.name}</span>
            <span>
              {state.xp} / {maxXp} XP
            </span>
          </div>
          <div className="mt-1.5 h-4 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-[#F5822B] to-[#FFD75E] transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="shrink-0 font-baloo text-xs font-bold text-white/50">
          {t("Còn")} {daysLeft(state.season.endsAt)} {t("ngày")}
        </div>
      </div>

      {!state.hasVip && (
        <button
          onClick={buyVip}
          disabled={busy}
          className="mx-5.5 mt-3.5 flex items-center justify-between gap-3 rounded-2xl border-[3px] border-[#FFD75E] bg-gradient-to-r from-[#7A4FBF] to-[#5B3D91] px-5 py-3.5 text-left shadow-[0_5px_0_#4A3170] transition-transform active:translate-y-1 disabled:opacity-60"
        >
          <span className="font-baloo text-base font-extrabold text-[#FFD75E]">👑 {t("Mở VIP mùa này — nhận thêm quà ở mọi mốc")}</span>
          <span className="rounded-xl bg-[#FFD75E] px-4 py-2 font-baloo text-sm font-extrabold text-[#5B3D91]">{t("Mở ngay")}</span>
        </button>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5.5 py-3.5">
        <div className="flex gap-3 px-1 font-baloo text-[11px] font-extrabold uppercase tracking-wide text-white/40">
          <span className="w-11 shrink-0" />
          <span className="flex-1">{t("Miễn phí")}</span>
          <span className="flex-1 text-[#FFD75E]">VIP</span>
        </div>
        {state.tiers.map((tr) => {
          const unlocked = state.xp >= tr.xpRequired;
          return (
            <div key={tr.tier} className="flex items-center gap-3 rounded-2xl border-[3px] border-[#3A2E5C] bg-[#241A3D] p-2.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-baloo text-sm font-extrabold text-white" style={{ background: unlocked ? "#F5822B" : "#3A2E5C" }}>
                {tr.tier}
              </div>
              <RewardCell kind={tr.freeRewardKind} amount={tr.freeRewardAmount} unlocked={unlocked} claimed={tr.freeClaimed} needsVip={false} busy={busy} onClaim={() => claim(tr.tier, "free")} />
              <RewardCell kind={tr.vipRewardKind} amount={tr.vipRewardAmount} unlocked={unlocked} claimed={tr.vipClaimed} needsVip={!state.hasVip} busy={busy} onClaim={() => claim(tr.tier, "vip")} vip />
            </div>
          );
        })}
        {state.tiers.length === 0 && <div className="grid flex-1 place-items-center font-baloo text-base font-bold text-white/40">{t("Mùa này chưa có mốc thưởng nào.")}</div>}
      </div>

      <div className="flex items-center gap-3.5 border-t-[3px] border-[#3A2E5C] bg-[#241A3D] px-5.5 py-3.5">
        <button
          onClick={claimAll}
          disabled={busy || !hasUnclaimed}
          className="rounded-2xl bg-brand-green px-8 py-3.5 font-baloo text-lg font-extrabold text-white shadow-[0_5px_0_#5C9C31] transition-transform active:translate-y-1 disabled:opacity-40"
        >
          {t("Nhận tất cả")}
        </button>
        <div className="font-baloo text-sm font-bold text-white/70">{msg}</div>
      </div>
    </div>
  );
}

function RewardCell({ kind, amount, unlocked, claimed, needsVip, busy, onClaim, vip }: {
  kind: BattlePassRewardKind;
  amount: number;
  unlocked: boolean;
  claimed: boolean;
  needsVip: boolean;
  busy: boolean;
  onClaim: () => void;
  vip?: boolean;
}) {
  const t = useT();
  const canClaim = unlocked && !claimed && !needsVip;
  return (
    <button
      onClick={canClaim ? onClaim : undefined}
      disabled={!canClaim || busy}
      className={`relative flex flex-1 items-center gap-2.5 rounded-xl border-[3px] px-3 py-2 transition-transform ${canClaim ? "active:translate-y-[2px]" : "cursor-default"}`}
      style={{
        borderColor: claimed ? "#5C9C31" : canClaim ? (vip ? "#FFD75E" : "#F5822B") : "#3A2E5C",
        background: claimed ? "#2C4A1E" : canClaim ? (vip ? "#3D2E5C" : "#3A2A1E") : "#1E1735",
        boxShadow: canClaim ? `0 3px 0 ${vip ? "#B8961F" : "#C9631A"}` : "none",
      }}
    >
      <span className="text-xl">{REWARD_ICON[kind]}</span>
      <span className="flex-1 text-left font-baloo text-[13px] font-extrabold text-white/90">{rewardLabel(kind, amount)}</span>
      {claimed && <span className="text-lg">✅</span>}
      {!claimed && needsVip && <span className="text-base" title={t("Cần VIP")}>🔒</span>}
      {!claimed && !needsVip && !unlocked && <span className="text-base">🔒</span>}
    </button>
  );
}
