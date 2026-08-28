import { useState } from "react";
import { useLang, useT } from "../lib/i18n";

interface OnboardingProps {
  onDone: () => void;
}

const STEPS_VI: { kicker: string; title: string; body: string; img: string; badge: [string, string]; bullets: [string, string][] }[] = [
  {
    kicker: "BƯỚC 1",
    title: "Chọn một bạn thú",
    body: "Bạn thú sẽ đi cùng suốt hành trình học. Học đều thì bạn ấy lớn nhanh.",
    img: "buddy",
    badge: ["Buddy", "#F5822B"],
    bullets: [
      ["40 bạn thú để mở khoá", "#F5822B"],
      ["Cho ăn, tắm, chơi mỗi ngày", "#57C6C6"],
      ["Pet nhắc bạn học đúng giờ", "#7CC24A"],
    ],
  },
  {
    kicker: "BƯỚC 2",
    title: "Học 5 phút mỗi ngày",
    body: "Mỗi bài học ngắn có nghe, chọn hình và bài test riêng ở cuối.",
    img: "mimi",
    badge: ["5 phút", "#57C6C6"],
    bullets: [
      ["Bài học chia theo 6 vùng thế giới", "#9B7EDE"],
      ["Nghe phát âm chuẩn từng từ", "#57C6C6"],
      ["Sai thì được nhắc lại ngay", "#EF6A5A"],
    ],
  },
  {
    kicker: "BƯỚC 3",
    title: "Kiếm coin, mở pet mới",
    body: "Hoàn thành bài học và mini-game để nhận coin và gem đổi bạn thú.",
    img: "stella",
    badge: ["+50 coin", "#FFC93C"],
    bullets: [
      ["Coin từ bài học và game", "#FFC93C"],
      ["Gem cho pet Epic và Legendary", "#57C6C6"],
      ["Chuỗi ngày học tặng thêm thưởng", "#F5822B"],
    ],
  },
  {
    kicker: "BƯỚC 4",
    title: "Bố mẹ luôn nắm được",
    body: "Khu phụ huynh có thời gian học, từ vựng yếu và giới hạn giờ chơi.",
    img: "bamboo",
    badge: ["An toàn", "#7CC24A"],
    bullets: [
      ["Không quảng cáo trong chế độ trẻ em", "#7CC24A"],
      ["Giới hạn thời gian mỗi ngày", "#6C8FE3"],
      ["Báo cáo tuần gửi email", "#9B7EDE"],
    ],
  },
];

const STEPS_EN: typeof STEPS_VI = [
  {
    kicker: "STEP 1",
    title: "Choose a companion",
    body: "Your pet will join the whole learning journey. Learn regularly and it grows fast.",
    img: "buddy",
    badge: ["Buddy", "#F5822B"],
    bullets: [
      ["40 pets to unlock", "#F5822B"],
      ["Feed, bathe, and play every day", "#57C6C6"],
      ["Pet reminds you to study on time", "#7CC24A"],
    ],
  },
  {
    kicker: "STEP 2",
    title: "Learn 5 minutes a day",
    body: "Each short lesson has listening, picture matching, and its own test at the end.",
    img: "mimi",
    badge: ["5 minutes", "#57C6C6"],
    bullets: [
      ["Lessons split across 6 world zones", "#9B7EDE"],
      ["Hear correct pronunciation for every word", "#57C6C6"],
      ["Get an instant retry when you're wrong", "#EF6A5A"],
    ],
  },
  {
    kicker: "STEP 3",
    title: "Earn coins, unlock new pets",
    body: "Finish lessons and mini-games to earn coins and gems for new companions.",
    img: "stella",
    badge: ["+50 coins", "#FFC93C"],
    bullets: [
      ["Coins from lessons and games", "#FFC93C"],
      ["Gems for Epic and Legendary pets", "#57C6C6"],
      ["Daily streaks give extra rewards", "#F5822B"],
    ],
  },
  {
    kicker: "STEP 4",
    title: "Parents always stay in the loop",
    body: "The Parent Area shows study time, weak vocabulary, and play-time limits.",
    img: "bamboo",
    badge: ["Safe", "#7CC24A"],
    bullets: [
      ["No ads in kid mode", "#7CC24A"],
      ["Daily time limits", "#6C8FE3"],
      ["Weekly report by email", "#9B7EDE"],
    ],
  },
];

