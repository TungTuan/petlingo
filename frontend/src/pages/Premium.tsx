import { useState } from "react";
import { BackIcon, CheckIcon } from "../components/ui";
import { useT } from "../lib/i18n";
import { api, ApiError, type Parent } from "../lib/api";

interface PremiumProps {
  childId: string;
  isPremium: boolean;
  onUpgraded: (parent: Parent) => void;
  onExit: () => void;
}

// "Mở toàn bộ 6 vùng" USED to be a perk here — removed (2026-08-28): every
// account, free or Premium, has been able to pick any of the 6 worlds via
// GameHub's "Chọn bài học" since WorldMap.tsx was retired, so keeping this
// listed as a paid perk was advertising something already free for everyone.
const PERKS: [string, string, string][] = [
  ["Không quảng cáo", "Bỏ hẳn banner và interstitial ở tài khoản người lớn.", "#EF6A5A"],
  ["Báo cáo phụ huynh chi tiết", "Từ vựng yếu, thời gian học, email tuần.", "#5C7BC9"],
  ["Tải bài học offline", "Học trên máy bay, không cần mạng.", "#57C6C6"],
  ["+2 pet Legendary mỗi tháng", "Bấm nhận thưởng mỗi tháng ngay bên dưới.", "#E8A22B"],
];
const PLANS: [string, string, string, string, string | null][] = [
  ["Tháng", "49k", "/tháng", "Huỷ bất cứ lúc nào", null],
  ["Năm", "399k", "/năm", "Chỉ 33k mỗi tháng", "Tiết kiệm 32%"],
  ["Gia đình", "599k", "/năm", "Tối đa 4 tài khoản trẻ", "Phổ biến"],
];

