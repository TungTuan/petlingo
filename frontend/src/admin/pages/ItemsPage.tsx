import { useEffect, useState } from "react";
import { api, ApiError, type AdminItem, type ItemEffect, type ItemInput } from "../../lib/api";
import { Badge, Button, Modal, Select, TextInput } from "../ui";

type Category = AdminItem["category"];
const CATEGORIES: Category[] = ["food", "toy", "accessory", "special"];
const CATEGORY_LABEL: Record<Category, string> = { food: "Đồ ăn", toy: "Đồ chơi", accessory: "Phụ kiện", special: "Vật phẩm" };
const CATEGORY_TONE: Record<Category, "green" | "orange" | "purple" | "gray"> = { food: "orange", toy: "green", accessory: "purple", special: "gray" };
const STATS: ItemEffect["stat"][] = ["hunger", "happiness", "health", "experience", "coins", "resetLevel"];
const STAT_LABEL: Record<ItemEffect["stat"], string> = { hunger: "Đồ ăn (pet)", happiness: "Vui vẻ (pet)", health: "Sức khoẻ (pet)", experience: "XP pet", coins: "Coin (trẻ)", resetLevel: "Reset level pet" };

const EMPTY: ItemInput = { key: "", name: "", category: "food", color: "#EF6A5A", radius: "12px", description: "", effects: [], price: 0, currency: "coin", imagePath: "", defaultQty: 1, order: 0, isActive: true };

export default function ItemsPage() {
  const [items, setItems] = useState<AdminItem[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminItem | "new" | null>(null);

  async function load() {
    try {
      const { items } = await api.adminListItems();
      setItems(items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách vật phẩm.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(it: AdminItem) {
    if (!confirm(`Xoá vật phẩm "${it.name}"? Trẻ đã có sẽ không bị mất khỏi Kho đồ, nhưng vật phẩm sẽ biến mất khỏi danh mục.`)) return;
    try {
      await api.adminDeleteItem(it.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được vật phẩm.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Quản lý vật phẩm ({items?.length ?? "…"})</h1>
        <Button onClick={() => setEditing("new")}>+ Thêm vật phẩm</Button>
      </div>

      {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}

      {items && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setEditing(it)}
              className="flex flex-col items-center gap-2 rounded-xl border border-line bg-white p-3.5 text-left transition-transform hover:-translate-y-0.5 hover:shadow-sm"
              style={{ opacity: it.isActive ? 1 : 0.5 }}
            >
              <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-lg bg-cream">
                <span className="h-11 w-11" style={{ borderRadius: it.radius, background: it.color }} />
              </div>
              <div className="flex w-full items-center justify-between gap-1">
                <span className="truncate font-semibold">{it.name}</span>
                <Badge tone={CATEGORY_TONE[it.category]}>{CATEGORY_LABEL[it.category]}</Badge>
              </div>
              <div className="w-full text-xs text-ink/50">Cấp sẵn: {it.defaultQty} · {it.effects.length === 0 ? "trang trí" : `${it.effects.length} hiệu ứng`}</div>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <ItemForm
          initial={editing === "new" ? EMPTY : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onDelete={editing !== "new" ? () => remove(editing) : undefined}
        />
      )}
    </div>
  );
}

function ItemForm({ initial, onClose, onSaved, onDelete }: { initial: ItemInput | AdminItem; onClose: () => void; onSaved: () => void; onDelete?: () => void }) {
  const editingItem = "id" in initial ? initial : null;
  const [form, setForm] = useState<ItemInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function setEffect(i: number, patch: Partial<ItemEffect>) {
    setForm((f) => ({ ...f, effects: f.effects.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) }));
  }
  function addEffect() {
    setForm((f) => ({ ...f, effects: [...f.effects, { stat: "hunger", delta: 10 }] }));
  }
  function removeEffect(i: number) {
    setForm((f) => ({ ...f, effects: f.effects.filter((_, idx) => idx !== i) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingItem) await api.adminUpdateItem(editingItem.id, form);
      else await api.adminCreateItem(form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được vật phẩm.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingItem ? `Sửa vật phẩm: ${editingItem.name}` : "Thêm vật phẩm mới"} onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Key (slug)" required disabled={!!editingItem} pattern="[a-z0-9-]+" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <TextInput label="Tên hiển thị" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <TextInput label="Mô tả" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-3 gap-3">
          <Select label="Loại" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
          <TextInput label="Màu" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 p-1" />
          <TextInput label="Bo góc (CSS radius)" required value={form.radius} onChange={(e) => setForm({ ...form, radius: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/80">Hiệu ứng khi dùng (để trống nếu chỉ trang trí)</span>
          {form.effects.map((eff, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select value={eff.stat} onChange={(e) => setEffect(i, { stat: e.target.value as ItemEffect["stat"] })} className="flex-1">
                {STATS.map((s) => (
                  <option key={s} value={s}>
                    {STAT_LABEL[s]}
                  </option>
                ))}
              </Select>
              <TextInput type="number" value={eff.delta} onChange={(e) => setEffect(i, { delta: +e.target.value })} className="w-24" />
              <button type="button" onClick={() => removeEffect(i)} className="text-ink/40 hover:text-[#B3402F]">
                ✕
              </button>
            </div>
          ))}
          <Button type="button" variant="ghost" onClick={addEffect} className="w-fit">
            + Thêm hiệu ứng
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Số lượng cấp sẵn cho trẻ mới"
            type="number"
            min={0}
            required
            value={form.defaultQty}
            onChange={(e) => setForm({ ...form, defaultQty: +e.target.value })}
          />
          <TextInput label="Thứ tự hiển thị" type="number" required value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Hiện trong danh mục (Bag / PetCare)
        </label>

        {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}

        <div className="mt-1 flex items-center justify-between">
          {onDelete ? (
            <Button type="button" variant="danger" onClick={onDelete}>
              Xoá vật phẩm
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
