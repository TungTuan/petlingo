/**
 * Loads each provider's own web SDK on demand and drives its sign-in popup,
 * returning the token the backend's /auth/<provider> route verifies (see
 * backend/src/lib/socialProviders.ts for exactly what each one checks).
 *
 * Web-only for now: this runs fine inside the Capacitor WebView too (all 3
 * SDKs open a popup/redirect that works in an embedded browser), but Apple
 * specifically expects the NATIVE Sign in with Apple flow on iOS apps for
 * App Store compliance — see TASKS.md's note on the native Capacitor plugin
 * upgrade still needed before shipping this to the App Store. Google/
 * Facebook could similarly get a native-feeling upgrade later (system
 * account picker instead of a web popup) but aren't required to.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: { type: "standard" }) => void;
        };
      };
    };
    FB?: {
      init: (config: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (callback: (response: { authResponse?: { accessToken?: string } }) => void, options: { scope: string }) => void;
    };
    fbAsyncInit?: () => void;
    AppleID?: {
      auth: {
        init: (config: { clientId: string; scope: string; redirectURI: string; usePopup: boolean }) => void;
        signIn: () => Promise<{ authorization?: { id_token?: string } }>;
      };
    };
  }
}

const loadedScripts = new Set<string>();

function loadScript(src: string): Promise<void> {
  if (loadedScripts.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Không tải được ${src} — kiểm tra lại kết nối mạng.`));
    document.head.appendChild(script);
  });
}

export async function signInWithGoogle(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) throw new Error("Đăng nhập Google chưa được cấu hình (thiếu VITE_GOOGLE_CLIENT_ID trong .env).");
  await loadScript("https://accounts.google.com/gsi/client");

  return new Promise((resolve, reject) => {
    const google = window.google;
    if (!google) return reject(new Error("Không tải được thư viện Google."));

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) resolve(response.credential);
        else reject(new Error("Không lấy được thông tin đăng nhập Google."));
      },
    });

    // Google Identity Services has no supported "open the popup on demand"
    // API for a custom-styled button — the standard workaround is rendering
    // Google's own button into an invisible container and clicking it for
    // the user, so our pixel-art-styled button is what they actually see.
    let container = document.getElementById("google-signin-hidden");
    if (!container) {
      container = document.createElement("div");
      container.id = "google-signin-hidden";
      container.style.position = "fixed";
      container.style.top = "-9999px";
      document.body.appendChild(container);
    }
    container.innerHTML = "";
    google.accounts.id.renderButton(container, { type: "standard" });
    const realButton = container.querySelector<HTMLElement>("div[role=button]");
    if (!realButton) return reject(new Error("Không khởi tạo được nút đăng nhập Google."));
    realButton.click();
  });
}

let fbInit: Promise<void> | null = null;

function initFacebookSdk(appId: string): Promise<void> {
  if (fbInit) return fbInit;
  fbInit = new Promise((resolve) => {
    window.fbAsyncInit = () => {
      window.FB!.init({ appId, cookie: true, xfbml: false, version: "v21.0" });
      resolve();
    };
  });
  void loadScript("https://connect.facebook.net/en_US/sdk.js");
  return fbInit;
}

export async function signInWithFacebook(): Promise<string> {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;
  if (!appId) throw new Error("Đăng nhập Facebook chưa được cấu hình (thiếu VITE_FACEBOOK_APP_ID trong .env).");
  await initFacebookSdk(appId);

  return new Promise((resolve, reject) => {
    window.FB!.login((response) => {
      if (response.authResponse?.accessToken) resolve(response.authResponse.accessToken);
      else reject(new Error("Đăng nhập Facebook bị huỷ hoặc thất bại."));
    }, { scope: "email" });
  });
}

let appleInit: Promise<void> | null = null;

function initAppleSdk(clientId: string, redirectURI: string): Promise<void> {
  if (appleInit) return appleInit;
  appleInit = loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auto.js").then(() => {
    window.AppleID!.auth.init({ clientId, scope: "name email", redirectURI, usePopup: true });
  });
  return appleInit;
}

export async function signInWithApple(): Promise<string> {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined;
  const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined;
  if (!clientId || !redirectURI) throw new Error("Đăng nhập Apple chưa được cấu hình (thiếu VITE_APPLE_CLIENT_ID/VITE_APPLE_REDIRECT_URI trong .env).");
  await initAppleSdk(clientId, redirectURI);

  const data = await window.AppleID!.auth.signIn();
  const idToken = data.authorization?.id_token;
  if (!idToken) throw new Error("Không lấy được thông tin đăng nhập Apple.");
  return idToken;
}
