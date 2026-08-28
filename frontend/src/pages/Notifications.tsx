import { useEffect, useState } from "react";
import { BackIcon } from "../components/ui";
import { useT } from "../lib/i18n";
import { api, ApiError, type AppNotification, type NotificationKind } from "../lib/api";

interface NotificationsProps {
  childId: string;
  onExit: () => void;
}

// One dot color + shape per real event kind (see backend's notification.service.ts —
// these 4 are the only kinds anything in the app actually creates).
const KIND_STYLE: Record<NotificationKind, { color: string; radius: string; tab: 1 | 2 }> = {
  lesson: { color: "#7CC24A", radius: "999px", tab: 1 },
  quest: { color: "#F5822B", radius: "10px", tab: 1 },
  checkin: { color: "#57C6C6", radius: "999px", tab: 1 },
  petUnlock: { color: "#F79BB0", radius: "14px", tab: 2 },
};

function timeAgo(iso: string, t: (s: string) => string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return t("Vừa xong");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${t("phút")}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${t("giờ")}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return t("Hôm qua");
  return `${days} ${t("ngày")}`;
}

/** Notifications — matches the reference sheet's "Phần 5 · Thông báo" panel.
 * Used to be 6 hardcoded fake rows that reset to "unread" every visit — now
 * backed by real events (see backend's notification.service.ts: pet
 * unlocked, điểm danh, nhiệm vụ hoàn thành, bài học xong) with "đã đọc"
 * persisted server-side, so it stays read across visits/devices instead of
 * re-highlighting itself. */
export default function Notifications({ childId, onExit }: NotificationsProps) {
  const t = useT();
  const [tab, setTab] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api
      .listNotifications(childId)
      .then((r) => setNotifications(r.notifications))
      .catch((err) => setMsg(err instanceof ApiError ? t(err.message) : t("Không tải được thông báo, thử lại nhé.")));
  }, [childId, t]);

  const shown = (notifications ?? []).filter((n) => tab === 0 || KIND_STYLE[n.kind].tab === tab);
  const unread = (notifications ?? []).filter((n) => !n.read).length;

  async function open(n: AppNotification) {
    setMsg(`${t("Đã mở:")} ${t(n.title)}`);
    if (n.read) return;
    setNotifications((list) => (list ? list.map((x) => (x.id === n.id ? { ...x, read: true } : x)) : list));
    try {
      const { notifications: fresh } = await api.markNotificationRead(childId, n.id);
      setNotifications(fresh);
    } catch {
      // Local optimistic update already shows it as read; a failed sync here
      // just means the very next full list refresh corrects it — not worth
      // bothering the user with an error for.
    }
  }

  async function markAllRead() {
    try {
      const { notifications: fresh } = await api.markAllNotificationsRead(childId);
      setNotifications(fresh);
      setMsg(t("Đã đánh dấu tất cả là đã đọc"));
    } catch (err) {
      setMsg(err instanceof ApiError ? t(err.message) : t("Không thực hiện được, thử lại nhé."));
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#F7F4EE]">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-white p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <span className="font-baloo text-[26px] font-extrabold">{t("Thông báo")}</span>
        {unread > 0 && (
          <span className="animate-pulse-soft rounded-full bg-[#EF6A5A] px-3 py-1 font-baloo text-sm font-extrabold text-white shadow-[0_3px_0_#C74B3D]">
            {unread} {t("mới")}
          </span>
        )}
        <div className="ml-3 flex gap-0.5 rounded-2xl bg-[#F1E7D3] p-1">
          {["Tất cả", "Học tập", "Pet"].map((label, i) => (
            <button key={label} onClick={() => setTab(i)} className={`rounded-[11px] px-4.5 py-2.5 font-baloo text-[14.5px] font-bold ${tab === i ? "bg-[#5C7BC9] text-white" : "text-[#8A7A62]"}`}>
              {t(label)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={markAllRead}
          disabled={unread === 0}
          className="rounded-2xl border-[3px] border-line bg-cream-card px-4.5 py-2.5 font-baloo text-sm font-bold text-brand-brown shadow-[0_4px_0_#E7D4B2] disabled:opacity-50"
        >
          {t("Đánh dấu đã đọc")}
        </button>
      </div>

      <div className="flex flex-1 gap-5 overflow-hidden p-5.5">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {notifications === null ? (
            <div className="grid flex-1 place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải…")}</div>
          ) : shown.length === 0 ? (
            <div className="grid flex-1 place-items-center rounded-[24px] border-4 border-dashed border-line font-baloo text-base font-bold text-ink/40">
              {t("Chưa có thông báo nào ở đây — học vài bài hoặc mở khoá pet mới nhé!")}
            </div>
          ) : (
            shown.map((n) => {
              const style = KIND_STYLE[n.kind];
              return (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className="flex items-start gap-3.5 rounded-[20px] border-[3px] p-4.5 text-left"
                  style={{ background: n.read ? "#FBF6EC" : "#fff", borderColor: n.read ? "#EFDFC2" : "#E7D4B2", boxShadow: `0 4px 0 ${n.read ? "#EFDFC2" : "#EADAB8"}` }}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: style.color }}>
                    <span className="h-5 w-5 bg-white/92" style={{ borderRadius: style.radius }} />
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2.5">
                      <span className="font-baloo text-base font-extrabold">{t(n.title)}</span>
                      {!n.read && <span className="h-2.5 w-2.5 rounded-full bg-[#EF6A5A]" />}
                    </span>
                    <span className="font-baloo text-sm font-semibold leading-snug text-[#6E6047]">{t(n.body)}</span>
                  </span>
                  <span className="shrink-0 font-baloo text-[12.5px] font-bold text-[#A2947C]">{timeAgo(n.createdAt, t)}</span>
                </button>
              );
            })
          )}
          <div className="font-baloo text-[13.5px] font-bold text-[#8A7A62]">{msg}</div>
        </div>

        <div className="flex w-[290px] flex-col gap-4">
          <div className="rounded-[22px] border-[3px] border-line2 bg-white p-4.5 font-baloo text-[13px] font-semibold leading-relaxed text-[#8A7A62]">
            {t("Thông báo ở đây ghi lại đúng những gì đã xảy ra thật trong app — xong bài học, mở khoá pet, điểm danh, hoàn thành nhiệm vụ.")}
          </div>
          <div className="mt-auto font-mono text-[10.5px] leading-relaxed text-[#A2947C]">
            {t("Thông báo cho trẻ chỉ là nhắc học và pet đang chờ. Không quảng cáo, không link ngoài.")}
          </div>
        </div>
      </div>
    </div>
  );
}
