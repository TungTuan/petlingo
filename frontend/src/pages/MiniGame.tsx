import { useEffect, useMemo, useState } from "react";
import { api, ApiError, type MiniGameTopicDetail, type MiniGameTopicListItem } from "../lib/api";
import { BackIcon, CoinIcon, MemoryCard, RewardModal, TopicIcon, type MemoryCardDef } from "../components/ui";
import { PETS } from "../components/ui/tokens";
import { useT } from "../lib/i18n";

interface MiniGameProps {
  onExit: () => void;
  /** Fired once per completed game (all pairs matched) — used to credit the "Chơi 1 mini-game" daily quest. */
  onWin?: (contentKey: string) => void;
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

function pickRoundWords(words: { en: string; vi: string; img: string }[], count: number, round: number) {
  const groups = new Map<string, typeof words>();
  for (const word of words) groups.set(word.img, [...(groups.get(word.img) ?? []), word]);
  const distinct = [...groups.values()];
  for (let i = distinct.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [distinct[i], distinct[j]] = [distinct[j]!, distinct[i]!]; }
  const shifted = [...distinct.slice(round % distinct.length), ...distinct.slice(0, round % distinct.length)];
  return shifted.slice(0, count).map((group) => group[Math.floor(Math.random() * group.length)]!);
}

/** Memory Match — matches the reference sheet's "Phần 2 · Mini-game" panel.
 * Now backed by real MiniGameTopic/MiniGameWord catalog data (see
 * /catalog/minigame-topics): shows a topic picker first, then plays
 * whichever topic was tapped — instead of the single hard-coded 4-pair set. */
export default function MiniGame({ onExit, onWin }: MiniGameProps) {
  const t = useT();
  const [list, setList] = useState<MiniGameTopicListItem[] | null>(null);
  const [topic, setTopic] = useState<MiniGameTopicDetail | null>(null);
  const [difficulty, setDifficulty] = useState<4 | 8 | 20 | null>(null);
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

  if (topic && difficulty) return <MiniGamePlay topic={topic} pairCount={difficulty} onExit={() => setDifficulty(null)} onWin={() => onWin?.(topic.id)} />;
  if (topic) return <DifficultyPicker topic={topic} onPick={setDifficulty} onExit={() => setTopic(null)} />;

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
                <TopicIcon label={tp.name} color={tp.color} />
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

function DifficultyPicker({ topic, onPick, onExit }: { topic: MiniGameTopicDetail; onPick: (count: 4 | 8 | 20) => void; onExit: () => void }) {
  const levels = [
    { count: 4 as const, name: "Dễ", note: "4 cặp · làm quen", icon: "🌱", color: "#7CC24A" },
    { count: 8 as const, name: "Trung bình", note: "8 cặp · luyện nhớ", icon: "⭐", color: "#F2A81C" },
    { count: 20 as const, name: "Khó", note: "20 cặp · thử thách", icon: "🔥", color: "#EF6A5A" },
  ];
  return <div className="flex h-full flex-col bg-gradient-to-b from-[#E9E2FB] to-[#F7EFDD]"><div className="flex items-center gap-3.5 p-4.5"><button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]"><BackIcon /></button><div><div className="font-baloo text-[26px] font-extrabold">{topic.name}</div><div className="font-baloo text-[13px] font-semibold text-[#8A7A62]">Chọn độ khó cho lượt chơi</div></div><span className="ml-auto rounded-full bg-white px-4 py-2 font-baloo text-sm font-extrabold text-[#7A6B5A]">Kho {topic.words.length} từ</span></div><div className="grid flex-1 place-items-center px-8 pb-8"><div className="grid w-full max-w-[900px] grid-cols-3 gap-6">{levels.map((level) => <button key={level.count} onClick={() => onPick(level.count)} className="group relative overflow-hidden rounded-[30px] border-4 border-white bg-white p-7 text-left shadow-[0_8px_0_#DCCDB4,0_18px_35px_rgba(65,50,36,.14)] transition-transform hover:-translate-y-2"><div className="mb-5 grid h-20 w-20 place-items-center rounded-[24px] text-4xl shadow-inner" style={{background:`${level.color}25`}}>{level.icon}</div><div className="font-baloo text-2xl font-extrabold" style={{color:level.color}}>{level.name}</div><div className="mt-2 font-baloo text-sm font-bold text-[#8A7A62]">{level.note}</div><div className="mt-6 h-3 overflow-hidden rounded-full bg-[#EFE7D7]"><div className="h-full rounded-full" style={{width:`${level.count / 20 * 100}%`,background:level.color}} /></div></button>)}</div></div></div>;
}

/** The actual matching game, once a topic has been picked. */
function MiniGamePlay({ topic, pairCount, onExit, onWin }: { topic: MiniGameTopicDetail; pairCount: 4 | 8 | 20; onExit: () => void; onWin?: () => void }) {
  const t = useT();
  const [round, setRound] = useState(0);
  const roundWords = useMemo(() => pickRoundWords(topic.words, pairCount, round), [topic, pairCount, round]);
  const deck = useMemo(() => buildDeck(roundWords), [roundWords]);
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
    setRound((value) => value + 1);
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_10%_15%,#F9F4FF_0_8%,transparent_25%),linear-gradient(145deg,#E8E0FA,#FFF8E8)]">
      <div className="pointer-events-none absolute -left-16 top-24 h-52 w-52 rounded-full bg-[#BFA9F0]/20 blur-2xl" /><div className="pointer-events-none absolute bottom-0 right-40 h-64 w-64 rounded-full bg-[#FFD36E]/15 blur-3xl" />
      <div className="relative z-10 flex h-[82px] shrink-0 items-center gap-3.5 border-b border-white/70 bg-white/35 px-5 backdrop-blur-sm">
        <button onClick={onExit} className="grid h-[46px] w-[46px] place-items-center rounded-[16px] bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[23px] font-extrabold">{topic.name}</span>
          <span className="font-baloo text-[12px] font-bold text-[#8A7A62]">Memory Match · {pairCount === 4 ? "Dễ" : pairCount === 8 ? "Trung bình" : "Khó"}</span>
        </div>
        <div className="flex-1" />
        <div className="w-[180px]"><div className="mb-1 flex justify-between font-baloo text-[11px] font-extrabold text-[#746451]"><span>TIẾN ĐỘ</span><span>{matched.length / 2}/{pairCount}</span></div><div className="h-3 overflow-hidden rounded-full border-2 border-white bg-[#DDD2C1]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#74C94C,#A7E06E)] transition-[width]" style={{width:`${matched.length / 2 / pairCount * 100}%`}} /></div></div>
        <div className="relative flex items-center gap-2 rounded-full bg-white px-4.5 py-2 font-baloo text-[17px] font-extrabold text-[#B07A0C] shadow-[0_3px_0_#E3CFA8]">
          <CoinIcon size={20} />
          {coins}
          {coinPop > 0 && (
            <span key={coinPop} className="animate-float-up pointer-events-none absolute -top-1 right-2 font-baloo text-sm font-extrabold text-[#4F7C2A]">
              +10
            </span>
          )}
        </div>
        <button onClick={reset} className="rounded-[15px] border-2 border-[#E2CFA9] bg-[#FFF9EA] px-4 py-2.5 font-baloo text-[13px] font-extrabold text-brand-brown shadow-[0_3px_0_#D8C39C]">
          {t("Chơi lại")}
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 gap-4 p-4">
        <div className={`grid min-h-0 min-w-0 flex-1 rounded-[26px] border-2 border-white/80 bg-white/38 p-3 shadow-[inset_0_1px_0_white,0_12px_30px_rgba(79,57,115,.09)] ${pairCount === 4 ? "grid-cols-4 grid-rows-2 gap-4" : pairCount === 8 ? "grid-cols-4 grid-rows-4 gap-2.5" : "grid-cols-8 grid-rows-5 gap-[7px]"}`}>
          {deck.map((c, i) => (
            <MemoryCard
              key={i}
              card={c}
              open={flipped.includes(i) || matched.includes(i)}
              matched={matched.includes(i)}
              wrong={wrongPair.includes(i)}
              density={pairCount === 20 ? "dense" : pairCount === 8 ? "compact" : "normal"}
              onClick={() => flip(i)}
            />
          ))}
        </div>
        <div className="flex min-h-0 w-[255px] shrink-0 flex-col gap-3">
          <div className="flex min-h-0 flex-1 flex-col rounded-[22px] border-2 border-white bg-white/90 p-3.5 shadow-[0_5px_0_#EADAB8,0_12px_25px_rgba(77,58,37,.1)]">
            <div className="mb-2 flex items-center justify-between font-baloo text-[16px] font-extrabold"><span>{t("Từ trong lượt này")}</span><span className="rounded-full bg-[#EEE6FA] px-2 py-1 text-[10px] text-[#7657B5]">{pairCount} TỪ</span></div>
            <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${pairCount === 20 ? "grid grid-cols-2 content-start gap-1.5" : "space-y-2"}`}>
            {roundWords.map((w, i) => {
              const solved = deck.some((c, idx) => c.key === i && matched.includes(idx));
              return (
                <div key={w.en} className={`flex items-center rounded-xl font-baloo font-bold ${pairCount === 20 ? "gap-1.5 bg-[#F8F4ED] p-1.5 text-[10px]" : "gap-2.5 text-[13px]"}`} style={{ color: solved ? "#4F7C2A" : "#4A3728" }}>
                  <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md" style={{ background: solved ? "#7CC24A" : "#E4D3BC" }}>
                    {solved && (
                      <svg width="13" height="13" viewBox="0 0 24 24" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4.5 4.5L19 7" />
                      </svg>
                    )}
                  </span>
                  {w.en}
                  {pairCount !== 20 && <span className="font-semibold text-[#A2947C]">{w.vi}</span>}
                </div>
              );
            })}</div>
          </div>
          {pairCount !== 20 && <div className="rounded-[18px] border-2 border-[#DDCFF5] bg-[#F1EAFB] p-3 font-baloo text-[11px] font-semibold leading-snug text-[#6E56A8]">
            {t("Từ ghép sai sẽ quay lại sớm hơn; ghép đúng 3 lần thì giãn ra 1 ngày → 3 ngày → 7 ngày.")}
          </div>}
          <div className="min-h-9 rounded-[14px] bg-[#4A3728]/80 px-3 py-2 font-baloo text-[11px] font-bold text-white shadow-sm">{msg}</div>
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
