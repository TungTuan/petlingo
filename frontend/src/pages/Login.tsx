import { useState } from "react";
import { ChunkyButton } from "../components/ui";
import { api, ApiError, type Parent } from "../lib/api";
import { useT } from "../lib/i18n";
import { signInWithApple, signInWithFacebook, signInWithGoogle } from "../lib/socialAuth";
import { tokenStorage } from "../lib/tokenStorage";

interface LoginProps {
  onAuthenticated: (parent: Parent) => Promise<void>;
}

const SOCIALS: { label: string; color: string; radius: string; signIn: () => Promise<string>; loginWithToken: (token: string) => ReturnType<typeof api.loginWithGoogle> }[] = [
  { label: "Google", color: "#EF6A5A", radius: "999px", signIn: signInWithGoogle, loginWithToken: api.loginWithGoogle },
  { label: "Apple", color: "#4A3728", radius: "8px", signIn: signInWithApple, loginWithToken: api.loginWithApple },
  { label: "Facebook", color: "#5C7BC9", radius: "8px", signIn: signInWithFacebook, loginWithToken: api.loginWithFacebook },
];

/** Login / Register — matches the reference sheet's "Phần 4 · Đăng nhập" panel. */
export default function Login({ onAuthenticated }: LoginProps) {
  const t = useT();
  const [tab, setTab] = useState<0 | 1>(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const authTitle = tab === 0 ? t("Đăng nhập") : t("Đăng ký");

  const handleSubmit = async () => {
    setMsg("");
    setLoading(true);
    try {
      const result = tab === 0 ? await api.login(email, password) : await api.register(email, password);
      tokenStorage.set(result.accessToken, result.refreshToken);
      setMsg(t("Đăng nhập thành công — vào Home"));
      await onAuthenticated(result.parent);
    } catch (err) {
      setMsg(err instanceof ApiError ? t(err.message) : t("Có lỗi xảy ra, thử lại nhé."));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (social: (typeof SOCIALS)[number]) => {
    setMsg("");
    setLoading(true);
    try {
      const token = await social.signIn();
      const result = await social.loginWithToken(token);
      tokenStorage.set(result.accessToken, result.refreshToken);
      setMsg(t("Đăng nhập thành công — vào Home"));
      await onAuthenticated(result.parent);
    } catch (err) {
      setMsg(err instanceof ApiError ? t(err.message) : err instanceof Error ? err.message : t("Có lỗi xảy ra, thử lại nhé."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="relative flex w-[38%] min-w-[300px] flex-col items-center justify-end gap-4 bg-gradient-to-b from-[#BFE6F7] from-0% via-[#DCEFC8] via-62% to-[#8CC85A] to-62% pb-10">
        <div className="animate-cloud absolute left-[5%] top-[8%] h-11 w-[130px] rounded-full bg-white/80" />
        <div className="absolute right-[4%] top-[16%] h-[52px] w-[170px] rounded-full bg-white/65" style={{ animation: "cloud 30s linear infinite alternate-reverse" }} />
        <div className="absolute inset-x-0 top-[6%] text-center">
          <div className="font-baloo text-[48px] font-extrabold leading-none text-brand-purple">
            Pet<span className="text-brand-orange">lin</span>
            <span className="text-brand-teal">go</span>
          </div>
          <div className="mt-1.5 font-baloo text-[15px] font-bold text-[#5A7080]">Learn English. Play. Grow Together!</div>
        </div>
        <div className="flex items-end gap-3.5">
          <img src="/pets/buddy.png" alt="" className="animate-bob h-[150px] w-[150px] object-contain object-bottom" />
          <img src="/pets/mimi.png" alt="" className="h-[110px] w-[110px] object-contain object-bottom" style={{ animation: "bob 3.9s ease-in-out infinite" }} />
        </div>
        <div className="rounded-2xl bg-white/92 px-5 py-3 font-baloo text-[15px] font-bold text-ink shadow-[0_4px_0_rgba(0,0,0,.1)]">
          {t("2.4 triệu từ đã học cùng nhau")}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-8">
        <div className="flex w-fit gap-1 rounded-2xl bg-[#F5EBD8] p-1.5">
          {([t("Đăng nhập"), t("Đăng ký")] as const).map((label, i) => (
            <button
              key={label}
              onClick={() => setTab(i as 0 | 1)}
              className={`rounded-xl px-7 py-2.5 font-baloo text-base font-extrabold ${tab === i ? "bg-brand-orange text-white" : "text-[#8A7A62]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="font-baloo text-[34px] font-extrabold">{authTitle}</div>

        <label className="flex flex-col gap-1.5 font-baloo text-[13px] font-bold text-[#8A7A62]">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@example.com"
            className="rounded-2xl border-[3px] border-line bg-cream-card px-4 py-3.5 font-baloo text-[16px] font-bold text-ink outline-none focus:border-brand-orange"
          />
        </label>
        <label className="flex flex-col gap-1.5 font-baloo text-[13px] font-bold text-[#8A7A62]">
          {t("Mật khẩu")}
          <span className="relative flex">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder={t("Ít nhất 8 ký tự")}
              className="flex-1 rounded-2xl border-[3px] border-line bg-cream-card px-4 py-3.5 pr-[58px] font-baloo text-[16px] font-bold text-ink outline-none focus:border-brand-orange"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-xl bg-[#F5EBD8]"
              aria-label={t("Hiện mật khẩu")}
            >
              <span className="h-3 w-5 rounded-full border-[3px] border-[#8A7A62] box-border" />
            </button>
          </span>
        </label>

        <div className="flex items-center gap-3.5">
          <button onClick={() => setRemember((v) => !v)} className="flex items-center gap-2 font-baloo text-sm font-bold text-[#6E6047]">
            <span
              className={`grid h-[26px] w-[26px] place-items-center rounded-[9px] border-[3px] ${remember ? "border-brand-green bg-brand-green" : "border-line bg-white"}`}
            >
              {remember && (
                <svg width="14" height="14" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4.5 4.5L19 7" />
                </svg>
              )}
            </span>
            {t("Ghi nhớ đăng nhập")}
          </button>
          <div className="flex-1" />
          <a href="#" className="font-baloo text-sm font-bold text-brand-orange">
            {t("Quên mật khẩu?")}
          </a>
        </div>

        <ChunkyButton shine disabled={loading || !email || password.length < 8} onClick={handleSubmit}>
          {loading ? t("Đang xử lý...") : authTitle}
        </ChunkyButton>

        <div className="flex items-center gap-3 font-baloo text-xs font-bold text-[#A2947C]">
          <span className="h-0.5 flex-1 bg-line" />
          {t("HOẶC")}
          <span className="h-0.5 flex-1 bg-line" />
        </div>
        <div className="flex gap-3">
          {SOCIALS.map((s) => (
            <button
              key={s.label}
              disabled={loading}
              onClick={() => handleSocialLogin(s)}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl border-[3px] border-line bg-white py-3.5 font-baloo text-[15px] font-bold text-[#6E6047] shadow-[0_4px_0_#E7D4B2] disabled:opacity-50"
            >
              <span className="h-[22px] w-[22px]" style={{ borderRadius: s.radius, background: s.color }} />
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-3 rounded-2xl border-[3px] border-[#C9E5F7] bg-[#EAF6FF] p-3.5">
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-[#5C7BC9] font-baloo text-base font-extrabold text-white">!</span>
          <div className="font-baloo text-[12.5px] font-semibold leading-snug text-[#5A7080]">
            {t("Tài khoản trẻ em do phụ huynh tạo và quản lý. Trẻ đăng nhập bằng mã PIN 4 số, không cần email.")}
          </div>
        </div>
        <div className="min-h-5 font-baloo text-sm font-bold text-brand-orange">{msg}</div>
      </div>
    </div>
  );
}
