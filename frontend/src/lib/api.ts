import { tokenStorage } from "./tokenStorage";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface Parent {
  id: string;
  email: string;
  phone: string | null;
  role: "PARENT" | "ADMIN";
  /** null = chưa từng chọn ngôn ngữ — App.tsx dùng để hiện LanguagePicker lần đầu vào app. */
  language: "vi" | "en" | "ja" | "ko" | null;
  isPremium: boolean;
}

/** "Nội dung của tôi" free-tier limits — see backend's premium.service.ts. */
export interface MyContentQuota {
  isPremium: boolean;
  limit: number;
  counts: {
    lesson: number;
    story: number;
    miniGameTopic: number;
    wordCatchTopic: number;
    shopTopic: number;
    homeTopic: number;
    rpgTopic: number;
    wordTrainTopic: number;
    detectiveCase: number;
    echoParrotTopic: number;
    chatBuddyTopic: number;
  };
}

export interface Child {
  id: string;
  parentId: string;
  displayName: string;
  avatarId: string;
  birthYear: number | null;
  createdAt: string;
}

export interface ProgressState {
  coins: number;
  gems: number;
  unlockedPets: string[];
  petCopies: Record<string, number>;
  petEggs: Record<string, number>;
  unlockedWorlds: string[];
  activePetId: string | null;
  streakDays: number;
  lastActiveDate: string | null;
  lastCheckinDate: string | null;
  lastLegendaryGrantAt: string | null;
  /** "Phối pet" fusion material — see backend's petFusion.service.ts. */
  commonShards: number;
  rareShards: number;
  epicShards: number;
  /** Settings.tsx's "Cho phép bảng xếp hạng" — see backend's leaderboard.service.ts. */
  hiddenFromRank: boolean;
  localVersion: number;
}

export interface CheckInResult {
  progress: ProgressState;
  reward: number;
  alreadyCheckedIn: boolean;
}

export type FusableRarity = "Common" | "Rare" | "Epic";
export type FusionMaterial = { petKey: string; source: "primary" | "egg" };
export interface FusePetsResult {
  progress: ProgressState;
  outputRarity: "Rare" | "Epic" | "Legendary";
  petKey: string;
  isNewPet: boolean;
  shardsGranted: number;
  coinsGranted: number;
}

export interface PurchasePetResult {
  progress: ProgressState;
  /** True when the child already owned this pet — the purchase converted
   * into fusion material instead of unlocking anything new, see
   * progress.service.ts's purchasePet doc comment. */
  isDuplicate: boolean;
  rarity: string;
  shardsGranted: number;
  coinsGranted: number;
  quantity: number;
}

export interface ClaimLegendaryResult {
  progress: ProgressState;
  grantedPetKeys: string[];
  alreadyClaimed: boolean;
}

export type ItemEffect = { stat: "hunger" | "happiness" | "health" | "coins" | "experience" | "resetLevel" | "renamePet" | "renameUser"; delta: number };
export interface InventoryItem {
  id: string;
  key: string;
  name: string;
  category: "food" | "toy" | "accessory" | "special";
  color: string;
  radius: string;
  description: string;
  effects: ItemEffect[];
  price: number;
  currency: "coin" | "gem";
  imagePath: string;
}
export interface InventoryEntry {
  item: InventoryItem;
  quantity: number;
}
export interface UseItemResult {
  quantity: number;
  progress: ProgressState;
  petStats: PetStatsState | null;
  message: string;
}
export interface RenameProfileResult { quantity: number; child: Child; message: string }

export interface PetStatsState {
  petKey: string;
  customName: string | null;
  hunger: number;
  happiness: number;
  health: number;
  experience: number;
  level: number;
  experienceToNextLevel: number;
}
export interface FriendSummary {
  friendshipId: string;
  status: "pending" | "accepted";
  direction: "sent" | "received";
  friend: { id: string; displayName: string; avatarId: string };
}
export interface FriendRanchSnapshot {
  owner: { id: string; displayName: string; avatarId: string };
  progress: ProgressState;
  petStats: Array<{ petKey: string; customName: string | null; hunger: number; happiness: number; health: number; experience: number; level: number }>;
}
export interface GiftMail { id: string; direction: "sent" | "received"; sender: { id: string; displayName: string }; receiver: { id: string; displayName: string }; item: { id: string; name: string; imagePath: string }; quantity: number; createdAt: string; readAt: string | null }
export type CareAction = "feed" | "bathe" | "play" | "sleep" | "pat";
export type RewardableActivity = "memoryMatch" | "wordCatch" | "englishShop" | "englishHome" | "wordTrain" | "englishDetective" | "echoParrot" | "chatBuddy" | "story";
export interface ActivityRewardResult { progress: ProgressState; petStats: PetStatsState | null; rewardCoins: number; rewardXp: number }
export interface CareResult {
  petStats: PetStatsState;
  progress: ProgressState;
  message: string;
}

export type QuestTrackKind = "lessons" | "miniGame" | "petCare";
export interface Quest {
  id: string;
  key: string;
  title: string;
  trackKind: QuestTrackKind;
  target: number;
  rewardCoins: number;
  color: string;
  progress: number;
  claimed: boolean;
}
export interface ClaimQuestResult {
  progress: ProgressState;
  quest: Quest;
}

/** Notifications.tsx's real feed — see backend's notification.service.ts. */
export type NotificationKind = "lesson" | "petUnlock" | "checkin" | "quest";
export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

/** BattlePass.tsx — see backend's battlePass.service.ts. */
export type BattlePassRewardKind = "coins" | "gems" | "commonShards" | "rareShards" | "epicShards" | "petEggCommon" | "petEggRare" | "petEggEpic" | "petEggLegendary" | "item";
export interface BattlePassTierDto {
  tier: number;
  xpRequired: number;
  freeRewardKind: BattlePassRewardKind;
  freeRewardAmount: number;
  freeRewardItemKey: string | null;
  vipRewardKind: BattlePassRewardKind;
  vipRewardAmount: number;
  vipRewardItemKey: string | null;
  freeClaimed: boolean;
  vipClaimed: boolean;
}
export interface BattlePassState {
  season: { id: string; name: string; startsAt: string; endsAt: string } | null;
  xp: number;
  hasVip: boolean;
  tiers: BattlePassTierDto[];
}
export interface ClaimBattlePassResult {
  state: BattlePassState;
  claimed: { tier: number; track: "free" | "vip" }[];
}

/** Shop.tsx "Ưu đãi" tab — see backend's packages.service.ts. Same
 * `BattlePassRewardKind` vocabulary as Battle Pass (`contents` entries). */
export type ShopPackageKind = "combo" | "firstPurchase";
export interface ShopPackageContentEntry {
  kind: BattlePassRewardKind;
  amount: number;
  itemKey: string | null;
}
export interface ShopPackageDto {
  id: string;
  key: string;
  name: string;
  description: string;
  kind: ShopPackageKind;
  color: string;
  imagePath: string;
  price: number;
  currency: "coin" | "gem";
  realPriceLabel: string;
  contents: ShopPackageContentEntry[];
  claimed: boolean;
}
export interface PurchasePackageResult {
  progress: ProgressState;
  package: ShopPackageDto;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Skip attaching the Authorization header (register/login/refresh). */
  skipAuth?: boolean;
  /** Internal: prevents infinite retry loops after a refresh attempt. */
  _isRetry?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // Only claim a JSON body when we're actually sending one — Fastify's body
  // parser rejects an empty body as invalid JSON if Content-Type says
  // otherwise, which turned every bodyless DELETE into a 400.
  const headers: Record<string, string> = options.body ? { "Content-Type": "application/json" } : {};
  if (!options.skipAuth) {
    const token = tokenStorage.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Access token expired mid-session — try one silent refresh, then retry.
  if (res.status === 401 && !options.skipAuth && !options._isRetry) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return request<T>(path, { ...options, _isRetry: true });
    }
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? res.statusText, data?.error);
  }
  return data as T;
}

