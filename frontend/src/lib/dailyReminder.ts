import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

/**
 * Settings.tsx's "Nhắc học hằng ngày" — a real local (on-device) daily
 * notification at 19:00, not a server push (no push infrastructure exists
 * in this app, and a local notification needs none: the OS itself fires it
 * on schedule even if Petlingo isn't running). Only actually schedulable on
 * a native build (iOS/Android) — Capacitor's plugin no-ops with a rejected
 * promise in a plain browser tab, so every exported function checks
 * `isReminderSupported()` first and the caller (Settings.tsx) shows an
 * explanatory message instead of pretending it worked on web.
 */
const ENABLED_KEY = "petlingo.dailyReminderEnabled";
const NOTIFICATION_ID = 1;

export function isReminderSupported(): boolean {
  return Capacitor.isNativePlatform();
}

export function isReminderEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === "1";
}

export async function enableDailyReminder(): Promise<void> {
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") {
    throw new Error("Petlingo cần quyền thông báo để nhắc học hằng ngày — hãy bật trong Cài đặt máy.");
  }
  await LocalNotifications.schedule({
    notifications: [
      {
        id: NOTIFICATION_ID,
        title: "Đến giờ học tiếng Anh rồi! 🐾",
        body: "Bạn thú đang chờ bạn quay lại học cùng đó.",
        schedule: { on: { hour: 19, minute: 0 }, allowWhileIdle: true },
      },
    ],
  });
  localStorage.setItem(ENABLED_KEY, "1");
}

export async function disableDailyReminder(): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
  localStorage.removeItem(ENABLED_KEY);
}
