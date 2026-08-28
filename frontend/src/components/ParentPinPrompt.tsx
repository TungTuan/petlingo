import { useState } from "react";
import { useT } from "../lib/i18n";
import { verifyParentPin } from "../lib/parentPin";

interface ParentPinPromptProps {
  /** "set" asks the user to enter a new 4-digit PIN twice (used from Settings
   * when turning the lock ON). "verify" checks against the PIN already
   * stored (used both from Settings when turning the lock OFF, and by the
   * Parent Area gate itself). */
  mode: "set" | "verify";
  title: string;
  onCancel: () => void;
  onVerified: () => void;
  onSet: (pin: string) => void;
}

/** Small 4-digit PIN pad — shared by Settings.tsx's "Khoá bằng mã phụ huynh"
 * toggle and the actual Parent Area entry gate in App.tsx. */
export default function ParentPinPrompt({ mode, title, onCancel, onVerified, onSet }: ParentPinPromptProps) {
  const t = useT();
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const needsConfirm = mode === "set" && firstPin !== null;
  const label = needsConfirm ? t("Nhập lại mã PIN để xác nhận") : mode === "set" ? t("Đặt mã PIN mới (4 số)") : t("Nhập mã PIN");

  function onBackspace() {
    setPin((p) => p.slice(0, -1));
  }

  async function submit(fullPin: string) {
    if (mode === "verify") {
      setBusy(true);
      const ok = await verifyParentPin(fullPin);
      setBusy(false);
      if (ok) {
        onVerified();
      } else {
        setError(t("Sai mã PIN, thử lại nhé."));
        setPin("");
      }
      return;
    }
    // mode === "set"
    if (!needsConfirm) {
      setFirstPin(fullPin);
      setPin("");
      return;
    }
    if (fullPin === firstPin) {
      onSet(fullPin);
    } else {
      setError(t("2 mã PIN không khớp, nhập lại từ đầu."));
      setFirstPin(null);
      setPin("");
    }
  }

  function onDigitFilled(next: string) {
    setPin(next);
    if (next.length === 4) void submit(next);
  }

  return (
    <div className="absolute inset-0 z-[130] grid place-items-center bg-[#1B1237]/78 p-5 backdrop-blur-sm">
      <div className="flex w-[360px] max-w-[92%] flex-col items-center gap-4 rounded-[28px] border-4 border-[#E7D8FF] bg-[#FFF9EC] p-6 shadow-[0_10px_0_#7657A6,0_25px_70px_rgba(0,0,0,.38)]">
        <div className="text-center font-baloo text-[20px] font-extrabold text-[#5B3D91]">{title}</div>
        <div className="text-center font-baloo text-sm font-semibold text-[#806D96]">{label}</div>
        <div className="flex gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              className="grid h-12 w-12 place-items-center rounded-2xl border-[3px] font-baloo text-2xl font-extrabold text-[#5B3D91]"
              style={{ borderColor: i < pin.length ? "#9B72D4" : "#E7D4B2", background: "#fff" }}
            >
              {i < pin.length ? "●" : ""}
            </span>
          ))}
        </div>
        {error && <div className="font-baloo text-[13px] font-bold text-[#C7455B]">{error}</div>}
        <div className="grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              disabled={busy}
              onClick={() => onDigitFilled(pin.length < 4 ? pin + d : pin)}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-white font-baloo text-xl font-extrabold text-[#5B3D91] shadow-[0_3px_0_#E7D4B2] disabled:opacity-50"
            >
              {d}
            </button>
          ))}
          <button onClick={onBackspace} disabled={busy} className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F1E7D3] font-baloo text-sm font-extrabold text-[#8A7A62] disabled:opacity-50">
            ⌫
          </button>
          <button
            disabled={busy}
            onClick={() => onDigitFilled(pin.length < 4 ? pin + "0" : pin)}
            className="grid h-14 w-14 place-items-center rounded-2xl bg-white font-baloo text-xl font-extrabold text-[#5B3D91] shadow-[0_3px_0_#E7D4B2] disabled:opacity-50"
          >
            0
          </button>
          <button onClick={onCancel} disabled={busy} className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FDECEC] font-baloo text-sm font-extrabold text-[#C7455B] disabled:opacity-50">
            {t("Huỷ")}
          </button>
        </div>
      </div>
    </div>
  );
}
