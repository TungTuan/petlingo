import { useState } from "react";
import { BackIcon } from "../components/ui";
import ParentPinPrompt from "../components/ParentPinPrompt";
import { api, ApiError } from "../lib/api";
import { useLang, useT, type Lang } from "../lib/i18n";
import { clearParentPin, isParentPinEnabled, setParentPin } from "../lib/parentPin";
import { disableDailyReminder, enableDailyReminder, isReminderEnabled, isReminderSupported } from "../lib/dailyReminder";
import { getAutoSpeak, getTtsRate, getTtsVoice, setAutoSpeak, setTtsRate, setTtsVoice } from "../lib/ttsPrefs";
import type { LegalKind } from "../lib/legal";

interface SettingsProps {
  parentEmail: string;
  hiddenFromRank: boolean;
  onToggleRankVisibility: (hidden: boolean) => Promise<unknown>;
  onDeleteAccount: (confirmEmail: string) => Promise<void>;
  onLogout: () => void;
  onOpenLegal: (kind: LegalKind) => void;
  onExit: () => void;
}

function Switch({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button onClick={onToggle} disabled={disabled} className="relative h-8.5 w-14.5 shrink-0 rounded-full transition-colors disabled:opacity-50" style={{ background: on ? "#7CC24A" : "#E4D3BC" }}>
      <span className="absolute top-1 h-6.5 w-6.5 rounded-full bg-white shadow transition-[left]" style={{ left: on ? "28px" : "4px" }} />
    </button>
  );
}
function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span className="shrink-0 rounded-2xl px-5 py-2.5 font-baloo text-[15px] font-extrabold text-white shadow-[0_3px_0_rgba(0,0,0,.14)]" style={{ background: color }}>
      {text}
    </span>
  );
}
/** 2-choice segmented control — "Tốc độ đọc"/"Giọng đọc" both toggle between exactly 2 real values. */
function TwoWaySwitch({ value, options, onPick, busy }: { value: string; options: [string, string][]; onPick: (next: string) => void; busy?: boolean }) {
  return (
    <span className="flex shrink-0 gap-1 rounded-2xl bg-[#F1E7D3] p-1">
      {options.map(([key, label]) => (
        <button
          key={key}
          disabled={busy}
          onClick={() => onPick(key)}
          className="rounded-xl px-4 py-2 font-baloo text-sm font-extrabold transition-colors disabled:opacity-60"
          style={{ background: value === key ? "#5C7BC9" : "transparent", color: value === key ? "#fff" : "#8A7A62" }}
        >
          {label}
        </button>
      ))}
    </span>
  );
}
const LANG_LABELS: Record<Lang, string> = { vi: "Tiếng Việt", en: "English", ja: "日本語", ko: "한국어" };

function LangSwitch({ lang, busy, onPick }: { lang: Lang; busy: boolean; onPick: (next: Lang) => void }) {
  return (
    <span className="flex shrink-0 flex-wrap justify-end gap-1 rounded-2xl bg-[#F1E7D3] p-1">
      {(["vi", "ja", "ko", "en"] as const).map((opt) => (
        <button
          key={opt}
          disabled={busy}
          onClick={() => onPick(opt)}
          className="rounded-xl px-4 py-2 font-baloo text-sm font-extrabold transition-colors disabled:opacity-60"
          style={{ background: lang === opt ? "#5C7BC9" : "transparent", color: lang === opt ? "#fff" : "#8A7A62" }}
        >
          {LANG_LABELS[opt]}
        </button>
      ))}
    </span>
  );
}

type RowKind =
  | "language"
  | "reminder"
  | "autoSpeak"
  | "ttsRate"
  | "ttsVoice"
  | "parentPin"
  | "rankVisibility"
  | "deleteAccount"
  | "synced"
  | "privacy"
  | "terms"
  | "soon";
type Row = { label: string; desc: string; kind: RowKind };

