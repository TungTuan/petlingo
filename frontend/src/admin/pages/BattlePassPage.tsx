import { useEffect, useState } from "react";
import {
  api,
  ApiError,
  type AdminBattlePassSeason,
  type AdminBattlePassTier,
  type AdminItem,
  type BattlePassRewardKind,
  type BattlePassSeasonInput,
  type BattlePassTierInput,
} from "../../lib/api";
import { Badge, Button, EmptyState, Modal, Select, TextInput } from "../ui";

const REWARD_KINDS: BattlePassRewardKind[] = ["coins", "gems", "commonShards", "rareShards", "epicShards", "petEggCommon", "petEggRare", "petEggEpic", "petEggLegendary", "item"];
const REWARD_KIND_LABEL: Record<BattlePassRewardKind, string> = {
  coins: "Coin",
  gems: "Gem",
  commonShards: "Mảnh ghép Common",
  rareShards: "Mảnh ghép Rare",
  epicShards: "Mảnh ghép Epic",
  petEggCommon: "Trứng pet Common (random)",
  petEggRare: "Trứng pet Rare (random)",
  petEggEpic: "Trứng pet Epic (random)",
  petEggLegendary: "Trứng pet Legendary (random)",
  item: "Vật phẩm trong Shop",
};

function rewardSummary(kind: BattlePassRewardKind, amount: number, itemKey: string | null, items: AdminItem[]) {
  if (kind === "item") {
    const item = items.find((i) => i.key === itemKey);
    return `${item?.name ?? itemKey ?? "?"} ×${amount}`;
  }
  if (kind.startsWith("petEgg")) return REWARD_KIND_LABEL[kind];
  return `${REWARD_KIND_LABEL[kind]} ×${amount}`;
}

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

const EMPTY_SEASON: BattlePassSeasonInput = { name: "", startsAt: "", endsAt: "" };
const EMPTY_TIER: BattlePassTierInput = { tier: 1, xpRequired: 100, freeRewardKind: "coins", freeRewardAmount: 50, freeRewardItemKey: null, vipRewardKind: "gems", vipRewardAmount: 5, vipRewardItemKey: null };

