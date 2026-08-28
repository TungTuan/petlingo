import { useState } from "react";
import { BackIcon } from "../components/ui";
import { useT } from "../lib/i18n";

interface ParentAreaProps {
  childName: string;
  level: number;
  onExit: () => void;
}

const PANELS = [
  {
    title: "Thời gian học 7 ngày",
    sub: "phút mỗi ngày",
    listTitle: "Bài học gần đây",
    chart: [18, 24, 12, 30, 22, 27, 23],
    color: "#6C8FE3",
    rows: [
      ["Animals — Lesson 3", "Hôm nay · 5/5 đúng", "+30 XP", "#7CC24A"],
      ["Colors — Test", "Hôm qua · 4/5 đúng", "+24 XP", "#FFC93C"],
      ["Memory Match", "Hôm qua · 4 cặp", "+40 coin", "#9B7EDE"],
      ["Numbers — Lesson 1", "2 ngày trước · 5/5", "+30 XP", "#57C6C6"],
    ],
  },
  {
    title: "Hoạt động theo giờ",
    sub: "lượt mở app",
    listTitle: "Phiên gần đây",
    chart: [2, 1, 3, 5, 4, 2, 3],
    color: "#57C6C6",
    rows: [
      ["16:20 → 16:43", "Forest · 2 bài học", "23 min", "#6C8FE3"],
      ["Hôm qua 19:02", "Town · mini-game", "18 min", "#6C8FE3"],
      ["2 ngày trước", "Forest · test", "12 min", "#6C8FE3"],
      ["3 ngày trước", "Pet Shop", "6 min", "#B3A691"],
    ],
  },
  {
    title: "Từ vựng đã học",
    sub: "từ mới mỗi ngày",
    listTitle: "Từ cần ôn lại",
    chart: [6, 9, 4, 11, 8, 10, 7],
    color: "#FFC93C",
    rows: [
      ["flower", "sai 2 lần · ôn hôm nay", "Cần ôn", "#EF6A5A"],
      ["river", "sai 1 lần · ôn mai", "Cần ôn", "#F5822B"],
      ["tiger", "đúng 3 lần · ôn sau 7 ngày", "Tốt", "#7CC24A"],
      ["sun", "đúng 4 lần · đã nhớ", "Đã nhớ", "#7CC24A"],
    ],
  },
  {
    title: "Giới hạn & an toàn",
    sub: "thiết lập hiện tại",
    listTitle: "Quy tắc đang bật",
    chart: [30, 30, 30, 30, 30, 45, 45],
    color: "#9B7EDE",
    rows: [
      ["Giới hạn 30 phút/ngày", "Tự khoá khi hết giờ", "Bật", "#7CC24A"],
      ["Không quảng cáo", "Tài khoản trẻ em", "Bật", "#7CC24A"],
      ["Chặn mua trong app", "Cần mã phụ huynh", "Bật", "#7CC24A"],
      ["Báo cáo tuần qua email", "Chủ nhật 20:00", "Tắt", "#B3A691"],
    ],
  },
];

