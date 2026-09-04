import { useEffect, useMemo, useState } from "react";
import { api, ApiError, type ShopShelfItem, type ShopTopicDetail, type ShopTopicListItem } from "../lib/api";
import { BackIcon, ChunkyButton, CoinIcon, RewardModal, SpeakerIcon } from "../components/ui";
import { speak } from "../lib/tts";
import { useT } from "../lib/i18n";

interface EnglishShopProps {
  onExit: () => void;
  onComplete?: (contentKey: string) => void;
}

const SHOP_TOPIC_ICON: Record<string, string> = {
  fruit: "🍎", bakery: "🥐", drinks: "🥤", vegetables: "🥕", toys: "🧸", clothes: "👕", supermarket: "🛒",
};

/** English Shop — "Buy 2 apples and 1 banana." style shopping-list rounds:
 * read the list, tap the right items (+ right quantities) off a shelf that
 * also has decoy items/extra copies, then pay. Backed by real
 * ShopTopic/ShopRound catalog data (see /catalog/shop-topics): shows a topic
 * picker first, then plays whichever topic was tapped. Unrelated to the
 * coin/gem "Pet Shop" (pages/Shop.tsx) despite the name overlap — this is a
 * vocabulary mini-game, not a purchase screen. */
export default function EnglishShop({ onExit, onComplete }: EnglishShopProps) {
  const t = useT();
  const [list, setList] = useState<ShopTopicListItem[] | null>(null);
  const [topic, setTopic] = useState<ShopTopicDetail | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    api
      .listShopTopics()
      .then((r) => setList(r.topics))
      .catch((err) => setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách chủ đề, thử lại nhé.")));
  }, [t]);

  async function openTopic(id: string) {
    setLoadErr("");
    try {
      const { topic } = await api.getShopTopic(id);
      setTopic(topic);
    } catch (err) {
      setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được chủ đề, thử lại nhé."));
    }
  }

  if (topic && difficulty) return <EnglishShopPlay topic={topic} difficulty={difficulty} onExit={() => setDifficulty(null)} onComplete={() => onComplete?.(topic.id)} />;
  if (topic) return <ShopDifficulty topic={topic} onPick={setDifficulty} onExit={() => setTopic(null)} />;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#FFE4B8,#FFF6E6_48%,#EAF6E4)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[repeating-linear-gradient(90deg,#EF6A5A_0_70px,#FFF4DC_70px_140px)] opacity-20" />
      <div className="relative flex items-center gap-3.5 border-b-2 border-white/70 bg-white/60 p-4.5 backdrop-blur-md">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[28px] font-extrabold text-[#8A4B2A]">English Shop</span>
          <span className="font-baloo text-[13px] font-semibold text-[#9B765C]">{t("Đọc danh sách · chọn đúng số lượng · thanh toán")}</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto px-7 py-6">
        {list === null ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải danh sách chủ đề…")}</div>
        ) : loadErr && list.length === 0 ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-[#B3402F]">{loadErr}</div>
        ) : (
          <div className="grid grid-cols-5 gap-5">
            {list.map((tp) => (
              <button
                key={tp.id}
                onClick={() => openTopic(tp.id)}
                className="group relative flex min-h-[190px] flex-col items-center gap-2.5 overflow-hidden rounded-[26px] border-[3px] border-white bg-white/92 p-4.5 text-center shadow-[0_7px_0_#E1BD83,0_14px_28px_rgba(128,82,37,.12)] transition-all hover:-translate-y-1.5"
              >
                <span className="absolute inset-x-0 top-0 h-2" style={{ background: tp.color }} />
                <span className="grid h-20 w-20 place-items-center rounded-[24px] text-[42px] shadow-[inset_0_-5px_0_rgba(0,0,0,.08)] transition-transform group-hover:scale-110" style={{ background: `${tp.color}35` }}>{SHOP_TOPIC_ICON[tp.key] ?? "🛍️"}</span>
                <span className="font-baloo text-[17px] font-extrabold leading-snug text-[#764124]">{tp.name}</span>
                <span className="mt-auto rounded-full bg-[#FFF1D8] px-3 py-1.5 font-baloo text-[11.5px] font-bold text-[#9B765C]">
                  {tp._count.rounds} {t("lượt chơi")}
                </span>
              </button>
            ))}
          </div>
        )}
        {loadErr && list && list.length > 0 && <div className="mt-3 font-baloo text-sm font-bold text-[#B3402F]">{loadErr}</div>}
      </div>
    </div>
  );
}

