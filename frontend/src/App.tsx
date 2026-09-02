import { useEffect, useRef, useState } from "react";
import ScreenFrame from "./components/ScreenFrame";
import {
  api,
  ApiError,
  type CareAction,
  type CareResult,
  type CatalogLesson,
  type CheckInResult,
  type Child,
  type ClaimQuestResult,
  type FusableRarity,
  type InventoryEntry,
  type Parent,
  type PetStatsState,
  type ProgressState,
  type Quest,
  type QuestTrackKind,
  type RewardableActivity,
  type ShopPackageDto,
  type UseItemResult,
} from "./lib/api";
import { DEFAULT_HOME_CUSTOMIZATION, loadHomeCustomization, saveHomeCustomization, type HomeCustomization } from "./lib/homeCustomization";
import type { DictionaryWord } from "./lib/dictionary";
import { isParentPinEnabled } from "./lib/parentPin";
import ParentPinPrompt from "./components/ParentPinPrompt";
import { LanguageProvider, useLang, useT } from "./lib/i18n";
import { tokenStorage } from "./lib/tokenStorage";
import Bag from "./pages/Bag";
import CreateChild from "./pages/CreateChild";
import Dictionary from "./pages/Dictionary";
import EnglishHome from "./pages/EnglishHome";
import EnglishShop from "./pages/EnglishShop";
import Home from "./pages/Home";
import LanguagePicker from "./pages/LanguagePicker";
import Lesson, { type LessonQuestion } from "./pages/Lesson";
import LessonPicker from "./pages/LessonPicker";
import Login from "./pages/Login";
import MiniGame from "./pages/MiniGame";
import More from "./pages/More";
import FightRoom from "./pages/FightRoom";
import MyContent from "./pages/MyContent";
import Notifications from "./pages/Notifications";
import Onboarding from "./pages/Onboarding";
import ParentArea from "./pages/ParentArea";
import PetCare from "./pages/PetCare";
import PetCollection from "./pages/PetCollection";
import PetRanch from "./pages/PetRanch";
import Premium from "./pages/Premium";
import BattlePass from "./pages/BattlePass";
import Profile from "./pages/Profile";
import QuestStreak from "./pages/QuestStreak";
import Rank from "./pages/Rank";
import Settings from "./pages/Settings";
import Shop from "./pages/Shop";
import SrsCard from "./pages/SrsCard";
import Story from "./pages/Story";
import SystemStates from "./pages/SystemStates";
import Topics from "./pages/Topics";
import WordCatch from "./pages/WordCatch";
import WordRpg from "./pages/WordRpg";
import WordTrain from "./pages/WordTrain";
import WorldLessons from "./pages/WorldLessons";
import EnglishDetective from "./pages/EnglishDetective";
import EchoParrot from "./pages/EchoParrot";
import ChatBuddy from "./pages/ChatBuddy";
import FlappyDragon from "./pages/FlappyDragon";
import { rememberLearnedWords } from "./lib/learningGate";
import GameHub from "./pages/GameHub";
import type { NavTab, Screen } from "./types/nav";
import PetEvolutionCelebration from "./components/PetEvolutionCelebration";

type Phase = "boot" | "login" | "offline" | "pickLanguage" | "createChild" | "onboarding" | "ready";

const ONBOARDED_KEY = "petlingo.onboarded";

// "Học ngay" studies Forest by default — the old WorldMap zone-picker
// (dropped, see TASKS.md: replaced by the "Game" tab/GameHub.tsx) used to let
// a child pick from 6 zones before this. A different world can still be
// picked via GameHub's "Chọn bài học" tile → WorldLessons.tsx, which just
// updates `lessonWorldKey` state below before switching to "lesson".
const DEFAULT_LESSON_WORLD_KEY = "forest";

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