const STEPS_JA: typeof STEPS_VI = [
  {
    kicker: "ステップ1",
    title: "相棒を選ぼう",
    body: "相棒は学習の旅にずっと一緒にいます。毎日学習すると早く成長します。",
    img: "buddy",
    badge: ["Buddy", "#F5822B"],
    bullets: [
      ["解除できる仲間40匹", "#F5822B"],
      ["毎日エサやり・お風呂・遊び", "#57C6C6"],
      ["ペットが学習時間を教えてくれる", "#7CC24A"],
    ],
  },
  {
    kicker: "ステップ2",
    title: "1日5分学ぼう",
    body: "各レッスンはリスニング、絵合わせ、最後に小テストがあります。",
    img: "mimi",
    badge: ["5分", "#57C6C6"],
    bullets: [
      ["6つのワールドエリアに分かれたレッスン", "#9B7EDE"],
      ["単語ごとの正しい発音を聞く", "#57C6C6"],
      ["間違えたらすぐにもう一度", "#EF6A5A"],
    ],
  },
  {
    kicker: "ステップ3",
    title: "コインを稼いで新しいペットを解除",
    body: "レッスンとミニゲームをクリアしてコインとジェムを獲得、新しい仲間と交換しよう。",
    img: "stella",
    badge: ["+50コイン", "#FFC93C"],
    bullets: [
      ["レッスンとゲームからコイン", "#FFC93C"],
      ["エピック・レジェンダリーペット用のジェム", "#57C6C6"],
      ["連続学習でボーナス報酬", "#F5822B"],
    ],
  },
  {
    kicker: "ステップ4",
    title: "保護者はいつでも把握できる",
    body: "保護者エリアで学習時間、苦手な単語、プレイ時間の制限が見られます。",
    img: "bamboo",
    badge: ["安全", "#7CC24A"],
    bullets: [
      ["子どもモードは広告なし", "#7CC24A"],
      ["1日の利用時間制限", "#6C8FE3"],
      ["週次レポートをメールで送信", "#9B7EDE"],
    ],
  },
];

const STEPS_KO: typeof STEPS_VI = [
  {
    kicker: "1단계",
    title: "동반자를 선택하세요",
    body: "동반자는 학습 여정 내내 함께해요. 꾸준히 학습하면 동반자가 빨리 자라요.",
    img: "buddy",
    badge: ["Buddy", "#F5822B"],
    bullets: [
      ["해제 가능한 동반자 40마리", "#F5822B"],
      ["매일 먹이 주기, 목욕, 놀기", "#57C6C6"],
      ["펫이 제때 학습하도록 알려줘요", "#7CC24A"],
    ],
  },
  {
    kicker: "2단계",
    title: "하루 5분씩 학습하세요",
    body: "각 짧은 레슨에는 듣기, 그림 고르기, 그리고 마지막에 미니 테스트가 있어요.",
    img: "mimi",
    badge: ["5분", "#57C6C6"],
    bullets: [
      ["6개 월드 지역으로 나뉜 레슨", "#9B7EDE"],
      ["단어마다 정확한 발음 듣기", "#57C6C6"],
      ["틀리면 바로 다시 알려줘요", "#EF6A5A"],
    ],
  },
  {
    kicker: "3단계",
    title: "코인을 모아 새 펫을 해제하세요",
    body: "레슨과 미니게임을 완료해서 코인과 젬을 받고 새 동반자로 교환하세요.",
    img: "stella",
    badge: ["+50코인", "#FFC93C"],
    bullets: [
      ["레슨과 게임에서 코인 획득", "#FFC93C"],
      ["에픽·레전더리 펫을 위한 젬", "#57C6C6"],
      ["연속 학습하면 추가 보상", "#F5822B"],
    ],
  },
  {
    kicker: "4단계",
    title: "부모님이 항상 확인할 수 있어요",
    body: "부모님 공간에서 학습 시간, 취약 어휘, 플레이 시간 제한을 볼 수 있어요.",
    img: "bamboo",
    badge: ["안전", "#7CC24A"],
    bullets: [
      ["어린이 모드에는 광고가 없어요", "#7CC24A"],
      ["하루 이용 시간 제한", "#6C8FE3"],
      ["주간 리포트를 이메일로 전송", "#9B7EDE"],
    ],
  },
];

