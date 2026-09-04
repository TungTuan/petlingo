import { useState, type FormEvent } from "react";
import { ChunkyButton } from "../components/ui";
import { api, ApiError, type Parent } from "../lib/api";
import { useT } from "../lib/i18n";
import { signInWithApple, signInWithFacebook, signInWithGoogle } from "../lib/socialAuth";
import { tokenStorage } from "../lib/tokenStorage";
import { Check, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";

interface LoginProps {
  onAuthenticated: (parent: Parent) => Promise<void>;
}

const SOCIALS: { label: string; brand: string; color: string; signIn: () => Promise<string>; loginWithToken: (token: string) => ReturnType<typeof api.loginWithGoogle> }[] = [
  { label: "Google", brand: "G", color: "#4285F4", signIn: signInWithGoogle, loginWithToken: api.loginWithGoogle },
  { label: "Apple", brand: "●", color: "#24211F", signIn: signInWithApple, loginWithToken: api.loginWithApple },
  { label: "Facebook", brand: "f", color: "#4267B2", signIn: signInWithFacebook, loginWithToken: api.loginWithFacebook },
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

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!email || password.length < 8 || loading) return;
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
    <div className="flex h-full overflow-hidden bg-[#FFFDF8]">
      <div className="relative hidden w-[42%] min-w-[320px] flex-col items-center justify-end gap-4 overflow-hidden bg-gradient-to-b from-[#BFEAF5] from-0% via-[#E1F3D2] via-62% to-[#86C557] to-62% pb-9 md:flex">
        <div className="animate-cloud absolute left-[5%] top-[8%] h-11 w-[130px] rounded-full bg-white/80" />
        <div className="absolute right-[4%] top-[16%] h-[52px] w-[170px] rounded-full bg-white/65" style={{ animation: "cloud 30s linear infinite alternate-reverse" }} />
        <div className="absolute inset-x-0 top-[7%] text-center">
          <div className="font-baloo text-[48px] font-extrabold leading-none text-brand-purple">
            Pet<span className="text-brand-orange">lin</span>
            <span className="text-brand-teal">go</span>
          </div>
          <div className="mt-2 font-baloo text-[15px] font-bold text-[#5A7080]">Learn English. Play. Grow Together!</div>
          <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border-2 border-white/80 bg-white/65 px-4 py-2 font-baloo text-[12px] font-extrabold text-[#438C79]">
            <Sparkles size={16} /> {t("Học mỗi ngày, lớn lên cùng pet")}
          </div>
        </div>
        <div className="flex items-end gap-3.5">
          <img src="/pets/buddy.webp" alt="" className="animate-bob h-[150px] w-[150px] object-contain object-bottom" />
          <img src="/pets/mimi.webp" alt="" className="h-[110px] w-[110px] object-contain object-bottom" style={{ animation: "bob 3.9s ease-in-out infinite" }} />
        </div>
        <div className="rounded-2xl bg-white/92 px-5 py-3 font-baloo text-[15px] font-bold text-ink shadow-[0_4px_0_rgba(0,0,0,.1)]">
          {t("2.4 triệu từ đã học cùng nhau")}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-[620px] flex-1 flex-col gap-3.5 overflow-y-auto px-6 py-6 sm:px-9 sm:py-7">
        <div className="flex items-center justify-between">
          <div className="font-baloo text-[25px] font-extrabold text-brand-purple md:hidden">Pet<span className="text-brand-orange">lin</span><span className="text-brand-teal">go</span></div>
          <div className="flex w-fit gap-1 rounded-2xl bg-[#F5EBD8] p-1.5">
          {([t("Đăng nhập"), t("Đăng ký")] as const).map((label, i) => (
            <button
              type="button"
              key={label}
              onClick={() => setTab(i as 0 | 1)}
              className={`rounded-xl px-7 py-2.5 font-baloo text-base font-extrabold ${tab === i ? "bg-brand-orange text-white" : "text-[#8A7A62]"}`}
            >
              {label}
            </button>
          ))}
          </div>
        </div>
        <div>
          <div className="font-baloo text-[32px] font-extrabold leading-tight text-[#40352D]">{authTitle}</div>
          <div className="mt-1 font-baloo text-[13px] font-semibold text-[#8A7A62]">{tab === 0 ? t("Chào mừng bạn quay lại với PetLingo!") : t("Tạo tài khoản để bắt đầu hành trình học tập")}</div>
        </div>

        <label className="flex flex-col gap-1.5 font-baloo text-[13px] font-bold text-[#8A7A62]">
          Email
          <span className="relative flex items-center">
            <Mail size={20} className="pointer-events-none absolute left-4 text-[#A2947C]" />
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@example.com" className="w-full rounded-2xl border-[3px] border-line bg-cream-card py-3.5 pl-12 pr-4 font-baloo text-[16px] font-bold text-ink outline-none transition-colors focus:border-brand-orange focus:bg-white" />
          </span>
        </label>
        <label className="flex flex-col gap-1.5 font-baloo text-[13px] font-bold text-[#8A7A62]">
          {t("Mật khẩu")}
          <span className="relative flex items-center">
            <LockKeyhole size={20} className="pointer-events-none absolute left-4 z-10 text-[#A2947C]" />
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder={t("Ít nhất 8 ký tự")}
              autoComplete={tab === 0 ? "current-password" : "new-password"}
              required
              className="w-full rounded-2xl border-[3px] border-line bg-cream-card py-3.5 pl-12 pr-[58px] font-baloo text-[16px] font-bold text-ink outline-none transition-colors focus:border-brand-orange focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 grid h-10 w-10 place-items-center rounded-xl bg-[#F5EBD8] text-[#7C6D5F] transition-colors hover:bg-[#EDE0C8]"
              aria-label={showPw ? t("Ẩn mật khẩu") : t("Hiện mật khẩu")}
            >
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </span>
        </label>

        <div className="flex items-center gap-3.5">
          <button type="button" onClick={() => setRemember((v) => !v)} className="flex items-center gap-2 font-baloo text-sm font-bold text-[#6E6047]">
            <span
              className={`grid h-[26px] w-[26px] place-items-center rounded-[9px] border-[3px] ${remember ? "border-brand-green bg-brand-green" : "border-line bg-white"}`}
            >
              {remember && <Check size={15} strokeWidth={3.5} className="text-white" />}
            </span>
            {t("Ghi nhớ đăng nhập")}
          </button>
          <div className="flex-1" />
          <button type="button" onClick={() => setMsg(t("Vui lòng liên hệ phụ huynh hoặc quản trị viên để đặt lại mật khẩu."))} className="font-baloo text-sm font-bold text-brand-orange hover:underline">
            {t("Quên mật khẩu?")}
          </button>
        </div>

        <ChunkyButton type="submit" shine disabled={loading || !email || password.length < 8} className="flex items-center justify-center gap-2">
          <KeyRound size={20} /> {loading ? t("Đang xử lý...") : authTitle}
        </ChunkyButton>

        <div className="flex items-center gap-3 font-baloo text-xs font-bold text-[#A2947C]">
          <span className="h-0.5 flex-1 bg-line" />
          {t("HOẶC")}
          <span className="h-0.5 flex-1 bg-line" />
        </div>
        <div className="flex gap-3">
          {SOCIALS.map((s) => (
            <button
              type="button"
              key={s.label}
              disabled={loading}
              onClick={() => handleSocialLogin(s)}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl border-[3px] border-line bg-white py-3.5 font-baloo text-[15px] font-bold text-[#6E6047] shadow-[0_4px_0_#E7D4B2] disabled:opacity-50"
            >
              <span className="grid h-[24px] w-[24px] place-items-center rounded-full font-sans text-[14px] font-black text-white shadow-sm" style={{ background: s.color }} aria-hidden="true">{s.brand}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-3 rounded-2xl border-[3px] border-[#C9E5F7] bg-[#EAF6FF] p-3.5">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-xl bg-[#5C7BC9] text-white"><ShieldCheck size={20} strokeWidth={2.8} /></span>
          <div className="font-baloo text-[12.5px] font-semibold leading-snug text-[#5A7080]">
            {t("Tài khoản trẻ em do phụ huynh tạo và quản lý. Trẻ đăng nhập bằng mã PIN 4 số, không cần email.")}
          </div>
        </div>
        <div role="alert" aria-live="polite" className="min-h-5 font-baloo text-sm font-bold text-brand-orange">{msg}</div>
      </form>
    </div>
  );
}