function AppInner() {
  const { setLang } = useLang();
  const t = useT();
  const [phase, setPhase] = useState<Phase>("boot");
  const [screen, setScreen] = useState<Screen>("home");
  const screenHistory = useRef<Screen[]>([]);
  const [parent, setParent] = useState<Parent | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);

  const [lessonQuestions, setLessonQuestions] = useState<LessonQuestion[] | null>(null);
  // "{World} · {Lesson title}" — set alongside lessonQuestions purely so the
  // real lesson-completion notification (see onComplete below) can say WHICH
  // lesson, instead of a generic "finished a lesson".
  const [currentLessonLabel, setCurrentLessonLabel] = useState("");
  // Which world's lesson "Học ngay"/the lesson-loading effect below should
  // fetch — defaults to Forest, changed by WorldLessons.tsx's picker.
  const [lessonWorldKey, setLessonWorldKey] = useState(DEFAULT_LESSON_WORLD_KEY);
  // Real saved-word list Topics.tsx hands off when starting a review — feeds SrsCard.tsx.
  const [reviewWords, setReviewWords] = useState<DictionaryWord[]>([]);
  // Only populated when a zone has MORE than one lesson (e.g. a parent added
  // their own via "Nội dung của tôi" alongside the system one) — otherwise
  // the single lesson auto-loads exactly like before, no picker shown.
  const [lessonChoices, setLessonChoices] = useState<CatalogLesson[] | null>(null);
  const [pickedLessonId, setPickedLessonId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryEntry[] | null>(null);
  const [foodShop, setFoodShop] = useState<InventoryEntry[] | null>(null);
  const [packages, setPackages] = useState<ShopPackageDto[] | null>(null);
  const [homeBackgroundShop, setHomeBackgroundShop] = useState<InventoryEntry[]>([]);
  const [homeCustomization, setHomeCustomization] = useState<HomeCustomization>(DEFAULT_HOME_CUSTOMIZATION);
  const [petStats, setPetStats] = useState<PetStatsState | null>(null);
  const [petStatsById, setPetStatsById] = useState<Record<string, PetStatsState>>({});
  const [dailyQuests, setDailyQuests] = useState<Quest[] | null>(null);
  const [evolution, setEvolution] = useState<{ petId: string; petName: string; fromLevel: number; toLevel: number } | null>(null);
  // Settings.tsx's "Khoá bằng mã phụ huynh" gate — re-locks every time Parent
  // Area is left, so a device-level PIN actually has to be re-entered each
  // visit rather than just once per app launch.
  const [parentAreaUnlocked, setParentAreaUnlocked] = useState(false);
  // phase === "offline"'s "Thử lại" button — see checkStoredSession().
  const [retryingSession, setRetryingSession] = useState(false);

  /**
   * App-level navigation history. Screens used to hard-code their Back
   * destination, which made a page opened from Home return to More (and vice
   * versa). Every forward navigation now records its origin; Back pops that
   * exact origin. Authentication/profile changes use resetNavigation because
   * history from a previous session must never leak into the next one.
   */
  function navigateTo(next: Screen) {
    if (next === screen) return;
    screenHistory.current = [...screenHistory.current, screen].slice(-40);
    setScreen(next);
  }

  function goBack(fallback: Screen = "home") {
    const previous = screenHistory.current.pop();
    setScreen(previous ?? fallback);
  }

  function resetNavigation(next: Screen = "home") {
    screenHistory.current = [];
    setScreen(next);
  }

  function celebrateEvolution(previousLevel: number | undefined, nextStats: PetStatsState | null) {
    if (!nextStats || previousLevel === undefined || nextStats.level <= previousLevel) return;
    const milestone = [30, 20, 10, 2].find((level) => previousLevel < level && nextStats.level >= level);
    if (!milestone) return;
    setEvolution({ petId: nextStats.petKey, petName: nextStats.petKey[0]!.toUpperCase() + nextStats.petKey.slice(1), fromLevel: previousLevel, toLevel: nextStats.level });
  }

  // The account's saved language preference always wins once known — this
  // may flip the interface language shortly after boot if it differs from
  // whatever this device last had cached (see LanguageProvider). `null`
  // means the account hasn't picked yet (see afterAuth's "pickLanguage"
  // phase below) — leave whatever LanguageProvider cached locally alone
  // until LanguagePicker itself calls setLang().
  useEffect(() => {
    if (parent?.language) setLang(parent.language);
  }, [parent, setLang]);

  // Extracted so the "offline" screen's "Thử lại" button can re-run the
  // exact same check once the network is back, without duplicating it.
  async function checkStoredSession() {
    if (!tokenStorage.getAccess()) {
      setPhase("login");
      return;
    }
    try {
      const { parent } = await api.me();
      await afterAuth(parent);
    } catch (err) {
      // A real ApiError here means the SERVER looked at the token and said
      // no (expired/revoked) — that session is genuinely gone, back to
      // login. Anything else (fetch itself failing — no network, DNS,
      // timeout) never even reached the server, so the stored session is
      // still perfectly valid; the old code cleared it unconditionally,
      // which is exactly what silently logged a parent out just because
      // they opened the app with no signal, with no way to log back in
      // until the network returned either. Keep the tokens and show a
      // retry screen instead.
      if (err instanceof ApiError) {
        tokenStorage.clear();
        setPhase("login");
      } else {
        setPhase("offline");
      }
    }
  }

  useEffect(() => {
    void checkStoredSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the real lesson content (admin-managed World → Lesson → Question,
  // plus any lessons the parent authored themselves via "Nội dung của tôi")
  // the first time the lesson screen is opened for the currently selected
  // zone. Falls back to the "forest" world's lesson when the selected zone
  // doesn't have any lessons authored yet. When a zone has more than one
  // lesson, this stops short and lets the "lesson" case below render a
  // picker instead of guessing which one to play.
  useEffect(() => {
    if (screen !== "lesson" || lessonQuestions !== null) return;
    (async () => {
      try {
        const { worlds } = await api.listWorlds();
        const world = worlds.find((w) => w.key === lessonWorldKey) ?? worlds[0];
        if (!world) return;

        let { lessons } = await api.listLessons(world.id);
        if (lessons.length === 0 && world.key !== "forest") {
          const forest = worlds.find((w) => w.key === "forest");
          if (forest) ({ lessons } = await api.listLessons(forest.id));
        }
        if (lessons.length === 0) return;

        let lesson = lessons[0]!;
        if (lessons.length > 1) {
          const picked = pickedLessonId ? lessons.find((l) => l.id === pickedLessonId) : null;
          if (picked) {
            lesson = picked;
          } else {
            setLessonChoices(lessons);
            return; // wait for the picker below to set pickedLessonId
          }
        }

        const { questions } = await api.listQuestions(lesson.id);
        setCurrentLessonLabel(`${world.name} · ${lesson.title}`);
        setLessonQuestions(questions.map((q) => ({ prompt: q.prompt, hint: q.hint, answer: q.answer, options: q.options })));
      } catch (err) {
        console.warn("Failed to load lesson content:", err);
      }
    })();
  }, [screen, lessonQuestions, pickedLessonId, lessonWorldKey]);

  // "Nhiệm vụ hôm nay" — also powers the compact progress card on Home.
  // It is fetched fresh when either screen is entered so progress made
  // elsewhere (a lesson, a mini-game, caring for a pet) always shows up
  // to date rather than a stale snapshot from the last visit.
  useEffect(() => {
    if ((screen !== "home" && screen !== "questStreak") || !child || dailyQuests !== null) return;
    api
      .listQuests(child.id)
      .then(({ quests }) => setDailyQuests(quests))
      .catch((err) => console.warn("Failed to load quests:", err));
  }, [screen, child, dailyQuests]);

  async function afterAuth(parent: Parent) {
    setParent(parent);
    if (parent.language === null) {
      setPhase("pickLanguage");
      return;
    }
    await proceedPastLanguage();
  }

  // Split out of afterAuth so LanguagePicker's onDone can resume the exact
  // same createChild-vs-onboarding-vs-home decision afterAuth would have
  // made, once the account actually has a language on file.
  async function proceedPastLanguage() {
    const { children } = await api.listChildren();
    if (children.length === 0) {
      setPhase("createChild");
      return;
    }
    await selectChild(children[0]!);
  }

  async function selectChild(child: Child) {
    setChild(child);
    // Starter coins/pets/worlds are seeded server-side now, at the moment
    // createChild() creates the Progress row — see child.service.ts for why
    // (a client-side PUT /progress used to do this and had the side effect
    // of starting the streak counter from account creation, not real use).
    const { progress } = await api.getProgress(child.id);
    setProgress(progress);
    setHomeCustomization(loadHomeCustomization(child.id));
    api.listInventory(child.id).then(({ items }) => setInventory(items)).catch((err) => console.warn("Failed to load inventory:", err));
    api.listFoodShop(child.id).then(({ items }) => setFoodShop(items)).catch((err) => console.warn("Failed to load food shop:", err));
    api.listPackages(child.id).then(({ packages }) => setPackages(packages)).catch((err) => console.warn("Failed to load shop packages:", err));
    api.listHomeBackgroundShop(child.id).then(({ items }) => setHomeBackgroundShop(items)).catch((err) => console.warn("Failed to load background shop:", err));
    resetNavigation("home");
    setPhase(localStorage.getItem(ONBOARDED_KEY) ? "ready" : "onboarding");
  }

  // Re-fetch this pet's hunger/happiness/health whenever the active
  // companion changes (including on first load).
  useEffect(() => {
    if (!child || !progress) return;
    const petKey = progress.activePetId ?? progress.unlockedPets[0];
    if (!petKey) return;
    api
      .getPetStats(child.id, petKey)
      .then(({ petStats }) => setPetStats(petStats))
      .catch((err) => console.warn("Failed to load pet stats:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child?.id, progress?.activePetId]);

  const unlockedPetsKey = progress?.unlockedPets.join("|") ?? "";
  useEffect(() => {
    if (!child || !progress) return;
    Promise.all(progress.unlockedPets.map((petKey) => api.getPetStats(child.id, petKey)))
      .then((rows) => setPetStatsById(Object.fromEntries(rows.map(({ petStats }) => [petStats.petKey, petStats]))))
      .catch((err) => console.warn("Failed to load pet evolution states:", err));
    // Only reload the full collection when ownership changes. Depending on
    // the whole progress object caused 20+ requests after every coin, gem or
    // active-pet update and was the main source of request bursts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child?.id, unlockedPetsKey]);

  function updateProgress(updater: (p: ProgressState) => ProgressState) {
    if (!progress || !child) return;
    const next = updater(progress);
    setProgress(next);
    api
      .putProgress(child.id, {
        coins: next.coins,
        gems: next.gems,
        unlockedPets: next.unlockedPets,
        unlockedWorlds: next.unlockedWorlds,
        activePetId: next.activePetId,
        lastActiveDate: new Date().toISOString(),
        localVersion: next.localVersion,
      })
      .then(({ progress: synced }) => setProgress(synced))
      .catch((err) => console.warn("Progress sync failed (will keep local state):", err));
  }

  // A fight room's coin reward is credited server-side the moment the match
  // ends (see backend's liveRoomManager.ts) — pulling straight from the
  // server here avoids any merge ambiguity with updateProgress's local-first
  // "coins only grow" logic, since the server has already applied the exact win.
  function refreshProgress() {
    if (!child) return;
    api
      .getProgress(child.id)
      .then(({ progress }) => setProgress(progress))
      .catch((err) => console.warn("Failed to refresh progress after a fight:", err));
  }

  // "Điểm danh" — server-authoritative, unlike updateProgress() above: the
  // coin reward is minted by the backend (see checkIn() in
  // progress.service.ts), not merged from an optimistic local update.
  async function handleCheckIn(): Promise<CheckInResult> {
    if (!child) throw new Error("Chưa chọn hồ sơ trẻ.");
    const result = await api.checkIn(child.id);
    setProgress(result.progress);
    return result;
  }

  async function selectActivePet(id: string) {
    if (!child) throw new Error("Chưa chọn hồ sơ trẻ.");
    // Keep the selected pet and its stats in the same UI commit. Previously
    // activePetId changed first, leaving the new portrait temporarily paired
    // with the previous pet's level/hunger values.
    const [result, statsResult] = await Promise.all([
      api.selectActivePet(child.id, id),
      api.getPetStats(child.id, id),
    ]);
    setProgress(result.progress);
    setPetStats(statsResult.petStats);
    setPetStatsById((stats) => ({ ...stats, [id]: statsResult.petStats }));
    return result.progress;
  }

  // Feeding/bathing/playing/sleeping/petting a companion — deltas + coin
  // costs are decided server-side (see careForPet() in petStats.service.ts)
  // so they're identical to what PetCare.tsx used to fake locally, just persisted.
  async function handleCareAction(action: CareAction): Promise<CareResult> {
    if (!child || !progress) throw new Error("Chưa chọn hồ sơ trẻ.");
    const petKey = progress.activePetId ?? progress.unlockedPets[0];
    if (!petKey) throw new Error("Chưa có pet nào.");
    const previousLevel = petStats?.level;
    const result = await api.careForPet(child.id, petKey, action);
    setPetStats(result.petStats);
    setPetStatsById((stats) => ({ ...stats, [result.petStats.petKey]: result.petStats }));
    if (action === "feed") {
      const inferredPreviousLevel = Math.min(result.petStats.level, Math.floor(Math.max(0, result.petStats.experience - 10) / 100) + 1);
      celebrateEvolution(previousLevel ?? inferredPreviousLevel, result.petStats);
    }
    setProgress(result.progress);
    // Every care action bumps the "Chăm pet" quest server-side (see
    // careForPet()) — invalidate the cached quest list so Home's quest card
    // shows the real progress next time, instead of only refreshing when Pet
    // Care was reached BY TAPPING that exact quest card (handleOpenQuest()'s
    // setDailyQuests(null) doesn't cover every other way to reach Pet Care —
    // the Home shortcut, More menu, etc.).
    setDailyQuests(null);
    return result;
  }

  // Dùng 1 vật phẩm trong Kho đồ — trừ số lượng + áp effect (hunger/happiness/
  // health lên pet đang active, hoặc cộng thẳng coin) đều tính ở backend.
  async function handleUseItem(itemId: string): Promise<UseItemResult> {
    if (!child) throw new Error("Chưa chọn hồ sơ trẻ.");
    const previousLevel = petStats?.level;
    const itemXp = inventory?.find((entry) => entry.item.id === itemId)?.item.effects.find((effect) => effect.stat === "experience")?.delta ?? 0;
    const result = await api.useItem(child.id, itemId);
    setInventory((inv) => (inv ? inv.map((e) => (e.item.id === itemId ? { ...e, quantity: result.quantity } : e)).filter((e) => e.quantity > 0) : inv));
    setProgress(result.progress);
    if (result.petStats) {
      setPetStats(result.petStats);
      setPetStatsById((stats) => ({ ...stats, [result.petStats!.petKey]: result.petStats! }));
      const inferredPreviousLevel = Math.min(result.petStats.level, Math.floor(Math.max(0, result.petStats.experience - itemXp) / 100) + 1);
      celebrateEvolution(previousLevel ?? inferredPreviousLevel, result.petStats);
    }
    return result;
  }

  async function handleRenamePet(itemId: string, name: string): Promise<UseItemResult> {
    if (!child) throw new Error("Chưa chọn hồ sơ trẻ.");
    const result = await api.renamePet(child.id, itemId, name);
    setInventory((inv) => (inv ? inv.map((e) => (e.item.id === itemId ? { ...e, quantity: result.quantity } : e)).filter((e) => e.quantity > 0) : inv));
    if (result.petStats) {
      setPetStats(result.petStats);
      setPetStatsById((stats) => ({ ...stats, [result.petStats!.petKey]: result.petStats! }));
    }
    return result;
  }

  async function handlePurchaseItem(itemId: string) {
    if (!child) throw new Error("Chưa chọn hồ sơ trẻ.");
    const result = await api.purchaseItem(child.id, itemId);
    setProgress(result.progress);
    const { items } = await api.listInventory(child.id);
    setInventory(items);
    setFoodShop((shop) => shop?.map((entry) => entry.item.id === itemId ? { ...entry, quantity: result.quantity } : entry) ?? null);
    return result;
  }

  async function handlePurchasePackage(packageId: string) {
    if (!child) throw new Error("Chưa chọn hồ sơ trẻ.");
    const result = await api.purchasePackage(child.id, packageId);
    setProgress(result.progress);
    setPackages((list) => list?.map((p) => (p.id === packageId ? result.package : p)) ?? null);
    // A combo package can grant catalog items (contents may include `kind:
    // "item"`) — reload inventory the same way handlePurchaseItem() does so
    // Bag/Pet Care reflect it immediately instead of on next screen change.
    const { items } = await api.listInventory(child.id);
    setInventory(items);
    return result;
  }

  async function handleActivityComplete(activity: RewardableActivity) {
    if (!child) return;
    // Fire-and-forget from every game's onComplete (none of them await this),
    // so a failed request here would otherwise be a silent unhandled
    // rejection — the child would see the "you won!" screen with no coins
    // ever landing and no trace of why. Matches the try/warn-and-continue
    // pattern already used for the other fire-and-forget calls in this file
    // (lesson quest bump, notification report, etc.).
    try {
      const result = await api.rewardActivity(child.id, activity);
      setProgress(result.progress);
      if (result.petStats) {
        setPetStats(result.petStats);
        setPetStatsById((stats) => ({ ...stats, [result.petStats!.petKey]: result.petStats! }));
      }
      setDailyQuests(null);
    } catch (err) {
      console.warn(`Failed to reward activity "${activity}":`, err);
    }
  }

  function handleChangeHomeCustomization(value: HomeCustomization) {
    setHomeCustomization(value);
    if (child) saveHomeCustomization(child.id, value);
  }

  async function handlePurchaseBackground(entry: InventoryEntry) {
    if (!child) throw new Error("Chưa chọn hồ sơ trẻ.");
    const result = await api.purchaseItem(child.id, entry.item.id);
    setProgress(result.progress);
    const [{ items: inventoryItems }, { items: backgroundItems }] = await Promise.all([
      api.listInventory(child.id),
      api.listHomeBackgroundShop(child.id),
    ]);
    setInventory(inventoryItems);
    setHomeBackgroundShop(backgroundItems);
  }

  async function handleClaimQuest(questId: string): Promise<ClaimQuestResult> {
    if (!child) throw new Error("Chưa chọn hồ sơ trẻ.");
    const result = await api.claimQuest(child.id, questId);
    setProgress(result.progress);
    setDailyQuests((qs) => (qs ? qs.map((q) => (q.id === questId ? result.quest : q)) : qs));
    return result;
  }

  function handleOpenQuest(trackKind: QuestTrackKind) {
    setDailyQuests(null); // refetch fresh progress next time "Nhiệm vụ hôm nay" is opened
    if (trackKind === "lessons") navigateTo("lesson");
    else if (trackKind === "miniGame") navigateTo("miniGame");
    else navigateTo("petCare");
  }

  function handleLogout() {
    tokenStorage.clear();
    setParent(null);
    setChild(null);
    setProgress(null);
    setInventory(null);
    setPetStats(null);
    resetNavigation("home");
    setPhase("login");
  }

  // Settings.tsx's "Xoá toàn bộ dữ liệu" — the account is gone the instant
  // this resolves, so there's nothing left to do but the same client-side
  // reset handleLogout() already does.
  async function handleDeleteAccount(confirmEmail: string) {
    await api.deleteAccount(confirmEmail);
    handleLogout();
  }

  // Settings.tsx's "Cho phép bảng xếp hạng" — see leaderboard.service.ts for
  // where the server actually enforces this.
  async function handleToggleRankVisibility(hidden: boolean) {
    if (!child) throw new Error("Chưa chọn hồ sơ trẻ.");
    const result = await api.setRankVisibility(child.id, hidden);
    setProgress(result.progress);
    return result.progress;
  }

  function handleNavigate(tab: NavTab) {
    const map: Record<NavTab, Screen> = { Home: "home", Game: "gameHub", Pets: "petCare", Bag: "bag", Shop: "shop", More: "more" };
    if (tab === "Home") setDailyQuests(null);
    navigateTo(map[tab]);
  }

  if (phase === "boot") {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[#1a1714]">
        <span className="font-baloo text-3xl font-extrabold text-white/80">
          Pet<span className="text-brand-orange">lin</span>
          <span className="text-brand-teal">go</span>
        </span>
      </div>
    );
  }

  if (phase === "login") {
    return (
      <ScreenFrame>
        <Login onAuthenticated={afterAuth} />
      </ScreenFrame>
    );
  }

  // A stored session exists but the last check couldn't reach the server at
  // all (no signal, DNS, timeout) — see checkStoredSession(). Deliberately
  // NOT the login screen: the parent is still logged in as far as their
  // device is concerned, they just can't be verified online right now, so
  // forcing a fresh email/password entry here would be both wrong and
  // useless (that needs network too). Same visual language as
  // SystemStates.tsx's "offline" demo card.
  if (phase === "offline") {
    return (
      <ScreenFrame>
        <div className="grid h-full place-items-center bg-cream p-6.5">
          <div className="animate-pop flex w-[560px] max-w-full flex-col items-center gap-4.5 rounded-[30px] border-4 p-9" style={{ background: "#F1F4F7", borderColor: "#D6E1EA", boxShadow: "0 8px 0 #CBD8E3" }}>
            <div className="relative grid h-[160px] w-[180px] place-items-center">
              <span className="absolute bottom-3.5 h-8.5 w-[140px] rounded-[50%] bg-black/[.12]" />
              <img src="/pets/buddy.png" alt="" className="animate-bob h-[160px] w-[160px] object-contain object-bottom" style={{ filter: "grayscale(.35)" }} />
              <span className="absolute right-0 top-1.5 grid h-13 w-13 place-items-center rounded-full font-baloo text-2xl font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,.16)]" style={{ background: "#5C7BC9" }}>
                !
              </span>
            </div>
            <div className="text-center font-baloo text-[28px] font-extrabold" style={{ color: "#4A6B85" }}>
              {t("Mất mạng rồi!")}
            </div>
            <div className="max-w-[420px] text-center font-baloo text-base font-semibold leading-relaxed text-[#6E6047]">
              {t("Vẫn đang đăng nhập bình thường — chỉ cần có mạng lại để tiếp tục.")}
            </div>
            <button
              disabled={retryingSession}
              onClick={async () => {
                setRetryingSession(true);
                await checkStoredSession();
                setRetryingSession(false);
              }}
              className="rounded-2xl px-9 py-3.5 font-baloo text-lg font-extrabold text-white transition-transform active:translate-y-1 disabled:opacity-70"
              style={{ background: "#5C7BC9", boxShadow: "0 5px 0 #43609F" }}
            >
              {retryingSession ? t("Đang thử lại…") : t("Thử lại")}
            </button>
            <button onClick={handleLogout} className="font-baloo text-sm font-bold text-[#8A7A62] underline">
              {t("Đăng xuất")}
            </button>
          </div>
        </div>
      </ScreenFrame>
    );
  }

  if (phase === "pickLanguage") {
    return (
      <ScreenFrame>
        <LanguagePicker
          onDone={(lang) => {
            setParent((p) => (p ? { ...p, language: lang } : p));
            proceedPastLanguage();
          }}
        />
      </ScreenFrame>
    );
  }

  if (phase === "createChild") {
    return (
      <ScreenFrame>
        <CreateChild onCreated={selectChild} />
      </ScreenFrame>
    );
  }

  if (phase === "onboarding") {
    return (
      <ScreenFrame>
        <Onboarding
          onDone={() => {
            localStorage.setItem(ONBOARDED_KEY, "1");
            setPhase("ready");
          }}
        />
      </ScreenFrame>
    );
  }

  if (!progress || !child || !parent) return null; // unreachable once phase === "ready"

  const owned = progress.unlockedPets;
  const petIds = owned.length > 0 ? owned : ["buddy"];
  const petNames = petIds.map((id) => petStatsById[id]?.customName || (id[0]!.toUpperCase() + id.slice(1)));
  const activePetId = progress.activePetId && petIds.includes(progress.activePetId) ? progress.activePetId : petIds[0]!;
  const activePetIndex = Math.max(0, petIds.indexOf(activePetId));
  const activePetName = petNames[activePetIndex]!;

  // Buying an owned species adds another real copy for pet fusion.
  async function buyPet(id: string, _currency: "coin" | "gem", _price: number) {
    if (!child) throw new Error("Chưa chọn hồ sơ trẻ.");
    // Price/currency come from the backend catalog. Never trust the values
    // rendered by the client when spending a child's balance.
    const result = await api.purchasePet(child.id, id);
    setProgress(result.progress);
    return result;
  }

  // "Phối pet" — server picks/consumes everything (see petFusion.service.ts),
  // this just applies the resulting progress and hands the full result back
  // for PetCollection.tsx to show what was rolled.
  async function fusePets(rarity: FusableRarity, materials: import("./lib/api").FusionMaterial[]) {
    if (!child) throw new Error("Chưa chọn hồ sơ trẻ.");
    const result = await api.fusePets(child.id, rarity, materials);
    setProgress(result.progress);
    return result;
  }

  const page = (() => {
    switch (screen) {
      case "home":
        return (
          <Home
            childName={child.displayName}
            level={8}
            hp={80}
            maxHp={100}
            coins={progress.coins}
            gems={progress.gems}
            petId={activePetId}
            petName={activePetName}
            petStats={petStats}
            quests={dailyQuests}
            onNavigate={handleNavigate}
            onPlayLesson={() => navigateTo("worldLessons")}
            onOpenDailyQuest={() => navigateTo("questStreak")}
            onOpenBattlePass={() => navigateTo("battlePass")}
            onOpenSettings={() => navigateTo("settings")}
            customization={homeCustomization}
            backgroundShop={homeBackgroundShop}
            ownedBackgroundKeys={new Set((inventory ?? []).filter((entry) => entry.item.key.startsWith("background-") && entry.quantity > 0).map((entry) => entry.item.key))}
            onChangeCustomization={handleChangeHomeCustomization}
            onPurchaseBackground={handlePurchaseBackground}
          />
        );

      case "lesson":
        if (lessonQuestions) {
          return (
            <Lesson
              questions={lessonQuestions}
              isPremium={parent.isPremium}
              topicLabel={currentLessonLabel}
              onExit={() => {
                setLessonQuestions(null);
                setLessonChoices(null);
                setPickedLessonId(null);
                setCurrentLessonLabel("");
                setDailyQuests(null);
                goBack("home");
              }}
              onComplete={(result) => {
                rememberLearnedWords(result.learnedWords);
                updateProgress((p) => ({ ...p, coins: p.coins + result.coinsEarned }));
                if (child) api.bumpQuestProgress(child.id, "lessons", 1).catch((err) => console.warn("Failed to bump lesson quest progress:", err));
                if (child) api.rewardLessonExperience(child.id, activePetId).then(({ petStats }) => setPetStats(petStats)).catch((err) => console.warn("Failed to reward pet experience:", err));
                // The one client-reported notification kind — see
                // notification.routes.ts's doc comment on why that's fine
                // here specifically (lesson results are already trusted from
                // the client everywhere else in this app).
                if (child) {
                  const title = `${child.displayName} vừa xong bài học`;
                  const body = `${currentLessonLabel || t("Bài học")} · ${result.correct}/${result.total} câu đúng, +${result.coinsEarned} coin.`;
                  api.reportLessonComplete(child.id, title, body).catch((err) => console.warn("Failed to report lesson-complete notification:", err));
                }
              }}
              onGoShop={() => navigateTo("shop")}
            />
          );
        }
        if (lessonChoices) {
          return (
            <LessonPicker
              lessons={lessonChoices}
              worldKey={lessonWorldKey}
              onPick={(id) => {
                setPickedLessonId(id);
                setLessonChoices(null);
              }}
              onExit={() => {
                setLessonChoices(null);
                setPickedLessonId(null);
                goBack("gameHub");
              }}
            />
          );
        }
        return <div className="grid h-full place-items-center bg-cream font-baloo text-lg font-bold text-ink/50">{t("Đang tải bài học…")}</div>;

      case "shop":
        return (
          <Shop
            coins={progress.coins}
            gems={progress.gems}
            owned={owned}
            petCopies={progress.petCopies}
            petEggs={progress.petEggs}
            petStatsById={petStatsById}
            activePetId={activePetId}
            shopItems={foodShop}
            packages={packages}
            onExit={() => goBack("home")}
            onBuy={buyPet}
            onFuse={fusePets}
            onSelectActive={selectActivePet}
            onPurchaseItem={handlePurchaseItem}
            onPurchasePackage={handlePurchasePackage}
          />
        );

      case "gameHub":
        return <GameHub onNavigate={handleNavigate} onOpen={navigateTo} />;

      case "worldLessons":
        return (
          <WorldLessons
            onSelectWorld={(worldKey) => {
              setLessonWorldKey(worldKey);
              setLessonQuestions(null);
              setLessonChoices(null);
              setPickedLessonId(null);
              navigateTo("lesson");
            }}
            onExit={() => goBack("gameHub")}
          />
        );

      case "miniGame":
        return (
          <MiniGame
            // All playable activities now live under the Game tab. Back must
            // return to that hub instead of the legacy More destination.
            onExit={() => goBack("gameHub")}
            onWin={() => handleActivityComplete("memoryMatch")}
          />
        );

      case "parentArea":
        if (isParentPinEnabled() && !parentAreaUnlocked) {
          return (
            <ParentPinPrompt
              mode="verify"
              title={t("Nhập mã PIN phụ huynh")}
              onCancel={() => goBack("more")}
              onVerified={() => setParentAreaUnlocked(true)}
              onSet={() => {}}
            />
          );
        }
        return (
          <ParentArea
            childName={child.displayName}
            level={8}
            onExit={() => {
              setParentAreaUnlocked(false);
              goBack("more");
            }}
          />
        );

      case "petCare":
        return (
          <PetCare
            coins={progress.coins}
            gems={progress.gems}
            petIds={petIds}
            petNames={petNames}
            petEggs={progress.petEggs}
            selectedPet={activePetIndex}
            onSelectPet={(i) => selectActivePet(petIds[i]!)}
            petStats={petStats}
            petStatsById={petStatsById}
            inventory={inventory}
            shopItems={foodShop}
            onPurchaseItem={handlePurchaseItem}
            onCareAction={handleCareAction}
            onUseItem={handleUseItem}
            onOpenRanch={() => navigateTo("petRanch")}
            onExit={() => goBack("home")}
          />
        );

      case "topics":
        return (
          <Topics
            childId={child.id}
            onStartReview={(words) => {
              setReviewWords(words);
              navigateTo("srsCard");
            }}
            onExit={() => goBack("gameHub")}
          />
        );

      case "srsCard":
        return <SrsCard words={reviewWords} onExit={() => goBack("topics")} />;

      case "bag":
        return <Bag coins={progress.coins} gems={progress.gems} inventory={inventory} onUseItem={handleUseItem} onRenamePet={handleRenamePet} onExit={() => goBack("home")} />;

      case "profile":
        return (
          <Profile
            childName={child.displayName}
            level={8}
            coins={progress.coins}
            gems={progress.gems}
            streak={progress.streakDays}
            ownedPets={owned}
            activePetId={activePetId}
            activePetName={activePetName}
            petStatsById={petStatsById}
            onOpenCollection={() => navigateTo("petCollection")}
            onExit={() => goBack("more")}
          />
        );

      case "premium":
        return <Premium childId={child.id} isPremium={parent.isPremium} onUpgraded={setParent} onExit={() => goBack("more")} />;

      case "battlePass":
        return <BattlePass childId={child.id} coins={progress.coins} gems={progress.gems} onRefreshProgress={refreshProgress} onExit={() => goBack("home")} />;

      case "notifications":
        return <Notifications childId={child.id} onExit={() => goBack("more")} />;

      case "wordCatch":
        return <WordCatch onExit={() => goBack("gameHub")} onComplete={() => handleActivityComplete("wordCatch")} />;

      case "flappyDragon":
        return <FlappyDragon childId={child.id} onExit={() => goBack("gameHub")} onReward={(score) => api.rewardFlappyDragon(child.id, score).then(({ progress }) => setProgress(progress))} />;

      case "englishShop":
        return <EnglishShop onExit={() => goBack("gameHub")} onComplete={() => handleActivityComplete("englishShop")} />;

      case "englishHome":
        return <EnglishHome onExit={() => goBack("gameHub")} onComplete={() => handleActivityComplete("englishHome")} />;

      case "wordRpg":
        return <WordRpg child={child} onExit={() => goBack("gameHub")} />;

      case "wordTrain":
        return <WordTrain onExit={() => goBack("gameHub")} onComplete={() => handleActivityComplete("wordTrain")} />;

      case "englishDetective":
        return <EnglishDetective onExit={() => goBack("gameHub")} onComplete={() => handleActivityComplete("englishDetective")} />;

      case "echoParrot":
        return <EchoParrot onExit={() => goBack("gameHub")} onComplete={() => handleActivityComplete("echoParrot")} />;

      case "chatBuddy":
        return <ChatBuddy onExit={() => goBack("gameHub")} onComplete={() => handleActivityComplete("chatBuddy")} />;

      case "systemStates":
        return <SystemStates onExit={() => goBack("more")} />;

      case "rank":
        return <Rank child={child} onExit={() => goBack("more")} onStudyMore={() => navigateTo("lesson")} />;

      case "questStreak":
        return (
          <QuestStreak
            streak={progress.streakDays}
            coins={progress.coins}
            checkedInToday={!!progress.lastCheckinDate && isSameCalendarDay(new Date(progress.lastCheckinDate), new Date())}
            activeToday={!!progress.lastActiveDate && isSameCalendarDay(new Date(progress.lastActiveDate), new Date())}
            onCheckIn={handleCheckIn}
            quests={dailyQuests}
            onClaimQuest={handleClaimQuest}
            onOpenQuest={handleOpenQuest}
            onExit={() => {
              setDailyQuests(null);
              goBack("more");
            }}
          />
        );

      case "story":
        return <Story onExit={() => goBack("more")} onComplete={() => handleActivityComplete("story")} />;

      case "myContent":
        return <MyContent childId={child.id} onExit={() => goBack("more")} onOpenPremium={() => navigateTo("premium")} />;

      case "dictionary":
        return <Dictionary childId={child.id} onExit={() => goBack("more")} />;

      case "fightRoom":
        return <FightRoom child={child} onExit={() => goBack("gameHub")} onRefreshProgress={refreshProgress} />;

      case "settings":
        return (
          <Settings
            parentEmail={parent.email}
            hiddenFromRank={progress.hiddenFromRank}
            onToggleRankVisibility={handleToggleRankVisibility}
            onDeleteAccount={handleDeleteAccount}
            onLogout={handleLogout}
            onExit={() => goBack("more")}
          />
        );

      case "petCollection":
        return (
          <PetCollection
            coins={progress.coins}
            gems={progress.gems}
            owned={owned}
            petCopies={progress.petCopies}
            petEggs={progress.petEggs}
            activePetId={activePetId}
            petStatsById={petStatsById}
            onExit={() => goBack("home")}
            onBuy={buyPet}
            onSelectActive={selectActivePet}
            onFuse={fusePets}
          />
        );

      case "petRanch":
        return <PetRanch owned={owned} petCopies={progress.petCopies} petStatsById={petStatsById} activePetId={activePetId} onSelectActive={selectActivePet} onExit={() => goBack("petCare")} />;

      case "more":
        return <More onNavigate={handleNavigate} onOpen={navigateTo} />;

      default:
        return null;
    }
  })();

  return (
    <ScreenFrame>
      <div className="relative h-full w-full overflow-hidden">
        {page}
        {evolution && <PetEvolutionCelebration {...evolution} onClose={() => setEvolution(null)} />}
      </div>
    </ScreenFrame>
  );
}