export type TtsVoice = "us" | "uk";
export type TtsRate = "normal" | "slow";

/**
 * Fetches synthesised speech for `text` as a Blob. Kept separate from
 * `request()` since that helper assumes a JSON body — this one wants raw
 * audio bytes instead. Still goes through the same Bearer-token auth (the
 * backend caches per parent-visible content, not per-user, but the route is
 * still gated behind login like the rest of the catalog).
 *
 * `voice`/`rate` are the child's Settings > "Giọng đọc"/"Tốc độ đọc" pick
 * (see lib/tts.ts) — omitted, the backend falls back to its own default.
 */
async function fetchTtsAudio(text: string, voice?: TtsVoice, rate?: TtsRate): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = tokenStorage.getAccess();
  if (token) headers.Authorization = `Bearer ${token}`;

  const params = new URLSearchParams({ text });
  if (voice) params.set("voice", voice);
  if (rate) params.set("rate", rate);
  const res = await fetch(`${API_URL}/tts?${params.toString()}`, { headers });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return res.blob();
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return false;

  try {
    const { accessToken } = await request<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      skipAuth: true,
    });
    tokenStorage.setAccess(accessToken);
    return true;
  } catch (err) {
    // Only wipe the session when the SERVER actually rejected the refresh
    // token (ApiError — e.g. expired/revoked). A network-level failure (no
    // connection, DNS, timeout — anything that never got a response) throws
    // a plain error here instead, and must NOT log the parent out: that used
    // to force a full re-login the moment wifi hiccuped mid-session, even
    // though nothing was wrong with their credentials.
    if (err instanceof ApiError) tokenStorage.clear();
    return false;
  }
}

// ---- Catalog (public, kid-app-facing) -------------------------------------

export interface CatalogWorld {
  id: string;
  key: string;
  name: string;
  topic: string;
  colorTheme: string;
  requiredStars: number;
  order: number;
}
export interface CatalogLesson {
  id: string;
  title: string;
  order: number;
  /** True when this lesson was created by the logged-in parent themselves, not the system catalog. */
  isOwn: boolean;
}
export interface CatalogQuestion {
  id: string;
  prompt: string;
  hint: string;
  answer: string;
  options: string[];
}
export interface VocabTopic {
  topic: string;
  count: number;
}
export interface VocabWord {
  id: string;
  word: string;
  meaningVi: string;
}

export interface StoryListItem {
  id: string;
  key: string;
  title: string;
  topic: string;
  colorTheme: string;
  isOwn: boolean;
  _count: { pages: number };
}
export interface StoryPageData {
  id: string;
  en: string;
  vi: string;
  img1: string;
  img2: string;
  label: string;
  sceneBg: string;
  ground: string;
  words: { en: string; vi: string; color: string }[];
}
export interface StoryDetail {
  id: string;
  key: string;
  title: string;
  topic: string;
  colorTheme: string;
  pages: StoryPageData[];
}

export interface MiniGameTopicListItem {
  id: string;
  key: string;
  name: string;
  color: string;
  isOwn: boolean;
  _count: { words: number };
}
export interface MiniGameTopicDetail {
  id: string;
  key: string;
  name: string;
  color: string;
  words: { en: string; vi: string; img: string }[];
}

export interface WordCatchTopicListItem {
  id: string;
  key: string;
  name: string;
  isOwn: boolean;
  _count: { rounds: number };
}
export interface WordCatchTopicDetail {
  id: string;
  key: string;
  name: string;
  rounds: { vi: string; answer: string; options: string[] }[];
}

export interface ShopShelfItem {
  en: string;
  vi: string;
  emoji: string;
  price: number;
}
export interface ShopRequiredItem {
  en: string;
  qty: number;
}
export interface ShopTopicListItem {
  id: string;
  key: string;
  name: string;
  color: string;
  isOwn: boolean;
  _count: { rounds: number };
}
export interface ShopRoundData {
  instructionEn: string;
  instructionVi: string;
  shelf: ShopShelfItem[];
  required: ShopRequiredItem[];
}
export interface ShopTopicDetail {
  id: string;
  key: string;
  name: string;
  color: string;
  rounds: ShopRoundData[];
}

export interface HomeObjectData {
  key: string;
  en: string;
  emoji: string;
  color: string;
}
export interface HomeZoneData {
  key: string;
  label: string;
  emoji: string;
}
export interface HomeTopicListItem {
  id: string;
  key: string;
  name: string;
  color: string;
  isOwn: boolean;
  _count: { rounds: number };
}
export interface HomeRoundData {
  instructionEn: string;
  instructionVi: string;
  objects: HomeObjectData[];
  correctObjectKey: string;
  zones: HomeZoneData[];
  correctZoneKey: string;
}
export interface HomeTopicDetail {
  id: string;
  key: string;
  name: string;
  color: string;
  rounds: HomeRoundData[];
}

export interface RpgQuestionData {
  en: string;
  answer: string;
  options: string[];
}
export interface RpgTopicListItem {
  id: string;
  key: string;
  name: string;
  color: string;
  isOwn: boolean;
  _count: { monsters: number };
}
export interface RpgMonsterData {
  id: string;
  name: string;
  emoji: string;
  isBoss: boolean;
  questions: RpgQuestionData[];
}
export interface RpgTopicDetail {
  id: string;
  key: string;
  name: string;
  color: string;
  monsters: RpgMonsterData[];
}
export interface RpgLevel {
  level: number;
  minXp: number;
}
export interface RpgStatus {
  xp: number;
  level: RpgLevel;
  nextLevel: RpgLevel | null;
}
export interface DefeatMonsterResult {
  rewardCoins: number;
  rewardXp: number;
  coins: number;
  xp: number;
  level: RpgLevel;
  nextLevel: RpgLevel | null;
  leveledUp: boolean;
}

export interface WordTrainFillData {
  word: string;
  blankIndex: number;
  options: string[];
}
export interface WordTrainScrambleData {
  words: string[];
}
export interface WordTrainTopicListItem {
  id: string;
  key: string;
  name: string;
  color: string;
  isOwn: boolean;
  _count: { rounds: number };
}
export type WordTrainRoundData = { kind: "fill"; vi: string; data: WordTrainFillData } | { kind: "scramble"; vi: string; data: WordTrainScrambleData };
export interface WordTrainTopicDetail {
  id: string;
  key: string;
  name: string;
  color: string;
  rounds: WordTrainRoundData[];
}

export interface DetectiveInterrogateData {
  npcName: string;
  npcEmoji: string;
  testimony: string;
  testimonyVi: string;
  question: string;
  options: string[];
  answerIndex: number;
  clue: string;
}
export interface DetectiveAccuseData {
  suspects: string[];
  correctSuspect: string;
}
export interface DetectiveCaseListItem {
  id: string;
  key: string;
  name: string;
  scenario: string;
  scenarioVi: string;
  color: string;
  isOwn: boolean;
  _count: { rounds: number };
}
export type DetectiveRoundData = { kind: "interrogate"; vi: string; data: DetectiveInterrogateData } | { kind: "accuse"; vi: string; data: DetectiveAccuseData };
export interface DetectiveCaseDetail {
  id: string;
  key: string;
  name: string;
  scenario: string;
  scenarioVi: string;
  color: string;
  rounds: DetectiveRoundData[];
}

export interface EchoParrotRoundData {
  en: string;
  vi: string;
  phonetic: string | null;
  /** Khớp Pet.key — khi có, hiện ảnh pet đó làm hình minh hoạ (2026-08-28). */
  petKey: string | null;
}
export interface EchoParrotTopicListItem {
  id: string;
  key: string;
  name: string;
  color: string;
  isOwn: boolean;
  _count: { rounds: number };
}
export interface EchoParrotTopicDetail {
  id: string;
  key: string;
  name: string;
  color: string;
  rounds: EchoParrotRoundData[];
}

