import { useCallback, useEffect, useRef, useState } from "react";
import { BackIcon, CoinIcon } from "../components/ui";
import { FLAPPY_REQUIRE_LEARNED_WORDS, FLAPPY_UNLOCK_WORDS, getLearnedWords } from "../lib/learningGate";
import type { FlappyDragonRewardResult } from "../lib/api";

interface FlappyDragonProps {
  childId: string;
  onExit: () => void;
  onReward: (score: number) => Promise<FlappyDragonRewardResult>;
}

type Phase = "locked" | "ready" | "playing" | "over";
type TreePair = { id: number; x: number; gapY: number; gapHeight: number; counted: boolean };

const DRAGON_X = 24;
const DRAGON_SIZE = 12;
const TREE_WIDTH = 11;
const GRAVITY = 48;
const FLAP_SPEED = -19;

// Difficulty ramp (2026-09-01): trees used to all spawn at the same
// difficulty from the very first one — new players got the "hard" gap/speed
// immediately. Now every knob eases in over the first few trees passed and
// reaches exactly the OLD constant values at the end of the ramp, so nothing
// about the steady-state game changes for players already used to it — only
// the first ~8 trees get gentler.
const GAP_HEIGHT_EASY = 46;
const GAP_HEIGHT_HARD = 34; // was the only value before this change
const TREE_SPEED_EASY = 19;
const TREE_SPEED_HARD = 27; // was the only value before this change
const SPAWN_INTERVAL_EASY = 2.15;
const SPAWN_INTERVAL_HARD = 1.65; // was the only value before this change
const DIFFICULTY_RAMP_TREES = 8;
// Vertical range the gap's center is allowed to land in — kept the same
// bounds the old fixed-34-height gap used (gapY = 27 + rand*42, i.e. gapTop
// as low as 10, gapBottom as high as 86) so the HARD end of the ramp
// reproduces the exact old placement range, not a new one.
const PLAYFIELD_TOP_MARGIN = 10;
const PLAYFIELD_BOTTOM_LIMIT = 86;

function lerp(easy: number, hard: number, progress: number): number {
  return easy + (hard - easy) * progress;
}
/** 0 on the very first tree, 1 once `DIFFICULTY_RAMP_TREES` have been passed. */
function difficultyProgress(treesPassed: number): number {
  return Math.min(1, treesPassed / DIFFICULTY_RAMP_TREES);
}