const SHOP_LEVELS = {
  easy: { label: "Dễ", icon: "🧺", rounds: 5, note: "5 lượt · 1–2 loại hàng", color: "#70B94A", range: [0, 34] },
  medium: { label: "Trung bình", icon: "🛒", rounds: 10, note: "10 lượt · 2–3 loại hàng", color: "#E6A52D", range: [34, 67] },
  hard: { label: "Khó", icon: "🏪", rounds: 20, note: "20 lượt · 3 loại · nhiều số lượng", color: "#E76558", range: [67, 100] },
} as const;

function ShopDifficulty({ topic, onPick, onExit }: { topic: ShopTopicDetail; onPick: (level: keyof typeof SHOP_LEVELS) => void; onExit: () => void }) {
  return <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#FFE1AF,#FFF7E9_58%,#EAF6E4)]"><div className="absolute inset-x-0 top-0 h-20 bg-[repeating-linear-gradient(90deg,#EF6A5A_0_60px,#FFF4DC_60px_120px)] opacity-20"/><div className="relative z-10 flex h-[84px] items-center gap-3 border-b border-white/70 bg-white/45 px-5 backdrop-blur-sm"><button onClick={onExit} className="grid h-[48px] w-[48px] place-items-center rounded-[16px] bg-[#5C7BC9] shadow-[0_4px_0_#43609F]"><BackIcon /></button><div><div className="font-baloo text-[24px] font-extrabold text-[#7C4528]">{topic.name}</div><div className="font-baloo text-xs font-bold text-[#9B765C]">Chọn thử thách mua sắm</div></div><span className="ml-auto rounded-full border-2 border-white bg-white/85 px-4 py-2 font-baloo text-xs font-extrabold text-[#A0693D]">🛍️ Kho {topic.rounds.length} nhiệm vụ</span></div><div className="relative z-10 grid flex-1 place-items-center p-8"><div className="grid w-full max-w-[960px] grid-cols-3 gap-6">{Object.entries(SHOP_LEVELS).map(([key, level])=><button key={key} onClick={()=>onPick(key as keyof typeof SHOP_LEVELS)} className="group rounded-[30px] border-4 border-white bg-white/94 p-7 text-left shadow-[0_8px_0_#D7B77D,0_20px_38px_rgba(120,76,33,.15)] transition-transform hover:-translate-y-2"><div className="mb-5 grid h-20 w-20 place-items-center rounded-[24px] text-4xl" style={{background:`${level.color}20`}}>{level.icon}</div><div className="font-baloo text-2xl font-extrabold" style={{color:level.color}}>{level.label}</div><div className="mt-2 font-baloo text-sm font-bold text-[#8A7965]">{level.note}</div><div className="mt-6 h-3 overflow-hidden rounded-full bg-[#F0E4D1]"><div className="h-full rounded-full" style={{width:`${level.rounds/20*100}%`,background:level.color}}/></div></button>)}</div></div></div>;
}