export interface ChatBuddyRoundData {
  petLine: string;
  petLineVi: string;
  options: string[];
  optionsVi: string[];
  answerIndex: number;
  replyLine: string;
  replyLineVi: string;
}
export interface ChatBuddyTopicListItem {
  id: string;
  key: string;
  name: string;
  color: string;
  isOwn: boolean;
  _count: { rounds: number };
}
export interface ChatBuddyTopicDetail {
  id: string;
  key: string;
  name: string;
  color: string;
  rounds: ChatBuddyRoundData[];
}

// ---- Admin catalog types -------------------------------------------------

export interface AdminUserSummary {
  id: string;
  email: string;
  phone: string | null;
  role: "PARENT" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  childrenCount: number;
}

export interface AdminUserDetail extends AdminUserSummary {
  children: { id: string; displayName: string; avatarId: string; birthYear: number | null; createdAt: string }[];
}

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";
export type Currency = "coin" | "gem";

export interface AdminPet {
  id: string;
  key: string;
  name: string;
  species: string;
  rarity: Rarity;
  price: number;
  currency: Currency;
  imagePath: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export type PetInput = Omit<AdminPet, "id" | "createdAt" | "updatedAt">;

export interface AdminItem {
  id: string;
  key: string;
  name: string;
  category: "food" | "toy" | "accessory" | "special";
  color: string;
  radius: string;
  description: string;
  effects: ItemEffect[];
  price: number;
  currency: "coin" | "gem";
  imagePath: string;
  defaultQty: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export type ItemInput = Omit<AdminItem, "id" | "createdAt" | "updatedAt">;

export interface AdminQuest {
  id: string;
  key: string;
  title: string;
  trackKind: QuestTrackKind;
  target: number;
  rewardCoins: number;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export type DailyQuestInput = Omit<AdminQuest, "id" | "createdAt" | "updatedAt">;

export interface AdminBattlePassSeason {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
  _count: { tiers: number };
}
export type BattlePassSeasonInput = { name: string; startsAt: string; endsAt: string };

export interface AdminBattlePassTier {
  id: string;
  seasonId: string;
  tier: number;
  xpRequired: number;
  freeRewardKind: BattlePassRewardKind;
  freeRewardAmount: number;
  freeRewardItemKey: string | null;
  vipRewardKind: BattlePassRewardKind;
  vipRewardAmount: number;
  vipRewardItemKey: string | null;
}
export type BattlePassTierInput = Omit<AdminBattlePassTier, "id" | "seasonId">;

export interface AdminShopPackage {
  id: string;
  key: string;
  name: string;
  description: string;
  kind: ShopPackageKind;
  color: string;
  imagePath: string;
  price: number;
  currency: "coin" | "gem";
  realPriceLabel: string;
  contents: ShopPackageContentEntry[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export type ShopPackageInput = Omit<AdminShopPackage, "id" | "createdAt" | "updatedAt">;

export interface AdminWorld {
  id: string;
  key: string;
  name: string;
  topic: string;
  colorTheme: string;
  requiredStars: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { lessons: number };
}
export type WorldInput = Omit<AdminWorld, "id" | "createdAt" | "updatedAt" | "_count">;

export interface AdminLesson {
  id: string;
  worldId: string;
  title: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { questions: number };
}
export type LessonInput = Pick<AdminLesson, "title" | "order" | "isActive">;

export interface AdminQuestion {
  id: string;
  lessonId: string;
  prompt: string;
  hint: string | null;
  answer: string;
  options: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}
export type QuestionInput = { prompt: string; hint?: string; answer: string; options: string[]; order: number };

// Full admin-only "create" shapes for Story/MiniGameTopic/WordCatchTopic —
// unlike their self-serve MyStoryCreateInput/MyMiniGameTopicCreateInput/
// MyWordCatchTopicCreateInput counterparts below (name/title only, everything
// else defaulted), admin picks the slug `key` and any color fields by hand,
// same as WorldInput above. The row shapes these return (MyStory/
// MyMiniGameTopic/MyWordCatchTopic) are identical whether read from /admin/*
// or /my/* — both come from the same listStories()-style service function.
export type StoryInput = { key: string; title: string; topic: string; colorTheme: string; order: number; isActive: boolean };
export type MiniGameTopicInput = { key: string; name: string; color: string; order: number; isActive: boolean };
export type WordCatchTopicInput = { key: string; name: string; order: number; isActive: boolean };

// ---- Self-serve ("My Content") types --------------------------------------
// Same row shapes the admin panel's AdminLesson/AdminQuestion above use —
// these just come from /my/* instead of /admin/*, scoped to whichever
// parent is logged in (see backend's services/admin/*.service.ts ownerId).

export type MyLesson = AdminLesson & { parentId: string | null };
export type MyLessonCreateInput = { worldId: string; title: string };

export interface MyStory {
  id: string;
  key: string;
  parentId: string | null;
  title: string;
  topic: string;
  colorTheme: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { pages: number };
}
export type MyStoryCreateInput = { title: string; topic: string };
export type StoryPageInput = { en: string; vi: string; img1: string; img2: string; label: string; sceneBg: string; ground: string; words: { en: string; vi: string; color: string }[]; order: number };
export interface MyStoryPage extends StoryPageInput {
  id: string;
  storyId: string;
}

export interface MyMiniGameTopic {
  id: string;
  key: string;
  parentId: string | null;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { words: number };
}
export type MyMiniGameTopicCreateInput = { name: string };
export type MiniGameWordInput = { en: string; vi: string; img: string; order: number };
export interface MyMiniGameWord extends MiniGameWordInput {
  id: string;
  topicId: string;
}

export interface MyWordCatchTopic {
  id: string;
  key: string;
  parentId: string | null;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { rounds: number };
}
export type MyWordCatchTopicCreateInput = { name: string };
export type WordCatchRoundInput = { vi: string; answer: string; options: string[]; order: number };
export interface MyWordCatchRound extends WordCatchRoundInput {
  id: string;
  topicId: string;
}

export interface MyShopTopic {
  id: string;
  key: string;
  parentId: string | null;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { rounds: number };
}
export type MyShopTopicCreateInput = { name: string };
export type ShopRoundInput = { instructionEn: string; instructionVi: string; shelf: ShopShelfItem[]; required: ShopRequiredItem[]; order: number };
export interface MyShopRound extends ShopRoundInput {
  id: string;
  topicId: string;
}

export interface MyHomeTopic {
  id: string;
  key: string;
  parentId: string | null;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { rounds: number };
}
export type MyHomeTopicCreateInput = { name: string };
export type HomeRoundInput = { instructionEn: string; instructionVi: string; objects: HomeObjectData[]; correctObjectKey: string; zones: HomeZoneData[]; correctZoneKey: string; order: number };
export interface MyHomeRound extends HomeRoundInput {
  id: string;
  topicId: string;
}

export interface MyRpgTopic {
  id: string;
  key: string;
  parentId: string | null;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { monsters: number };
}
export type MyRpgTopicCreateInput = { name: string };
export type RpgMonsterInput = { name: string; emoji: string; isBoss: boolean; questions: RpgQuestionData[]; order: number };
export interface MyRpgMonster extends RpgMonsterInput {
  id: string;
  topicId: string;
}

export interface MyWordTrainTopic {
  id: string;
  key: string;
  parentId: string | null;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { rounds: number };
}
export type MyWordTrainTopicCreateInput = { name: string };
export type WordTrainRoundInput = ({ kind: "fill"; data: WordTrainFillData } | { kind: "scramble"; data: WordTrainScrambleData }) & { vi: string; order: number };
export interface MyWordTrainRound {
  id: string;
  topicId: string;
  kind: "fill" | "scramble";
  vi: string;
  data: WordTrainFillData | WordTrainScrambleData;
  order: number;
}

export interface MyDetectiveCase {
  id: string;
  key: string;
  parentId: string | null;
  name: string;
  scenario: string;
  scenarioVi: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { rounds: number };
}
export type MyDetectiveCaseCreateInput = { name: string; scenario: string; scenarioVi: string };
export type DetectiveRoundInput = ({ kind: "interrogate"; data: DetectiveInterrogateData } | { kind: "accuse"; data: DetectiveAccuseData }) & { vi: string; order: number };
export interface MyDetectiveRound {
  id: string;
  caseId: string;
  kind: "interrogate" | "accuse";
  vi: string;
  data: DetectiveInterrogateData | DetectiveAccuseData;
  order: number;
}

export interface MyEchoParrotTopic {
  id: string;
  key: string;
  parentId: string | null;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { rounds: number };
}
export type MyEchoParrotTopicCreateInput = { name: string };
export type EchoParrotRoundInput = { en: string; vi: string; phonetic?: string; petKey?: string; order: number };
export interface MyEchoParrotRound {
  id: string;
  topicId: string;
  en: string;
  vi: string;
  phonetic: string | null;
  petKey: string | null;
  order: number;
}

export interface MyChatBuddyTopic {
  id: string;
  key: string;
  parentId: string | null;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { rounds: number };
}
export type MyChatBuddyTopicCreateInput = { name: string };
/** Full admin-authoring shape (all 3 translations per field) — distinct from
 * `ChatBuddyRoundData` above, which is the already-pickLang()-resolved shape
 * a child's device receives from `/catalog/chat-buddy-topics/:id`. */
export interface ChatBuddyRoundFullData {
  petLine: string;
  petLineVi: string;
  petLineJa?: string;
  petLineKo?: string;
  options: string[];
  optionsVi: string[];
  optionsJa?: string[];
  optionsKo?: string[];
  answerIndex: number;
  replyLine: string;
  replyLineVi: string;
  replyLineJa?: string;
  replyLineKo?: string;
}
export type ChatBuddyRoundInput = { data: ChatBuddyRoundFullData; order: number };
export interface MyChatBuddyRound {
  id: string;
  topicId: string;
  data: ChatBuddyRoundFullData;
  order: number;
}

export const api = {
  register: (email: string, password: string, phone?: string) =>
    request<{ parent: Parent; accessToken: string; refreshToken: string }>("/auth/register", {
      method: "POST",
      body: { email, password, phone },
      skipAuth: true,
    }),

  login: (email: string, password: string) =>
    request<{ parent: Parent; accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuth: true,
    }),

  // `token` is whatever lib/socialAuth.ts's signInWith<Provider>() returned —
  // an idToken/accessToken/identityToken depending on the provider, see its
  // doc comment. Same response shape as login/register either way.
  loginWithGoogle: (token: string) => request<{ parent: Parent; accessToken: string; refreshToken: string }>("/auth/google", { method: "POST", body: { token }, skipAuth: true }),
  loginWithFacebook: (token: string) => request<{ parent: Parent; accessToken: string; refreshToken: string }>("/auth/facebook", { method: "POST", body: { token }, skipAuth: true }),
  loginWithApple: (token: string) => request<{ parent: Parent; accessToken: string; refreshToken: string }>("/auth/apple", { method: "POST", body: { token }, skipAuth: true }),

  me: () => request<{ parent: Parent }>("/auth/me"),

  fetchTtsAudio,

  updateLanguage: (language: "vi" | "en" | "ja" | "ko") => request<{ parent: Parent }>("/auth/me/language", { method: "PATCH", body: { language } }),

  activatePremium: () => request<{ parent: Parent }>("/auth/me/premium", { method: "PATCH" }),

  // Settings.tsx's "Xoá toàn bộ dữ liệu" — permanent, cascades to every child/lesson/etc. See auth.service.ts's deleteAccount().
  deleteAccount: (confirmEmail: string) => request<void>("/auth/me", { method: "DELETE", body: { confirmEmail } }),
  getMyQuota: () => request<MyContentQuota>("/my/quota"),

  listChildren: () => request<{ children: Child[] }>("/children"),

  createChild: (displayName: string, avatarId: string, birthYear?: number) =>
    request<{ child: Child }>("/children", {
      method: "POST",
      body: { displayName, avatarId, birthYear },
    }),

  getProgress: (childId: string) => request<{ progress: ProgressState }>(`/children/${childId}/progress`),

  putProgress: (childId: string, progress: Omit<ProgressState, "streakDays" | "lastCheckinDate" | "lastLegendaryGrantAt" | "commonShards" | "rareShards" | "epicShards" | "petCopies" | "petEggs" | "hiddenFromRank">) =>
    request<{ progress: ProgressState }>(`/children/${childId}/progress`, {
      method: "PUT",
      body: progress,
    }),

  checkIn: (childId: string) => request<CheckInResult>(`/children/${childId}/checkin`, { method: "POST" }),

  rewardActivity: (childId: string, activity: RewardableActivity) =>
    request<ActivityRewardResult>(`/children/${childId}/activity-reward`, { method: "POST", body: { activity } }),

  claimLegendary: (childId: string) => request<ClaimLegendaryResult>(`/children/${childId}/legendary-claim`, { method: "POST" }),

  fusePets: (childId: string, rarity: FusableRarity, materials: FusionMaterial[]) => request<FusePetsResult>(`/children/${childId}/pets/fuse`, { method: "POST", body: { rarity, materials } }),

  purchasePet: (childId: string, petKey: string) =>
    request<PurchasePetResult>(`/children/${childId}/pets/purchase`, { method: "POST", body: { petKey } }),
  selectActivePet: (childId: string, petKey: string) =>
    request<{ progress: ProgressState }>(`/children/${childId}/pets/active`, { method: "PATCH", body: { petKey } }),

  // Settings.tsx's "Cho phép bảng xếp hạng" — see backend's leaderboard.service.ts.
  setRankVisibility: (childId: string, hidden: boolean) =>
    request<{ progress: ProgressState }>(`/children/${childId}/rank-visibility`, { method: "PATCH", body: { hidden } }),

  // ---- Từ đã lưu (Dictionary.tsx's save button, Topics/SrsCard's real deck, MyContent suggestion chips) ----

  listSavedWords: (childId: string) => request<{ words: string[] }>(`/children/${childId}/saved-words`),
  saveWord: (childId: string, word: string) => request<{ words: string[] }>(`/children/${childId}/saved-words`, { method: "POST", body: { word } }),
  unsaveWord: (childId: string, word: string) => request<{ words: string[] }>(`/children/${childId}/saved-words/${encodeURIComponent(word)}`, { method: "DELETE" }),

  // ---- Thông báo (Notifications.tsx) — real events, not mock data ----

  listNotifications: (childId: string) => request<{ notifications: AppNotification[] }>(`/children/${childId}/notifications`),
  markNotificationRead: (childId: string, notificationId: string) =>
    request<{ notifications: AppNotification[] }>(`/children/${childId}/notifications/${notificationId}/read`, { method: "PATCH" }),
  markAllNotificationsRead: (childId: string) => request<{ notifications: AppNotification[] }>(`/children/${childId}/notifications/read-all`, { method: "PATCH" }),
  // The one client-reported kind — see notification.routes.ts's doc comment.
  reportLessonComplete: (childId: string, title: string, body: string) =>
    request<{ notifications: AppNotification[] }>(`/children/${childId}/notifications/lesson-complete`, { method: "POST", body: { title, body } }),

  // ---- Battle Pass (BattlePass.tsx) — tách riêng khỏi Premium ----

  getBattlePass: (childId: string) => request<BattlePassState>(`/children/${childId}/battlepass`),
  claimBattlePassTier: (childId: string, tier: number, track: "free" | "vip") =>
    request<ClaimBattlePassResult>(`/children/${childId}/battlepass/claim`, { method: "POST", body: { tier, track } }),
  claimAllBattlePass: (childId: string) => request<ClaimBattlePassResult>(`/children/${childId}/battlepass/claim-all`, { method: "POST" }),
  // Demo activation, no real payment gateway yet — same pattern as activatePremium().
  activateVipSeason: (childId: string) => request<BattlePassState>(`/children/${childId}/battlepass/vip`, { method: "POST" }),

  listPackages: (childId: string) => request<{ packages: ShopPackageDto[] }>(`/children/${childId}/packages`),
  purchasePackage: (childId: string, packageId: string) =>
    request<PurchasePackageResult>(`/children/${childId}/packages/purchase`, { method: "POST", body: { packageId } }),

  // ---- Inventory (Bag) & Pet Care ----

  listInventory: (childId: string) => request<{ items: InventoryEntry[] }>(`/children/${childId}/items`),
  useItem: (childId: string, itemId: string) => request<UseItemResult>(`/children/${childId}/items/${itemId}/use`, { method: "POST" }),
  renamePet: (childId: string, itemId: string, name: string) => request<UseItemResult>(`/children/${childId}/items/${itemId}/rename-pet`, { method: "POST", body: { name } }),
  renameProfile: (childId: string, itemId: string, name: string) => request<RenameProfileResult>(`/children/${childId}/items/${itemId}/rename-profile`, { method: "POST", body: { name } }),

  getPetStats: (childId: string, petKey: string) => request<{ petStats: PetStatsState }>(`/children/${childId}/pets/${petKey}/stats`),
  careForPet: (childId: string, petKey: string, action: CareAction) =>
    request<CareResult>(`/children/${childId}/pets/${petKey}/care`, { method: "POST", body: { action } }),
  rewardLessonExperience: (childId: string, petKey: string) =>
    request<{ petStats: PetStatsState }>(`/children/${childId}/pets/${petKey}/lesson-experience`, { method: "POST" }),
  rewardFlappyDragon: (childId: string, score: number) =>
    request<{ progress: ProgressState; rewardCoins: number }>(`/children/${childId}/flappy-reward`, { method: "POST", body: { score } }),
  listFoodShop: (childId: string) => request<{ items: InventoryEntry[] }>(`/children/${childId}/food-shop`),
  listHomeBackgroundShop: (childId: string) => request<{ items: InventoryEntry[] }>(`/children/${childId}/home-background-shop`),
  purchaseItem: (childId: string, itemId: string) => request<{ progress: ProgressState; quantity: number }>(`/children/${childId}/items/${itemId}/purchase`, { method: "POST" }),

  listFriends: (childId: string) => request<{ friendCode: string; friendships: FriendSummary[] }>(`/children/${childId}/friends`),
  sendFriendRequest: (childId: string, friendCode: string) => request<FriendSummary>(`/children/${childId}/friends/requests`, { method: "POST", body: { friendCode } }),
  acceptFriendRequest: (childId: string, friendshipId: string) => request<{ friendship: FriendSummary }>(`/children/${childId}/friends/${friendshipId}/accept`, { method: "POST" }),
  removeFriendship: (childId: string, friendshipId: string) => request<void>(`/children/${childId}/friends/${friendshipId}`, { method: "DELETE" }),
  visitFriendRanch: (childId: string, friendChildId: string) => request<{ ranch: FriendRanchSnapshot }>(`/children/${childId}/friends/${friendChildId}/ranch`),
  listMailbox: (childId: string) => request<{ gifts: GiftMail[] }>(`/children/${childId}/mailbox`),
  sendGift: (childId: string, friendChildId: string, itemId: string, quantity: number) => request<{ quantity: number; message: string }>(`/children/${childId}/friends/${friendChildId}/gifts`, { method: "POST", body: { itemId, quantity } }),

  // ---- Daily quests ("Nhiệm vụ hôm nay") ----

  listQuests: (childId: string) => request<{ quests: Quest[] }>(`/children/${childId}/quests`),
  claimQuest: (childId: string, questId: string) => request<ClaimQuestResult>(`/children/${childId}/quests/${questId}/claim`, { method: "POST" }),
  bumpQuestProgress: (childId: string, trackKind: "lessons" | "miniGame", amount: number) =>
    request<{ quests: Quest[] }>(`/children/${childId}/quests/progress`, { method: "POST", body: { trackKind, amount } }),

  // ---- Catalog ----

  listWorlds: () => request<{ worlds: CatalogWorld[] }>("/catalog/worlds"),
  listLessons: (worldId: string) => request<{ lessons: CatalogLesson[] }>(`/catalog/worlds/${worldId}/lessons`),
  listQuestions: (lessonId: string) => request<{ questions: CatalogQuestion[] }>(`/catalog/lessons/${lessonId}/questions`),
  listVocabTopics: () => request<{ topics: VocabTopic[] }>("/catalog/vocab/topics"),
  listVocabByTopic: (topic: string) => request<{ words: VocabWord[] }>(`/catalog/vocab?topic=${encodeURIComponent(topic)}`),

  listStories: () => request<{ stories: StoryListItem[] }>("/catalog/stories"),
  getStory: (id: string) => request<{ story: StoryDetail }>(`/catalog/stories/${id}`),

  listMiniGameTopics: () => request<{ topics: MiniGameTopicListItem[] }>("/catalog/minigame-topics"),
  getMiniGameTopic: (id: string) => request<{ topic: MiniGameTopicDetail }>(`/catalog/minigame-topics/${id}`),

  listWordCatchTopics: () => request<{ topics: WordCatchTopicListItem[] }>("/catalog/wordcatch-topics"),
  getWordCatchTopic: (id: string) => request<{ topic: WordCatchTopicDetail }>(`/catalog/wordcatch-topics/${id}`),

  listShopTopics: () => request<{ topics: ShopTopicListItem[] }>("/catalog/shop-topics"),
  getShopTopic: (id: string) => request<{ topic: ShopTopicDetail }>(`/catalog/shop-topics/${id}`),

  listHomeTopics: () => request<{ topics: HomeTopicListItem[] }>("/catalog/home-topics"),
  getHomeTopic: (id: string) => request<{ topic: HomeTopicDetail }>(`/catalog/home-topics/${id}`),

  listRpgTopics: () => request<{ topics: RpgTopicListItem[] }>("/catalog/rpg-topics"),
  getRpgTopic: (id: string) => request<{ topic: RpgTopicDetail }>(`/catalog/rpg-topics/${id}`),

  // ---- Word RPG (level/XP + monster defeat) --------------------------------
  getRpgStatus: (childId: string) => request<RpgStatus>(`/rpg/status/${childId}`),
  defeatRpgMonster: (childId: string, monsterId: string) => request<DefeatMonsterResult>(`/rpg/monsters/${monsterId}/defeat`, { method: "POST", body: { childId } }),

  listWordTrainTopics: () => request<{ topics: WordTrainTopicListItem[] }>("/catalog/word-train-topics"),
  getWordTrainTopic: (id: string) => request<{ topic: WordTrainTopicDetail }>(`/catalog/word-train-topics/${id}`),
  listDetectiveCases: () => request<{ cases: DetectiveCaseListItem[] }>("/catalog/detective-cases"),
  getDetectiveCase: (id: string) => request<{ case: DetectiveCaseDetail }>(`/catalog/detective-cases/${id}`),
  listEchoParrotTopics: () => request<{ topics: EchoParrotTopicListItem[] }>("/catalog/echo-parrot-topics"),
  getEchoParrotTopic: (id: string) => request<{ topic: EchoParrotTopicDetail }>(`/catalog/echo-parrot-topics/${id}`),
  listChatBuddyTopics: () => request<{ topics: ChatBuddyTopicListItem[] }>("/catalog/chat-buddy-topics"),
  getChatBuddyTopic: (id: string) => request<{ topic: ChatBuddyTopicDetail }>(`/catalog/chat-buddy-topics/${id}`),

  // ---- Admin ----

  adminListUsers: (search: string) =>
    request<{ users: AdminUserSummary[]; total: number; page: number; pageSize: number }>(
      `/admin/users?pageSize=100${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    ),
  adminGetUser: (id: string) => request<{ user: AdminUserDetail }>(`/admin/users/${id}`),
  adminSetUserActive: (id: string, isActive: boolean) =>
    request<{ user: AdminUserDetail }>(`/admin/users/${id}`, { method: "PATCH", body: { isActive } }),
  adminDeleteUser: (id: string) => request<void>(`/admin/users/${id}`, { method: "DELETE" }),

  adminListPets: () => request<{ pets: AdminPet[] }>("/admin/pets"),
  adminCreatePet: (input: PetInput) => request<{ pet: AdminPet }>("/admin/pets", { method: "POST", body: input }),
  adminUpdatePet: (id: string, input: Partial<PetInput>) => request<{ pet: AdminPet }>(`/admin/pets/${id}`, { method: "PATCH", body: input }),
  adminDeletePet: (id: string) => request<void>(`/admin/pets/${id}`, { method: "DELETE" }),

  adminListItems: () => request<{ items: AdminItem[] }>("/admin/items"),
  adminCreateItem: (input: ItemInput) => request<{ item: AdminItem }>("/admin/items", { method: "POST", body: input }),
  adminUpdateItem: (id: string, input: Partial<ItemInput>) => request<{ item: AdminItem }>(`/admin/items/${id}`, { method: "PATCH", body: input }),
  adminDeleteItem: (id: string) => request<void>(`/admin/items/${id}`, { method: "DELETE" }),

  adminListQuests: () => request<{ quests: AdminQuest[] }>("/admin/quests"),
  adminCreateQuest: (input: DailyQuestInput) => request<{ quest: AdminQuest }>("/admin/quests", { method: "POST", body: input }),
  adminUpdateQuest: (id: string, input: Partial<DailyQuestInput>) => request<{ quest: AdminQuest }>(`/admin/quests/${id}`, { method: "PATCH", body: input }),
  adminDeleteQuest: (id: string) => request<void>(`/admin/quests/${id}`, { method: "DELETE" }),

  // ---- Battle Pass admin (BattlePassPage.tsx) ----

  adminListBattlePassSeasons: () => request<{ seasons: AdminBattlePassSeason[] }>("/admin/battle-pass"),
  adminCreateBattlePassSeason: (input: BattlePassSeasonInput) => request<{ season: AdminBattlePassSeason }>("/admin/battle-pass", { method: "POST", body: input }),
  adminUpdateBattlePassSeason: (id: string, input: Partial<BattlePassSeasonInput>) =>
    request<{ season: AdminBattlePassSeason }>(`/admin/battle-pass/${id}`, { method: "PATCH", body: input }),
  adminDeleteBattlePassSeason: (id: string) => request<void>(`/admin/battle-pass/${id}`, { method: "DELETE" }),

  adminListBattlePassTiers: (seasonId: string) => request<{ tiers: AdminBattlePassTier[] }>(`/admin/battle-pass/${seasonId}/tiers`),
  adminCreateBattlePassTier: (seasonId: string, input: BattlePassTierInput) =>
    request<{ tier: AdminBattlePassTier }>(`/admin/battle-pass/${seasonId}/tiers`, { method: "POST", body: input }),
  adminUpdateBattlePassTier: (tierId: string, input: Partial<BattlePassTierInput>) =>
    request<{ tier: AdminBattlePassTier }>(`/admin/battle-pass/tiers/${tierId}`, { method: "PATCH", body: input }),
  adminDeleteBattlePassTier: (tierId: string) => request<void>(`/admin/battle-pass/tiers/${tierId}`, { method: "DELETE" }),

  // ---- Shop packages admin (ShopPackagesPage.tsx) ----

  adminListShopPackages: () => request<{ packages: AdminShopPackage[] }>("/admin/shop-packages"),
  adminCreateShopPackage: (input: ShopPackageInput) => request<{ package: AdminShopPackage }>("/admin/shop-packages", { method: "POST", body: input }),
  adminUpdateShopPackage: (id: string, input: Partial<ShopPackageInput>) =>
    request<{ package: AdminShopPackage }>(`/admin/shop-packages/${id}`, { method: "PATCH", body: input }),
  adminDeleteShopPackage: (id: string) => request<void>(`/admin/shop-packages/${id}`, { method: "DELETE" }),

  adminListWorlds: () => request<{ worlds: AdminWorld[] }>("/admin/worlds"),
  adminCreateWorld: (input: WorldInput) => request<{ world: AdminWorld }>("/admin/worlds", { method: "POST", body: input }),
  adminUpdateWorld: (id: string, input: Partial<WorldInput>) => request<{ world: AdminWorld }>(`/admin/worlds/${id}`, { method: "PATCH", body: input }),
  adminDeleteWorld: (id: string) => request<void>(`/admin/worlds/${id}`, { method: "DELETE" }),

  adminListLessons: (worldId: string) => request<{ lessons: AdminLesson[] }>(`/admin/worlds/${worldId}/lessons`),
  adminCreateLesson: (worldId: string, input: LessonInput) =>
    request<{ lesson: AdminLesson }>(`/admin/worlds/${worldId}/lessons`, { method: "POST", body: input }),
  adminUpdateLesson: (id: string, input: Partial<LessonInput>) =>
    request<{ lesson: AdminLesson }>(`/admin/lessons/${id}`, { method: "PATCH", body: input }),
  adminDeleteLesson: (id: string) => request<void>(`/admin/lessons/${id}`, { method: "DELETE" }),

  adminListQuestions: (lessonId: string) => request<{ questions: AdminQuestion[] }>(`/admin/lessons/${lessonId}/questions`),
  adminCreateQuestion: (lessonId: string, input: QuestionInput) =>
    request<{ question: AdminQuestion }>(`/admin/lessons/${lessonId}/questions`, { method: "POST", body: input }),
  adminUpdateQuestion: (id: string, input: Partial<QuestionInput>) =>
    request<{ question: AdminQuestion }>(`/admin/questions/${id}`, { method: "PATCH", body: input }),
  adminDeleteQuestion: (id: string) => request<void>(`/admin/questions/${id}`, { method: "DELETE" }),

  adminListStories: () => request<{ stories: MyStory[] }>("/admin/stories"),
  adminCreateStory: (input: StoryInput) => request<{ story: MyStory }>("/admin/stories", { method: "POST", body: input }),
  adminUpdateStory: (id: string, input: Partial<StoryInput>) => request<{ story: MyStory }>(`/admin/stories/${id}`, { method: "PATCH", body: input }),
  adminDeleteStory: (id: string) => request<void>(`/admin/stories/${id}`, { method: "DELETE" }),
  adminListStoryPages: (storyId: string) => request<{ pages: MyStoryPage[] }>(`/admin/stories/${storyId}/pages`),
  adminCreateStoryPage: (storyId: string, input: StoryPageInput) => request<{ page: MyStoryPage }>(`/admin/stories/${storyId}/pages`, { method: "POST", body: input }),
  adminUpdateStoryPage: (id: string, input: Partial<StoryPageInput>) => request<{ page: MyStoryPage }>(`/admin/story-pages/${id}`, { method: "PATCH", body: input }),
  adminDeleteStoryPage: (id: string) => request<void>(`/admin/story-pages/${id}`, { method: "DELETE" }),

  adminListMiniGameTopics: () => request<{ topics: MyMiniGameTopic[] }>("/admin/minigame-topics"),
  adminCreateMiniGameTopic: (input: MiniGameTopicInput) => request<{ topic: MyMiniGameTopic }>("/admin/minigame-topics", { method: "POST", body: input }),
  adminUpdateMiniGameTopic: (id: string, input: Partial<MiniGameTopicInput>) =>
    request<{ topic: MyMiniGameTopic }>(`/admin/minigame-topics/${id}`, { method: "PATCH", body: input }),
  adminDeleteMiniGameTopic: (id: string) => request<void>(`/admin/minigame-topics/${id}`, { method: "DELETE" }),
  adminListMiniGameWords: (topicId: string) => request<{ words: MyMiniGameWord[] }>(`/admin/minigame-topics/${topicId}/words`),
  adminCreateMiniGameWord: (topicId: string, input: MiniGameWordInput) =>
    request<{ word: MyMiniGameWord }>(`/admin/minigame-topics/${topicId}/words`, { method: "POST", body: input }),
  adminUpdateMiniGameWord: (id: string, input: Partial<MiniGameWordInput>) =>
    request<{ word: MyMiniGameWord }>(`/admin/minigame-words/${id}`, { method: "PATCH", body: input }),
  adminDeleteMiniGameWord: (id: string) => request<void>(`/admin/minigame-words/${id}`, { method: "DELETE" }),

  adminListWordCatchTopics: () => request<{ topics: MyWordCatchTopic[] }>("/admin/wordcatch-topics"),
  adminCreateWordCatchTopic: (input: WordCatchTopicInput) => request<{ topic: MyWordCatchTopic }>("/admin/wordcatch-topics", { method: "POST", body: input }),
  adminUpdateWordCatchTopic: (id: string, input: Partial<WordCatchTopicInput>) =>
    request<{ topic: MyWordCatchTopic }>(`/admin/wordcatch-topics/${id}`, { method: "PATCH", body: input }),
  adminDeleteWordCatchTopic: (id: string) => request<void>(`/admin/wordcatch-topics/${id}`, { method: "DELETE" }),
  adminListWordCatchRounds: (topicId: string) => request<{ rounds: MyWordCatchRound[] }>(`/admin/wordcatch-topics/${topicId}/rounds`),
  adminCreateWordCatchRound: (topicId: string, input: WordCatchRoundInput) =>
    request<{ round: MyWordCatchRound }>(`/admin/wordcatch-topics/${topicId}/rounds`, { method: "POST", body: input }),
  adminUpdateWordCatchRound: (id: string, input: Partial<WordCatchRoundInput>) =>
    request<{ round: MyWordCatchRound }>(`/admin/wordcatch-rounds/${id}`, { method: "PATCH", body: input }),
  adminDeleteWordCatchRound: (id: string) => request<void>(`/admin/wordcatch-rounds/${id}`, { method: "DELETE" }),

  // ---- Self-serve ("My Content") — any logged-in parent, own content only ----

  myListLessons: (worldId: string) => request<{ lessons: MyLesson[] }>(`/my/lessons?worldId=${encodeURIComponent(worldId)}`),
  myCreateLesson: (input: MyLessonCreateInput) => request<{ lesson: MyLesson }>("/my/lessons", { method: "POST", body: input }),
  myDeleteLesson: (id: string) => request<void>(`/my/lessons/${id}`, { method: "DELETE" }),
  myListQuestions: (lessonId: string) => request<{ questions: AdminQuestion[] }>(`/my/lessons/${lessonId}/questions`),
  myCreateQuestion: (lessonId: string, input: QuestionInput) => request<{ question: AdminQuestion }>(`/my/lessons/${lessonId}/questions`, { method: "POST", body: input }),
  myUpdateQuestion: (id: string, input: Partial<QuestionInput>) => request<{ question: AdminQuestion }>(`/my/questions/${id}`, { method: "PATCH", body: input }),
  myDeleteQuestion: (id: string) => request<void>(`/my/questions/${id}`, { method: "DELETE" }),

  myListStories: () => request<{ stories: MyStory[] }>("/my/stories"),
  myCreateStory: (input: MyStoryCreateInput) => request<{ story: MyStory }>("/my/stories", { method: "POST", body: input }),
  myDeleteStory: (id: string) => request<void>(`/my/stories/${id}`, { method: "DELETE" }),
  myListStoryPages: (storyId: string) => request<{ pages: MyStoryPage[] }>(`/my/stories/${storyId}/pages`),
  myCreateStoryPage: (storyId: string, input: StoryPageInput) => request<{ page: MyStoryPage }>(`/my/stories/${storyId}/pages`, { method: "POST", body: input }),
  myUpdateStoryPage: (id: string, input: Partial<StoryPageInput>) => request<{ page: MyStoryPage }>(`/my/story-pages/${id}`, { method: "PATCH", body: input }),
  myDeleteStoryPage: (id: string) => request<void>(`/my/story-pages/${id}`, { method: "DELETE" }),

  myListMiniGameTopics: () => request<{ topics: MyMiniGameTopic[] }>("/my/minigame-topics"),
  myCreateMiniGameTopic: (input: MyMiniGameTopicCreateInput) => request<{ topic: MyMiniGameTopic }>("/my/minigame-topics", { method: "POST", body: input }),
  myDeleteMiniGameTopic: (id: string) => request<void>(`/my/minigame-topics/${id}`, { method: "DELETE" }),
  myListMiniGameWords: (topicId: string) => request<{ words: MyMiniGameWord[] }>(`/my/minigame-topics/${topicId}/words`),
  myCreateMiniGameWord: (topicId: string, input: MiniGameWordInput) => request<{ word: MyMiniGameWord }>(`/my/minigame-topics/${topicId}/words`, { method: "POST", body: input }),
  myDeleteMiniGameWord: (id: string) => request<void>(`/my/minigame-words/${id}`, { method: "DELETE" }),

  myListWordCatchTopics: () => request<{ topics: MyWordCatchTopic[] }>("/my/wordcatch-topics"),
  myCreateWordCatchTopic: (input: MyWordCatchTopicCreateInput) => request<{ topic: MyWordCatchTopic }>("/my/wordcatch-topics", { method: "POST", body: input }),
  myDeleteWordCatchTopic: (id: string) => request<void>(`/my/wordcatch-topics/${id}`, { method: "DELETE" }),
  myListWordCatchRounds: (topicId: string) => request<{ rounds: MyWordCatchRound[] }>(`/my/wordcatch-topics/${topicId}/rounds`),
  myCreateWordCatchRound: (topicId: string, input: WordCatchRoundInput) => request<{ round: MyWordCatchRound }>(`/my/wordcatch-topics/${topicId}/rounds`, { method: "POST", body: input }),
  myDeleteWordCatchRound: (id: string) => request<void>(`/my/wordcatch-rounds/${id}`, { method: "DELETE" }),

  // English Shop self-serve — API is wired up (mirrors MiniGame/WordCatch
  // exactly), but there's no "Nội dung của tôi" form for it yet — see
  // TASKS.md. Callable already for anyone driving the API directly.
  myListShopTopics: () => request<{ topics: MyShopTopic[] }>("/my/shop-topics"),
  myCreateShopTopic: (input: MyShopTopicCreateInput) => request<{ topic: MyShopTopic }>("/my/shop-topics", { method: "POST", body: input }),
  myDeleteShopTopic: (id: string) => request<void>(`/my/shop-topics/${id}`, { method: "DELETE" }),
  myListShopRounds: (topicId: string) => request<{ rounds: MyShopRound[] }>(`/my/shop-topics/${topicId}/rounds`),
  myCreateShopRound: (topicId: string, input: ShopRoundInput) => request<{ round: MyShopRound }>(`/my/shop-topics/${topicId}/rounds`, { method: "POST", body: input }),
  myDeleteShopRound: (id: string) => request<void>(`/my/shop-rounds/${id}`, { method: "DELETE" }),

  // English Home self-serve — same story as English Shop above: API ready, no form yet.
  myListHomeTopics: () => request<{ topics: MyHomeTopic[] }>("/my/home-topics"),
  myCreateHomeTopic: (input: MyHomeTopicCreateInput) => request<{ topic: MyHomeTopic }>("/my/home-topics", { method: "POST", body: input }),
  myDeleteHomeTopic: (id: string) => request<void>(`/my/home-topics/${id}`, { method: "DELETE" }),
  myListHomeRounds: (topicId: string) => request<{ rounds: MyHomeRound[] }>(`/my/home-topics/${topicId}/rounds`),
  myCreateHomeRound: (topicId: string, input: HomeRoundInput) => request<{ round: MyHomeRound }>(`/my/home-topics/${topicId}/rounds`, { method: "POST", body: input }),
  myDeleteHomeRound: (id: string) => request<void>(`/my/home-rounds/${id}`, { method: "DELETE" }),

  // Word RPG self-serve — same story as English Shop/Home above: API ready, no form yet.
  myListRpgTopics: () => request<{ topics: MyRpgTopic[] }>("/my/rpg-topics"),
  myCreateRpgTopic: (input: MyRpgTopicCreateInput) => request<{ topic: MyRpgTopic }>("/my/rpg-topics", { method: "POST", body: input }),
  myDeleteRpgTopic: (id: string) => request<void>(`/my/rpg-topics/${id}`, { method: "DELETE" }),
  myListRpgMonsters: (topicId: string) => request<{ monsters: MyRpgMonster[] }>(`/my/rpg-topics/${topicId}/monsters`),
  myCreateRpgMonster: (topicId: string, input: RpgMonsterInput) => request<{ monster: MyRpgMonster }>(`/my/rpg-topics/${topicId}/monsters`, { method: "POST", body: input }),
  myDeleteRpgMonster: (id: string) => request<void>(`/my/rpg-monsters/${id}`, { method: "DELETE" }),

  // Word Train self-serve — same story as the other new games above: API ready, no form yet.
  myListWordTrainTopics: () => request<{ topics: MyWordTrainTopic[] }>("/my/word-train-topics"),
  myCreateWordTrainTopic: (input: MyWordTrainTopicCreateInput) => request<{ topic: MyWordTrainTopic }>("/my/word-train-topics", { method: "POST", body: input }),
  myDeleteWordTrainTopic: (id: string) => request<void>(`/my/word-train-topics/${id}`, { method: "DELETE" }),
  myListWordTrainRounds: (topicId: string) => request<{ rounds: MyWordTrainRound[] }>(`/my/word-train-topics/${topicId}/rounds`),
  myCreateWordTrainRound: (topicId: string, input: WordTrainRoundInput) => request<{ round: MyWordTrainRound }>(`/my/word-train-topics/${topicId}/rounds`, { method: "POST", body: input }),
  myDeleteWordTrainRound: (id: string) => request<void>(`/my/word-train-rounds/${id}`, { method: "DELETE" }),

  myListDetectiveCases: () => request<{ cases: MyDetectiveCase[] }>("/my/detective-cases"),
  myCreateDetectiveCase: (input: MyDetectiveCaseCreateInput) => request<{ case: MyDetectiveCase }>("/my/detective-cases", { method: "POST", body: input }),
  myDeleteDetectiveCase: (id: string) => request<void>(`/my/detective-cases/${id}`, { method: "DELETE" }),
  myListDetectiveRounds: (caseId: string) => request<{ rounds: MyDetectiveRound[] }>(`/my/detective-cases/${caseId}/rounds`),
  myCreateDetectiveRound: (caseId: string, input: DetectiveRoundInput) => request<{ round: MyDetectiveRound }>(`/my/detective-cases/${caseId}/rounds`, { method: "POST", body: input }),
  myDeleteDetectiveRound: (id: string) => request<void>(`/my/detective-rounds/${id}`, { method: "DELETE" }),

  myListEchoParrotTopics: () => request<{ topics: MyEchoParrotTopic[] }>("/my/echo-parrot-topics"),
  myCreateEchoParrotTopic: (input: MyEchoParrotTopicCreateInput) => request<{ topic: MyEchoParrotTopic }>("/my/echo-parrot-topics", { method: "POST", body: input }),
  myDeleteEchoParrotTopic: (id: string) => request<void>(`/my/echo-parrot-topics/${id}`, { method: "DELETE" }),
  myListEchoParrotRounds: (topicId: string) => request<{ rounds: MyEchoParrotRound[] }>(`/my/echo-parrot-topics/${topicId}/rounds`),
  myCreateEchoParrotRound: (topicId: string, input: EchoParrotRoundInput) => request<{ round: MyEchoParrotRound }>(`/my/echo-parrot-topics/${topicId}/rounds`, { method: "POST", body: input }),
  myDeleteEchoParrotRound: (id: string) => request<void>(`/my/echo-parrot-rounds/${id}`, { method: "DELETE" }),

  myListChatBuddyTopics: () => request<{ topics: MyChatBuddyTopic[] }>("/my/chat-buddy-topics"),
  myCreateChatBuddyTopic: (input: MyChatBuddyTopicCreateInput) => request<{ topic: MyChatBuddyTopic }>("/my/chat-buddy-topics", { method: "POST", body: input }),
  myDeleteChatBuddyTopic: (id: string) => request<void>(`/my/chat-buddy-topics/${id}`, { method: "DELETE" }),
  myListChatBuddyRounds: (topicId: string) => request<{ rounds: MyChatBuddyRound[] }>(`/my/chat-buddy-topics/${topicId}/rounds`),
  myCreateChatBuddyRound: (topicId: string, input: ChatBuddyRoundInput) => request<{ round: MyChatBuddyRound }>(`/my/chat-buddy-topics/${topicId}/rounds`, { method: "POST", body: input }),
  myDeleteChatBuddyRound: (id: string) => request<void>(`/my/chat-buddy-rounds/${id}`, { method: "DELETE" }),

  // ---- Đấu trường (fight rooms) --------------------------------------------
  listBattleLessons: () => request<{ lessons: BattleLesson[] }>("/fight/lessons"),
  createFightRoom: (childId: string, lessonId: string) => request<{ room: FightRoom }>("/fight/rooms", { method: "POST", body: { childId, lessonId } }),
  joinFightRoom: (code: string, childId: string) => request<{ room: FightRoom }>(`/fight/rooms/${code}/join`, { method: "POST", body: { childId } }),
  getFightRoom: (code: string) => request<{ room: FightRoom }>(`/fight/rooms/${code}`),

  // ---- Đường đua Hạng (rank ladder) ------------------------------------------
  getLeaderboard: () => request<{ leaderboard: LeaderboardEntry[] }>("/fight/leaderboard"),
  getMyRank: (childId: string) => request<MyRank>(`/fight/rank/${childId}`),
};

// ---- Đường đua Hạng types ---------------------------------------------------

export interface RankTier {
  key: string;
  name: string;
  color: string;
  min: number;
  coinMultiplier: number;
}
export interface LeaderboardEntry {
  rank: number;
  childId: string;
  displayName: string;
  avatarId: string;
  rating: number;
  tier: RankTier;
}
export interface MyRank {
  hasPlayed: boolean;
  rating: number;
  tier: RankTier;
  nextTier: RankTier | null;
  position: number | null;
  totalPlayers: number;
}

// ---- Đấu trường (fight rooms) types ----------------------------------------

export interface BattleLesson {
  id: string;
  title: string;
  worldName: string;
  colorTheme: string;
  questionCount: number;
  isOwn: boolean;
}

export interface FightParticipant {
  id: string;
  childId: string;
  score: number;
  joinedAt: string;
  child: { id: string; displayName: string; avatarId: string };
}

export interface FightRoom {
  id: string;
  code: string;
  lessonId: string;
  hostChildId: string;
  status: "waiting" | "active" | "finished" | "abandoned";
  winnerChildId: string | null;
  rewardCoins: number;
  createdAt: string;
  updatedAt: string;
  participants: FightParticipant[];
  lesson: { title: string };
}
