import { useEffect, useState } from "react";
import { api, ApiError, type MyStory, type MyStoryPage, type StoryInput, type StoryPageInput } from "../../lib/api";
import { Badge, Button, EmptyState, Modal, TextInput } from "../ui";

const EMPTY_STORY: StoryInput = { key: "", title: "", topic: "", colorTheme: "#9B7EDE", order: 0, isActive: true };
const EMPTY_PAGE: StoryPageInput = { en: "", vi: "", img1: "", img2: "", label: "", sceneBg: "#CFEAF6", ground: "#EAF6E4", words: [], order: 0 };

export default function StoriesPage() {
  const [stories, setStories] = useState<MyStory[] | null>(null);
  const [selectedStory, setSelectedStory] = useState<MyStory | null>(null);
  const [pages, setPages] = useState<MyStoryPage[] | null>(null);
  const [error, setError] = useState("");

  const [editingStory, setEditingStory] = useState<MyStory | "new" | null>(null);
  const [editingPage, setEditingPage] = useState<MyStoryPage | "new" | null>(null);

  async function loadStories() {
    try {
      const { stories } = await api.adminListStories();
      setStories(stories);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách truyện.");
    }
  }
  async function loadPages(story: MyStory) {
    try {
      const { pages } = await api.adminListStoryPages(story.id);
      setPages(pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách trang.");
    }
  }

  useEffect(() => {
    loadStories();
  }, []);

  function pickStory(s: MyStory) {
    setSelectedStory(s);
    setPages(null);
    loadPages(s);
  }

  async function deleteStory(s: MyStory) {
    if (!confirm(`Xoá truyện "${s.title}"? Toàn bộ trang bên trong cũng bị xoá.`)) return;
    try {
      await api.adminDeleteStory(s.id);
      if (selectedStory?.id === s.id) {
        setSelectedStory(null);
        setPages(null);
      }
      await loadStories();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được truyện.");
    }
  }
  async function deletePage(p: MyStoryPage) {
    if (!confirm(`Xoá trang #${p.order + 1}?`)) return;
    try {
      await api.adminDeleteStoryPage(p.id);
      if (selectedStory) await loadPages(selectedStory);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được trang.");
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <h1 className="text-xl font-bold">Quản lý truyện</h1>
      {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}

      <div className="grid flex-1 grid-cols-2 gap-4 overflow-hidden">
        {/* Stories column */}
        <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wide text-ink/50">Truyện ({stories?.length ?? "…"})</span>
            <Button variant="ghost" onClick={() => setEditingStory("new")}>
              + Truyện
            </Button>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
            {stories?.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm ${selectedStory?.id === s.id ? "border-brand-orange bg-[#FFF1DE]" : "border-transparent hover:bg-cream"}`}
              >
                <button onClick={() => pickStory(s)} className="flex flex-1 items-center gap-2 text-left">
                  <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: s.colorTheme }} />
                  <span className="flex-1 truncate font-semibold">{s.title}</span>
                  <span className="text-xs text-ink/40">{s._count.pages} trang</span>
                  {!s.isActive && <Badge tone="gray">Ẩn</Badge>}
                </button>
                <button onClick={() => setEditingStory(s)} className="text-xs text-ink/40 hover:text-brand-orange" title="Sửa">
                  ✎
                </button>
                <button onClick={() => deleteStory(s)} className="text-xs text-ink/40 hover:text-[#B3402F]" title="Xoá">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pages column */}
        <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between px-1">
            <span className="truncate text-xs font-bold uppercase tracking-wide text-ink/50">{selectedStory ? `Trang · ${selectedStory.title}` : "Trang"}</span>
            {selectedStory && (
              <Button variant="ghost" onClick={() => setEditingPage("new")}>
                + Trang
              </Button>
            )}
          </div>
          {!selectedStory ? (
            <EmptyState>Chọn 1 truyện bên trái để xem trang.</EmptyState>
          ) : (
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
              {pages?.length === 0 && <EmptyState>Chưa có trang nào.</EmptyState>}
              {pages?.map((p, i) => (
                <div key={p.id} className="flex flex-col gap-1 rounded-lg border border-transparent px-2.5 py-2 text-sm hover:bg-cream">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 text-xs text-ink/40">#{i + 1}</span>
                    <span className="flex-1 font-semibold">{p.en}</span>
                    <button onClick={() => setEditingPage(p)} className="text-xs text-ink/40 hover:text-brand-orange" title="Sửa">
                      ✎
                    </button>
                    <button onClick={() => deletePage(p)} className="text-xs text-ink/40 hover:text-[#B3402F]" title="Xoá">
                      ✕
                    </button>
                  </div>
                  <span className="pl-5 text-xs text-ink/50">{p.vi}</span>
                  {p.words.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-5">
                      {p.words.map((w) => (
                        <span key={w.en} className="rounded-full px-2 py-0.5 text-xs" style={{ background: `${w.color}22`, color: w.color }}>
                          {w.en} · {w.vi}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingStory && (
        <StoryForm
          initial={editingStory === "new" ? EMPTY_STORY : editingStory}
          onClose={() => setEditingStory(null)}
          onSaved={() => {
            setEditingStory(null);
            loadStories();
          }}
        />
      )}
      {editingPage && selectedStory && (
        <StoryPageForm
          storyId={selectedStory.id}
          initial={editingPage === "new" ? EMPTY_PAGE : editingPage}
          onClose={() => setEditingPage(null)}
          onSaved={() => {
            setEditingPage(null);
            if (selectedStory) loadPages(selectedStory);
          }}
        />
      )}
    </div>
  );
}

function StoryForm({ initial, onClose, onSaved }: { initial: StoryInput; onClose: () => void; onSaved: () => void }) {
  const editingStory = "id" in (initial as MyStory) ? (initial as unknown as MyStory) : null;
  const [form, setForm] = useState<StoryInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingStory) await api.adminUpdateStory(editingStory.id, form);
      else await api.adminCreateStory(form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được truyện.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingStory ? `Sửa truyện: ${editingStory.title}` : "Thêm truyện mới"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Key (slug)" required disabled={!!editingStory} pattern="[a-z0-9-]+" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <TextInput label="Tên truyện" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <TextInput label="Chủ đề" required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Màu chủ đạo" required type="color" value={form.colorTheme} onChange={(e) => setForm({ ...form, colorTheme: e.target.value })} className="h-10 p-1" />
          <TextInput label="Thứ tự" type="number" required value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Hiện trong danh sách truyện
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

function StoryPageForm({ storyId, initial, onClose, onSaved }: { storyId: string; initial: StoryPageInput | MyStoryPage; onClose: () => void; onSaved: () => void }) {
  const editingPage = "id" in (initial as MyStoryPage) ? (initial as unknown as MyStoryPage) : null;
  const [form, setForm] = useState<StoryPageInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function setWord(i: number, field: "en" | "vi" | "color", value: string) {
    setForm((f) => ({ ...f, words: f.words.map((w, idx) => (idx === i ? { ...w, [field]: value } : w)) }));
  }
  function addWord() {
    if (form.words.length >= 6) return;
    setForm((f) => ({ ...f, words: [...f.words, { en: "", vi: "", color: "#F5822B" }] }));
  }
  function removeWord(i: number) {
    setForm((f) => ({ ...f, words: f.words.filter((_, idx) => idx !== i) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const cleanWords = form.words.filter((w) => w.en.trim() && w.vi.trim());
    const payload = { ...form, words: cleanWords };
    try {
      if (editingPage) await api.adminUpdateStoryPage(editingPage.id, payload);
      else await api.adminCreateStoryPage(storyId, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được trang.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingPage ? `Sửa trang #${editingPage.order + 1}` : "Thêm trang mới"} onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextInput label="Câu tiếng Anh" required value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })} placeholder="Buddy sees a star." />
        <TextInput label="Câu tiếng Việt" required value={form.vi} onChange={(e) => setForm({ ...form, vi: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Pet minh hoạ 1 (key)" required value={form.img1} onChange={(e) => setForm({ ...form, img1: e.target.value })} placeholder="buddy" />
          <TextInput label="Pet minh hoạ 2 (key)" required value={form.img2} onChange={(e) => setForm({ ...form, img2: e.target.value })} placeholder="whiskers" />
        </div>
        <TextInput label="Tên bối cảnh" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Sân sau nhà" />
        <div className="grid grid-cols-3 gap-3">
          <TextInput label="Màu nền trời" required type="color" value={form.sceneBg} onChange={(e) => setForm({ ...form, sceneBg: e.target.value })} className="h-10 p-1" />
          <TextInput label="Màu nền đất" required type="color" value={form.ground} onChange={(e) => setForm({ ...form, ground: e.target.value })} className="h-10 p-1" />
          <TextInput label="Thứ tự" type="number" required value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/80">Từ mới trang này (tuỳ chọn, tối đa 6)</span>
          {form.words.map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <TextInput value={w.en} onChange={(e) => setWord(i, "en", e.target.value)} className="flex-1" placeholder="star" />
              <TextInput value={w.vi} onChange={(e) => setWord(i, "vi", e.target.value)} className="flex-1" placeholder="ngôi sao" />
              <TextInput type="color" value={w.color} onChange={(e) => setWord(i, "color", e.target.value)} className="h-9 w-12 p-1" />
              <button type="button" onClick={() => removeWord(i)} className="text-ink/40 hover:text-[#B3402F]">
                ✕
              </button>
            </div>
          ))}
          {form.words.length < 6 && (
            <Button type="button" variant="ghost" onClick={addWord} className="w-fit">
              + Thêm từ
            </Button>
          )}
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