/** The actual shopping game, once a topic has been picked. */
function EnglishShopPlay({ topic, difficulty, onExit, onComplete }: { topic: ShopTopicDetail; difficulty: keyof typeof SHOP_LEVELS; onExit: () => void; onComplete?: () => void }) {
  const t = useT();
  const config = SHOP_LEVELS[difficulty];
  const [session, setSession] = useState(0);
  const rounds = useMemo(() => {
    const [start, end] = config.range;
    const pool = [...topic.rounds.slice(start, end)];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j]!, pool[i]!]; }
    if (session % 2) pool.reverse();
    return pool.slice(0, config.rounds);
  }, [topic, config, session]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pickedIdx, setPickedIdx] = useState<Set<number>>(new Set());
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [coins, setCoins] = useState(0);
  const [coinPop, setCoinPop] = useState(0);
  const [msg, setMsg] = useState(t("Chạm đúng món trên kệ để bỏ vào giỏ"));
  const [paid, setPaid] = useState(false);
  const [finished, setFinished] = useState(false);
  const round = rounds[roundIdx]!;

  const roundComplete = round.required.every((r) => (cart[r.en] ?? 0) >= r.qty);

  function priceOf(en: string) {
    return round.shelf.find((s) => s.en === en)?.price ?? 0;
  }
  const total = Object.entries(cart).reduce((sum, [en, qty]) => sum + priceOf(en) * qty, 0);

  // The moment the cart exactly covers every required item, stop taking taps
  // and show the receipt — the player pays (advances) explicitly instead of
  // auto-skipping, so there's a beat to actually read the total.
  useEffect(() => {
    if (roundComplete) setPaid(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundComplete]);

  function pick(item: ShopShelfItem, idx: number) {
    if (paid || pickedIdx.has(idx) || wrongIdx !== null) return;
    const needed = round.required.find((r) => r.en === item.en)?.qty ?? 0;
    const have = cart[item.en] ?? 0;
    if (have < needed) {
      setCart((c) => ({ ...c, [item.en]: (c[item.en] ?? 0) + 1 }));
      setPickedIdx((s) => new Set(s).add(idx));
      setCoins((c) => c + 5);
      setCoinPop((p) => p + 1);
      setMsg(`${t("Đã bỏ vào giỏ")}: ${item.en}`);
    } else {
      setWrongIdx(idx);
      setMsg(t("Không cần món này đâu!"));
      setTimeout(() => setWrongIdx(null), 450);
    }
  }

  function nextRound() {
    if (roundIdx + 1 >= rounds.length) {
      setFinished(true);
      onComplete?.();
      return;
    }
    setRoundIdx((i) => i + 1);
    setCart({});
    setPickedIdx(new Set());
    setPaid(false);
    setMsg(t("Chạm đúng món trên kệ để bỏ vào giỏ"));
  }

  function reset() {
    setRoundIdx(0);
    setCart({});
    setPickedIdx(new Set());
    setWrongIdx(null);
    setCoins(0);
    setPaid(false);
    setFinished(false);
    setMsg(t("Chạm đúng món trên kệ để bỏ vào giỏ"));
    setSession((value) => value + 1);
  }

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#FFE7BE,#FFF8E9_42%,#EAF6E4)]">
      <div className="flex items-center gap-3.5 border-b-2 border-white/80 bg-white/65 p-4 backdrop-blur-md">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[25px] font-extrabold">{topic.name}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">
            English Shop · <b style={{color:config.color}}>{config.label}</b> · {t("Lượt")} {roundIdx + 1}/{rounds.length}
          </span>
        </div>
        <div className="flex-1" />
        <div className="h-3 w-[250px] overflow-hidden rounded-full border-2 border-white bg-[#F1DFC4] shadow-inner"><div className="h-full rounded-full bg-[linear-gradient(90deg,#F2A81C,#7CC24A)] transition-all" style={{ width: `${((roundIdx + (paid ? 1 : 0)) / rounds.length) * 100}%` }} /></div>
        <div className="relative flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-[17px] font-extrabold text-[#B07A0C] shadow-[0_3px_0_#E3CFA8]">
          <CoinIcon size={20} />
          {coins}
          {coinPop > 0 && (
            <span key={coinPop} className="animate-float-up pointer-events-none absolute -top-1 right-2 font-baloo text-sm font-extrabold text-[#4F7C2A]">
              +5
            </span>
          )}
        </div>
        <button onClick={reset} className="rounded-2xl border-[3px] border-line bg-cream-card px-5 py-2.5 font-baloo text-[15px] font-bold text-brand-brown shadow-[0_4px_0_#E7D4B2]">
          {t("Chơi lại")}
        </button>
      </div>

      <div className="relative flex flex-1 gap-5 px-6 pb-5 pt-3">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center gap-4 rounded-[24px] border-[3px] border-white bg-white/95 p-4 shadow-[0_6px_0_#E1BD83,0_12px_24px_rgba(120,76,33,.12)]">
            <button
              onClick={() => speak(round.instructionEn)}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-teal shadow-[0_4px_0_#37A0A0] transition-transform active:translate-y-[3px]"
            >
              <SpeakerIcon />
            </button>
            <div className="flex flex-1 flex-col gap-1"><span className="font-baloo text-[10px] font-extrabold uppercase tracking-[.16em] text-[#D48722]">Shopping mission</span>
              <div className="font-baloo text-[22px] font-extrabold leading-snug">{round.instructionEn}</div>
              <div className="font-baloo text-[15px] font-semibold text-[#8A7A62]">{round.instructionVi}</div>
            </div>
          </div>

          <div className="shop-shelves relative grid flex-1 grid-cols-4 content-start gap-x-3.5 gap-y-6 overflow-y-auto rounded-[28px] border-4 border-white p-4 pt-12 shadow-[0_7px_0_#C89D65,0_16px_30px_rgba(91,57,25,.16)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-9 before:bg-[repeating-linear-gradient(90deg,#EF6A5A_0_55px,#FFF_55px_110px)]">
            <div className="pointer-events-none absolute left-5 top-1.5 z-10 rounded-full bg-[#8A4B2A] px-4 py-1 font-baloo text-[11px] font-extrabold uppercase tracking-[.14em] text-white shadow-[0_3px_0_#63351F]">Fresh Market</div>
            {round.shelf.map((item, idx) => {
              const isPicked = pickedIdx.has(idx);
              const isWrong = wrongIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => pick(item, idx)}
                  disabled={isPicked || paid}
                  className={`group relative flex min-h-[132px] flex-col items-center justify-center gap-1.5 rounded-[18px] border-[3px] bg-[#FFFDF8] p-3 shadow-[0_5px_0_#B88A52,0_9px_16px_rgba(80,47,20,.12)] transition-all hover:-translate-y-1 disabled:cursor-default disabled:hover:translate-y-0 ${isWrong ? "animate-shake" : ""} ${isPicked ? "shop-item-picked" : ""}`}
                  style={{ borderColor: isPicked ? "#7CC24A" : isWrong ? "#EF6A5A" : "#E4C798" }}
                >
                  <span className="text-[42px] leading-none transition-transform group-hover:scale-110">{item.emoji}</span>
                  <span className="font-baloo text-[13px] font-extrabold">{item.en}</span>
                  <span className="rounded-full bg-[#FFF1CB] px-2.5 py-0.5 font-baloo text-[12px] font-extrabold text-[#B07A0C]">${item.price}</span>
                  {isPicked && (
                    <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-brand-green shadow-[0_3px_0_#5C9C31]">
                      <svg width="12" height="12" viewBox="0 0 24 24" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4.5 4.5L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex w-[300px] flex-col gap-3.5">
          <div className="relative flex flex-col gap-2.5 overflow-hidden rounded-[24px] border-[3px] border-[#D7C29A] bg-[#FFFDF5] p-4.5 pt-6 shadow-[0_6px_0_#BE9761] before:absolute before:inset-x-0 before:top-0 before:h-3 before:bg-[repeating-linear-gradient(90deg,#EF6A5A_0_24px,#FFF_24px_48px)]">
            <div className="flex items-center justify-between font-baloo text-[19px] font-extrabold text-[#764124]"><span>📝 {t("Cần mua")}</span><span className="rounded-full bg-[#F4E7CF] px-2 py-1 text-[10px] text-[#9B765C]">{round.required.filter((r) => (cart[r.en] ?? 0) >= r.qty).length}/{round.required.length}</span></div>
            {round.required.map((r) => {
              const have = cart[r.en] ?? 0;
              const done = have >= r.qty;
              return (
                <div key={r.en} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 font-baloo text-[15px] font-bold" style={{ color: done ? "#4F7C2A" : "#4A3728", background: done ? "#EEF9E3" : "transparent" }}>
                  <span className="grid h-[22px] w-[22px] place-items-center rounded-lg" style={{ background: done ? "#7CC24A" : "#E4D3BC" }}>
                    {done && (
                      <svg width="13" height="13" viewBox="0 0 24 24" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4.5 4.5L19 7" />
                      </svg>
                    )}
                  </span>
                  {r.en}
                  <span className="font-semibold text-[#A2947C]">
                    {have}/{r.qty}
                  </span>
                </div>
              );
            })}
            <div className="mt-1 flex items-center justify-between border-t-[3px] border-dashed border-[#D7C29A] pt-3 font-baloo text-lg font-extrabold">
              <span className="text-[#8A7A62]">🛒 {t("Giỏ hàng")}</span>
              <span className="rounded-full bg-[#FFD75E] px-3 py-1 text-[#7A5410]">${total}</span>
            </div>
          </div>

          {paid ? (
            <div className="animate-pop flex flex-col gap-2.5 rounded-[24px] border-[3px] border-[#CDE7B4] bg-[#EEF9E3] p-4.5 shadow-[0_5px_0_#9BC97B]">
              <div className="flex items-center gap-2.5"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-3xl shadow-[0_3px_0_#CDE7B4]">🧑‍💼</span><div className="font-baloo text-lg font-extrabold text-[#4F7C2A]">{t("Thu ngân")}<div className="text-[10px] font-bold uppercase tracking-wider text-[#78A65D]">Ready to checkout</div></div></div>
              <div className="font-baloo text-[13.5px] font-semibold leading-snug text-[#4F7C2A]">
                {t('Nhân viên: "How much is this?"')}
                <br />
                {t("Bạn:")} &quot;It&apos;s ${total}.&quot;
              </div>
              <ChunkyButton tone="green" onClick={nextRound}>
                {t("Thanh toán")}
              </ChunkyButton>
            </div>
          ) : (
            <div className="mt-auto flex items-center gap-2 rounded-2xl border-2 border-white bg-white/70 px-3 py-2.5 font-baloo text-[13px] font-semibold text-[#8A7A62] shadow-sm"><span className="text-xl">💬</span>{msg}</div>
          )}
        </div>

        {finished && (
          <RewardModal coins={coins} xp={20} score={`${rounds.length}/${rounds.length} ${t("lượt")}`} onContinue={reset}>
            <div className="font-baloo text-sm font-semibold text-[#6E6047]">{t("Mua sắm xong hết rồi! Chơi lại để ôn nhanh hơn nhé.")}</div>
          </RewardModal>
        )}
      </div>
    </div>
  );
}