const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Parent Area — matches the reference sheet's "Phần 2 · Parent" panel. */
export default function ParentArea({ childName, level, onExit }: ParentAreaProps) {
  const t = useT();
  const [ptab, setPtab] = useState(0);
  const [toggles, setToggles] = useState([true, false, true]);
  const P = PANELS[ptab]!;
  const maxV = Math.max(...P.chart);

  return (
    <div className="flex h-full flex-col bg-[#F7F4EE]">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-white p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <span className="font-baloo text-[26px] font-extrabold">Parent Area</span>
        <div className="ml-3.5 flex gap-0.5 rounded-2xl bg-[#F1E7D3] p-1">
          {["Progress", "Activity", "Vocabulary", "Settings"].map((label, i) => (
            <button
              key={label}
              onClick={() => setPtab(i)}
              className={`rounded-[11px] px-5.5 py-2.5 font-baloo text-[15px] font-bold ${ptab === i ? "bg-[#5C7BC9] text-white" : "text-[#8A7A62]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2.5 rounded-full border-[3px] border-[#C9E5F7] bg-[#EAF6FF] py-1.5 pl-1.5 pr-4.5">
          <img src="/pets/buddy.png" alt="" className="h-[38px] w-[38px] rounded-full bg-white object-contain" />
          <span className="font-baloo text-base font-extrabold text-[#3E7FB0]">
            {childName} · Level {level}
          </span>
        </div>
      </div>

      <div className="flex flex-1 gap-5 overflow-hidden p-5.5">
        <div className="flex w-[260px] flex-col gap-3.5">
          <div className="flex flex-col gap-3 rounded-[22px] border-[3px] border-line2 bg-white p-4.5 shadow-[0_5px_0_#EADAB8]">
            <div className="font-baloo text-[17px] font-extrabold">{t("Hôm nay")}</div>
            <div className="flex gap-2.5">
              <div className="flex-1 rounded-2xl bg-[#EAF6FF] p-3 text-center">
                <div className="font-baloo text-[26px] font-extrabold text-[#3E7FB0]">
                  23<span className="text-[13px]"> min</span>
                </div>
                <div className="font-baloo text-[11px] font-semibold text-[#8A9AA6]">{t("Học")}</div>
              </div>
              <div className="flex-1 rounded-2xl bg-[#FFF1DE] p-3 text-center">
                <div className="font-baloo text-[26px] font-extrabold text-[#C7551A]">7</div>
                <div className="font-baloo text-[11px] font-semibold text-[#A6866A]">Streak</div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-baloo text-[12.5px] font-bold text-[#8A7A62]">
                <span>{t("Giới hạn thời gian")}</span>
                <span>
                  30 {t("phút")}
                </span>
              </div>
              <div className="h-3.5 overflow-hidden rounded-full bg-[#F1E7D3]">
                <div className="h-full rounded-full bg-brand-blue" style={{ width: "77%" }} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-[22px] border-[3px] border-[#DDCFF5] bg-[#F1EAFB] p-4.5">
            <div className="font-baloo text-[17px] font-extrabold text-[#6E56A8]">Premium</div>
            <div className="font-baloo text-[13px] font-semibold leading-snug text-[#6E56A8]">{t("Full bài học · tắt quảng cáo · báo cáo chi tiết.")}</div>
            <button className="rounded-2xl bg-brand-purple py-3.5 font-baloo text-base font-extrabold text-white shadow-[0_5px_0_#7A5EBC] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#7A5EBC]">
              {t("Mở khoá 49k/tháng")}
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4.5">
          <div className="flex flex-col gap-4 rounded-[24px] border-[3px] border-line2 bg-white p-5.5 shadow-[0_5px_0_#EADAB8]">
            <div className="flex items-baseline gap-3">
              <span className="font-baloo text-xl font-extrabold">{t(P.title)}</span>
              <span className="font-baloo text-[13px] font-semibold text-[#8A7A62]">{t(P.sub)}</span>
            </div>
            <div className="flex h-[190px] items-end gap-4.5">
              {P.chart.map((v, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="font-baloo text-xs font-bold text-[#8A7A62]">{v}</span>
                  <span className="w-full rounded-t-xl" style={{ height: `${Math.round((v / maxV) * 140)}px`, background: i === 6 ? "#F5822B" : P.color }} />
                  <span className="font-baloo text-xs font-bold text-[#8A7A62]">{t(DAYS[i]!)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 gap-4.5">
            <div className="flex flex-1 flex-col gap-3 rounded-[24px] border-[3px] border-line2 bg-white p-5">
              <div className="font-baloo text-[18px] font-extrabold">{t(P.listTitle)}</div>
              {P.rows.map(([title, sub, value, dot]) => (
                <div key={title} className="flex items-center gap-3 border-b-2 border-dashed border-[#F1E7D3] py-2.5">
                  <span className="h-[34px] w-[34px] shrink-0 rounded-[11px]" style={{ background: dot }} />
                  <div className="flex-1">
                    <div className="font-baloo text-[15px] font-bold">{t(title)}</div>
                    <div className="font-baloo text-xs font-semibold text-[#8A7A62]">{t(sub)}</div>
                  </div>
                  <span className="font-baloo text-[15px] font-extrabold" style={{ color: dot }}>
                    {t(value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex w-[250px] flex-col gap-3.5 rounded-[24px] border-[3px] border-line2 bg-white p-5">
              <div className="font-baloo text-[18px] font-extrabold">{t("Cài đặt nhanh")}</div>
              {["Giới hạn 30 phút", "Báo cáo qua email", "Khoá mua trong app"].map((label, i) => (
                <button
                  key={label}
                  onClick={() => setToggles((tg) => tg.map((v, idx) => (idx === i ? !v : v)))}
                  className="flex items-center justify-between gap-2.5 text-left font-baloo text-sm font-bold"
                >
                  {t(label)}
                  <span className="relative h-[31px] w-[54px] flex-none rounded-full transition-colors" style={{ background: toggles[i] ? "#7CC24A" : "#E4D3BC" }}>
                    <span className="absolute top-[3px] h-[25px] w-[25px] rounded-full bg-white shadow transition-[left]" style={{ left: toggles[i] ? "26px" : "3px" }} />
                  </span>
                </button>
              ))}
              <div className="mt-auto font-mono text-[10.5px] leading-relaxed text-[#A2947C]">{t("Chế độ trẻ em luôn tắt quảng cáo và mua trong app.")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
