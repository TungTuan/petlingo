import { useEffect, useState } from "react";
import { api, ApiError, type AdminPet, type Currency, type PetInput, type Rarity } from "../../lib/api";
import { Badge, Button, Modal, Select, TextInput } from "../ui";

const RARITIES: Rarity[] = ["Common", "Rare", "Epic", "Legendary"];
const RARITY_TONE: Record<Rarity, "gray" | "green" | "purple" | "orange"> = { Common: "gray", Rare: "green", Epic: "purple", Legendary: "orange" };

const EMPTY: PetInput = { key: "", name: "", species: "", rarity: "Common", price: 0, currency: "coin", imagePath: "", order: 0, isActive: true };

export default function PetsPage() {
  const [pets, setPets] = useState<AdminPet[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminPet | "new" | null>(null);

  async function load() {
    try {
      const { pets } = await api.adminListPets();
      setPets(pets);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách pet.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(p: AdminPet) {
    if (!confirm(`Xoá pet "${p.name}"? Trẻ đã sở hữu pet này sẽ không bị mất, nhưng pet sẽ biến mất khỏi Shop.`)) return;
    try {
      await api.adminDeletePet(p.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được pet.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Quản lý Pet ({pets?.length ?? "…"})</h1>
        <Button onClick={() => setEditing("new")}>+ Thêm pet</Button>
      </div>

      {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}

      {pets && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pets.map((p) => (
            <button
              key={p.id}
              onClick={() => setEditing(p)}
              className="flex flex-col items-center gap-2 rounded-xl border border-line bg-white p-3.5 text-left transition-transform hover:-translate-y-0.5 hover:shadow-sm"
              style={{ opacity: p.isActive ? 1 : 0.5 }}
            >
              <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-lg bg-cream">
                <img src={p.imagePath} alt={p.name} className="h-[85%] w-[85%] object-contain" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              </div>
              <div className="flex w-full items-center justify-between gap-1">
                <span className="truncate font-semibold">{p.name}</span>
                <Badge tone={RARITY_TONE[p.rarity]}>{p.rarity}</Badge>
              </div>
              <div className="w-full text-xs text-ink/50">
                {p.species} · {p.price === 0 ? "Free" : `${p.price} ${p.currency}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <PetForm
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

function PetForm({ initial, onClose, onSaved, onDelete }: { initial: PetInput; onClose: () => void; onSaved: () => void; onDelete?: () => void }) {
  const isNew = !("createdAt" in (initial as AdminPet));
  const editingPet = !isNew ? (initial as unknown as AdminPet) : null;
  const [form, setForm] = useState<PetInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingPet) await api.adminUpdatePet(editingPet.id, form);
      else await api.adminCreatePet(form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được pet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingPet ? `Sửa pet: ${editingPet.name}` : "Thêm pet mới"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Key (slug)"
            required
            disabled={!!editingPet}
            pattern="[a-z0-9-]+"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value, imagePath: form.imagePath || `/pets/${e.target.value}.webp` })}
          />
          <TextInput label="Tên hiển thị" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <TextInput label="Loài / mô tả" required value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Độ hiếm" value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value as Rarity })}>
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <Select label="Loại tiền" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}>
            <option value="coin">Coin</option>
            <option value="gem">Gem</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Giá" type="number" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
          <TextInput label="Thứ tự hiển thị" type="number" required value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
        </div>
        <TextInput label="Đường dẫn ảnh" required value={form.imagePath} onChange={(e) => setForm({ ...form, imagePath: e.target.value })} />
        <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Hiện trong Shop
        </label>

        {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}

        <div className="mt-1 flex items-center justify-between">
          {onDelete ? (
            <Button type="button" variant="danger" onClick={onDelete}>
              Xoá pet
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
