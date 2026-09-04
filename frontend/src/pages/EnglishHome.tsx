import { useEffect, useRef, useState } from "react";
import { api, ApiError, type HomeObjectData, type HomeTopicDetail, type HomeTopicListItem } from "../lib/api";
import { BackIcon, ChunkyButton, CoinIcon, RewardModal, SpeakerIcon } from "../components/ui";
import { speak } from "../lib/tts";
import { useT } from "../lib/i18n";

interface EnglishHomeProps {
  onExit: () => void;
  onComplete?: () => void;
}

const HOME_TOPIC_ICON: Record<string, string> = {
  "living-room": "🛋️", bedroom: "🛏️", kitchen: "🍳", bathroom: "🛁", garden: "🌳",
};

const HOME_TOPIC_HOTSPOT: Record<string, { left: string; top: string; width: string; height: string }> = {
  bedroom: { left: "8%", top: "16%", width: "31%", height: "31%" },
  bathroom: { left: "41%", top: "16%", width: "31%", height: "31%" },
  kitchen: { left: "7%", top: "53%", width: "33%", height: "34%" },
  "living-room": { left: "42%", top: "53%", width: "32%", height: "34%" },
  garden: { left: "76%", top: "28%", width: "20%", height: "57%" },
};

const HOME_SCENE_FOCUS: Record<string, string> = {
  bedroom: "22% 28%", bathroom: "55% 28%", kitchen: "22% 76%", "living-room": "58% 76%", garden: "88% 60%",
};

/** English Home — "Put the red ball under the table." style placement
 * rounds: drag the right object (color + noun, among decoys) onto the
 * right spot in a real room scene (preposition + furniture, among decoy
 * spots). Backed by real HomeTopic/HomeRound catalog data (see
 * /catalog/home-topics): shows a room picker first, then plays whichever
 * room was tapped. */