const STEPS_BY_LANG: Record<string, typeof STEPS_VI> = { vi: STEPS_VI, en: STEPS_EN, ja: STEPS_JA, ko: STEPS_KO };

/** Onboarding — matches the reference sheet's "Phần 5 · Onboarding" panel. */
export default function Onboarding({ onDone }: OnboardingProps) {
  const { lang } = useLang();
  const t = useT();
  const STEPS = STEPS_BY_LANG[lang] ?? STEPS_VI;
  const [step, setStep] = useState(0);
  const s = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#BFE6F7] from-0% via-[#DCEFC8] via-58% to-[#6FB544] to-58%">
      <div className="animate-cloud absolute left-[10%] top-[7%] h-[46px] w-[140px] rounded-full bg-white/80" />
      <div className="absolute right-[12%] top-[14%] h-[54px] w-[180px] rounded-full bg-white/60" style={{ animation: "cloud 30s linear infinite alternate-reverse" }} />

      <div className="relative flex items-center gap-3.5 p-5.5">
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <span key={i} className="h-2.5 rounded-full transition-all" style={{ width: step === i ? "46px" : "14px", background: i <= step ? "#F5822B" : "rgba(255,255,255,.75)" }} />
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={() => setStep(STEPS.length - 1)} className="rounded-2xl bg-white/85 px-5.5 py-2.5 font-baloo text-[15px] font-bold text-[#8A7A62]">
          {t("Bỏ qua")}
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center gap-11 px-15 pb-7.5">
        <div className="flex w-[420px] flex-col gap-4.5">
          <div className="w-fit rounded-full bg-white px-4 py-1.5 font-baloo text-[13px] font-extrabold text-brand-orange shadow-[0_3px_0_rgba(0,0,0,.1)]">{s.kicker}</div>
          <div className="font-baloo text-[46px] font-extrabold leading-[1.1] text-ink">{s.title}</div>
          <div className="font-baloo text-lg font-semibold leading-relaxed text-[#5A6A55]">{s.body}</div>
          <div className="flex flex-col gap-2.5">
            {s.bullets.map(([label, color]) => (
              <div key={label} className="flex items-center gap-2.5 font-baloo text-[15px] font-bold">
                <span className="grid h-6.5 w-6.5 shrink-0 place-items-center rounded-[9px]" style={{ background: color }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4.5 4.5L19 7" />
                  </svg>
                </span>
                {label}
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-3.5">
            <button
              onClick={() => setStep((v) => Math.max(0, v - 1))}
              disabled={step === 0}
              className="rounded-2xl border-[3px] border-white/90 bg-white/85 px-6.5 py-3.5 font-baloo text-[17px] font-bold text-brand-brown disabled:opacity-45"
            >
              {t("Quay lại")}
            </button>
            <button
              onClick={() => (isLast ? onDone() : setStep((v) => v + 1))}
              className="relative overflow-hidden rounded-2xl bg-brand-orange px-10.5 py-4 font-baloo text-lg font-extrabold text-white shadow-[0_6px_0_#C9631A] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#C9631A]"
            >
              {isLast ? t("Vào học ngay") : t("Tiếp tục")}
              <span className="animate-shine pointer-events-none absolute left-0 top-0 h-full w-9 bg-gradient-to-r from-transparent via-white/55 to-transparent" />
            </button>
          </div>
        </div>

        <div className="relative grid h-[420px] w-[420px] place-items-center">
          <span className="animate-ring absolute h-[330px] w-[330px] rounded-full bg-white/50" />
          <span className="absolute bottom-14 h-11 w-[250px] rounded-[50%] bg-black/[.14]" />
          <img src={`/pets/${s.img}.png`} alt="" className="animate-bob h-[340px] w-[340px] object-contain object-bottom" />
          <span
            className="animate-pulse-soft absolute right-4.5 top-8.5 rounded-full px-5 py-2.5 font-baloo text-base font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,.18)]"
            style={{ background: s.badge[1] }}
          >
            {s.badge[0]}
          </span>
        </div>
      </div>
    </div>
  );
}