/** Settings — matches the reference sheet's "Phần 6 · Cài đặt" panel.
 *
 * Every row here now does exactly what it says, or says plainly that it
 * doesn't yet ("Sắp ra mắt") — this used to be a static mockup where only
 * "Ngôn ngữ giao diện" was real and the other 15 rows were local-only state
 * with zero effect. See TASKS.md's dated entry for the full audit of what
 * was real vs. fake and why each "Sắp ra mắt" row needs infrastructure this
 * app doesn't have yet (background music, push notifications... wait, no —
 * reminder IS real now, see below) before it can be built for real.
 */
export default function Settings({ parentEmail, hiddenFromRank, onToggleRankVisibility, onDeleteAccount, onLogout, onOpenLegal, onExit }: SettingsProps) {
  const t = useT();
  const { lang, setLang } = useLang();
  const [group, setGroup] = useState(0);
  const [saveMsg, setSaveMsg] = useState("");
  const [langBusy, setLangBusy] = useState(false);

  const [ttsVoice, setTtsVoiceState] = useState(getTtsVoice());
  const [ttsRate, setTtsRateState] = useState(getTtsRate());
  const [autoSpeak, setAutoSpeakState] = useState(getAutoSpeak());

  const [reminderOn, setReminderOn] = useState(isReminderEnabled());
  const [reminderBusy, setReminderBusy] = useState(false);

  const [pinOn, setPinOn] = useState(isParentPinEnabled());
  const [pinPrompt, setPinPrompt] = useState<"set" | "verify" | null>(null);

  const [rankBusy, setRankBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function changeLanguage(next: Lang) {
    if (next === lang || langBusy) return;
    setLangBusy(true);
    setLang(next); // apply immediately — don't make the whole UI wait on the network round-trip
    try {
      await api.updateLanguage(next);
    } catch (err) {
      setSaveMsg(err instanceof ApiError ? t(err.message) : t("Không lưu được ngôn ngữ, thử lại nhé."));
    } finally {
      setLangBusy(false);
    }
  }

  function pickTtsRate(next: string) {
    setTtsRate(next as "normal" | "slow");
    setTtsRateState(next as "normal" | "slow");
    setSaveMsg(t("Đã lưu cài đặt"));
  }
  function pickTtsVoice(next: string) {
    setTtsVoice(next as "us" | "uk");
    setTtsVoiceState(next as "us" | "uk");
    setSaveMsg(t("Đã lưu cài đặt"));
  }
  function toggleAutoSpeak() {
    const next = !autoSpeak;
    setAutoSpeak(next);
    setAutoSpeakState(next);
    setSaveMsg(t("Đã lưu cài đặt"));
  }

  async function toggleReminder() {
    if (reminderBusy) return;
    if (!isReminderSupported()) {
      setSaveMsg(t("Nhắc học chỉ hoạt động trên app cài trên điện thoại, không phải bản web này."));
      return;
    }
    setReminderBusy(true);
    try {
      if (reminderOn) {
        await disableDailyReminder();
        setReminderOn(false);
        setSaveMsg(t("Đã tắt nhắc học hằng ngày"));
      } else {
        await enableDailyReminder();
        setReminderOn(true);
        setSaveMsg(t("Sẽ nhắc học lúc 19:00 mỗi ngày"));
      }
    } catch (err) {
      setSaveMsg(err instanceof Error ? t(err.message) : t("Không bật được nhắc học, thử lại nhé."));
    } finally {
      setReminderBusy(false);
    }
  }

  function togglePin() {
    setPinPrompt(pinOn ? "verify" : "set");
  }

  async function toggleRank() {
    if (rankBusy) return;
    setRankBusy(true);
    try {
      await onToggleRankVisibility(!hiddenFromRank);
      setSaveMsg(!hiddenFromRank ? t("Đã ẩn khỏi bảng xếp hạng") : t("Đã hiện lại trên bảng xếp hạng"));
    } catch {
      setSaveMsg(t("Có lỗi xảy ra, thử lại nhé."));
    } finally {
      setRankBusy(false);
    }
  }

  async function confirmDelete() {
    if (deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await onDeleteAccount(deleteEmailInput);
      // onDeleteAccount itself logs out on success — nothing left to render here.
    } catch (err) {
      setDeleteError(err instanceof ApiError ? t(err.message) : t("Không xoá được, thử lại nhé."));
    } finally {
      setDeleteBusy(false);
    }
  }

  const GROUPS: { label: string; color: string; title: string; rows: Row[] }[] = [
    {
      label: "Chung",
      color: "#F5822B",
      title: "Cài đặt chung",
      rows: [
        { label: "Ngôn ngữ giao diện", desc: "Đổi ngôn ngữ hiển thị của app — nội dung từ vựng bài học cũng đổi theo ngôn ngữ đã chọn (trừ tiếng Anh).", kind: "language" },
        { label: "Nhắc học hằng ngày", desc: isReminderSupported() ? "Gửi thông báo lúc 19:00 mỗi ngày (chỉ trên app điện thoại)" : "Chỉ hoạt động trên app cài trên điện thoại, không phải bản web", kind: "reminder" },
        { label: "Chế độ tối", desc: "Dịu mắt khi học buổi tối", kind: "soon" },
        { label: "Tự động phát âm", desc: "Đọc từ ngay khi hiện trên màn hình bài học", kind: "autoSpeak" },
      ],
    },
    {
      label: "Âm thanh",
      color: "#57C6C6",
      title: "Âm thanh & giọng đọc",
      rows: [
        { label: "Âm lượng nhạc nền", desc: "Chưa có nhạc nền trong app", kind: "soon" },
        { label: "Hiệu ứng âm thanh", desc: "Chưa có hiệu ứng âm thanh trong app", kind: "soon" },
        { label: "Tốc độ đọc", desc: "Chậm hơn cho bé mới bắt đầu — áp dụng cho mọi giọng đọc trong app", kind: "ttsRate" },
        { label: "Giọng đọc", desc: "Giọng Mỹ hoặc Anh-Anh — áp dụng cho mọi giọng đọc trong app", kind: "ttsVoice" },
      ],
    },
    {
      label: "Trẻ em & an toàn",
      color: "#7CC24A",
      title: "Trẻ em & an toàn",
      rows: [
        { label: "Giới hạn giờ mỗi ngày", desc: "Tự khoá app khi hết giờ", kind: "soon" },
        { label: "Khoá bằng mã phụ huynh", desc: "Cần PIN 4 số để vào khu phụ huynh trên máy này", kind: "parentPin" },
        { label: "Cho phép bảng xếp hạng", desc: "Hiện tên bé trên bảng xếp hạng toàn app", kind: "rankVisibility" },
        { label: "Chế độ ngoại tuyến", desc: "Chỉ học bài đã tải, không cần mạng", kind: "soon" },
      ],
    },
    {
      label: "Dữ liệu & tài khoản",
      color: "#9B7EDE",
      title: "Dữ liệu & tài khoản",
      rows: [
        { label: "Sao lưu tiến độ", desc: "Tiến độ đã luôn được lưu trực tiếp trên máy chủ — không cần sao lưu tay", kind: "synced" },
        { label: "Tải bài học offline", desc: "Đang phát triển", kind: "soon" },
        { label: "Xuất báo cáo học tập", desc: "Đang phát triển", kind: "soon" },
        { label: "Chính sách quyền riêng tư", desc: "Dữ liệu được thu thập, sử dụng và quyền kiểm soát của phụ huynh", kind: "privacy" },
        { label: "Điều khoản sử dụng", desc: "Quy tắc tài khoản, nội dung và vật phẩm ảo", kind: "terms" },
        { label: "Xoá toàn bộ dữ liệu", desc: "Không thể hoàn tác — cần gõ lại email để xác nhận", kind: "deleteAccount" },
      ],
    },
  ];
  const g = GROUPS[group]!;

  return (
    <div className="flex h-full flex-col bg-[#F7F4EE]">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-white p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <span className="font-baloo text-2xl font-extrabold">{t("Cài đặt")}</span>
        <div className="flex-1" />
        <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">
          {t("Phiên bản 2.4.0 · tài khoản phụ huynh:")} {parentEmail}
        </span>
      </div>

      <div className="flex flex-1 gap-5 overflow-hidden p-5.5">
        <div className="flex w-[230px] flex-col gap-2">
          {GROUPS.map((grp, i) => (
            <button
              key={grp.label}
              onClick={() => {
                setGroup(i);
                setSaveMsg("");
              }}
              className="flex items-center gap-3 rounded-2xl border-[3px] px-4 py-3.5 text-left font-baloo text-base font-extrabold"
              style={{ background: group === i ? "#FFF1DE" : "#fff", borderColor: group === i ? "#F5822B" : "#EFDFC2", color: group === i ? "#C7551A" : "#4A3728" }}
            >
              <span className="h-8 w-8 shrink-0 rounded-[11px]" style={{ background: grp.color }} />
              {t(grp.label)}
            </button>
          ))}
          <div className="mt-auto flex flex-col gap-2.5">
            <button onClick={onLogout} className="rounded-2xl border-[3px] border-[#F6C3BB] bg-[#FDF0EC] py-3.5 font-baloo text-[15px] font-extrabold text-[#B3402F]">
              {t("Đăng xuất")}
            </button>
            <div className="font-mono text-[10.5px] leading-relaxed text-[#A2947C]">{t("Xoá dữ liệu cần xác nhận qua email phụ huynh.")}</div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4.5 overflow-y-auto rounded-[24px] border-[3px] border-line2 bg-white p-6 shadow-[0_5px_0_#EADAB8]">
          <div className="font-baloo text-[22px] font-extrabold">{t(g.title)}</div>
          <div className="flex flex-col gap-3.5">
            {g.rows.map((row) => (
              <div key={row.label} className="flex items-center gap-4 border-b-2 border-dashed border-[#F1E7D3] pb-3.5">
                <div className="flex-1">
                  <div className="font-baloo text-[16.5px] font-extrabold">{t(row.label)}</div>
                  <div className="font-baloo text-[12.5px] font-semibold leading-snug text-[#8A7A62]">{t(row.desc)}</div>
                </div>
                {row.kind === "language" && <LangSwitch lang={lang} busy={langBusy} onPick={changeLanguage} />}
                {row.kind === "reminder" && <Switch on={reminderOn} onToggle={toggleReminder} disabled={reminderBusy} />}
                {row.kind === "autoSpeak" && <Switch on={autoSpeak} onToggle={toggleAutoSpeak} />}
                {row.kind === "ttsRate" && (
                  <TwoWaySwitch
                    value={ttsRate}
                    options={[
                      ["normal", t("Bình thường")],
                      ["slow", t("Chậm")],
                    ]}
                    onPick={pickTtsRate}
                  />
                )}
                {row.kind === "ttsVoice" && (
                  <TwoWaySwitch
                    value={ttsVoice}
                    options={[
                      ["us", t("Mỹ")],
                      ["uk", t("Anh-Anh")],
                    ]}
                    onPick={pickTtsVoice}
                  />
                )}
                {row.kind === "parentPin" && <Switch on={pinOn} onToggle={togglePin} />}
                {row.kind === "rankVisibility" && <Switch on={!hiddenFromRank} onToggle={toggleRank} disabled={rankBusy} />}
                {row.kind === "deleteAccount" && (
                  <button onClick={() => setDeleteOpen(true)} className="shrink-0 rounded-2xl bg-[#EF6A5A] px-5 py-2.5 font-baloo text-[15px] font-extrabold text-white shadow-[0_3px_0_#B3402F]">
                    {t("Xoá")}
                  </button>
                )}
                {row.kind === "synced" && <Pill text={t("Đã đồng bộ")} color="#7CC24A" />}
                {row.kind === "privacy" && <button onClick={() => onOpenLegal("privacy")} className="shrink-0 rounded-2xl bg-[#2FA9A5] px-5 py-2.5 font-baloo text-[15px] font-extrabold text-white shadow-[0_3px_0_#247E7B]">{t("Xem")}</button>}
                {row.kind === "terms" && <button onClick={() => onOpenLegal("terms")} className="shrink-0 rounded-2xl bg-[#8B6BCB] px-5 py-2.5 font-baloo text-[15px] font-extrabold text-white shadow-[0_3px_0_#654B9B]">{t("Xem")}</button>}
                {row.kind === "soon" && <Pill text={t("Sắp ra mắt")} color="#B3A691" />}
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-3.5">
            <div className="font-baloo text-sm font-bold text-[#4F7C2A]">{saveMsg}</div>
          </div>
        </div>
      </div>

      {pinPrompt && (
        <ParentPinPrompt
          mode={pinPrompt}
          title={pinPrompt === "set" ? t("Đặt mã PIN phụ huynh") : t("Nhập mã PIN hiện tại để tắt khoá")}
          onCancel={() => setPinPrompt(null)}
          onVerified={() => {
            clearParentPin();
            setPinOn(false);
            setPinPrompt(null);
            setSaveMsg(t("Đã tắt khoá mã PIN"));
          }}
          onSet={(pin) => {
            void setParentPin(pin).then(() => {
              setPinOn(true);
              setPinPrompt(null);
              setSaveMsg(t("Đã bật khoá mã PIN"));
            });
          }}
        />
      )}

      {deleteOpen && (
        <div className="absolute inset-0 z-[130] grid place-items-center bg-[#1B1237]/78 p-5 backdrop-blur-sm">
          <div className="flex w-[420px] max-w-[92%] flex-col gap-4 rounded-[28px] border-4 border-[#F6C3BB] bg-white p-6 shadow-[0_10px_0_#B3402F,0_25px_70px_rgba(0,0,0,.38)]">
            <div className="font-baloo text-[20px] font-extrabold text-[#B3402F]">{t("Xoá toàn bộ dữ liệu")}</div>
            <div className="font-baloo text-[13.5px] font-semibold leading-snug text-[#6E6047]">
              {t("Thao tác này xoá VĨNH VIỄN tài khoản, toàn bộ hồ sơ trẻ, tiến độ, pet và nội dung tự soạn. Không thể hoàn tác.")}
            </div>
            <div className="font-baloo text-[13px] font-bold text-[#4A3728]">
              {t("Gõ lại email")} <span className="text-[#B3402F]">{parentEmail}</span> {t("để xác nhận:")}
            </div>
            <input
              value={deleteEmailInput}
              onChange={(e) => setDeleteEmailInput(e.target.value)}
              placeholder={parentEmail}
              className="rounded-2xl border-[3px] border-[#F1E7D3] px-4 py-3 font-baloo text-sm font-semibold outline-none focus:border-[#EF6A5A]"
            />
            {deleteError && <div className="font-baloo text-[13px] font-bold text-[#C7455B]">{deleteError}</div>}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteEmailInput("");
                  setDeleteError("");
                }}
                disabled={deleteBusy}
                className="flex-1 rounded-2xl bg-[#F1E7D3] py-3 font-baloo text-sm font-extrabold text-[#6E6047] disabled:opacity-60"
              >
                {t("Huỷ")}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteBusy || deleteEmailInput.trim().toLowerCase() !== parentEmail.trim().toLowerCase()}
                className="flex-1 rounded-2xl bg-[#EF6A5A] py-3 font-baloo text-sm font-extrabold text-white shadow-[0_3px_0_#B3402F] disabled:opacity-40"
              >
                {deleteBusy ? t("Đang xoá…") : t("Xoá vĩnh viễn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