export default function EnglishHome({ onExit, onComplete }: EnglishHomeProps) {
  const t = useT();
  const [list, setList] = useState<HomeTopicListItem[] | null>(null);
  const [topic, setTopic] = useState<HomeTopicDetail | null>(null);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    api
      .listHomeTopics()
      .then((r) => setList(r.topics))
      .catch((err) => setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách chủ đề, thử lại nhé.")));
  }, [t]);

  async function openTopic(id: string) {
    setLoadErr("");
    try {
      const { topic } = await api.getHomeTopic(id);
      setTopic(topic);
    } catch (err) {
      setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được chủ đề, thử lại nhé."));
    }
  }

  if (topic) return <EnglishHomePlay topic={topic} onExit={() => setTopic(null)} onComplete={onComplete} />;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#CFEAF6_0%,#EEF8FF_45%,#FFF4DE_100%)]">
      <div className="pointer-events-none absolute -left-20 top-20 h-56 w-56 rounded-full bg-white/45 blur-2xl" />
      <div className="pointer-events-none absolute right-12 top-6 text-7xl opacity-20">🏡</div>
      <div className="relative flex items-center gap-3.5 border-b-2 border-white/70 bg-white/55 p-4.5 backdrop-blur-md">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[28px] font-extrabold text-[#315B72]">English Home</span>
          <span className="font-baloo text-[13px] font-semibold text-[#648194]">{t("Nghe câu lệnh · chọn đồ vật · đặt đúng vị trí")}</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto px-7 py-6">
        {list === null ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-ink/40">{t("Đang tải danh sách chủ đề…")}</div>
        ) : loadErr && list.length === 0 ? (
          <div className="grid h-full place-items-center font-baloo text-base font-bold text-[#B3402F]">{loadErr}</div>
        ) : (
          <div className="mx-auto flex h-full max-h-[570px] w-full max-w-[1080px] items-center justify-center">
            <div className="relative aspect-[1672/941] w-full overflow-hidden rounded-[32px] border-4 border-white bg-[#BFE9FA] shadow-[0_8px_0_#9ABCCA,0_22px_55px_rgba(49,91,114,.24)]">
              <img src="/games/english-home/dollhouse-v1.webp" alt="Ngôi nhà English Home" className="absolute inset-0 h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.06),transparent_45%,rgba(35,73,45,.08))]" />
              {list.map((tp) => {
                const spot = HOME_TOPIC_HOTSPOT[tp.key] ?? { left: "40%", top: "35%", width: "22%", height: "24%" };
                return (
                  <button
                    key={tp.id}
                    onClick={() => openTopic(tp.id)}
                    className="group absolute rounded-[24px] border-[4px] border-transparent bg-white/0 transition-all hover:border-white/95 hover:bg-white/12 hover:shadow-[0_0_0_6px_rgba(87,198,198,.4),0_12px_30px_rgba(40,70,70,.22)] focus-visible:border-white focus-visible:outline-none"
                    style={spot}
                    aria-label={`${tp.name} · ${tp._count.rounds} ${t("lượt chơi")}`}
                  >
                    <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border-2 border-white/90 px-4 py-2 font-baloo text-[13px] font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,.18),0_7px_20px_rgba(0,0,0,.18)] transition-transform group-hover:-translate-x-1/2 group-hover:scale-105" style={{ background: tp.color }}>
                      <span className="text-xl">{HOME_TOPIC_ICON[tp.key] ?? "🏠"}</span>
                      {tp.name}
                      <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px]">{tp._count.rounds}</span>
                    </span>
                  </button>
                );
              })}
              <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border-2 border-white/85 bg-[#315B72]/82 px-5 py-2 font-baloo text-[12px] font-extrabold text-white shadow-lg backdrop-blur-sm">Chọn một căn phòng để bắt đầu</div>
            </div>
          </div>
        )}
        {loadErr && list && list.length > 0 && <div className="mt-3 font-baloo text-sm font-bold text-[#B3402F]">{loadErr}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spatial room scenes — a zone's key is always "<preposition>-<furnitureKey>"
// (see backend's seed.ts), so rather than hand-placing all ~10 unique zones
// per room, each room only needs its handful of FURNITURE anchors placed
// once; a zone's on-screen spot is then derived by nudging its furniture's
// anchor in the direction its preposition implies. Purely a presentation
// concern — correctness still only ever depends on the real key match.
// ---------------------------------------------------------------------------

interface FurnitureAnchor {
  key: string;
  emoji: string;
  x: number; // % of scene width
  y: number; // % of scene height
}

const ROOM_SCENES: Record<string, { bg: string; furniture: FurnitureAnchor[] }> = {
  "living-room": {
    bg: "linear-gradient(180deg, #FDF3DE 0%, #F7E8CE 100%)",
    furniture: [
      { key: "table", emoji: "🍽️", x: 55, y: 70 },
      { key: "sofa", emoji: "🛋️", x: 50, y: 48 },
      { key: "door", emoji: "🚪", x: 88, y: 42 },
      { key: "chair", emoji: "🪑", x: 22, y: 58 },
      { key: "window", emoji: "🪟", x: 50, y: 22 },
    ],
  },
  bedroom: {
    bg: "linear-gradient(180deg, #F1EAFB 0%, #E9E2FB 100%)",
    furniture: [
      { key: "bed", emoji: "🛏️", x: 36, y: 62 },
      { key: "lamp", emoji: "💡", x: 14, y: 61 },
      { key: "closet", emoji: "🗄️", x: 78, y: 45 },
      { key: "window", emoji: "🪟", x: 38, y: 24 },
    ],
  },
  kitchen: {
    bg: "linear-gradient(180deg, #FFE9C9 0%, #FFF3D6 100%)",
    furniture: [
      { key: "table", emoji: "🍽️", x: 50, y: 69 },
      { key: "cabinet", emoji: "🗄️", x: 68, y: 35 },
      { key: "sink", emoji: "🚰", x: 35, y: 52 },
      { key: "chair", emoji: "🪑", x: 50, y: 87 },
    ],
  },
  bathroom: {
    bg: "linear-gradient(180deg, #CFEAF6 0%, #E9F6FB 100%)",
    furniture: [
      { key: "bathtub", emoji: "🛁", x: 62, y: 62 },
      { key: "shelf", emoji: "🗄️", x: 66, y: 25 },
      { key: "sink", emoji: "🚰", x: 20, y: 58 },
      { key: "mirror", emoji: "🪞", x: 20, y: 27 },
    ],
  },
  garden: {
    bg: "linear-gradient(180deg, #CFEAF6 0%, #DCEFC8 100%)",
    furniture: [
      { key: "tree", emoji: "🌳", x: 70, y: 58 },
      { key: "bench", emoji: "🪑", x: 50, y: 28 },
      { key: "flower", emoji: "🌷", x: 32, y: 68 },
      { key: "gate", emoji: "🚪", x: 15, y: 55 },
    ],
  },
};

const PREPOSITION_NUDGE: Record<string, { dx: number; dy: number }> = {
  under: { dx: 0, dy: 15 },
  on: { dx: 0, dy: -15 },
  in: { dx: 0, dy: 0 },
  next: { dx: 16, dy: 0 },
  near: { dx: -16, dy: 0 },
  behind: { dx: 0, dy: -17 },
  front: { dx: 0, dy: 15 },
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Derives a zone's on-screen % position from its key ("under-table" -> the
 * "table" furniture anchor, nudged upward for "under"). Falls back to dead
 * center if a furniture key isn't in this room's scene (shouldn't happen
 * with real seed data, but keeps a bad round from crashing the screen). */
function zonePosition(sceneKey: string, zoneKey: string): { x: number; y: number } {
  const scene = ROOM_SCENES[sceneKey];
  const [preposition, ...rest] = zoneKey.split("-");
  const furnitureKey = rest.join("-");
  const anchor = scene?.furniture.find((f) => f.key === furnitureKey);
  if (!scene || !anchor) return { x: 50, y: 50 };
  const nudge = PREPOSITION_NUDGE[preposition ?? ""] ?? { dx: 0, dy: 0 };
  return { x: clamp(anchor.x + nudge.dx, 10, 90), y: clamp(anchor.y + nudge.dy, 10, 90) };
}

interface DragState {
  objectKey: string;
  x: number;
  y: number;
}

/**
 * Converts a real (viewport) pointer position into the design-canvas-local
 * coordinates a `position: fixed` element inside the app actually renders
 * against. ScreenFrame.tsx wraps every screen in a `.device-frame` box
 * that's `transform: scale(...)`'d to fit the viewport (see index.css) —
 * per the CSS spec, ANY transformed ancestor becomes the containing block
 * for its `position: fixed` descendants instead of the real viewport, so a
 * ghost's `left`/`top` need to be in .device-frame's own untransformed
 * design-canvas space, not raw clientX/clientY, or it visually drifts from
 * the cursor by however much the frame is currently scaled/offset.
 */
function toDeviceFramePoint(clientX: number, clientY: number): { x: number; y: number } {
  const frame = document.querySelector<HTMLElement>(".device-frame");
  if (!frame) return { x: clientX, y: clientY };
  const rect = frame.getBoundingClientRect();
  // offsetWidth reflects the frame's untransformed layout width (CSS
  // `transform` never affects it) — reading it here instead of hardcoding
  // index.css's canvas width means this self-derives correctly even if
  // that width ever changes again.
  const scale = rect.width / frame.offsetWidth;
  return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
}

/** The actual placement game, once a room has been picked. */
function EnglishHomePlay({ topic, onExit, onComplete }: { topic: HomeTopicDetail; onExit: () => void; onComplete?: () => void }) {
  const t = useT();
  const rounds = topic.rounds;
  const [roundIdx, setRoundIdx] = useState(0);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [wrongZoneKey, setWrongZoneKey] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);
  const [coinPop, setCoinPop] = useState(0);
  const [success, setSuccess] = useState(false);
  const [finished, setFinished] = useState(false);
  const round = rounds[roundIdx]!;
  const scene = ROOM_SCENES[topic.key];

  const zoneRefs = useRef(new Map<string, HTMLDivElement>());
  const droppedRef = useRef(false); // guards a pointerup from also firing after a successful drop already handled it

  const heldObject = round.objects.find((o) => o.key === round.correctObjectKey)!;
  const correctZone = round.zones.find((z) => z.key === round.correctZoneKey)!;

  function startDrag(e: React.PointerEvent, obj: HomeObjectData) {
    if (success) return;
    droppedRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toDeviceFramePoint(e.clientX, e.clientY);
    setDrag({ objectKey: obj.key, x: p.x, y: p.y });
  }

  function moveDrag(e: React.PointerEvent, obj: HomeObjectData) {
    if (drag?.objectKey !== obj.key) return;
    const p = toDeviceFramePoint(e.clientX, e.clientY);
    setDrag({ objectKey: obj.key, x: p.x, y: p.y });
  }

  function endDrag(e: React.PointerEvent, obj: HomeObjectData) {
    if (drag?.objectKey !== obj.key || droppedRef.current) return;
    droppedRef.current = true;
    const x = e.clientX;
    const y = e.clientY;
    const hitZones = round.zones.filter((zone) => {
      const el = zoneRefs.current.get(zone.key);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
    // Nearby prepositions around the same furniture can overlap visually.
    // Prefer the correct target when the pointer is inside both instead of
    // letting array order turn an accurate drop into a false negative.
    const zone = hitZones.find((candidate) => candidate.key === round.correctZoneKey) ?? hitZones[0];
    if (zone) {
      if (obj.key === round.correctObjectKey && zone.key === round.correctZoneKey) {
        setCoins((c) => c + 10);
        setCoinPop((p) => p + 1);
        setSuccess(true);
      } else {
        setWrongZoneKey(zone.key);
        setTimeout(() => setWrongZoneKey(null), 450);
      }
    }
    setDrag(null);
  }

  function nextRound() {
    if (roundIdx + 1 >= rounds.length) {
      setFinished(true);
      onComplete?.();
      return;
    }
    setRoundIdx((i) => i + 1);
    setSuccess(false);
  }

  function reset() {
    setRoundIdx(0);
    setDrag(null);
    setWrongZoneKey(null);
    setCoins(0);
    setSuccess(false);
    setFinished(false);
  }

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#DDF2FA,#FFF6E6)]">
      <div className="flex items-center gap-3.5 border-b-2 border-white/80 bg-white/60 p-4 backdrop-blur-md">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[25px] font-extrabold">{topic.name}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">
            {t("Lượt")} {roundIdx + 1}/{rounds.length}
          </span>
        </div>
        <div className="flex-1" />
        <div className="h-3 w-[260px] overflow-hidden rounded-full border-2 border-white bg-[#D9EAF1] shadow-inner"><div className="h-full rounded-full bg-[linear-gradient(90deg,#57C6C6,#7CC24A)] transition-all" style={{ width: `${((roundIdx + (success ? 1 : 0)) / rounds.length) * 100}%` }} /></div>
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

      <div className="relative flex flex-1 flex-col gap-3.5 px-6 pb-5 pt-3">
        <div className="flex items-center gap-4 rounded-[24px] border-[3px] border-white bg-white/95 p-4 shadow-[0_6px_0_#BFD7E2,0_12px_24px_rgba(55,96,120,.12)]">
          <button
            onClick={() => speak(round.instructionEn)}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-teal shadow-[0_4px_0_#37A0A0] transition-transform active:translate-y-[3px]"
          >
            <SpeakerIcon />
          </button>
          <div className="flex flex-1 flex-col gap-1"><span className="font-baloo text-[10px] font-extrabold uppercase tracking-[.16em] text-[#57A5AD]">Mission</span>
            <div className="font-baloo text-[22px] font-extrabold leading-snug">{round.instructionEn}</div>
            <div className="font-baloo text-[15px] font-semibold text-[#8A7A62]">{round.instructionVi}</div>
          </div>
        </div>

        {/* The room scene — furniture is decorative, the dashed boxes are real drop targets (hit-tested against on pointer-up). */}
        <div className="relative w-full flex-1 overflow-hidden rounded-[28px] border-4 border-white shadow-[0_7px_0_#C8B994,0_16px_32px_rgba(80,64,39,.16)]" style={{ background: scene?.bg ?? "#F7EFDD", minHeight: 260 }}>
          <img
            src="/games/english-home/dollhouse-v1.webp"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-700"
            style={{ transform: "scale(2.05)", transformOrigin: HOME_SCENE_FOCUS[topic.key] ?? "50% 50%" }}
          />
          <div className="pointer-events-none absolute inset-0 bg-white/8" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-black/10 to-transparent" />
          <div className="pointer-events-none absolute left-5 top-4 flex items-center gap-2 rounded-full border-2 border-white/80 bg-white/75 px-3 py-1.5 font-baloo text-[11px] font-extrabold uppercase tracking-wider text-[#6E56A8] shadow-sm">{HOME_TOPIC_ICON[topic.key] ?? "🏠"} {topic.name}</div>
          <div className="pointer-events-none absolute right-5 top-4 rounded-full border-2 border-white/80 bg-[#315B72]/75 px-3 py-1.5 font-baloo text-[10px] font-extrabold text-white backdrop-blur-sm">🔍 Room focus</div>
          {round.zones.map((zone) => {
            const pos = zonePosition(topic.key, zone.key);
            return (
              <div
                key={zone.key}
                ref={(el) => {
                  if (el) zoneRefs.current.set(zone.key, el);
                }}
                className={`absolute flex w-[112px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-2xl border-[3px] border-dashed px-2 py-2 text-center transition-all ${drag ? "game-zone-ready scale-110 bg-white shadow-[0_0_0_6px_rgba(155,126,222,.16),0_8px_18px_rgba(80,60,120,.22)]" : "bg-white/58 opacity-80 shadow-sm"} ${wrongZoneKey === zone.key ? "animate-shake !border-[#EF6A5A] !bg-[#FFF0ED]" : ""}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, borderColor: wrongZoneKey === zone.key ? "#EF6A5A" : "#9B7EDE" }}
              >
                <span className="text-base leading-none">{zone.emoji}</span>
                <span className="font-baloo text-[10.5px] font-extrabold leading-tight text-[#6E56A8]">{zone.label}</span>
              </div>
            );
          })}

          {success && (
            <div className="animate-pop absolute inset-0 z-20 grid place-items-center bg-ink/25">
              <div className="flex flex-col items-center gap-3 rounded-[24px] border-[3px] border-[#CDE7B4] bg-[#EEF9E3] p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,.2)]">
                <div className="flex items-center gap-2 font-baloo text-xl font-extrabold text-[#4F7C2A]">
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-2xl" style={{ background: heldObject.color }}>
                    {heldObject.emoji}
                  </span>
                  {correctZone.emoji} {t("Đặt đúng chỗ rồi!")}
                </div>
                <div className="font-baloo text-sm font-semibold text-[#4F7C2A]">
                  {heldObject.en} → {correctZone.label}
                </div>
                <ChunkyButton tone="green" onClick={nextRound}>
                  {t("Tiếp tục")}
                </ChunkyButton>
              </div>
            </div>
          )}
        </div>

        {/* Draggable objects tray — kéo (không phải chạm) đúng đồ vật vào đúng ô trong cảnh phòng bên trên. */}
        <div className="relative flex justify-center gap-4 rounded-[22px] border-2 border-white/80 bg-white/60 px-5 pb-3 pt-7 shadow-[0_4px_0_#E4D4B8] backdrop-blur-sm">
          <span className="absolute left-4 top-1.5 font-baloo text-[10px] font-extrabold uppercase tracking-[.15em] text-[#8A7A62]">🧺 Kéo một đồ vật vào phòng</span>
          {round.objects.map((obj) => (
            <button
              key={obj.key}
              onPointerDown={(e) => startDrag(e, obj)}
              onPointerMove={(e) => moveDrag(e, obj)}
              onPointerUp={(e) => endDrag(e, obj)}
              disabled={success}
              className="group flex min-w-[112px] flex-col items-center gap-1.5 rounded-[20px] border-[3px] border-[#EFDFC2] bg-white p-3 shadow-[0_5px_0_#EADAB8] transition-transform hover:-translate-y-1 active:cursor-grabbing disabled:opacity-50"
              style={{ touchAction: "none", opacity: drag?.objectKey === obj.key ? 0.3 : undefined, cursor: "grab" }}
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl text-[30px] shadow-[inset_0_-4px_0_rgba(0,0,0,.08)] transition-transform group-hover:scale-110" style={{ background: obj.color }}>
                {obj.emoji}
              </span>
              <span className="font-baloo text-[12.5px] font-extrabold">{obj.en}</span>
            </button>
          ))}
        </div>
        <div className="text-center font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Kéo đồ vật đúng vào đúng ô trong phòng")}</div>

        {finished && (
          <RewardModal coins={coins} xp={20} score={`${rounds.length}/${rounds.length} ${t("lượt")}`} onContinue={reset}>
            <div className="font-baloo text-sm font-semibold text-[#6E6047]">{t("Dọn nhà xong hết rồi! Chơi lại để ôn nhanh hơn nhé.")}</div>
          </RewardModal>
        )}
      </div>

      {/* Ghost — follows the pointer while dragging, ignores pointer events itself so it never steals the drop hit-test. */}
      {drag && (
        <div className="pointer-events-none fixed z-50" style={{ left: drag.x, top: drag.y, transform: "translate(-50%, -50%)" }}>
          {(() => {
            const obj = round.objects.find((o) => o.key === drag.objectKey)!;
            return (
              <span className="grid h-16 w-16 place-items-center rounded-2xl text-[34px] shadow-[0_8px_18px_rgba(0,0,0,.3)]" style={{ background: obj.color }}>
                {obj.emoji}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}