export default function FlappyDragon({ childId: _childId, onExit, onReward }: FlappyDragonProps) {
  const learnedCount = getLearnedWords().length;
  const unlocked = !FLAPPY_REQUIRE_LEARNED_WORDS || learnedCount >= FLAPPY_UNLOCK_WORDS;
  const [phase, setPhase] = useState<Phase>(unlocked ? "ready" : "locked");
  const [dragonY, setDragonY] = useState(44);
  const [trees, setTrees] = useState<TreePair[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("petlingo.flappyDragonBest") ?? 0));
  const [saving, setSaving] = useState(false);
  const [rewardMessage, setRewardMessage] = useState("");
  const phaseRef = useRef(phase);
  const yRef = useRef(44);
  const velocityRef = useRef(0);
  const treesRef = useRef<TreePair[]>([]);
  const lastTimeRef = useRef(0);
  const spawnRef = useRef(0);
  const scoreRef = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const finish = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    phaseRef.current = "over";
    setPhase("over");
    const finalScore = scoreRef.current;
    setBest((current) => {
      const next = Math.max(current, finalScore);
      localStorage.setItem("petlingo.flappyDragonBest", String(next));
      return next;
    });
    if (finalScore > 0) {
      setSaving(true);
      setRewardMessage("");
      onReward(finalScore)
        .then(({ rewardCoins, dailyRemaining }) => {
          setRewardMessage(rewardCoins > 0
            ? `Đã nhận ${rewardCoins} coin · Còn ${dailyRemaining} coin thưởng hôm nay.`
            : "Đã đạt giới hạn 200 coin hôm nay · Bạn vẫn có thể chơi để lập kỷ lục!");
        })
        .catch(() => setRewardMessage("Chưa lưu được phần thưởng, thử lại sau nhé."))
        .finally(() => setSaving(false));
    }
  }, [onReward]);

  const flap = useCallback(() => {
    if (phaseRef.current === "ready" || phaseRef.current === "over") {
      yRef.current = 44;
      velocityRef.current = FLAP_SPEED;
      treesRef.current = [];
      scoreRef.current = 0;
      spawnRef.current = 0;
      lastTimeRef.current = performance.now();
      setDragonY(44);
      setTrees([]);
      setScore(0);
      setRewardMessage("");
      phaseRef.current = "playing";
      setPhase("playing");
      return;
    }
    if (phaseRef.current === "playing") velocityRef.current = FLAP_SPEED;
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  useEffect(() => {
    let frame = 0;
    const tick = (now: number) => {
      if (phaseRef.current === "playing") {
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.034);
        lastTimeRef.current = now;
        // Recomputed every frame from the CURRENT score, so speed/spawn-rate
        // ramp up smoothly as trees are passed rather than jumping in steps.
        const progress = difficultyProgress(scoreRef.current);
        const treeSpeed = lerp(TREE_SPEED_EASY, TREE_SPEED_HARD, progress);
        const spawnInterval = lerp(SPAWN_INTERVAL_EASY, SPAWN_INTERVAL_HARD, progress);
        velocityRef.current += GRAVITY * dt;
        yRef.current += velocityRef.current * dt;
        spawnRef.current += dt;

        if (spawnRef.current >= spawnInterval) {
          spawnRef.current = 0;
          // Gap height is fixed onto the tree AT SPAWN TIME (not recomputed
          // later) so a tree already on screen never shrinks its own gap
          // under the player mid-approach — only trees spawned later get
          // harder.
          const gapHeight = lerp(GAP_HEIGHT_EASY, GAP_HEIGHT_HARD, progress);
          const minCenter = PLAYFIELD_TOP_MARGIN + gapHeight / 2;
          const maxCenter = PLAYFIELD_BOTTOM_LIMIT - gapHeight / 2;
          const gapY = minCenter + Math.random() * Math.max(0, maxCenter - minCenter);
          treesRef.current.push({ id: now, x: 108, gapY, gapHeight, counted: false });
        }

        treesRef.current = treesRef.current
          .map((tree) => ({ ...tree, x: tree.x - treeSpeed * dt }))
          .filter((tree) => tree.x > -TREE_WIDTH - 2);

        for (const tree of treesRef.current) {
          if (!tree.counted && tree.x + TREE_WIDTH < DRAGON_X) {
            tree.counted = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }
          const overlapsX = DRAGON_X + DRAGON_SIZE * 0.72 > tree.x && DRAGON_X + DRAGON_SIZE * 0.18 < tree.x + TREE_WIDTH;
          const gapTop = tree.gapY - tree.gapHeight / 2;
          const gapBottom = tree.gapY + tree.gapHeight / 2;
          const hitsTree = overlapsX && (yRef.current + DRAGON_SIZE * 0.2 < gapTop || yRef.current + DRAGON_SIZE * 0.8 > gapBottom);
          if (hitsTree) finish();
        }
        if (yRef.current < -3 || yRef.current > 84) finish();
        setDragonY(yRef.current);
        setTrees([...treesRef.current]);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [finish]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#BDEBFF]">
      <header className="relative z-30 flex items-center gap-3 p-4">
        <button aria-label="Quay lại" onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]"><BackIcon /></button>
        <div>
          <h1 className="font-baloo text-[26px] font-extrabold text-[#315B72]">🐉 Flappy Dragon</h1>
          <p className="font-baloo text-xs font-bold text-[#577688]">Chạm để vỗ cánh · Mỗi cây vượt qua = 1 coin</p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="rounded-full bg-white/90 px-4 py-2 font-baloo font-extrabold text-[#B07A0C]">🏆 {best}</span>
          <span className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 font-baloo font-extrabold text-[#B07A0C]"><CoinIcon size={18} /> {score}</span>
        </div>
      </header>

      <button type="button" onClick={phase === "locked" ? undefined : flap} className="relative min-h-0 flex-1 cursor-pointer overflow-hidden text-left focus:outline-none" aria-label="Khu vực chơi Flappy Dragon">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#9DE0FF_0%,#DDF7FF_66%,#A5DD72_67%,#72B84C_100%)]" />
        <div className="absolute left-[8%] top-[14%] text-6xl opacity-75">☁️</div>
        <div className="absolute left-[57%] top-[24%] text-5xl opacity-60">☁️</div>
        <div className="absolute bottom-[8%] left-0 right-0 h-[18%] bg-[repeating-linear-gradient(90deg,#5A9E43_0_18px,#6EB84E_18px_36px)] opacity-45" />

        {trees.map((tree) => {
          const topHeight = tree.gapY - tree.gapHeight / 2;
          const bottomTop = tree.gapY + tree.gapHeight / 2;
          return (
            <div key={tree.id}>
              <div className="absolute top-0 rounded-b-[42%] border-x-4 border-b-4 border-[#397737] bg-[repeating-linear-gradient(90deg,#4D963F_0_12px,#65AE4C_12px_24px)] shadow-lg" style={{ left: `${tree.x}%`, width: `${TREE_WIDTH}%`, height: `${topHeight}%` }} />
              <div className="absolute bottom-0 rounded-t-[42%] border-x-4 border-t-4 border-[#397737] bg-[repeating-linear-gradient(90deg,#4D963F_0_12px,#65AE4C_12px_24px)] shadow-lg" style={{ left: `${tree.x}%`, width: `${TREE_WIDTH}%`, top: `${bottomTop}%` }} />
            </div>
          );
        })}

        <img src="/pets/animation/ember-wing-flap-v6.webp" alt="Ember dragon" draggable={false} className="pointer-events-none absolute z-20 object-contain drop-shadow-[0_10px_5px_rgba(65,66,35,.3)]" style={{ left: `${DRAGON_X}%`, top: `${dragonY}%`, width: `${DRAGON_SIZE}%`, transform: `translateY(-50%) rotate(${Math.max(-18, Math.min(28, velocityRef.current * 1.1))}deg)` }} />

        {phase !== "playing" && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-[#284A5A]/25 p-5 backdrop-blur-[2px]">
            <div className="w-[430px] max-w-[90%] rounded-[30px] border-4 border-white bg-[#FFF9EA] p-6 text-center shadow-[0_10px_0_#D4B879,0_24px_50px_rgba(34,61,62,.28)]">
              {phase === "locked" ? (
                <>
                  <div className="text-5xl">🔒</div>
                  <h2 className="mt-2 font-baloo text-2xl font-extrabold text-[#4B3E33]">Cần học thêm từ mới!</h2>
                  <p className="mt-2 font-baloo font-semibold text-[#7A6A58]">Đã học {learnedCount}/{FLAPPY_UNLOCK_WORDS} từ. Trả lời đúng trong bài học để mở khóa chuyến bay.</p>
                  <div className="mt-4 h-4 overflow-hidden rounded-full bg-[#E8DDC3]"><div className="h-full rounded-full bg-[#75B94B]" style={{ width: `${Math.min(100, learnedCount / FLAPPY_UNLOCK_WORDS * 100)}%` }} /></div>
                  <button type="button" onClick={(event) => { event.stopPropagation(); onExit(); }} className="mt-5 rounded-2xl bg-[#F5822B] px-6 py-3 font-baloo font-extrabold text-white shadow-[0_5px_0_#C55F1A]">Đi học ngay</button>
                </>
              ) : (
                <>
                  <div className="text-5xl">{phase === "over" ? "🌟" : "🐉"}</div>
                  <h2 className="mt-2 font-baloo text-2xl font-extrabold text-[#4B3E33]">{phase === "over" ? `Bạn đã vượt ${score} cây!` : "Sẵn sàng bay chưa?"}</h2>
                  <p className="mt-2 font-baloo font-semibold text-[#7A6A58]">{saving ? "Đang xác nhận phần thưởng..." : phase === "over" ? `${rewardMessage || "Đang tính phần thưởng..."} Chạm để chơi lại!` : "Chạm màn hình hoặc nhấn Space để vỗ cánh."}</p>
                  <span className="mt-5 inline-block rounded-2xl bg-[#F5822B] px-7 py-3 font-baloo font-extrabold text-white shadow-[0_5px_0_#C55F1A]">{phase === "over" ? "Bay lại" : "Bắt đầu"}</span>
                </>
              )}
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
