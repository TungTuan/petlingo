import { Capacitor } from "@capacitor/core";
import { useCallback, useRef, useState } from "react";

/**
 * Thin native/web abstraction for "listen to the child, get back what they
 * said" — powers EchoParrot.tsx's speak-and-be-heard practice, the one game
 * in the app that needs the microphone (every other game only ever plays
 * audio TO the child via lib/tts.ts, never records them).
 *
 * Two completely different backends depending on where we're running:
 *
 * - Native (iOS/Android via Capacitor): `@capacitor-community/speech-recognition`,
 *   which bridges to each platform's real on-device recognizer (iOS
 *   `SFSpeechRecognizer`, Android `SpeechRecognizer`). This is the ONLY
 *   option that actually works on iOS — Capacitor's iOS WebView (WKWebView)
 *   does not implement the browser `SpeechRecognition` API at all (a
 *   long-standing WebKit limitation; this is different from Safari-the-app,
 *   which does support it), so the plugin's own "web" fallback is a stub
 *   that throws "not implemented" for everything (see its dist/esm/web.js) —
 *   it is genuinely native-only, on purpose.
 * - Web (plain browser — dev server iteration, or Chrome/Android testing):
 *   falls back to the raw `window.SpeechRecognition`/`webkitSpeechRecognition`
 *   API directly. Chrome/Edge support this well; desktop Safari's support is
 *   inconsistent. This path exists purely so this game is iterable/testable
 *   without a native build every time — the real target is the native path.
 */

export type SpeechListenStatus = "idle" | "listening" | "unsupported" | "denied";

export function useSpeechRecognition() {
  const [status, setStatus] = useState<SpeechListenStatus>("idle");
  const webRecognizerRef = useRef<{ stop: () => void } | null>(null);

  const listen = useCallback(async (): Promise<string | null> => {
    if (Capacitor.isNativePlatform()) {
      const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
      try {
        const { available } = await SpeechRecognition.available();
        if (!available) {
          setStatus("unsupported");
          return null;
        }
        let perm = await SpeechRecognition.checkPermissions();
        if (perm.speechRecognition !== "granted") {
          perm = await SpeechRecognition.requestPermissions();
        }
        if (perm.speechRecognition !== "granted") {
          setStatus("denied");
          return null;
        }
        setStatus("listening");
        const { matches } = await SpeechRecognition.start({ language: "en-US", maxResults: 3, popup: false, partialResults: false });
        setStatus("idle");
        return matches?.[0] ?? null;
      } catch {
        setStatus("idle");
        return null;
      }
    }

    const Ctor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!Ctor) {
      setStatus("unsupported");
      return null;
    }
    return new Promise((resolve) => {
      const recognizer = new Ctor();
      recognizer.lang = "en-US";
      recognizer.maxAlternatives = 3;
      recognizer.interimResults = false;
      setStatus("listening");
      recognizer.onresult = (e) => {
        setStatus("idle");
        resolve(e.results?.[0]?.[0]?.transcript ?? null);
      };
      recognizer.onerror = (e) => {
        setStatus(e.error === "not-allowed" ? "denied" : "idle");
        resolve(null);
      };
      recognizer.onend = () => setStatus((s) => (s === "listening" ? "idle" : s));
      webRecognizerRef.current = recognizer;
      recognizer.start();
    });
  }, []);

  const cancel = useCallback(() => {
    webRecognizerRef.current?.stop();
    if (Capacitor.isNativePlatform()) {
      import("@capacitor-community/speech-recognition").then(({ SpeechRecognition }) => SpeechRecognition.stop().catch(() => {}));
    }
    setStatus("idle");
  }, []);

  return { status, listen, cancel };
}

/** Just the bits of the browser's SpeechRecognition interface this hook touches — not in lib.dom.d.ts by default. */
interface SpeechRecognitionLike {
  lang: string;
  maxAlternatives: number;
  interimResults: boolean;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

/** Normalizes for a forgiving compare — recognizers drop/add punctuation and
 * capitalization inconsistently, and kids' speech recognition especially
 * shouldn't be penalized for that. `includes()` (not just equality) also
 * tolerates the recognizer prepending/appending a stray filler word. */
export function isCloseSpeechMatch(target: string, heard: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const t = normalize(target);
  const h = normalize(heard);
  if (!t || !h) return false;
  return h === t || h.includes(t);
}
