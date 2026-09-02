import { useEffect, useState } from "react";
import { api, ApiError, type AdminItem, type AdminShopPackage, type BattlePassRewardKind, type ShopPackageContentEntry, type ShopPackageInput, type ShopPackageKind } from "../../lib/api";
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
const KIND_LABEL: Record<ShopPackageKind, string> = { combo: "Combo (mua bằng coin/gem)", firstPurchase: "Nạp lần đầu (tiền thật, 1 lần)" };

function contentSummary(c: ShopPackageContentEntry, items: AdminItem[]): string {
  if (c.kind === "item") {
    const item = items.find((i) => i.key === c.itemKey);
    return `${item?.name ?? c.itemKey ?? "?"} ×${c.amount}`;
  }
  if (c.kind.startsWith("petEgg")) return REWARD_KIND_LABEL[c.kind];
  return `${REWARD_KIND_LABEL[c.kind]} ×${c.amount}`;
}

const EMPTY_ENTRY: ShopPackageContentEntry = { kind: "coins", amount: 100, itemKey: null };
const EMPTY_PACKAGE: ShopPackageInput = {
  key: "",
  name: "",
  description: "",
  kind: "combo",
  color: "#FFC93C",
  imagePath: "",
  price: 100,
  currency: "coin",
  realPriceLabel: "",
  contents: [EMPTY_ENTRY],
  order: 0,
  isActive: true,
};

/** Admin CRUD cho "Gói vật phẩm" trong Shop — 2 loại dùng chung 1 model (xem
 * schema.prisma's ShopPackageKind doc comment): "combo" (bán bằng coin/gem
 * thật, mua lại thoải mái) và "firstPurchase" ("Nạp lần đầu" — nhãn giá tiền
 * thật hiển thị thuần, bấm nhận ngay như Premium/VIP demo, chỉ 1 lần/trẻ).
 * Cùng khuôn flat-CRUD-table như QuestsPage.tsx; ô soạn phần thưởng tái dùng
 * đúng UI pattern (Select kind + Select vật phẩm nếu kind="item") đã có ở
 * BattlePassPage.tsx's RewardFields, chỉ khác là `contents` cho phép nhiều
 * dòng (mảng) thay vì đúng 2 slot free/vip cố định. */
