import { useEffect, useState } from "react";
import { api, ApiError, type MiniGameTopicInput, type MiniGameWordInput, type MyMiniGameTopic, type MyMiniGameWord } from "../../lib/api";
import { Badge, Button, EmptyState, Modal, TextInput } from "../ui";

const EMPTY_TOPIC: MiniGameTopicInput = { key: "", name: "", color: "#7CC24A", order: 0, isActive: true };
const EMPTY_WORD: MiniGameWordInput = { en: "", vi: "", img: "", order: 0 };

export default function MiniGamePage() {
  const [topics, setTopics] = useState<MyMiniGameTopic[] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<MyMiniGameTopic | null>(null);
  const [words, setWords] = useState<MyMiniGameWord[] | null>(null);
  const [error, setError] = useState("");

  const [editingTopic, setEditingTopic] = useState<MyMiniGameTopic | "new" | null>(null);
  const [editingWord, setEditingWord] = useState<MyMiniGameWord | "new" | null>(null);

  async function loadTopics() {
    try {
      const { topics } = await api.adminListMiniGameTopics();
      setTopics(topics);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách chủ đề.");
    }
  }
  async function loadWords(topic: MyMiniGameTopic) {
    try {
      const { words } = await api.adminListMiniGameWords(topic.id);
      setWords(words);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách từ.");
    }
  }

  useEffect(() => {
    loadTopics();
  }, []);

  function pickTopic(topic: MyMiniGameTopic) {
    setSelectedTopic(topic);
    setWords(null);
    loadWords(topic);
  }

  async function deleteTopic(topic: MyMiniGameTopic) {
    if (!confirm(`Xoá chủ đề "${topic.name}"? Toàn bộ cặp từ bên trong cũng bị xoá.`)) return;
    try {
      await api.adminDeleteMiniGameTopic(topic.id);
      if (selectedTopic?.id === topic.id) {
        setSelectedTopic(null);
        setWords(null);
      }
      await loadTopics();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được chủ đề.");
    }
  }
  async function deleteWord(word: MyMiniGameWord) {
    if (!confirm(`Xoá từ "${word.en}"?`)) return;
    try {
      await api.adminDeleteMiniGameWord(word.id);
      if (selectedTopic) await loadWords(selectedTopic);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được từ.");
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <h1 className="text-xl font-bold">Quản lý Memory Match</h1>
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
                  <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: topic.color }} />
                  <span className="flex-1 truncate font-semibold">{topic.name}</span>
                  <span className="text-xs text-ink/40">{topic._count.words} cặp</span>
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

        {/* Words column */}
        <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between px-1">
            <span className="truncate text-xs font-bold uppercase tracking-wide text-ink/50">{selectedTopic ? `Cặp từ · ${selectedTopic.name}` : "Cặp từ"}</span>
            {selectedTopic && (
              <Button variant="ghost" onClick={() => setEditingWord("new")}>
                + Cặp từ
              </Button>
            )}
          </div>
          {!selectedTopic ? (
            <EmptyState>Chọn 1 chủ đề bên trái để xem cặp từ.</EmptyState>
          ) : (
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
              {words?.length === 0 && <EmptyState>Chưa có cặp từ nào.</EmptyState>}
              {words?.map((word) => (
                <div key={word.id} className="flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-sm hover:bg-cream">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cream text-base">{word.img.length <= 2 ? word.img : "🐾"}</span>
                  <span className="flex-1 truncate font-semibold">
                    {word.en} <span className="font-normal text-ink/50">· {word.vi}</span>
                  </span>
                  <button onClick={() => setEditingWord(word)} className="text-xs text-ink/40 hover:text-brand-orange" title="Sửa">
                    ✎
                  </button>
                  <button onClick={() => deleteWord(word)} className="text-xs text-ink/40 hover:text-[#B3402F]" title="Xoá">
                    ✕
                  </button>
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
      {editingWord && selectedTopic && (
        <WordForm
          topicId={selectedTopic.id}
          initial={editingWord === "new" ? EMPTY_WORD : editingWord}
          onClose={() => setEditingWord(null)}
          onSaved={() => {
            setEditingWord(null);
            if (selectedTopic) loadWords(selectedTopic);
          }}
        />
      )}
    </div>
  );
}

function TopicForm({ initial, onClose, onSaved }: { initial: MiniGameTopicInput; onClose: () => void; onSaved: () => void }) {
  const editingTopic = "id" in (initial as MyMiniGameTopic) ? (initial as unknown as MyMiniGameTopic) : null;
  const [form, setForm] = useState<MiniGameTopicInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingTopic) await api.adminUpdateMiniGameTopic(editingTopic.id, form);
      else await api.adminCreateMiniGameTopic(form);
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
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Màu chủ đạo" required type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 p-1" />
          <TextInput label="Thứ tự" type="number" required value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
        </div>
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

function WordForm({ topicId, initial, onClose, onSaved }: { topicId: string; initial: MiniGameWordInput | MyMiniGameWord; onClose: () => void; onSaved: () => void }) {
  const editingWord = "id" in (initial as MyMiniGameWord) ? (initial as unknown as MyMiniGameWord) : null;
  const [form, setForm] = useState<MiniGameWordInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingWord) await api.adminUpdateMiniGameWord(editingWord.id, form);
      else await api.adminCreateMiniGameWord(topicId, form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được từ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingWord ? `Sửa từ: ${editingWord.en}` : "Thêm cặp từ mới"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Từ tiếng Anh" required value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })} />
          <TextInput label="Nghĩa tiếng Việt" required value={form.vi} onChange={(e) => setForm({ ...form, vi: e.target.value })} />
        </div>
        <TextInput label="Ảnh (Pet key hoặc emoji)" required value={form.img} onChange={(e) => setForm({ ...form, img: e.target.value })} placeholder="buddy hoặc 🍎" />
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
