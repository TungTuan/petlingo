import { useEffect, useState } from "react";
import { api, ApiError, type MyWordCatchRound, type MyWordCatchTopic, type WordCatchRoundInput, type WordCatchTopicInput } from "../../lib/api";
import { Badge, Button, EmptyState, Modal, TextInput } from "../ui";

const EMPTY_TOPIC: WordCatchTopicInput = { key: "", name: "", order: 0, isActive: true };
const EMPTY_ROUND: WordCatchRoundInput = { vi: "", answer: "", options: ["", ""], order: 0 };

export default function WordCatchPage() {
  const [topics, setTopics] = useState<MyWordCatchTopic[] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<MyWordCatchTopic | null>(null);
  const [rounds, setRounds] = useState<MyWordCatchRound[] | null>(null);
  const [error, setError] = useState("");

  const [editingTopic, setEditingTopic] = useState<MyWordCatchTopic | "new" | null>(null);
  const [editingRound, setEditingRound] = useState<MyWordCatchRound | "new" | null>(null);

  async function loadTopics() {
    try {
      const { topics } = await api.adminListWordCatchTopics();
      setTopics(topics);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách chủ đề.");
    }
  }
  async function loadRounds(topic: MyWordCatchTopic) {
    try {
      const { rounds } = await api.adminListWordCatchRounds(topic.id);
      setRounds(rounds);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách lượt chơi.");
    }
  }

  useEffect(() => {
    loadTopics();
  }, []);

  function pickTopic(topic: MyWordCatchTopic) {
    setSelectedTopic(topic);
    setRounds(null);
    loadRounds(topic);
  }

  async function deleteTopic(topic: MyWordCatchTopic) {
    if (!confirm(`Xoá chủ đề "${topic.name}"? Toàn bộ lượt chơi bên trong cũng bị xoá.`)) return;
    try {
      await api.adminDeleteWordCatchTopic(topic.id);
      if (selectedTopic?.id === topic.id) {
        setSelectedTopic(null);
        setRounds(null);
      }
      await loadTopics();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được chủ đề.");
    }
  }
  async function deleteRound(round: MyWordCatchRound) {
    if (!confirm("Xoá lượt chơi này?")) return;
    try {
      await api.adminDeleteWordCatchRound(round.id);
      if (selectedTopic) await loadRounds(selectedTopic);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được lượt chơi.");
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <h1 className="text-xl font-bold">Quản lý Word Catch</h1>
      {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}

      <div className="grid flex-1 grid-cols-2 gap-4 overflow-hidden">
        {/* Topics column */}
        <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wide text-ink/50">Chủ đề ({topics?.length ?? "…"})</span>
            <Button variant="ghost" onClick={() => setEditingTopic("new")}>
              + Chủ đề
            </Button>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
            {topics?.map((topic) => (
              <div
                key={topic.id}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm ${selectedTopic?.id === topic.id ? "border-brand-orange bg-[#FFF1DE]" : "border-transparent hover:bg-cream"}`}
              >
                <button onClick={() => pickTopic(topic)} className="flex flex-1 items-center gap-2 text-left">
                  <span className="flex-1 truncate font-semibold">{topic.name}</span>
                  <span className="text-xs text-ink/40">{topic._count.rounds} lượt</span>
                  {!topic.isActive && <Badge tone="gray">Ẩn</Badge>}
                </button>
                <button onClick={() => setEditingTopic(topic)} className="text-xs text-ink/40 hover:text-brand-orange" title="Sửa">
                  ✎
                </button>
                <button onClick={() => deleteTopic(topic)} className="text-xs text-ink/40 hover:text-[#B3402F]" title="Xoá">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rounds column */}
        <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between px-1">
            <span className="truncate text-xs font-bold uppercase tracking-wide text-ink/50">{selectedTopic ? `Lượt chơi · ${selectedTopic.name}` : "Lượt chơi"}</span>
            {selectedTopic && (
              <Button variant="ghost" onClick={() => setEditingRound("new")}>
                + Lượt chơi
              </Button>
            )}
          </div>
          {!selectedTopic ? (
            <EmptyState>Chọn 1 chủ đề bên trái để xem lượt chơi.</EmptyState>
          ) : (
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
              {rounds?.length === 0 && <EmptyState>Chưa có lượt chơi nào.</EmptyState>}
              {rounds?.map((round) => (
                <div key={round.id} className="flex flex-col gap-1 rounded-lg border border-transparent px-2.5 py-2 text-sm hover:bg-cream">
                  <div className="flex items-start gap-2">
                    <span className="flex-1 font-semibold">{round.vi}</span>
                    <button onClick={() => setEditingRound(round)} className="text-xs text-ink/40 hover:text-brand-orange" title="Sửa">
                      ✎
                    </button>
                    <button onClick={() => deleteRound(round)} className="text-xs text-ink/40 hover:text-[#B3402F]" title="Xoá">
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {round.options.map((o) => (
                      <span key={o} className={`rounded-full px-2 py-0.5 text-xs ${o === round.answer ? "bg-[#EEF9E3] font-bold text-[#4F7C2A]" : "bg-cream text-ink/50"}`}>
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingTopic && (
        <TopicForm
          initial={editingTopic === "new" ? EMPTY_TOPIC : editingTopic}
          onClose={() => setEditingTopic(null)}
          onSaved={() => {
            setEditingTopic(null);
            loadTopics();
          }}
        />
      )}
      {editingRound && selectedTopic && (
        <RoundForm
          topicId={selectedTopic.id}
          initial={editingRound === "new" ? EMPTY_ROUND : editingRound}
          onClose={() => setEditingRound(null)}
          onSaved={() => {
            setEditingRound(null);
            if (selectedTopic) loadRounds(selectedTopic);
          }}
        />
      )}
    </div>
  );
}

function TopicForm({ initial, onClose, onSaved }: { initial: WordCatchTopicInput; onClose: () => void; onSaved: () => void }) {
  const editingTopic = "id" in (initial as MyWordCatchTopic) ? (initial as unknown as MyWordCatchTopic) : null;
  const [form, setForm] = useState<WordCatchTopicInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingTopic) await api.adminUpdateWordCatchTopic(editingTopic.id, form);
      else await api.adminCreateWordCatchTopic(form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được chủ đề.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingTopic ? `Sửa chủ đề: ${editingTopic.name}` : "Thêm chủ đề mới"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Key (slug)" required disabled={!!editingTopic} pattern="[a-z0-9-]+" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <TextInput label="Tên chủ đề" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <TextInput label="Thứ tự" type="number" required value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
        <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Hiện trong danh sách chủ đề
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

function RoundForm({ topicId, initial, onClose, onSaved }: { topicId: string; initial: WordCatchRoundInput | MyWordCatchRound; onClose: () => void; onSaved: () => void }) {
  const editingRound = "id" in (initial as MyWordCatchRound) ? (initial as unknown as MyWordCatchRound) : null;
  const [form, setForm] = useState<WordCatchRoundInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function setOption(i: number, value: string) {
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? value : o)) }));
  }
  function addOption() {
    if (form.options.length >= 6) return;
    setForm((f) => ({ ...f, options: [...f.options, ""] }));
  }
  function removeOption(i: number) {
    if (form.options.length <= 2) return;
    setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const cleanOptions = form.options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError("Cần ít nhất 2 lựa chọn.");
      setBusy(false);
      return;
    }
    if (!cleanOptions.includes(form.answer.trim())) {
      setError("Đáp án phải nằm trong danh sách lựa chọn.");
      setBusy(false);
      return;
    }
    const payload = { ...form, options: cleanOptions, answer: form.answer.trim() };
    try {
      if (editingRound) await api.adminUpdateWordCatchRound(editingRound.id, payload);
      else await api.adminCreateWordCatchRound(topicId, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được lượt chơi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingRound ? "Sửa lượt chơi" : "Thêm lượt chơi mới"} onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextInput label="Nghĩa tiếng Việt (đề bài)" required value={form.vi} onChange={(e) => setForm({ ...form, vi: e.target.value })} />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/80">Lựa chọn (chọn ô tròn cho đáp án đúng)</span>
          {form.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="answer" checked={form.answer !== "" && o === form.answer} onChange={() => setForm({ ...form, answer: o })} />
              <TextInput required value={o} onChange={(e) => setOption(i, e.target.value)} className="flex-1" placeholder={`Lựa chọn ${i + 1}`} />
              {form.options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} className="text-ink/40 hover:text-[#B3402F]">
                  ✕
                </button>
              )}
            </div>
          ))}
          {form.options.length < 6 && (
            <Button type="button" variant="ghost" onClick={addOption} className="w-fit">
              + Thêm lựa chọn
            </Button>
          )}
        </div>

        <TextInput label="Thứ tự" type="number" required value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
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
