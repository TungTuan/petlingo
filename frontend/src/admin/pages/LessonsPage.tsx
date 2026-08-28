import { useEffect, useState } from "react";
import { api, ApiError, type AdminLesson, type AdminQuestion, type AdminWorld, type LessonInput, type QuestionInput, type WorldInput } from "../../lib/api";
import { Badge, Button, EmptyState, Modal, TextInput } from "../ui";

const EMPTY_WORLD: WorldInput = { key: "", name: "", topic: "", colorTheme: "#7CC24A", requiredStars: 0, order: 0, isActive: true };
const EMPTY_LESSON: LessonInput = { title: "", order: 0, isActive: true };
const EMPTY_QUESTION: QuestionInput = { prompt: "", hint: "", answer: "", options: ["", ""], order: 0 };

export default function LessonsPage() {
  const [worlds, setWorlds] = useState<AdminWorld[] | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<AdminWorld | null>(null);
  const [lessons, setLessons] = useState<AdminLesson[] | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<AdminLesson | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);
  const [error, setError] = useState("");

  const [editingWorld, setEditingWorld] = useState<AdminWorld | "new" | null>(null);
  const [editingLesson, setEditingLesson] = useState<AdminLesson | "new" | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | "new" | null>(null);

  async function loadWorlds() {
    try {
      const { worlds } = await api.adminListWorlds();
      setWorlds(worlds);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách world.");
    }
  }
  async function loadLessons(world: AdminWorld) {
    try {
      const { lessons } = await api.adminListLessons(world.id);
      setLessons(lessons);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách bài học.");
    }
  }
  async function loadQuestions(lesson: AdminLesson) {
    try {
      const { questions } = await api.adminListQuestions(lesson.id);
      setQuestions(questions);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách câu hỏi.");
    }
  }

  useEffect(() => {
    loadWorlds();
  }, []);

  function pickWorld(w: AdminWorld) {
    setSelectedWorld(w);
    setSelectedLesson(null);
    setQuestions(null);
    setLessons(null);
    loadLessons(w);
  }
  function pickLesson(l: AdminLesson) {
    setSelectedLesson(l);
    setQuestions(null);
    loadQuestions(l);
  }

  async function deleteWorld(w: AdminWorld) {
    if (!confirm(`Xoá world "${w.name}"? Toàn bộ bài học và câu hỏi bên trong cũng bị xoá.`)) return;
    try {
      await api.adminDeleteWorld(w.id);
      if (selectedWorld?.id === w.id) {
        setSelectedWorld(null);
        setLessons(null);
      }
      await loadWorlds();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được world.");
    }
  }
  async function deleteLesson(l: AdminLesson) {
    if (!confirm(`Xoá bài học "${l.title}"? Toàn bộ câu hỏi bên trong cũng bị xoá.`)) return;
    try {
      await api.adminDeleteLesson(l.id);
      if (selectedLesson?.id === l.id) {
        setSelectedLesson(null);
        setQuestions(null);
      }
      if (selectedWorld) await loadLessons(selectedWorld);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được bài học.");
    }
  }
  async function deleteQuestion(q: AdminQuestion) {
    if (!confirm("Xoá câu hỏi này?")) return;
    try {
      await api.adminDeleteQuestion(q.id);
      if (selectedLesson) await loadQuestions(selectedLesson);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được câu hỏi.");
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <h1 className="text-xl font-bold">Quản lý bài học</h1>
      {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}

      <div className="grid flex-1 grid-cols-3 gap-4 overflow-hidden">
        {/* Worlds column */}
        <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wide text-ink/50">World Map ({worlds?.length ?? "…"})</span>
            <Button variant="ghost" onClick={() => setEditingWorld("new")}>
              + World
            </Button>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
            {worlds?.map((w) => (
              <div
                key={w.id}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm ${selectedWorld?.id === w.id ? "border-brand-orange bg-[#FFF1DE]" : "border-transparent hover:bg-cream"}`}
              >
                <button onClick={() => pickWorld(w)} className="flex flex-1 items-center gap-2 text-left">
                  <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: w.colorTheme }} />
                  <span className="flex-1 truncate font-semibold">{w.name}</span>
                  <span className="text-xs text-ink/40">{w._count.lessons} bài</span>
                </button>
                <button onClick={() => setEditingWorld(w)} className="text-xs text-ink/40 hover:text-brand-orange" title="Sửa">
                  ✎
                </button>
                <button onClick={() => deleteWorld(w)} className="text-xs text-ink/40 hover:text-[#B3402F]" title="Xoá">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Lessons column */}
        <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between px-1">
            <span className="truncate text-xs font-bold uppercase tracking-wide text-ink/50">{selectedWorld ? `Bài học · ${selectedWorld.name}` : "Bài học"}</span>
            {selectedWorld && (
              <Button variant="ghost" onClick={() => setEditingLesson("new")}>
                + Bài học
              </Button>
            )}
          </div>
          {!selectedWorld ? (
            <EmptyState>Chọn 1 world bên trái để xem bài học.</EmptyState>
          ) : (
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
              {lessons?.length === 0 && <EmptyState>Chưa có bài học nào.</EmptyState>}
              {lessons?.map((l) => (
                <div
                  key={l.id}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm ${selectedLesson?.id === l.id ? "border-brand-orange bg-[#FFF1DE]" : "border-transparent hover:bg-cream"}`}
                >
                  <button onClick={() => pickLesson(l)} className="flex flex-1 items-center gap-2 text-left">
                    <span className="flex-1 truncate font-semibold">{l.title}</span>
                    <span className="text-xs text-ink/40">{l._count.questions} câu</span>
                    {!l.isActive && <Badge tone="gray">Ẩn</Badge>}
                  </button>
                  <button onClick={() => setEditingLesson(l)} className="text-xs text-ink/40 hover:text-brand-orange" title="Sửa">
                    ✎
                  </button>
                  <button onClick={() => deleteLesson(l)} className="text-xs text-ink/40 hover:text-[#B3402F]" title="Xoá">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Questions column */}
        <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between px-1">
            <span className="truncate text-xs font-bold uppercase tracking-wide text-ink/50">{selectedLesson ? `Câu hỏi · ${selectedLesson.title}` : "Câu hỏi"}</span>
            {selectedLesson && (
              <Button variant="ghost" onClick={() => setEditingQuestion("new")}>
                + Câu hỏi
              </Button>
            )}
          </div>
          {!selectedLesson ? (
            <EmptyState>Chọn 1 bài học ở giữa để xem câu hỏi.</EmptyState>
          ) : (
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
              {questions?.length === 0 && <EmptyState>Chưa có câu hỏi nào.</EmptyState>}
              {questions?.map((q) => (
                <div key={q.id} className="flex flex-col gap-1 rounded-lg border border-transparent px-2.5 py-2 text-sm hover:bg-cream">
                  <div className="flex items-start gap-2">
                    <span className="flex-1 font-semibold">{q.prompt}</span>
                    <button onClick={() => setEditingQuestion(q)} className="text-xs text-ink/40 hover:text-brand-orange" title="Sửa">
                      ✎
                    </button>
                    <button onClick={() => deleteQuestion(q)} className="text-xs text-ink/40 hover:text-[#B3402F]" title="Xoá">
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((o) => (
                      <span key={o} className={`rounded-full px-2 py-0.5 text-xs ${o === q.answer ? "bg-[#EEF9E3] font-bold text-[#4F7C2A]" : "bg-cream text-ink/50"}`}>
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

      {editingWorld && (
        <WorldForm
          initial={editingWorld === "new" ? EMPTY_WORLD : editingWorld}
          onClose={() => setEditingWorld(null)}
          onSaved={() => {
            setEditingWorld(null);
            loadWorlds();
          }}
        />
      )}
      {editingLesson && selectedWorld && (
        <LessonForm
          worldId={selectedWorld.id}
          initial={editingLesson === "new" ? EMPTY_LESSON : editingLesson}
          onClose={() => setEditingLesson(null)}
          onSaved={() => {
            setEditingLesson(null);
            if (selectedWorld) loadLessons(selectedWorld);
          }}
        />
      )}
      {editingQuestion && selectedLesson && (
        <QuestionForm
          lessonId={selectedLesson.id}
          initial={editingQuestion === "new" ? EMPTY_QUESTION : editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSaved={() => {
            setEditingQuestion(null);
            if (selectedLesson) loadQuestions(selectedLesson);
          }}
        />
      )}
    </div>
  );
}

function WorldForm({ initial, onClose, onSaved }: { initial: WorldInput; onClose: () => void; onSaved: () => void }) {
  const editingWorld = "id" in (initial as AdminWorld) ? (initial as unknown as AdminWorld) : null;
  const [form, setForm] = useState<WorldInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingWorld) await api.adminUpdateWorld(editingWorld.id, form);
      else await api.adminCreateWorld(form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được world.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingWorld ? `Sửa world: ${editingWorld.name}` : "Thêm world mới"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Key (slug)" required disabled={!!editingWorld} pattern="[a-z0-9-]+" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <TextInput label="Tên hiển thị" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <TextInput label="Chủ đề" required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        <div className="grid grid-cols-3 gap-3">
          <TextInput label="Màu chủ đạo" required type="color" value={form.colorTheme} onChange={(e) => setForm({ ...form, colorTheme: e.target.value })} className="h-10 p-1" />
          <TextInput label="Sao cần để mở" type="number" min={0} required value={form.requiredStars} onChange={(e) => setForm({ ...form, requiredStars: +e.target.value })} />
          <TextInput label="Thứ tự" type="number" required value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Hiện trên World Map
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

function LessonForm({ worldId, initial, onClose, onSaved }: { worldId: string; initial: LessonInput; onClose: () => void; onSaved: () => void }) {
  const editingLesson = "id" in (initial as AdminLesson) ? (initial as unknown as AdminLesson) : null;
  const [form, setForm] = useState<LessonInput>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingLesson) await api.adminUpdateLesson(editingLesson.id, form);
      else await api.adminCreateLesson(worldId, form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được bài học.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingLesson ? `Sửa bài học: ${editingLesson.title}` : "Thêm bài học mới"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextInput label="Tên bài học" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <TextInput label="Thứ tự" type="number" required value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
        <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Cho phép học
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

function QuestionForm({ lessonId, initial, onClose, onSaved }: { lessonId: string; initial: QuestionInput | AdminQuestion; onClose: () => void; onSaved: () => void }) {
  const editingQuestion = "id" in (initial as AdminQuestion) ? (initial as unknown as AdminQuestion) : null;
  const [form, setForm] = useState<QuestionInput>({ ...initial, hint: initial.hint ?? "" });
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
      if (editingQuestion) await api.adminUpdateQuestion(editingQuestion.id, payload);
      else await api.adminCreateQuestion(lessonId, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được câu hỏi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editingQuestion ? "Sửa câu hỏi" : "Thêm câu hỏi mới"} onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextInput label="Câu hỏi" required value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
        <TextInput label="Gợi ý (tuỳ chọn)" value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} />

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