export default function BattlePassPage() {
  const [seasons, setSeasons] = useState<AdminBattlePassSeason[] | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<AdminBattlePassSeason | null>(null);
  const [tiers, setTiers] = useState<AdminBattlePassTier[] | null>(null);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [error, setError] = useState("");

  const [editingSeason, setEditingSeason] = useState<AdminBattlePassSeason | "new" | null>(null);
  const [editingTier, setEditingTier] = useState<AdminBattlePassTier | "new" | null>(null);

  async function loadSeasons() {
    try {
      const { seasons } = await api.adminListBattlePassSeasons();
      setSeasons(seasons);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách mùa.");
    }
  }
  async function loadTiers(season: AdminBattlePassSeason) {
    try {
      const { tiers } = await api.adminListBattlePassTiers(season.id);
      setTiers(tiers);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách mốc.");
    }
  }

  useEffect(() => {
    loadSeasons();
    api.adminListItems().then(({ items }) => setItems(items)).catch(() => {});
  }, []);

  function pickSeason(season: AdminBattlePassSeason) {
    setSelectedSeason(season);
    setTiers(null);
    loadTiers(season);
  }

  const now = Date.now();
  function seasonStatus(s: AdminBattlePassSeason): "current" | "upcoming" | "ended" {
    const starts = new Date(s.startsAt).getTime();
    const ends = new Date(s.endsAt).getTime();
    if (now < starts) return "upcoming";
    if (now > ends) return "ended";
    return "current";
  }

  async function deleteSeason(season: AdminBattlePassSeason) {
    if (!confirm(`Xoá mùa "${season.name}"? Toàn bộ mốc và tiến độ trẻ trong mùa này cũng bị xoá.`)) return;
    try {
      await api.adminDeleteBattlePassSeason(season.id);
      if (selectedSeason?.id === season.id) {
        setSelectedSeason(null);
        setTiers(null);
      }
      await loadSeasons();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được mùa.");
    }
  }
  async function deleteTier(tier: AdminBattlePassTier) {
    if (!confirm(`Xoá mốc ${tier.tier}?`)) return;
    try {
      await api.adminDeleteBattlePassTier(tier.id);
      if (selectedSeason) await loadTiers(selectedSeason);
      loadSeasons();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được mốc.");
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Quản lý Battle Pass</h1>
        <p className="text-sm text-ink/50">Mỗi mùa kéo dài theo ngày bắt đầu/kết thúc tự đặt — trẻ chỉ thấy đúng 1 mùa đang trong khoảng ngày đó, XP reset mỗi mùa mới.</p>
      </div>
      {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}

      <div className="grid flex-1 grid-cols-[320px_1fr] gap-4 overflow-hidden">
        {/* Seasons column */}
        <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wide text-ink/50">Mùa ({seasons?.length ?? "…"})</span>
            <Button variant="ghost" onClick={() => setEditingSeason("new")}>
              + Mùa
            </Button>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
            {seasons?.map((season) => {
              const status = seasonStatus(season);
              return (
                <div
                  key={season.id}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm ${selectedSeason?.id === season.id ? "border-brand-orange bg-[#FFF1DE]" : "border-transparent hover:bg-cream"}`}
                >
                  <button onClick={() => pickSeason(season)} className="flex flex-1 flex-col items-start gap-0.5 text-left">
                    <span className="flex items-center gap-2 font-semibold">
                      {season.name}
                      {status === "current" && <Badge tone="green">Đang chạy</Badge>}
                      {status === "upcoming" && <Badge tone="purple">Sắp tới</Badge>}
                      {status === "ended" && <Badge tone="gray">Đã kết thúc</Badge>}
                    </span>
                    <span className="text-xs text-ink/40">
                      {toDateInput(season.startsAt)} → {toDateInput(season.endsAt)} · {season._count.tiers} mốc
                    </span>
                  </button>
                  <button onClick={() => setEditingSeason(season)} className="text-xs text-ink/40 hover:text-brand-orange" title="Sửa">
                    ✎
                  </button>
                  <button onClick={() => deleteSeason(season)} className="text-xs text-ink/40 hover:text-[#B3402F]" title="Xoá">
                    ✕
                  </button>
                </div>
              );
            })}
            {seasons?.length === 0 && <EmptyState>Chưa có mùa nào — thêm 1 mùa để bắt đầu soạn mốc thưởng.</EmptyState>}
          </div>
        </div>

        {/* Tiers column */}
        <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between px-1">
            <span className="truncate text-xs font-bold uppercase tracking-wide text-ink/50">{selectedSeason ? `Mốc thưởng · ${selectedSeason.name}` : "Mốc thưởng"}</span>
            {selectedSeason && (
              <Button variant="ghost" onClick={() => setEditingTier("new")}>
                + Mốc
              </Button>
            )}
          </div>
          {!selectedSeason ? (
            <EmptyState>Chọn 1 mùa bên trái để soạn mốc thưởng (tối đa 30 mốc/mùa).</EmptyState>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {tiers?.length === 0 && <EmptyState>Chưa có mốc nào — bấm "+ Mốc" để thêm mốc đầu tiên.</EmptyState>}
              {tiers && tiers.length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Mốc</th>
                      <th className="px-3 py-2 font-semibold">XP cần</th>
                      <th className="px-3 py-2 font-semibold">Quà miễn phí</th>
                      <th className="px-3 py-2 font-semibold">Quà VIP</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((t) => (
                      <tr key={t.id} className="border-b border-line last:border-0 hover:bg-cream/40">
                        <td className="px-3 py-2 font-bold">{t.tier}</td>
                        <td className="px-3 py-2 text-ink/60">{t.xpRequired}</td>
                        <td className="px-3 py-2">{rewardSummary(t.freeRewardKind, t.freeRewardAmount, t.freeRewardItemKey, items)}</td>
                        <td className="px-3 py-2 text-[#6E56A8]">{rewardSummary(t.vipRewardKind, t.vipRewardAmount, t.vipRewardItemKey, items)}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setEditingTier(t)}>
                              Sửa
                            </Button>
                            <Button variant="danger" onClick={() => deleteTier(t)}>
                              Xoá
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {editingSeason && (
        <SeasonForm
          initial={editingSeason === "new" ? EMPTY_SEASON : editingSeason}
          onClose={() => setEditingSeason(null)}
          onSaved={() => {
            setEditingSeason(null);
            loadSeasons();
          }}
        />
      )}
      {editingTier && selectedSeason && (
        <TierForm
          seasonId={selectedSeason.id}
          items={items}
          initial={editingTier === "new" ? EMPTY_TIER : editingTier}
          onClose={() => setEditingTier(null)}
          onSaved={() => {
            setEditingTier(null);
            if (selectedSeason) loadTiers(selectedSeason);
            loadSeasons(); // keeps the sidebar's "N mốc" count in sync
          }}
        />
      )}
    </div>
  );
}

function SeasonForm({ initial, onClose, onSaved }: { initial: BattlePassSeasonInput | AdminBattlePassSeason; onClose: () => void; onSaved: () => void }) {
  const editingSeason = "id" in initial ? initial : null;
  const [name, setName] = useState(editingSeason ? editingSeason.name : (initial as BattlePassSeasonInput).name);
  const [startsAt, setStartsAt] = useState(editingSeason ? toDateInput(editingSeason.startsAt) : "");
  const [endsAt, setEndsAt] = useState(editingSeason ? toDateInput(editingSeason.endsAt) : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function defaultTo30Days(start: string) {
    if (!start) return "";
    const d = new Date(start);
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const input = { name, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() };
      if (editingSeason) await api.adminUpdateBattlePassSeason(editingSeason.id, input);
      else await api.adminCreateBattlePassSeason(input);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được mùa.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingSeason ? `Sửa mùa: ${editingSeason.name}` : "Thêm mùa mới"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextInput label="Tên mùa" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mùa 1" />
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Ngày bắt đầu"
            type="date"
            required
            value={startsAt}
            onChange={(e) => {
              const v = e.target.value;
              setStartsAt(v);
              if (!endsAt) setEndsAt(defaultTo30Days(v));
            }}
          />
          <TextInput label="Ngày kết thúc" type="date" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
        <p className="text-xs text-ink/40">Mặc định gợi ý 30 ngày kể từ ngày bắt đầu — sửa lại nếu muốn mùa dài/ngắn hơn.</p>
        {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RewardFields({ label, kind, amount, itemKey, items, onChange }: {
  label: string;
  kind: BattlePassRewardKind;
  amount: number;
  itemKey: string | null;
  items: AdminItem[];
  onChange: (next: { kind: BattlePassRewardKind; amount: number; itemKey: string | null }) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <span className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</span>
      <Select value={kind} onChange={(e) => onChange({ kind: e.target.value as BattlePassRewardKind, amount, itemKey })}>
        {REWARD_KINDS.map((k) => (
          <option key={k} value={k}>
            {REWARD_KIND_LABEL[k]}
          </option>
        ))}
      </Select>
      {kind === "item" ? (
        <Select value={itemKey ?? ""} onChange={(e) => onChange({ kind, amount, itemKey: e.target.value || null })}>
          <option value="">— Chọn vật phẩm —</option>
          {items.map((i) => (
            <option key={i.key} value={i.key}>
              {i.name}
            </option>
          ))}
        </Select>
      ) : null}
      {!kind.startsWith("petEgg") && (
        <TextInput
          label={kind === "item" ? "Số lượng" : "Số lượng"}
          type="number"
          min={0}
          required
          value={amount}
          onChange={(e) => onChange({ kind, amount: +e.target.value, itemKey })}
        />
      )}
      {kind.startsWith("petEgg") && <p className="text-xs text-ink/40">Random 1 pet đúng bậc hiếm này — trùng bản đã có thì quy đổi thành mảnh ghép/coin, không cần nhập số lượng.</p>}
    </div>
  );
}

function TierForm({ seasonId, items, initial, onClose, onSaved }: { seasonId: string; items: AdminItem[]; initial: BattlePassTierInput | AdminBattlePassTier; onClose: () => void; onSaved: () => void }) {
  const editingTier = "id" in (initial as AdminBattlePassTier) ? (initial as AdminBattlePassTier) : null;
  const [form, setForm] = useState<BattlePassTierInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingTier) await api.adminUpdateBattlePassTier(editingTier.id, form);
      else await api.adminCreateBattlePassTier(seasonId, form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được mốc.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingTier ? `Sửa mốc ${editingTier.tier}` : "Thêm mốc mới"} wide onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Số mốc (1–30)" type="number" min={1} max={30} required value={form.tier} onChange={(e) => setForm({ ...form, tier: +e.target.value })} />
          <TextInput label="XP tích luỹ cần đạt" type="number" min={0} required value={form.xpRequired} onChange={(e) => setForm({ ...form, xpRequired: +e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <RewardFields
            label="Quà — Miễn phí"
            kind={form.freeRewardKind}
            amount={form.freeRewardAmount}
            itemKey={form.freeRewardItemKey}
            items={items}
            onChange={({ kind, amount, itemKey }) => setForm({ ...form, freeRewardKind: kind, freeRewardAmount: amount, freeRewardItemKey: itemKey })}
          />
          <RewardFields
            label="Quà — VIP"
            kind={form.vipRewardKind}
            amount={form.vipRewardAmount}
            itemKey={form.vipRewardItemKey}
            items={items}
            onChange={({ kind, amount, itemKey }) => setForm({ ...form, vipRewardKind: kind, vipRewardAmount: amount, vipRewardItemKey: itemKey })}
          />
        </div>
        {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
