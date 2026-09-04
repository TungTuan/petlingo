import { useRef, useState, type CSSProperties } from "react";
import { ArrowRight, BookOpen, CalendarCheck2, Check, Gift, Palette, ShieldCheck, Trophy } from "lucide-react";
import { ChunkyButton, CoinIcon, GearIcon, GemIcon, HeartIcon, StarIcon } from "../components/ui";
import BottomTabs from "../components/BottomTabs";
import PetPortrait from "../components/PetPortrait";
import { useT } from "../lib/i18n";
import type { NavTab } from "../types/nav";
import { getPetEvolutionStage, getPetMood } from "../lib/petEvolution";
import HomeCustomizationModal from "../components/HomeCustomizationModal";
import { HOME_BACKGROUNDS, type HomeCustomization } from "../lib/homeCustomization";
import type { InventoryEntry, Quest } from "../lib/api";

type ParticleStyle = CSSProperties & Record<`--${string}`, string>;

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createWeatherParticles() {
  const random = seededRandom(0x504554);
  const rainCount = 112;
  const rain = Array.from({ length: rainCount }, (_, index) => {
    const duration = 820 + random() * 1050;
    // Stratified phase: every section of the fall cycle always contains
    // drops, while the jitter prevents them from forming visible rows.
    const phase = (index + random() * 0.82) / rainCount;
    return {
      left: `${-4 + random() * 112}%`,
      width: `${1.8 + random() * 2.2}px`,
      height: `${22 + random() * 30}px`,
      opacity: 0.48 + random() * 0.5,
      animationDuration: `${duration}ms`,
      animationDelay: `${-phase * duration}ms`,
      "--rain-drift": `${-45 - random() * 105}px`,
      "--rain-angle": `${10 + random() * 11}deg`,
    } satisfies ParticleStyle;
  });
  const snowCount = 120;
  const snow = Array.from({ length: snowCount }, (_, index) => {
    const duration = 4300 + random() * 6200;
    const size = 4 + random() * 11;
    const phase = (index + random() * 0.82) / snowCount;
    return {
      left: `${-2 + random() * 104}%`,
      width: `${size}px`,
      height: `${size}px`,
      opacity: 0.42 + random() * 0.56,
      animationDuration: `${duration}ms`,
      animationDelay: `${-phase * duration}ms`,
      "--snow-mid": `${-55 + random() * 110}px`,
      "--snow-end": `${-75 + random() * 150}px`,
    } satisfies ParticleStyle;
  });
  const leaves = Array.from({ length: 18 }, () => {
    const duration = 3900 + random() * 4500;
    const size = 0.65 + random() * 0.75;
    const wave = -12 + random() * 28;
    return {
      top: `${4 + random() * 78}%`,
      scale: `${size}`,
      animationDuration: `${duration}ms`,
      animationDelay: `${-random() * duration}ms`,
      "--leaf-wave": `${wave}vh`,
      "--leaf-end": `${wave * -0.35}vh`,
    } satisfies ParticleStyle;
  });
  return { rain, snow, leaves };
}

const WEATHER_PARTICLES = createWeatherParticles();

interface HomeProps {
  childName: string;
  level: number;
  hp: number;
  maxHp: number;
  coins: number;
  gems: number;
  petId: string;
  petName: string;
  petStats: import("../lib/api").PetStatsState | null;
  quests: Quest[] | null;
  onNavigate: (tab: NavTab) => void;
  onPlayLesson: () => void;
  onOpenDailyQuest: () => void;
  onOpenBattlePass: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  customization: HomeCustomization;
  backgroundShop: InventoryEntry[];
  ownedBackgroundKeys: Set<string>;
  onChangeCustomization: (value: HomeCustomization) => void;
  onPurchaseBackground: (entry: InventoryEntry) => Promise<void>;
}

