import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Crown, Flame, Shield, Sparkles, Swords, Trophy, X, Zap } from "lucide-react";
import PetPortrait from "../components/PetPortrait";
import { BackIcon, ChunkyButton, CoinIcon, SoftButton } from "../components/ui";
import { PETS, RARITY } from "../components/ui/tokens";
import { api, ApiError, type Child, type RpgStatus, type RpgTopicDetail, type RpgTopicListItem } from "../lib/api";
import { useT } from "../lib/i18n";

interface WordRpgProps { child: Child; onExit: () => void }
const PLAYER_MAX_HP = 100;
const PLAYER_DAMAGE = 25;
const TOPIC_META: Record<string, { icon: string; eyebrow: string; description: string; backdrop: string; squad: string[] }> = {
  "emotion-forest": { icon: "🌙", eyebrow: "Ải 1 · Cơ bản", description: "Đọc cảm xúc, kết bạn với đội thú trong rừng phép thuật.", backdrop: "linear-gradient(145deg,#46316F 0%,#694E91 52%,#2B2149 100%)", squad: ["mimi", "buddy", "lila", "sprout", "umbra"] },
  "action-cave": { icon: "🔥", eyebrow: "Ải 2 · Thử thách", description: "Học động từ hành động và chinh phục hang động pha lê.", backdrop: "linear-gradient(145deg,#164E63 0%,#257A83 52%,#173B56 100%)", squad: ["kiwi", "stripe", "nocty", "gargo", "frostwing"] },
};
const DEFAULT_SQUAD = ["poppy", "leo", "mystic", "aqua", "ember"];
const squadFor = (key: string) => TOPIC_META[key]?.squad ?? DEFAULT_SQUAD;
function petFor(topicKey: string, index: number) {
  const id = squadFor(topicKey)[index % squadFor(topicKey).length]!;
  return PETS.find((pet) => pet.id === id) ?? PETS[0]!;
}
function HpBar({ percent, color, track = "#E8E0D2" }: { percent: number; color: string; track?: string }) {
  return <div className="h-3 overflow-hidden rounded-full border border-white/20" style={{ background: track }}><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, percent)}%`, background: color }} /></div>;
}

export default function WordRpg({ child, onExit }: WordRpgProps) {
  const t = useT();
  const [list, setList] = useState<RpgTopicListItem[] | null>(null);
  const [topic, setTopic] = useState<RpgTopicDetail | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [loadingId, setLoadingId] = useState("");
  useEffect(() => { api.listRpgTopics().then((r) => setList(r.topics)).catch((err) => setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được danh sách chủ đề, thử lại nhé."))); }, [t]);
  async function openTopic(id: string) {
    setLoadErr(""); setLoadingId(id);
    try { const result = await api.getRpgTopic(id); setTopic(result.topic); }
    catch (err) { setLoadErr(err instanceof ApiError ? t(err.message) : t("Không tải được chủ đề, thử lại nhé.")); }
    finally { setLoadingId(""); }
  }
  if (topic) return <WordRpgBattle child={child} topic={topic} onExit={() => setTopic(null)} />;
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,#CDEEFF_0%,#E9F7F0_42%,#FFF5DE_100%)]">
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-[#82D4E8]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-[#FFD36C]/25 blur-3xl" />
      <header className="relative z-10 flex items-center gap-4 px-5 py-4">
        <button onClick={onExit} aria-label={t("Quay lại")} className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_5px_0_#43609F] active:translate-y-1 active:shadow-none"><BackIcon /></button>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Swords className="text-[#E56738]" size={25} /><h1 className="font-baloo text-[27px] font-extrabold text-[#3D352D]">Word RPG</h1></div><p className="font-baloo text-[12px] font-semibold text-[#7E746A]">Chọn vùng đất · trả lời từ vựng · thu phục bạn thú</p></div>
        <div className="rounded-[20px] border-2 border-white bg-white/85 px-4 py-2 text-right shadow-[0_4px_0_#D7E2D9]"><div className="font-baloo text-[10px] font-extrabold uppercase tracking-wider text-[#8C8176]">Nhà thám hiểm</div><div className="font-baloo text-[15px] font-extrabold text-[#4E7C68]">{child.displayName}</div></div>
      </header>
      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <section className="mx-auto mb-5 flex max-w-[1040px] items-center justify-between overflow-hidden rounded-[28px] border-[3px] border-white bg-[linear-gradient(120deg,#FFFAE9,#E9F7E5)] px-6 py-4 shadow-[0_7px_0_#CEE0D0]">
          <div><div className="mb-1 flex items-center gap-2 font-baloo text-[11px] font-extrabold uppercase tracking-[.12em] text-[#71906A]"><Sparkles size={15} /> Hành trình hôm nay</div><h2 className="font-baloo text-[22px] font-extrabold text-[#43382E]">Đánh bại 5 đối thủ bằng vốn từ của bạn</h2><p className="mt-1 font-baloo text-[12px] font-semibold text-[#817567]">Trả lời đúng để tấn công. Thắng mỗi pet nhận coin và XP ngay lập tức.</p></div>
          <div className="hidden gap-2 sm:flex"><div className="rounded-2xl bg-[#FFF1C6] px-4 py-2 text-center font-baloo font-extrabold text-[#A87517]"><div className="text-[10px] uppercase">Thường</div>+15 coin</div><div className="rounded-2xl bg-[#F0E9FF] px-4 py-2 text-center font-baloo font-extrabold text-[#7253A7]"><div className="text-[10px] uppercase">Boss</div>+40 coin</div></div>
        </section>
        {list === null ? <div className="grid h-64 place-items-center font-baloo font-bold text-[#81928B]">Đang mở bản đồ phiêu lưu…</div> : loadErr && list.length === 0 ? <div className="grid h-64 place-items-center font-baloo font-bold text-[#D45346]">{loadErr}</div> : (
          <div className="mx-auto grid max-w-[1040px] gap-5 md:grid-cols-2">
            {list.map((tp, index) => {
              const meta = TOPIC_META[tp.key] ?? { icon: "✨", eyebrow: `Ải ${index + 1}`, description: "Một hành trình từ vựng mới đang chờ bạn.", backdrop: "linear-gradient(145deg,#566B8E,#768DB0 52%,#405574)", squad: DEFAULT_SQUAD };
              const squad = squadFor(tp.key).slice(0, tp._count.monsters);
              return <button key={tp.id} onClick={() => openTopic(tp.id)} disabled={!!loadingId} style={{ background: meta.backdrop }} className="group relative min-h-[300px] overflow-hidden rounded-[30px] border-[4px] border-white p-5 text-left shadow-[0_8px_0_rgba(63,56,48,.2)] transition-transform hover:-translate-y-1 disabled:cursor-wait">
                <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" />
                <div className="relative flex items-start justify-between"><div><span className="rounded-full bg-white/20 px-3 py-1 font-baloo text-[10px] font-extrabold uppercase tracking-wider text-white">{meta.eyebrow}</span><h3 className="mt-3 font-baloo text-[25px] font-extrabold text-white">{tp.name}</h3><p className="mt-1 max-w-[330px] font-baloo text-[12px] font-semibold text-white/75">{meta.description}</p></div><span className="text-[42px] drop-shadow-md">{meta.icon}</span></div>
                <div className="relative mt-5 flex h-[104px] items-end justify-center -space-x-3">{squad.map((petId, petIndex) => { const pet = PETS.find((p) => p.id === petId)!; return <div key={petId} className="relative h-[92px] w-[92px] rounded-full border-[3px] border-white/75 bg-white/20 p-1 shadow-lg transition-transform group-hover:-translate-y-1" style={{ zIndex: petIndex }}><PetPortrait petId={pet.id} name={pet.name} level={petIndex === squad.length - 1 ? 30 : 20} className="h-full w-full" /></div>; })}</div>
                <div className="relative mt-3 flex items-center justify-between"><div className="flex items-center gap-2 font-baloo text-[12px] font-extrabold text-white/85"><Shield size={17} /> {tp._count.monsters} đối thủ · 1 Boss</div><span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-baloo text-[13px] font-extrabold text-[#4D4865] shadow-[0_4px_0_rgba(0,0,0,.15)]">{loadingId === tp.id ? "Đang vào…" : "Bắt đầu"}<ArrowRight size={17} /></span></div>
              </button>;
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function WordRpgBattle({ child, topic, onExit }: { child: Child; topic: RpgTopicDetail; onExit: () => void }) {
  const monsters = topic.monsters;
  const [monsterIdx, setMonsterIdx] = useState(0); const [questionIdx, setQuestionIdx] = useState(0); const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [chosen, setChosen] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [status, setStatus] = useState<RpgStatus | null>(null);
  const [runCoins, setRunCoins] = useState(0); const [runXp, setRunXp] = useState(0); const [leveledUp, setLeveledUp] = useState(false);
  const [defeated, setDefeated] = useState(false); const [gameOver, setGameOver] = useState(false); const [victory, setVictory] = useState(false);
  const monster = monsters[monsterIdx]!; const question = monster.questions[questionIdx]!;
  const pet = useMemo(() => petFor(topic.key, monsterIdx), [topic.key, monsterIdx]);
  const monsterHpPercent = Math.round(((monster.questions.length - questionIdx) / monster.questions.length) * 100);
  useEffect(() => { api.getRpgStatus(child.id).then(setStatus).catch(() => undefined); }, [child.id]);
  function reset() { setMonsterIdx(0); setQuestionIdx(0); setPlayerHp(PLAYER_MAX_HP); setChosen(null); setBusy(false); setRunCoins(0); setRunXp(0); setLeveledUp(false); setDefeated(false); setGameOver(false); setVictory(false); }
  async function answer(opt: string) {
    if (chosen || busy) return; setChosen(opt); setBusy(true); const correct = opt === question.answer;
    if (correct) {
      if (questionIdx + 1 < monster.questions.length) { setTimeout(() => { setChosen(null); setBusy(false); setQuestionIdx((i) => i + 1); }, 750); return; }
      try { const result = await api.defeatRpgMonster(child.id, monster.id); setRunCoins((c) => c + result.rewardCoins); setRunXp((x) => x + result.rewardXp); setStatus({ xp: result.xp, level: result.level, nextLevel: result.nextLevel }); setLeveledUp(result.leveledUp); } catch { /* Server owns rewards. */ }
      setDefeated(true); setTimeout(() => { setDefeated(false); setLeveledUp(false); setChosen(null); setBusy(false); if (monsterIdx + 1 >= monsters.length) setVictory(true); else { setMonsterIdx((i) => i + 1); setQuestionIdx(0); } }, 1450);
    } else { const hp = Math.max(0, playerHp - PLAYER_DAMAGE); setPlayerHp(hp); setTimeout(() => { setChosen(null); setBusy(false); if (hp <= 0) setGameOver(true); }, 950); }
  }
  return <div className="relative flex h-full flex-col overflow-hidden" style={{ background: TOPIC_META[topic.key]?.backdrop ?? "linear-gradient(180deg,#3A315D,#513F72 50%,#241D3E)" }}>
    <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_30%,white_0_2px,transparent_3px),radial-gradient(circle_at_80%_20%,white_0_1px,transparent_2px)] [background-size:90px_90px,70px_70px]" />
    <header className="relative z-10 flex items-center gap-3 px-4 py-3"><button onClick={onExit} className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]"><BackIcon /></button><div className="min-w-0"><h1 className="truncate font-baloo text-[21px] font-extrabold text-white">{topic.name}</h1><p className="font-baloo text-[11px] font-bold text-white/65">Đối thủ {monsterIdx + 1}/{monsters.length} · Câu {questionIdx + 1}/{monster.questions.length}</p></div><div className="mx-3 hidden flex-1 items-center gap-1.5 sm:flex">{monsters.map((_, i) => <span key={i} className={`h-2 flex-1 rounded-full ${i < monsterIdx ? "bg-[#85D45E]" : i === monsterIdx ? "bg-[#FFD45C]" : "bg-white/20"}`} />)}</div>{status && <div className="rounded-xl bg-white/15 px-3 py-1.5 font-baloo text-[11px] font-extrabold text-white">Lv.{status.level.level}</div>}<div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-baloo text-[14px] font-extrabold text-[#A87517]"><CoinIcon size={17} />+{runCoins}</div></header>
    <main className="relative z-10 mx-auto grid min-h-0 w-full max-w-[1080px] flex-1 gap-4 px-5 pb-5" style={{ gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)" }}>
      <section className="relative flex min-h-[300px] flex-col overflow-hidden rounded-[30px] border-[3px] border-white/25 bg-white/10 p-4 shadow-[0_8px_0_rgba(0,0,0,.18)] backdrop-blur-sm">
        <div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="rounded-full px-2.5 py-1 font-baloo text-[9px] font-extrabold uppercase text-white" style={{ background: RARITY[pet.rarity].tint }}>{pet.rarity}</span>{monster.isBoss && <span className="flex items-center gap-1 rounded-full bg-[#F05C4F] px-2.5 py-1 font-baloo text-[9px] font-extrabold text-white"><Crown size={12} /> BOSS</span>}</div><h2 className="mt-2 font-baloo text-[22px] font-extrabold text-white">{pet.name}</h2><p className="font-baloo text-[11px] font-semibold text-white/60">{pet.species} · {monster.name}</p></div><div className="rounded-2xl bg-black/15 px-3 py-2 text-right font-baloo text-[10px] font-bold text-white/70"><div>SỨC MẠNH</div><div className="text-[18px] font-extrabold text-[#FFD45C]">{monster.isBoss ? 980 : 320 + monsterIdx * 120}</div></div></div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center"><div className="absolute h-48 w-48 rounded-full bg-white/15 blur-2xl" /><div className={`relative h-[210px] w-[250px] ${defeated ? "animate-shake opacity-60" : "animate-bob"}`}><PetPortrait petId={pet.id} name={pet.name} level={monster.isBoss ? 30 : 20} animated className="h-full w-full drop-shadow-[0_18px_15px_rgba(0,0,0,.25)]" /></div>{defeated && <div className="animate-pop absolute rounded-[22px] border-4 border-white bg-[#EEFAE4] px-6 py-3 text-center font-baloo text-[18px] font-extrabold text-[#4F7C2A]"><Check className="mx-auto" />Thu phục thành công!{leveledUp && <div className="text-[12px] text-[#9A7217]">🎉 Lên cấp RPG</div>}</div>}</div>
        <div><div className="mb-1.5 flex justify-between font-baloo text-[11px] font-extrabold text-white"><span className="flex items-center gap-1"><Flame size={14} /> HP đối thủ</span><span>{monster.questions.length - questionIdx}/{monster.questions.length}</span></div><HpBar percent={monsterHpPercent} color="#FF765F" track="rgba(255,255,255,.16)" /></div>
      </section>
      <section className="flex min-h-0 flex-col rounded-[30px] border-[3px] border-white bg-[#FFFDF8] p-5 shadow-[0_8px_0_rgba(0,0,0,.16)]">
        <div className="mb-3"><div className="mb-1 flex items-center justify-between font-baloo text-[11px] font-extrabold text-[#776A5E]"><span>❤️ {child.displayName}</span><span>{playerHp}/{PLAYER_MAX_HP}</span></div><HpBar percent={playerHp} color={playerHp > 40 ? "#77C653" : "#EF6257"} /></div>
        {!defeated && <><div className="rounded-[24px] border-2 border-[#E9DCC4] bg-[linear-gradient(135deg,#FFF8E5,#F3F8ED)] px-5 py-4 text-center"><div className="flex items-center justify-center gap-2 font-baloo text-[10px] font-extrabold uppercase tracking-wider text-[#8B7D6C]"><Zap size={14} className="text-[#E9A51E]" /> Chọn nghĩa đúng để tấn công</div><div className="mt-1 font-baloo text-[32px] font-extrabold text-[#3F352E]">{question.en}</div></div><div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-3">{question.options.map((opt, i) => { const show=chosen!==null,picked=chosen===opt,correct=opt===question.answer; const state=show&&correct?"correct":show&&picked?"wrong":"idle"; return <button key={opt} disabled={show} onClick={()=>answer(opt)} className={`relative flex min-h-[78px] items-center gap-3 rounded-[20px] border-[3px] px-3 text-left font-baloo font-extrabold shadow-[0_4px_0_#D9CDB9] transition-transform active:translate-y-1 ${state==="correct"?"border-[#76BF52] bg-[#EFF9E8]":state==="wrong"?"border-[#E8665A] bg-[#FDEBE8]":"border-[#E5D9C4] bg-white"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: ["#617EC7","#F08A3E","#51B7A9","#9479D2"][i%4] }}>{String.fromCharCode(65+i)}</span><span className="text-[16px] text-[#443A31]">{opt}</span>{state==="correct"&&<Check className="ml-auto text-[#62A73E]" />}{state==="wrong"&&<X className="ml-auto text-[#D85248]" />}</button>; })}</div>{chosen && <div className={`mt-3 rounded-full py-2 text-center font-baloo text-[13px] font-extrabold ${chosen===question.answer?"bg-[#EAF7E2] text-[#548D36]":"bg-[#FDE9E6] text-[#BD493E]"}`}>{chosen===question.answer?"⚔️ Chính xác! Đòn đánh trúng mục tiêu.":`🛡️ Chưa đúng — đáp án là ${question.answer}`}</div>}</>}
      </section>
    </main>
    {(gameOver || victory) && <div className="absolute inset-0 z-30 grid place-items-center bg-[#251D32]/65 p-5 backdrop-blur-sm"><div className="animate-pop w-full max-w-[440px] rounded-[32px] border-4 border-white bg-[#FFFDF7] p-6 text-center shadow-2xl"><div className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${victory?"bg-[#FFD65C] text-[#A86E10]":"bg-[#FFE5E0] text-[#CB4B40]"}`}>{victory?<Trophy size={43}/>:<Shield size={43}/>}</div><h2 className="mt-3 font-baloo text-[25px] font-extrabold text-[#43372F]">{victory?"Chinh phục vùng đất!":"Đội bạn cần nghỉ ngơi"}</h2><p className="mt-1 font-baloo text-[12px] font-semibold text-[#817466]">{victory?"Bạn đã thu phục toàn bộ đội pet đối thủ.":"Đừng lo, toàn bộ phần thưởng đã kiếm vẫn được giữ lại."}</p><div className="my-4 flex justify-center gap-2"><span className="flex items-center gap-1 rounded-full bg-[#FFF1C9] px-4 py-2 font-baloo font-extrabold text-[#A87517]"><CoinIcon size={18}/>+{runCoins}</span><span className="rounded-full bg-[#EAF7E3] px-4 py-2 font-baloo font-extrabold text-[#568C38]">+{runXp} XP</span>{status&&<span className="rounded-full bg-[#EEE8FA] px-4 py-2 font-baloo font-extrabold text-[#7253A7]">Lv.{status.level.level}</span>}</div><div className="flex gap-3"><SoftButton onClick={onExit} className="flex-1">Chọn ải</SoftButton><ChunkyButton tone={victory?"green":"orange"} onClick={reset} className="flex-1">Chơi lại</ChunkyButton></div></div></div>}
  </div>;
}
