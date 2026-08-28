import { useEffect, useState } from "react";
import { api, ApiError, type AdminQuest, type DailyQuestInput, type QuestTrackKind } from "../../lib/api";
import { Badge, Button, Modal, Select, TextInput } from "../ui";

const TRACK_KINDS: QuestTrackKind[] = ["lessons", "miniGame", "petCare"];
const TRACK_LABEL: Record<QuestTrackKind, string> = { lessons: "Học bài", miniGame: "Chơi mini-game", petCare: "Chăm pet" };

const EMPTY: DailyQuestInput = { key: "", title: "", trackKind: "lessons", target: 1, rewardCoins: 10, color: "#F5822B", order: 0, isActive: true };

export default function QuestsPage() {
  const [quests, setQuests] = useState<AdminQuest[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminQuest | "new" | null>(null);

  async function load() {
    try {
      const { quests } = await api.adminListQuests();
      setQuests(quests);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách nhiệm vụ.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(q: AdminQuest) {
    if (!confirm(`Xoá nhiệm vụ "${q.title}"?`)) return;
    try {
      await api.adminDeleteQuest(q.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được nhiệm vụ.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Quản lý nhiệm vụ hằng ngày ({quests?.length ?? "…"})</h1>
        <Button onClick={() => setEditing("new")}>+ Thêm nhiệm vụ</Button>
      </div>

      {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}

      {quests && (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Nhiệm vụ</th>
                <th className="px-4 py-3 font-semibold">Theo dõi</th>
                <th className="px-4 py-3 font-semibold">Mục tiêu</th>
                <th className="px-4 py-3 font-semibold">Thưởng</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {quests.map((q) => (
                <tr key={q.id} className="border-b border-line last:border-0 hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <button onClick={() => setEditing(q)} className="flex items-center gap-2.5 font-semibold hover:text-brand-orange hover:underline">
                      <span className="h-6 w-6 shrink-0 rounded-lg" style={{ background: q.color }} />
                      {q.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="purple">{TRACK_LABEL[q.trackKind]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{q.target}</td>
                  <td className="px-4 py-3 font-semibold text-[#B07A0C]">+{q.rewardCoins} coin</td>
                  <td className="px-4 py-3">
                    <Badge tone={q.isActive ? "green" : "gray"}>{q.isActive ? "Đang bật" : "Đã tắt"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setEditing(q)}>
                        Sửa
                      </Button>
                      <Button variant="danger" onClick={() => remove(q)}>
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
        <QuestForm
          initial={editing === "new" ? EMPTY : editing}
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

function QuestForm({ initial, onClose, onSaved }: { initial: DailyQuestInput | AdminQuest; onClose: () => void; onSaved: () => void }) {
  const editingQuest = "id" in initial ? initial : null;
  const [form, setForm] = useState<DailyQuestInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingQuest) await api.adminUpdateQuest(editingQuest.id, form);
      else await api.adminCreateQuest(form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được nhiệm vụ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingQuest ? `Sửa nhiệm vụ: ${editingQuest.title}` : "Thêm nhiệm vụ mới"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Key (slug)" required disabled={!!editingQuest} pattern="[a-z0-9-]+" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <TextInput label="Tên hiển thị" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <Select label="Theo dõi hành động nào" value={form.trackKind} onChange={(e) => setForm({ ...form, trackKind: e.target.value as QuestTrackKind })}>
          {TRACK_KINDS.map((k) => (
            <option key={k} value={k}>
              {TRACK_LABEL[k]}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-3 gap-3">
          <TextInput label="Mục tiêu (số lần)" type="number" min={1} required value={form.target} onChange={(e) => setForm({ ...form, target: +e.target.value })} />
          <TextInput label="Thưởng (coin)" type="number" min={0} required value={form.rewardCoins} onChange={(e) => setForm({ ...form, rewardCoins: +e.target.value })} />
          <TextInput label="Màu" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 p-1" />
        </div>
        <TextInput label="Thứ tự hiển thị" type="number" required value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
        <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Hiện trong "Nhiệm vụ hôm nay"
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
