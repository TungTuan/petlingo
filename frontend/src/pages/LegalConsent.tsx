import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { api, ApiError, type Parent } from "../lib/api";
import type { LegalKind } from "../lib/legal";
import { useT } from "../lib/i18n";

export default function LegalConsent({ onOpenLegal, onAccepted }: { onOpenLegal: (kind: LegalKind) => void; onAccepted: (parent: Parent) => Promise<void> }) {
  const t = useT();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    if (!checked || busy) return;
    setBusy(true);
    setError("");
    try {
      const { parent } = await api.acceptLegal();
      await onAccepted(parent);
    } catch (reason) {
      setError(reason instanceof ApiError ? t(reason.message) : t("Có lỗi xảy ra, thử lại nhé."));
      setBusy(false);
    }
  }

  return <div className="grid h-full place-items-center bg-[linear-gradient(145deg,#DDF6F2,#F1EBFF_55%,#FFF1D8)] p-6"><div className="flex w-[560px] max-w-full flex-col items-center gap-5 rounded-[32px] border-4 border-white bg-white/95 p-8 text-center shadow-[0_10px_0_#D6E9E4,0_24px_70px_rgba(55,70,70,.2)]"><span className="grid h-20 w-20 place-items-center rounded-[26px] bg-[#DDF6F2] text-[#29998E]"><ShieldCheck size={42} /></span><div><h1 className="font-baloo text-[28px] font-extrabold text-[#41372F]">{t("Dành cho phụ huynh")}</h1><p className="mt-2 font-baloo text-sm font-semibold leading-6 text-[#786C61]">{t("Trước khi tạo hoặc tiếp tục quản lý hồ sơ trẻ, vui lòng đọc các tài liệu về dữ liệu và quy tắc sử dụng PetLingo.")}</p></div><div className="flex gap-3"><button onClick={() => onOpenLegal("privacy")} className="rounded-2xl border-2 border-[#BFE5DF] bg-[#EFFAF8] px-5 py-3 font-baloo text-sm font-extrabold text-[#247F76]">{t("Chính sách quyền riêng tư")}</button><button onClick={() => onOpenLegal("terms")} className="rounded-2xl border-2 border-[#D8C9F3] bg-[#F5F0FF] px-5 py-3 font-baloo text-sm font-extrabold text-[#7254B2]">{t("Điều khoản sử dụng")}</button></div><button onClick={() => setChecked((value) => !value)} className="flex items-start gap-3 rounded-2xl bg-[#FFF8EA] p-4 text-left"><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 ${checked ? "border-[#75BE4D] bg-[#75BE4D] text-white" : "border-[#D8C9B2] bg-white"}`}>{checked && <Check size={17} strokeWidth={3.5} />}</span><span className="font-baloo text-sm font-bold leading-6 text-[#5F544A]">{t("Tôi xác nhận mình là phụ huynh/người giám hộ có thẩm quyền và đồng ý với Điều khoản cùng Chính sách quyền riêng tư.")}</span></button>{error && <div role="alert" className="font-baloo text-sm font-bold text-[#C44747]">{error}</div>}<button onClick={accept} disabled={!checked || busy} className="w-full rounded-2xl bg-[#F5822B] py-4 font-baloo text-lg font-extrabold text-white shadow-[0_5px_0_#BD5B1B] disabled:opacity-40">{busy ? t("Đang xử lý...") : t("Đồng ý và tiếp tục")}</button></div></div>;
}
