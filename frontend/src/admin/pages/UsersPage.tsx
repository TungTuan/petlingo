import { useEffect, useState } from "react";
import { api, ApiError, type AdminUserDetail, type AdminUserSummary } from "../../lib/api";
import { Badge, Button, EmptyState, Modal, TextInput } from "../ui";

export default function UsersPage({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUserSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);

  async function load(q = search) {
    try {
      const { users } = await api.adminListUsers(q);
      setUsers(users);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách người dùng.");
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleActive(u: AdminUserSummary) {
    try {
      await api.adminSetUserActive(u.id, !u.isActive);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không cập nhật được người dùng.");
    }
  }

  async function remove(u: AdminUserSummary) {
    if (!confirm(`Xoá tài khoản ${u.email}? Toàn bộ hồ sơ trẻ và tiến độ liên quan cũng sẽ bị xoá.`)) return;
    try {
      await api.adminDeleteUser(u.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được người dùng.");
    }
  }

  async function openDetail(id: string) {
    try {
      const { user } = await api.adminGetUser(id);
      setDetail(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được chi tiết người dùng.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Quản lý người dùng</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex gap-2"
        >
          <TextInput placeholder="Tìm theo email / số điện thoại…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button variant="ghost" type="submit">
            Tìm
          </Button>
        </form>
      </div>

      {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}

      {users === null ? (
        <div className="text-sm text-ink/50">Đang tải…</div>
      ) : users.length === 0 ? (
        <EmptyState>Không có người dùng nào khớp.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">SĐT</th>
                <th className="px-4 py-3 font-semibold">Vai trò</th>
                <th className="px-4 py-3 font-semibold">Số trẻ</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0 hover:bg-cream/40">
                  <td className="px-4 py-3 font-medium">
                    <button onClick={() => openDetail(u.id)} className="hover:text-brand-orange hover:underline">
                      {u.email}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.role === "ADMIN" ? "purple" : "gray"}>{u.role === "ADMIN" ? "Admin" : "Phụ huynh"}</Badge>
                  </td>
                  <td className="px-4 py-3">{u.childrenCount}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.isActive ? "green" : "orange"}>{u.isActive ? "Hoạt động" : "Đã khoá"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" disabled={u.id === currentUserId} onClick={() => toggleActive(u)}>
                        {u.isActive ? "Khoá" : "Mở khoá"}
                      </Button>
                      <Button variant="danger" disabled={u.id === currentUserId} onClick={() => remove(u)}>
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

      {detail && (
        <Modal title={detail.email} onClose={() => setDetail(null)}>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/50">Vai trò</span>
              <Badge tone={detail.role === "ADMIN" ? "purple" : "gray"}>{detail.role === "ADMIN" ? "Admin" : "Phụ huynh"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/50">Trạng thái</span>
              <Badge tone={detail.isActive ? "green" : "orange"}>{detail.isActive ? "Hoạt động" : "Đã khoá"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/50">Ngày tạo</span>
              <span>{new Date(detail.createdAt).toLocaleString("vi-VN")}</span>
            </div>
            <div className="mt-2 border-t border-line pt-3">
              <div className="mb-1.5 font-semibold">Hồ sơ trẻ ({detail.children.length})</div>
              {detail.children.length === 0 ? (
                <div className="text-ink/50">Chưa tạo hồ sơ trẻ nào.</div>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {detail.children.map((c) => (
                    <li key={c.id} className="flex justify-between rounded-lg bg-cream/60 px-3 py-2">
                      <span className="font-medium">{c.displayName}</span>
                      <span className="text-ink/50">{c.birthYear ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
