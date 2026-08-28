import { useEffect, useMemo, useState } from "react";
import { api, ApiError, type MiniGameTopicDetail, type MiniGameTopicListItem } from "../lib/api";
import { BackIcon, CoinIcon, MemoryCard, RewardModal, type MemoryCardDef } from "../components/ui";
import { PETS } from "../components/ui/tokens";
import { useT } from "../lib/i18n";

interface MiniGameProps {
  onExit: () => void;
  /** Fired once per completed game (all pairs matched) — used to credit the "Chơi 1 mini-game" daily quest. */
  onWin?: () => void;
}

const PET_KEYS = new Set(PETS.map((p) => p.id));
/** A topic's word.img is either a Pet.key (reuses existing pet art, e.g. the "Animals" topic) or a raw emoji glyph. */
function isPetKey(img: string): boolean {
  return PET_KEYS.has(img);
}

type DeckCard = MemoryCardDef & { key: number; en: string; vi: string };

function buildDeck(words: { en: string; vi: string; img: string }[]): DeckCard[] {
  const cards: DeckCard[] = [];
  words.forEach((w, i) => {
    cards.push({ key: i, kind: "word", word: w.en, en: w.en, vi: w.vi });
    cards.push(isPetKey(w.img) ? { key: i, kind: "img", pet: w.img, en: w.en, vi: w.vi } : { key: i, kind: "emoji", emoji: w.img, en: w.en, vi: w.vi });
  });
  // Fisher–Yates so the pairs never land side-by-side (a fixed shuffle would repeat every game).
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards;
}

/** Memory Match — matches the reference sheet's "Phần 2 · Mini-game" panel.
 * Now backed by real MiniGameTopic/MiniGameWord catalog data (see
 * /catalog/minigame-topics): shows a topic picker first, then plays
 * whichever topic was tapped — instead of the single hard-coded 4-pair set. */