/** Premium — matches the reference sheet's "Phần 4 · Premium" panel. */
export default function Premium({ childId, isPremium, onUpgraded, onExit }: PremiumProps) {
  const t = useT();
  const [plan, setPlan] = useState(1);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [legendaryMsg, setLegendaryMsg] = useState("");
  const [legendaryBusy, setLegendaryBusy] = useState(false);

  // The app has no real payment gateway yet — this is a demo activation
  // (see backend's auth.service.ts activatePremium()), not a real purchase.
  async function upgrade() {
    if (isPremium || busy) return;
    setBusy(true);
    setMsg("");
    try {
      const { parent } = await api.activatePremium();
      onUpgraded(parent);
      setMsg(t("Đã mở Premium — cảm ơn bạn!"));
    } catch (err) {
      setMsg(err instanceof ApiError ? t(err.message) : t("Không mở được Premium, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  // No real App Store/Google Play receipt to restore yet (see upgrade()'s
  // comment) — this re-checks the account's actual current Premium status
  // from the server instead of doing nothing, which is the closest honest
  // equivalent until a real payment gateway exists.
  async function restorePurchases() {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const { parent } = await api.me();
      onUpgraded(parent);
      setMsg(parent.isPremium ? t("Tài khoản của bạn đang có Premium.") : t("Không tìm thấy giao dịch Premium nào cho tài khoản này."));
    } catch {
      setMsg(t("Không kiểm tra được, thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  async function claimLegendary() {
    if (legendaryBusy) return;
    setLegendaryBusy(true);
    setLegendaryMsg("");
    try {
      const result = await api.claimLegendary(childId);
      setLegendaryMsg(
        result.alreadyClaimed
          ? t("Tháng này đã nhận rồi — quay lại tháng sau nhé!")
          : result.grantedPetKeys.length > 0
            ? `${t("Đã nhận")} ${result.grantedPetKeys.length} pet Legendary mới! 🎉`
            : t("Bạn đã sở hữu hết pet Legendary hiện có rồi!"),
      );
    } catch (err) {
      setLegendaryMsg(err instanceof ApiError ? t(err.message) : t("Không nhận được thưởng, thử lại nhé."));
    } finally {
      setLegendaryBusy(false);
    }
  }

  const compare: [string, string, string][] = [
    ["Số bài học", "30 bài", "Không giới hạn"],
    ["Quảng cáo (người lớn)", "Có", "Không"],
    ["Báo cáo phụ huynh", "Cơ bản", "Chi tiết"],
    ["Số tài khoản trẻ", "1", plan === 2 ? "4" : "2"],
  ];

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#EFE9FB] to-[#F7F4EE]">
      <div className="flex items-center gap-3.5 p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <span className="font-baloo text-[26px] font-extrabold">Petlingo Premium</span>
        <div className="flex-1" />
        <span className="font-baloo text-[13px] font-semibold text-[#8A7A62]">{t("Huỷ bất cứ lúc nào · thanh toán qua App Store / Google Play")}</span>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden px-7.5 pb-6.5">
        <div className="flex w-[330px] flex-col gap-3.5 rounded-[26px] border-[3px] border-line2 bg-white p-5.5 shadow-[0_6px_0_#EADAB8]">
          <div className="font-baloo text-xl font-extrabold">{t("Bạn nhận được")}</div>
          {PERKS.map(([title, desc, color]) => (
            <div key={title} className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px]" style={{ background: color }}>
                <CheckIcon />
              </span>
              <div>
                <div className="font-baloo text-[15px] font-extrabold">{t(title)}</div>
                <div className="font-baloo text-[12.5px] font-semibold leading-snug text-[#8A7A62]">{t(desc)}</div>
              </div>
            </div>
          ))}
          <div className="mt-auto rounded-2xl bg-[#EEF9E3] p-3.5 font-baloo text-[12.5px] font-semibold leading-snug text-[#4F7C2A]">
            {t("Trẻ em không bao giờ thấy quảng cáo, kể cả bản miễn phí.")}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4.5">
          {/* Plans + comparison scroll independently so the CTA row below always
              stays visible/reachable — this content's height varies with plan/
              perk data and isn't guaranteed to fit every viewport (confirmed
              on a real phone at the wider on-screen text/spacing this app now
              renders at — see index.css's .device-frame doc comment). */}
          <div className="flex min-h-0 flex-1 flex-col gap-4.5 overflow-y-auto">
            <div className="flex gap-4.5">
              {PLANS.map(([name, price, per, note, tag], i) => (
                <button
                  key={name}
                  onClick={() => {
                    setPlan(i);
                    setMsg("");
                  }}
                  className="relative flex flex-1 flex-col items-start gap-2 rounded-[26px] border-4 p-5.5 text-left"
                  style={{
                    background: plan === i ? "#F1EAFB" : "#fff",
                    borderColor: plan === i ? "#9B7EDE" : "#EFDFC2",
                    boxShadow: `0 6px 0 ${plan === i ? "#9B7EDE" : "#EFDFC2"}`,
                  }}
                >
                  <span className="font-baloo text-[17px] font-extrabold" style={{ color: plan === i ? "#6E56A8" : "#4A3728" }}>
                    {t(name)}
                  </span>
                  <span className="font-baloo text-[34px] font-extrabold leading-none" style={{ color: plan === i ? "#6E56A8" : "#4A3728" }}>
                    {price}
                  </span>
                  <span className="font-baloo text-[13px] font-semibold" style={{ color: plan === i ? "#8B7BB5" : "#8A7A62" }}>
                    {t(per)}
                  </span>
                  <span className="font-baloo text-[12.5px] font-bold" style={{ color: plan === i ? "#8B7BB5" : "#8A7A62" }}>
                    {t(note)}
                  </span>
                  {tag && (
                    <span className="absolute -top-3.5 right-4 rounded-full bg-brand-orange px-3.5 py-1 font-baloo text-xs font-extrabold text-white shadow-[0_3px_0_#C9631A]">{t(tag)}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-[24px] border-[3px] border-line2 bg-white p-5">
              <div className="font-baloo text-[18px] font-extrabold">{t("So sánh")}</div>
              {compare.map(([label, free, pro]) => (
                <div key={label} className="flex items-center gap-3 border-b-2 border-dashed border-[#F1E7D3] py-2">
                  <span className="flex-1 font-baloo text-[14.5px] font-bold">{t(label)}</span>
                  <span className="w-[110px] text-center font-baloo text-[13.5px] font-bold text-[#8A7A62]">{t(free)}</span>
                  <span className="w-[110px] text-center font-baloo text-[13.5px] font-extrabold text-[#6E56A8]">{t(pro)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isPremium ? (
              <span className="flex items-center gap-2.5 rounded-[20px] bg-[#EEF9E3] px-8 py-4.5 font-baloo text-lg font-extrabold text-[#4F7C2A]">
                <CheckIcon color="#4F7C2A" />
                {t("Bạn đã là thành viên Premium")}
              </span>
            ) : (
              <button
                onClick={upgrade}
                disabled={busy}
                className="relative overflow-hidden rounded-[20px] bg-brand-purple px-11.5 py-4.5 font-baloo text-xl font-extrabold text-white shadow-[0_6px_0_#7A5EBC] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#7A5EBC] disabled:opacity-60"
              >
                {busy ? t("Đang xử lý...") : `${t("Dùng thử 7 ngày")} · ${PLANS[plan]![1]}${PLANS[plan]![2]}`}
                {!busy && <span className="animate-shine pointer-events-none absolute left-0 top-0 h-full w-9 bg-gradient-to-r from-transparent via-white/55 to-transparent" />}
              </button>
            )}
            {isPremium && (
              <button
                onClick={claimLegendary}
                disabled={legendaryBusy}
                className="relative overflow-hidden rounded-[20px] bg-[#E8A22B] px-8 py-4.5 font-baloo text-lg font-extrabold text-white shadow-[0_6px_0_#B4790F] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#B4790F] disabled:opacity-60"
              >
                {legendaryBusy ? t("Đang xử lý...") : `🐲 ${t("Nhận pet Legendary tháng này")}`}
              </button>
            )}
            <button onClick={restorePurchases} disabled={busy} className="rounded-2xl border-[3px] border-line bg-white px-6.5 py-3.5 font-baloo text-base font-bold text-brand-brown disabled:opacity-60">
              {t("Khôi phục mua hàng")}
            </button>
            <div className="flex flex-col font-baloo text-sm font-bold text-[#6E56A8]">
              {msg && <span>{msg}</span>}
              {legendaryMsg && <span>{legendaryMsg}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