export default function ShopPackagesPage() {
  const [packages, setPackages] = useState<AdminShopPackage[] | null>(null);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminShopPackage | "new" | null>(null);

  async function load() {
    try {
      const { packages } = await api.adminListShopPackages();
      setPackages(packages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách gói.");
    }
  }

  useEffect(() => {
    load();
    api.adminListItems().then(({ items }) => setItems(items)).catch(() => {});
  }, []);

  async function remove(p: AdminShopPackage) {
    if (!confirm(`Xoá gói "${p.name}"?`)) return;
    try {
      await api.adminDeleteShopPackage(p.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được gói này.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Gói vật phẩm trong Shop ({packages?.length ?? "…"})</h1>
        <Button onClick={() => setEditing("new")}>+ Thêm gói</Button>
      </div>

      {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}

      {packages && packages.length === 0 && <EmptyState>Chưa có gói nào — bấm "+ Thêm gói" để tạo gói combo hoặc gói nạp lần đầu.</EmptyState>}

      {packages && packages.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Gói</th>
                <th className="px-4 py-3 font-semibold">Loại</th>
                <th className="px-4 py-3 font-semibold">Giá</th>
                <th className="px-4 py-3 font-semibold">Nội dung</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <button onClick={() => setEditing(p)} className="flex items-center gap-2.5 font-semibold hover:text-brand-orange hover:underline">
                      <span className="h-6 w-6 shrink-0 rounded-lg" style={{ background: p.color }} />
                      {p.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.kind === "firstPurchase" ? "orange" : "purple"}>{p.kind === "firstPurchase" ? "Nạp lần đầu" : "Combo"}</Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#B07A0C]">{p.kind === "firstPurchase" ? p.realPriceLabel : `${p.price} ${p.currency === "gem" ? "gem" : "coin"}`}</td>
                  <td className="px-4 py-3 text-ink/60">{p.contents.map((c) => contentSummary(c, items)).join(", ")}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.isActive ? "green" : "gray"}>{p.isActive ? "Đang bật" : "Đã tắt"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setEditing(p)}>
                        Sửa
                      </Button>
                      <Button variant="danger" onClick={() => remove(p)}>
                        Xoá
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PackageForm
          items={items}
          initial={editing === "new" ? EMPTY_PACKAGE : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ContentEntryFields({ entry, items, onChange, onRemove, removable }: {
  entry: ShopPackageContentEntry;
  items: AdminItem[];
  onChange: (next: ShopPackageContentEntry) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <div className="flex items-center justify-between">
        <Select value={entry.kind} onChange={(e) => onChange({ ...entry, kind: e.target.value as BattlePassRewardKind })} className="flex-1">
          {REWARD_KINDS.map((k) => (
            <option key={k} value={k}>
              {REWARD_KIND_LABEL[k]}
            </option>
          ))}
        </Select>
        {removable && (
          <button type="button" onClick={onRemove} className="ml-2 text-sm font-semibold text-[#B3402F] hover:underline">
            Xoá
          </button>
        )}
      </div>
      {entry.kind === "item" ? (
        <Select value={entry.itemKey ?? ""} onChange={(e) => onChange({ ...entry, itemKey: e.target.value || null })}>
          <option value="">— Chọn vật phẩm —</option>
          {items.map((i) => (
            <option key={i.key} value={i.key}>
              {i.name}
            </option>
          ))}
        </Select>
      ) : null}
      {!entry.kind.startsWith("petEgg") && (
        <TextInput label="Số lượng" type="number" min={0} required value={entry.amount} onChange={(e) => onChange({ ...entry, amount: +e.target.value })} />
      )}
      {entry.kind.startsWith("petEgg") && <p className="text-xs text-ink/40">Random 1 pet đúng bậc hiếm này — trùng bản đã có thì quy đổi thành mảnh ghép, không cần nhập số lượng.</p>}
    </div>
  );
}

function PackageForm({ items, initial, onClose, onSaved }: { items: AdminItem[]; initial: ShopPackageInput | AdminShopPackage; onClose: () => void; onSaved: () => void }) {
  const editingPackage = "id" in (initial as AdminShopPackage) ? (initial as AdminShopPackage) : null;
  const [form, setForm] = useState<ShopPackageInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingPackage) await api.adminUpdateShopPackage(editingPackage.id, form);
      else await api.adminCreateShopPackage(form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được gói này.");
    } finally {
      setBusy(false);
    }
  }

  function updateEntry(i: number, next: ShopPackageContentEntry) {
    setForm({ ...form, contents: form.contents.map((c, idx) => (idx === i ? next : c)) });
  }
  function removeEntry(i: number) {
    setForm({ ...form, contents: form.contents.filter((_, idx) => idx !== i) });
  }
  function addEntry() {
    setForm({ ...form, contents: [...form.contents, EMPTY_ENTRY] });
  }

  return (
    <Modal title={editingPackage ? `Sửa gói: ${editingPackage.name}` : "Thêm gói mới"} onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Key (slug)" required disabled={!!editingPackage} pattern="[a-z0-9-]+" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <TextInput label="Tên hiển thị" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <TextInput label="Mô tả ngắn" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Loại gói" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ShopPackageKind })}>
            {(["combo", "firstPurchase"] as const).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </Select>
          <TextInput label="Màu" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 p-1" />
        </div>

        {form.kind === "combo" ? (
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-cream/40 p-3">
            <TextInput label="Giá" type="number" min={1} required value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
            <Select label="Đơn vị" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as "coin" | "gem" })}>
              <option value="coin">Coin</option>
              <option value="gem">Gem</option>
            </Select>
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-cream/40 p-3">
            <TextInput
              label='Nhãn giá tiền thật (vd "49.000đ")'
              required
              value={form.realPriceLabel}
              onChange={(e) => setForm({ ...form, realPriceLabel: e.target.value })}
            />
            <p className="mt-2 text-xs text-ink/40">
              App chưa tích hợp cổng thanh toán thật (App Store/Google Play) — bấm nút này ở màn Shop nhận quà ngay, không trừ gì, giống Premium/VIP mùa. Chỉ nhận được đúng 1 lần cho mỗi trẻ.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink/80">Nội dung gói</span>
          {form.contents.map((c, i) => (
            <ContentEntryFields key={i} entry={c} items={items} onChange={(next) => updateEntry(i, next)} onRemove={() => removeEntry(i)} removable={form.contents.length > 1} />
          ))}
          <Button type="button" variant="ghost" onClick={addEntry} className="self-start">
            + Thêm phần thưởng
          </Button>
        </div>

        <TextInput label="Thứ tự hiển thị" type="number" required value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
        <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Hiện trong Shop (tab "Ưu đãi")
        </label>

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