export default function MiniGame({ onExit, onWin }: MiniGameProps) {
  const t = useT();
  const [list, setList] = useState<MiniGameTopicListItem[] | null>(null);
  const [topic, setTopic] = useState<MiniGameTopicDetail | null>(null);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    api
      .listMiniGameTopics()
      .then((r) => setList(r.topics))
      .catch((err) => setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách chủ đề, thử lại nhé.")));
  }, [t]);

  async function openTopic(id: string) {
    setLoadErr("");
    try {
      const { topic } = await api.getMiniGameTopic(id);
      setTopic(topic);
    } catch (err) {
      setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được chủ đề, thử lại nhé."));
    }
  }

  if (topic) return <MiniGamePlay topic={topic} onExit={() => setTopic(null)} onWin={onWin} />;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#E9E2FB] to-[#F7EFDD]">
      <div className="flex items-center gap-3.5 p-4.5">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[26px] font-extrabold">Memory Match</span>
          <span className="font-baloo text-[13px] font-semibold text-[#8A7A62]">{t("Chọn 1 chủ đề để bắt đầu ghép từ")}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {list === null ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải danh sách chủ đề…")}</div>
        ) : loadErr && list.length === 0 ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-[#B3402F]">{loadErr}</div>
        ) : (
          <div className="grid grid-cols-5 gap-4.5">
            {list.map((tp) => (
              <button
                key={tp.id}
                onClick={() => openTopic(tp.id)}
                className="flex flex-col items-start gap-2.5 rounded-[22px] border-[3px] border-line2 bg-white p-4.5 text-left shadow-[0_5px_0_#EADAB8] transition-transform hover:-translate-y-1"
              >
                <span className="h-10 w-10 rounded-2xl" style={{ background: tp.color }} />
                <span className="font-baloo text-base font-extrabold leading-snug">{tp.name}</span>
                <span className="mt-auto font-baloo text-[11.5px] font-bold text-[#A2947C]">
                  {tp._count.words} {t("cặp từ")}
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

/** The actual matching game, once a topic has been picked. */
function MiniGamePlay({ topic, onExit, onWin }: { topic: MiniGameTopicDetail; onExit: () => void; onWin?: () => void }) {
  const t = useT();
  const deck = useMemo(() => buildDeck(topic.words), [topic]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrongPair, setWrongPair] = useState<number[]>([]);
  const [coins, setCoins] = useState(0);
  const [coinPop, setCoinPop] = useState(0);
  const [msg, setMsg] = useState(t("Chạm 2 thẻ để ghép từ với hình"));

  const won = matched.length === deck.length;

  useEffect(() => {
    if (won) onWin?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  function flip(i: number) {
    if (matched.includes(i) || flipped.includes(i) || flipped.length === 2) return;
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length < 2) return;
    const [a, b] = next as [number, number];
    if (deck[a]!.key === deck[b]!.key) {
      setTimeout(() => {
        setMatched((m) => [...m, a, b]);
        setFlipped([]);
        setCoins((c) => c + 10);
        setCoinPop((p) => p + 1);
        setMsg(`${t("Ghép đúng")} ${deck[a]!.en} — ${deck[a]!.vi}`);
      }, 250);
    } else {
      setMsg(t("Chưa khớp, thử lại nhé!"));
      setTimeout(() => setWrongPair(next), 450);
      setTimeout(() => {
        setFlipped([]);
        setWrongPair([]);
      }, 900);
    }
  }

  function reset() {
    setFlipped([]);
    setMatched([]);
    setWrongPair([]);
    setCoins(0);
    setMsg(t("Chạm 2 thẻ để ghép từ với hình"));
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#E9E2FB] to-[#F7EFDD]">
      <div className="flex items-center gap-3.5 p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[26px] font-extrabold">{topic.name}</span>
          <span className="font-baloo text-[13px] font-semibold text-[#8A7A62]">{t("Ghép từ với hình · spaced repetition")}</span>
        </div>
        <div className="flex-1" />
        <div className="rounded-full bg-white px-4.5 py-2 font-baloo text-[17px] font-extrabold text-[#6E6047] shadow-[0_3px_0_#E3CFA8]">
          {t("Cặp")} {matched.length / 2}/{topic.words.length}
        </div>
        <div className="relative flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-[17px] font-extrabold text-[#B07A0C] shadow-[0_3px_0_#E3CFA8]">
          <CoinIcon size={20} />
          {coins}
          {coinPop > 0 && (
            <span key={coinPop} className="animate-float-up pointer-events-none absolute -top-1 right-2 font-baloo text-sm font-extrabold text-[#4F7C2A]">
              +10
            </span>
          )}
        </div>
        <button onClick={reset} className="rounded-2xl border-[3px] border-line bg-cream-card px-5 py-2.5 font-baloo text-[15px] font-bold text-brand-brown shadow-[0_4px_0_#E7D4B2]">
          {t("Chơi lại")}
        </button>
      </div>

      <div className="relative flex flex-1 gap-5.5 px-6 pb-6">
        <div className="grid flex-1 grid-cols-4 grid-rows-2 gap-4.5">
          {deck.map((c, i) => (
            <MemoryCard
              key={i}
              card={c}
              open={flipped.includes(i) || matched.includes(i)}
              matched={matched.includes(i)}
              wrong={wrongPair.includes(i)}
              onClick={() => flip(i)}
            />
          ))}
        </div>
        <div className="flex w-[280px] flex-col gap-3.5">
          <div className="flex flex-col gap-2.5 rounded-[22px] border-[3px] border-line2 bg-white p-4.5 shadow-[0_5px_0_#EADAB8]">
            <div className="font-baloo text-[18px] font-extrabold">{t("Từ trong lượt này")}</div>
            {topic.words.map((w, i) => {
              const solved = deck.some((c, idx) => c.key === i && matched.includes(idx));
              return (
                <div key={w.en} className="flex items-center gap-2.5 font-baloo text-[15px] font-bold" style={{ color: solved ? "#4F7C2A" : "#4A3728" }}>
                  <span className="grid h-[22px] w-[22px] place-items-center rounded-lg" style={{ background: solved ? "#7CC24A" : "#E4D3BC" }}>
                    {solved && (
                      <svg width="13" height="13" viewBox="0 0 24 24" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4.5 4.5L19 7" />
                      </svg>
                    )}
                  </span>
                  {w.en}
                  <span className="font-semibold text-[#A2947C]">{w.vi}</span>
                </div>
              );
            })}
          </div>
          <div className="rounded-[22px] border-[3px] border-[#DDCFF5] bg-[#F1EAFB] p-4 font-baloo text-[13px] font-semibold leading-snug text-[#6E56A8]">
            {t("Từ ghép sai sẽ quay lại sớm hơn; ghép đúng 3 lần thì giãn ra 1 ngày → 3 ngày → 7 ngày.")}
          </div>
          <div className="mt-auto font-baloo text-sm font-semibold text-[#8A7A62]">{msg}</div>
        </div>

        {won && (
          <RewardModal coins={coins} xp={20} score={`${deck.length / 2}/${deck.length / 2} ${t("cặp")}`} onContinue={reset}>
            <div className="font-baloo text-sm font-semibold text-[#6E6047]">{t("Ghép hết rồi! Chơi lại để ôn nhanh hơn nhé.")}</div>
          </RewardModal>
        )}
      </div>
    </div>
  );
}
