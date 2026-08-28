import { useState } from "react";
import { api, ApiError, type Parent } from "../lib/api";
import { tokenStorage } from "../lib/tokenStorage";
import { Button, TextInput } from "./ui";

export default function AdminLogin({ onLoggedIn }: { onLoggedIn: (parent: Parent) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { parent, accessToken, refreshToken } = await api.login(email, password);
      if (parent.role !== "ADMIN") {
        tokenStorage.clear();
        setError("Tài khoản này không có quyền quản trị.");
        return;
      }
      tokenStorage.set(accessToken, refreshToken);
      onLoggedIn(parent);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể đăng nhập, thử lại nhé.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-4">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-line bg-white p-7 shadow-sm">
        <div>
          <div className="font-baloo text-2xl font-extrabold text-ink">
            Pet<span className="text-brand-orange">lin</span>
            <span className="text-brand-teal">go</span>
          </div>
          <div className="text-sm text-ink/60">Trang quản trị</div>
        </div>
        <TextInput label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        <TextInput label="Mật khẩu" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="rounded-lg bg-[#FDF0EC] px-3 py-2 text-sm font-medium text-[#B3402F]">{error}</div>}
        <Button type="submit" disabled={busy}>
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}