/** Home — matches the reference sheet's "Phần 1 · Home + Pet" panel. */
export default function Home({
  childName,
  level,
  hp,
  maxHp,
  coins,
  gems,
  petId,
  petName,
  petStats,
  quests,
  onNavigate,
  onPlayLesson,
  onOpenDailyQuest,
  onOpenBattlePass,
  onOpenSettings,
  onOpenPrivacy,
  customization,
  backgroundShop,
  ownedBackgroundKeys,
  onChangeCustomization,
  onPurchaseBackground,
}: HomeProps) {
  const t = useT();
  const [pats, setPats] = useState(0);
  const lastPatAt = useRef(0);
  function reactToPat() {
    const now = performance.now();
    if (now - lastPatAt.current < 350) return;
    lastPatAt.current = now;
    setPats((value) => value + 1);
  }
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [busyBackground, setBusyBackground] = useState<string | null>(null);
  const petLevel = petStats?.level ?? 1;
  const stage = getPetEvolutionStage(petLevel);
  const mood = getPetMood(petStats?.hunger ?? 70);
  const xpInLevel = (petStats?.experience ?? 0) % 100;
  const activeBackground = HOME_BACKGROUNDS.find((bg) => bg.id === customization.backgroundId) ?? HOME_BACKGROUNDS[0]!;
  const questList = quests ?? [];
  const completedQuests = questList.filter((quest) => quest.progress >= quest.target).length;
  const allQuestsCompleted = questList.length > 0 && completedQuests === questList.length;

  async function purchaseBackground(entry: InventoryEntry) {
    setBusyBackground(entry.item.key);
    try {
      await onPurchaseBackground(entry);
      onChangeCustomization({ ...customization, backgroundId: HOME_BACKGROUNDS.find((bg) => bg.itemKey === entry.item.key)?.id ?? customization.backgroundId });
    } finally {
      setBusyBackground(null);
    }
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className={`absolute inset-0 bg-cover bg-center transition-[filter] duration-700 ${activeBackground.previewClass}`} />
      <div className="absolute inset-0 transition-colors duration-700" style={{ background: activeBackground.overlay }} />
      {customization.weather === "rain" && <div className="home-rain-effect absolute inset-0" aria-hidden="true">
        <span className="home-wind-gust" />
        {WEATHER_PARTICLES.rain.map((style, i) => <i key={`rain-${i}`} style={style} />)}
        {WEATHER_PARTICLES.leaves.map((style, i) => <b key={`leaf-${i}`} style={style} />)}
      </div>}
      {customization.weather === "snow" && <div className="home-snow-effect absolute inset-0" aria-hidden="true">{WEATHER_PARTICLES.snow.map((style, i) => <i key={`snow-${i}`} style={style} />)}</div>}

      <div className="relative flex items-center gap-3 p-4">
        <div className="flex items-center gap-2.5 rounded-[22px] border-2 border-white/70 bg-[#238FCC]/90 py-1.5 pl-2 pr-4 text-white shadow-[0_5px_0_#166A9E,0_10px_20px_rgba(17,74,115,.2)] backdrop-blur-sm">
          <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-[#FFF2CE] text-2xl">👧</span>
          <span className="font-baloo text-[18px] font-extrabold">{childName}</span>
          <span className="flex items-center gap-1 font-baloo text-base font-extrabold text-[#FFF3A5]">
            <StarIcon size={18} />
            {level}
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 rounded-full border-2 border-[#7EC8EF] bg-[#123E6A]/90 px-4 py-2 font-baloo text-base font-extrabold text-white shadow-[0_4px_0_#0A2949]">
          <HeartIcon size={19} />
          {hp}/{maxHp}
        </div>
        <div className="flex items-center gap-2 rounded-full border-2 border-[#7EC8EF] bg-[#123E6A]/90 px-4 py-2 font-baloo text-base font-extrabold text-white shadow-[0_4px_0_#0A2949]">
          <CoinIcon size={19} />
          {coins}
        </div>
        <div className="flex items-center gap-2 rounded-full border-2 border-[#7EC8EF] bg-[#123E6A]/90 px-4 py-2 font-baloo text-base font-extrabold text-white shadow-[0_4px_0_#0A2949]">
          <GemIcon size={19} />
          {gems}
        </div>
        <button onClick={onOpenSettings} className="grid h-12 w-12 place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_rgba(0,0,0,.24)]">
          <GearIcon />
        </button>
        <button onClick={() => setShowCustomizer(true)} className="group relative grid h-12 w-12 place-items-center rounded-full border-2 border-white/80 bg-[linear-gradient(135deg,#F5822B,#FFD75E)] text-white shadow-[0_4px_0_#B95C22,0_8px_18px_rgba(102,57,24,.2)] transition-transform hover:-translate-y-1 active:translate-y-0" title="Trang trí sân nhà">
          <Palette size={25} strokeWidth={2.8} />
          <span className="animate-pulse-soft absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#EF6A5A] font-baloo text-[11px] font-extrabold text-white">!</span>
        </button>
      </div>

      <div className="relative flex flex-1 px-5">
        <div className="flex w-[210px] flex-col justify-center gap-3">
          <div className="mb-0.5 px-1">
            <div className="font-baloo text-[10px] font-extrabold uppercase tracking-[.14em] text-white/75">Hoạt động hôm nay</div>
            <div className="mt-0.5 font-baloo text-[13px] font-extrabold text-white">Mỗi ngày một niềm vui mới</div>
          </div>
          <button
            onClick={onOpenDailyQuest}
            className="group relative flex min-h-[86px] items-center gap-3 overflow-hidden rounded-[22px] border-[3px] border-white/80 bg-[#FFF9E9]/95 px-3.5 text-left shadow-[0_6px_0_#C9B78D,0_12px_24px_rgba(49,77,42,.18)] transition-transform hover:-translate-y-1 active:translate-y-1"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#EF6A5A] text-white shadow-[0_4px_0_#C74B3D]"><CalendarCheck2 size={26} strokeWidth={2.6} /></span>
            <span className="min-w-0 flex-1"><span className="block pr-9 font-baloo text-[14px] font-extrabold text-[#56483C]">{t("Nhiệm vụ hôm nay")}</span><span className="mt-1 block font-baloo text-[10px] font-bold text-[#917F6B]">{quests === null ? "Đang cập nhật…" : questList.length ? `${completedQuests}/${questList.length} đã hoàn thành` : "Chưa có nhiệm vụ mới"}</span><span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-[#E9DDC5]"><span className="block h-full rounded-full bg-[#77C653] transition-[width]" style={{ width: `${questList.length ? (completedQuests / questList.length) * 100 : 0}%` }} /></span></span>
            {quests !== null && questList.length > 0 && (allQuestsCompleted ? <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[#77C653] text-white"><Check size={15} strokeWidth={3} /></span> : <span className="absolute right-2 top-2 grid h-6 min-w-8 place-items-center rounded-full bg-[#EF6A5A] px-1.5 font-baloo text-[10px] font-extrabold text-white">{completedQuests}/{questList.length}</span>)}
          </button>
          <button onClick={onOpenBattlePass} className="group relative flex min-h-[86px] items-center gap-3 overflow-hidden rounded-[22px] border-[3px] border-white/80 bg-[linear-gradient(135deg,#FFF6D9,#F5E8FF)] px-3.5 text-left shadow-[0_6px_0_#CDBB9E,0_12px_24px_rgba(49,77,42,.18)] transition-transform hover:-translate-y-1 active:translate-y-1">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#9B7EDE,#6D56B1)] text-[#FFE785] shadow-[0_4px_0_#594392]"><Trophy size={27} strokeWidth={2.5} /></span>
            <span className="min-w-0 flex-1"><span className="block font-baloo text-[14px] font-extrabold text-[#56483C]">{t("Battle Pass")}</span><span className="mt-1 block font-baloo text-[10px] font-bold leading-tight text-[#917F6B]">Làm nhiệm vụ · mở khóa quà mùa</span></span>
            <ArrowRight className="shrink-0 text-[#795CB6] transition-transform group-hover:translate-x-1" size={18} />
          </button>
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-end gap-2.5 pb-5">
          <div className="relative z-10 rounded-[20px] border-2 border-white/80 bg-white/90 px-5 py-2.5 font-baloo text-lg font-bold text-ink shadow-[0_8px_24px_rgba(74,100,43,.16)] backdrop-blur-md">
            {stage === "egg" ? t("Học cùng mình để trứng nở nhé!") : mood === "sad" ? t("Mình hơi đói rồi!") : `${t("Xin chào! Mình là")} ${petName}!`}
            <span className="absolute bottom-[-12px] left-8 h-[18px] w-[18px] rotate-45 border-b-[3px] border-r-[3px] border-line bg-white" />
          </div>
          <button onClick={reactToPat} onDoubleClick={(event) => event.preventDefault()} className={`relative z-[5] grid h-[260px] w-[380px] place-items-end border-none bg-transparent p-0 ${petLevel >= 30 ? "pet-max-preview" : ""}`} title={t("Chạm để vuốt Buddy")}>
            <span className="pet-ground-shadow absolute bottom-5 h-11 w-[245px] rounded-[50%] bg-[#365625]/25 blur-[2px]" />
            <span key={`pet-action-${pats}`} className={pats > 0 ? "home-pet-cute-action relative z-10 block" : "relative z-10 block"}><PetPortrait petId={petId} name={petName} level={petLevel} mood={mood} animated className="h-[260px] w-[320px] drop-shadow-[0_18px_16px_rgba(51,72,29,.28)] transition-transform duration-200 hover:scale-[1.025] active:scale-95" /></span>
            {pats > 0 && (
              <span key={`pet-heart-${pats}`} className="animate-float-up pointer-events-none absolute right-[46px] top-5 font-baloo text-[30px] font-extrabold text-[#EF6A5A]">
                ♥
              </span>
            )}
          </button>
          <div className="relative z-10 flex items-center gap-2.5 rounded-full border border-white/80 bg-white/90 px-4.5 py-1.5 shadow-[0_8px_20px_rgba(52,83,36,.15)] backdrop-blur-md">
            <span className="font-baloo text-[15px] font-extrabold text-[#C7455B]">{t("Cấp")} {petLevel}</span>
            <span className="h-3.5 w-[180px] overflow-hidden rounded-full bg-[#EFE3CC]">
              <span className="block h-full bg-[#EF6A5A] transition-[width]" style={{ width: `${petLevel >= 30 ? 100 : xpInLevel}%` }} />
            </span>
            <span className="font-baloo text-[13px] font-bold text-[#8A7A62]">{petLevel >= 30 ? "MAX" : `${xpInLevel}/100 XP`}</span>
          </div>
        </div>

        <div className="flex w-[235px] flex-col justify-center">
          <div className="overflow-hidden rounded-[26px] border-[3px] border-white/85 bg-[#FFF9EA]/95 p-4 shadow-[0_7px_0_#CBB98E,0_14px_28px_rgba(53,71,34,.18)] backdrop-blur-sm">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#F5822B] text-white shadow-[0_4px_0_#C65D17]"><BookOpen size={27} /></span><span><span className="block font-baloo text-[10px] font-extrabold uppercase tracking-[.12em] text-[#A17A49]">Bài học tiếp theo</span><span className="block font-baloo text-[16px] font-extrabold text-[#55463A]">Cùng pet khám phá</span></span></div>
            <div className="my-3 flex items-center justify-between rounded-[15px] bg-[#F4EAD5] px-3 py-2"><span className="flex items-center gap-1.5 font-baloo text-[10px] font-extrabold text-[#8C7252]"><Gift size={15} className="text-[#D89B1D]" /> Thưởng hoàn thành</span><span className="font-baloo text-[11px] font-extrabold text-[#B27A10]">+50 coin · +30 XP</span></div>
            <ChunkyButton shine onClick={onPlayLesson} className="w-full !py-3.5 text-[17px]">
              <span className="flex items-center justify-center gap-2">{t("Học ngay")} <ArrowRight size={19} /></span>
            </ChunkyButton>
          </div>
        </div>
      </div>

      <div className="relative flex justify-center px-5 pb-4.5">
        <BottomTabs active="Home" onChange={onNavigate} className="w-[760px]" />
      </div>
      <button onClick={onOpenPrivacy} className="absolute bottom-2.5 right-4 z-20 flex items-center gap-1.5 rounded-full bg-[#173D60]/75 px-3 py-1.5 font-baloo text-[10px] font-extrabold text-white/90 backdrop-blur-sm hover:bg-[#173D60]">
        <ShieldCheck size={14} /> {t("Chính sách quyền riêng tư")}
      </button>
      {showCustomizer && <HomeCustomizationModal value={customization} coins={coins} gems={gems} shopItems={backgroundShop} ownedItemKeys={ownedBackgroundKeys} busyItemKey={busyBackground} onChange={onChangeCustomization} onPurchase={purchaseBackground} onClose={() => setShowCustomizer(false)} />}
    </div>
  );
}
