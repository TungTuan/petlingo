import { useState } from "react";
import { BackIcon } from "../components/ui";
import { useT } from "../lib/i18n";

interface SystemStatesProps {
  onExit: () => void;
}

interface StateDef {
  key: string;
  title: string;
  body: string;
  img: string;
  bg: string;
  border: string;
  shadow: string;
  titleColor: string;
  btnBg: string;
  btnShadow: string;
  primary: string;
  secondary: string;
  code: string;
  filter: string;
  hasMeter?: boolean;
  meterLabel?: string;
  meterValue?: string;
  meterColor?: string;
  icon: string;
}

const STATES: StateDef[] = [
  {
    key: "offline",
    title: "Mất mạng rồi!",
    body: "Buddy không tải được bài mới. Bài đã tải vẫn học được bình thường.",
    img: "buddy",
    bg: "#F1F4F7",
    border: "#D6E1EA",
    shadow: "#CBD8E3",
    titleColor: "#4A6B85",
    btnBg: "#5C7BC9",
    btnShadow: "#43609F",
    primary: "Thử lại",
    secondary: "Học bài đã tải",
    code: "NET_OFFLINE",
    filter: "grayscale(.35)",
    icon: "!",
  },
  {
    key: "timeup",
    title: "Hết giờ học hôm nay",
    body: "Lily đã học đủ 30 phút. Mai quay lại nhé — Buddy sẽ chờ!",
    img: "mimi",
    bg: "#EFEAF8",
    border: "#DDCFF5",
    shadow: "#CFC0EC",
    titleColor: "#6E56A8",
    btnBg: "#9B7EDE",
    btnShadow: "#7A5EBC",
    primary: "Xin thêm 10 phút",
    secondary: "Đóng app",
    code: "TIME_LIMIT_REACHED",
    filter: "none",
    hasMeter: true,
    meterLabel: "Đã dùng",
    meterValue: "100%",
    meterColor: "#9B7EDE",
    icon: "⏱",
  },
  {
    key: "empty",
    title: "Chưa có bài học nào",
    body: "Vùng này đang được thêm bài mới. Thử vùng Forest hoặc Town trước nhé.",
    img: "poppy",
    bg: "#FFF9EC",
    border: "#EBD9B8",
    shadow: "#E3CFA8",
    titleColor: "#8A5A3B",
    btnBg: "#F5822B",
    btnShadow: "#C9631A",
    primary: "Về World Map",
    secondary: "Chơi mini-game",
    code: "CONTENT_EMPTY",
    filter: "none",
    icon: "?",
  },
  {
    key: "error",
    title: "Có gì đó chưa ổn",
    body: "Buddy làm rơi mất dữ liệu bài học. Thử lại sau vài giây nhé.",
    img: "ember",
    bg: "#FDF0EC",
    border: "#F6C3BB",
    shadow: "#EFB0A6",
    titleColor: "#B3402F",
    btnBg: "#EF6A5A",
    btnShadow: "#C74B3D",
    primary: "Tải lại",
    secondary: "Báo cho bố mẹ",
    code: "ERR_500_LESSON_FETCH",
    filter: "none",
    icon: "!",
  },
];

/** System states — matches the reference sheet's "Phần 5 · Trạng thái hệ thống" panel: illustrated empty/error/offline/timeout states. */
export default function SystemStates({ onExit }: SystemStatesProps) {
  const t = useT();
  const [tab, setTab] = useState(0);
  const [msg, setMsg] = useState("");
  const st = STATES[tab]!;

  return (
    <div className="flex h-full flex-col bg-cream">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-[#F7EFDD] p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <span className="font-baloo text-2xl font-extrabold">{t("Trạng thái hệ thống")}</span>
        <div className="ml-2.5 flex gap-0.5 rounded-2xl bg-[#F1E7D3] p-1">
          {["Mất mạng", "Hết giờ", "Chưa có bài", "Lỗi tải"].map((label, i) => (
            <button
              key={label}
              onClick={() => {
                setTab(i);
                setMsg("");
              }}
              className={`rounded-[11px] px-4.5 py-2.5 font-baloo text-[14.5px] font-bold ${tab === i ? "bg-[#5C7BC9] text-white" : "text-[#8A7A62]"}`}
            >
              {t(label)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Mỗi trạng thái đều có pet dẫn dắt, không dùng chữ lỗi kỹ thuật")}</span>
      </div>

      <div className="grid flex-1 place-items-center p-6.5">
        <div
          className="animate-pop flex w-[660px] flex-col items-center gap-4.5 rounded-[30px] border-4 p-9"
          style={{ background: st.bg, borderColor: st.border, boxShadow: `0 8px 0 ${st.shadow}` }}
        >
          <div className="relative grid h-[200px] w-[220px] place-items-center">
            <span className="absolute bottom-3.5 h-8.5 w-[170px] rounded-[50%] bg-black/[.12]" />
            <img src={`/pets/${st.img}.png`} alt="" className="animate-bob h-[200px] w-[200px] object-contain object-bottom" style={{ filter: st.filter }} />
            <span
              className="absolute right-1 top-1.5 grid h-13 w-13 place-items-center rounded-full font-baloo text-2xl font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,.16)]"
              style={{ background: st.btnBg, animation: st.key === "offline" ? "wifi 1.6s ease-in-out infinite" : "pulseSoft 2s ease-in-out infinite" }}
            >
              {st.icon}
            </span>
          </div>
          <div className="text-center font-baloo text-[32px] font-extrabold" style={{ color: st.titleColor }}>
            {t(st.title)}
          </div>
          <div className="max-w-[480px] text-center font-baloo text-lg font-semibold leading-relaxed text-[#6E6047]">{t(st.body)}</div>
          {st.hasMeter && (
            <div className="flex w-full max-w-[420px] flex-col gap-1.5">
              <div className="flex justify-between font-baloo text-[13px] font-bold text-[#8A7A62]">
                <span>{t(st.meterLabel!)}</span>
                <span>{st.meterValue}</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-white/75">
                <div className="h-full rounded-full" style={{ width: st.meterValue, background: st.meterColor }} />
              </div>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3.5">
            <button
              onClick={() => setMsg(st.key === "timeup" ? t("Cần mã phụ huynh để mở thêm giờ") : t("Đang thử lại…"))}
              className="rounded-2xl px-9 py-3.5 font-baloo text-lg font-extrabold text-white transition-transform active:translate-y-1"
              style={{ background: st.btnBg, boxShadow: `0 5px 0 ${st.btnShadow}` }}
            >
              {t(st.primary)}
            </button>
            <button className="rounded-2xl border-[3px] border-line bg-white px-7.5 py-3 font-baloo text-[17px] font-bold text-brand-brown">{t(st.secondary)}</button>
          </div>
          <div className="font-mono text-[10.5px] text-[#A2947C]">{st.code}</div>
          <div className="min-h-[18px] font-baloo text-sm font-bold" style={{ color: st.titleColor }}>
            {msg}
          </div>
        </div>
      </div>
    </div>
  );
}
