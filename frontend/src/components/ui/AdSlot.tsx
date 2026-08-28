import { useT } from "../../lib/i18n";

/**
 * Khối quảng cáo. KHÔNG render với tài khoản trẻ em — luật COPPA/GDPR-K.
 */
export function AdSlot({
  kind = "banner",
  isChild = false,
  premium = false,
  note,
}: {
  kind?: "banner" | "square" | "interstitial";
  isChild?: boolean;
  premium?: boolean;
  note?: string;
}) {
  const t = useT();
  if (isChild || premium) return null;
  const h = { banner: 64, square: 150, interstitial: 120 }[kind];
  return (
    <div className="flex flex-col items-center gap-2 rounded-[20px] border-[3px] border-dashed border-[#DFC9A2] bg-cream p-4">
      <div className="font-mono text-[10px] text-[#A2947C]">
        ADMOB · {kind.toUpperCase()} · {t("TÀI KHOẢN NGƯỜI LỚN")}
      </div>
      <div
        className="grid w-full place-items-center rounded-xl bg-[repeating-linear-gradient(45deg,#F0E5D0,#F0E5D0_8px,#E8DBC2_8px,#E8DBC2_16px)] font-mono text-[11px] text-[#A2947C]"
        style={{ height: h }}
      >
        ad slot
      </div>
      {note && <div className="font-baloo text-xs font-semibold text-[#8A7A62]">{note}</div>}
    </div>
  );
}
