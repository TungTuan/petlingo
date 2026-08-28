import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tungnguyentuan.petlingo",
  appName: "Petlingo",
  webDir: "dist",
  server: {
    // Lets the Android WebView call a plain http:// backend (e.g. your Mac's
    // LAN IP while testing) — Android 9+ blocks cleartext traffic by default
    // otherwise. iOS needs a separate Info.plist exception, see MOBILE_BUILD.md.
    // Turn this off (and switch the backend to HTTPS) before ever shipping
    // a real release build.
    cleartext: true,
  },
};

export default config;
