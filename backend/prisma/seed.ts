/**
 * Seeds the catalog tables the Admin panel manages (Pet / World / Lesson /
 * Question) with the same data the frontend used to hardcode as mock
 * arrays, and promotes one account to ADMIN so there's a way into
 * /admin on a fresh database.
 *
 * Run with: npm run prisma:seed  (backend/package.json)
 * Admin login is ADMIN_EMAIL / ADMIN_PASSWORD from .env, falling back to
 * admin@petlingo.dev / admin1234 for local dev.
 */
import "dotenv/config";
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@petlingo.dev";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin1234";
// Generous but NOT the literal int32 ceiling (2,147,483,647) — `coins` is a
// Postgres `integer` column, so seeding the exact max meant any later
// mint-style addition (check-in reward, quest claim, fight-room win) would
// overflow and crash with a raw "value out of range" error the moment it
// tried to add even 1 more coin (see clampToInt32 in progress.service.ts,
// added after this exact bug got reported — this constant's value change is
// the other half of that fix, at the source). Leaves ~1.1 billion of
// headroom, which is "unlimited" for any realistic amount of manual testing.
const ADMIN_COINS = 999_000_000;

type Rarity = "Common" | "Rare" | "Epic" | "Legendary";
const RARITY_PRICE: Record<Rarity, { price: number; currency: "coin" | "gem" }> = {
  Common: { price: 100, currency: "coin" },
  Rare: { price: 500, currency: "coin" },
  Epic: { price: 300, currency: "gem" },
  Legendary: { price: 999, currency: "gem" },
};

// Mirrors frontend/src/components/ui/tokens.ts PET_DATA.
const PETS: [string, string, string, Rarity][] = [
  ["Buddy", "buddy", "Chó Golden", "Common"],
  ["Mimi", "mimi", "Mèo cam", "Common"],
  ["Poppy", "poppy", "Thỏ trắng", "Common"],
  ["Snowy", "snowy", "Ngỗng trắng", "Common"],
  ["Ducky", "ducky", "Vịt vàng", "Common"],
  ["Coco", "coco", "Mèo nâu", "Common"],
  ["Milky", "milky", "Mèo trắng", "Common"],
  ["Smokey", "smokey", "Mèo xám", "Common"],
  ["Pepper", "pepper", "Mèo tam thể", "Common"],
  ["Misty", "misty", "Mèo khói", "Common"],
  ["Biscuit", "biscuit", "Chó con kem", "Common"],
  ["Cocoa", "cocoa", "Chó nâu", "Common"],
  ["Waffle", "waffle", "Chó đốm", "Common"],
  ["Bamboo", "bamboo", "Gấu trúc", "Rare"],
  ["Kiwi", "kiwi", "Chim xanh", "Rare"],
  ["Rosie", "rosie", "Chim hồng", "Rare"],
  ["Frosty", "frosty", "Chim cánh cụt", "Rare"],
  ["Leo", "leo", "Sư tử", "Rare"],
  ["Stripe", "stripe", "Hổ con", "Rare"],
  ["Ellie", "ellie", "Voi con", "Rare"],
  ["Lila", "lila", "Mèo tím", "Rare"],
  ["Sia", "sia", "Mèo Xiêm", "Rare"],
  ["Nimbus", "nimbus", "Husky", "Rare"],
  ["Sunny", "sunny", "Sư tử vàng", "Rare"],
  ["Gargo", "gargo", "Quái nhỏ tím", "Epic"],
  ["Sprout", "sprout", "Rồng mầm", "Epic"],
  ["Angel", "angel", "Mèo có cánh", "Epic"],
  ["Glacio", "glacio", "Gấu băng", "Epic"],
  ["Mystic", "mystic", "Mèo pháp sư", "Epic"],
  ["Berry", "berry", "Gấu xanh", "Epic"],
  ["Nocty", "nocty", "Rồng dơi", "Epic"],
  ["Papillon", "papillon", "Tiên bướm", "Epic"],
  ["Frostwing", "frostwing", "Rồng băng", "Legendary"],
  ["Prism", "prism", "Rồng cầu vồng", "Legendary"],
  ["Stella", "stella", "Kỳ lân", "Legendary"],
  ["Blaze", "blaze", "Phượng hoàng", "Legendary"],
  ["Aqua", "aqua", "Linh thú nước", "Legendary"],
  ["Umbra", "umbra", "Rồng bóng tối", "Legendary"],
  ["Void", "void", "Rồng hư không", "Legendary"],
  ["Ember", "ember", "Rồng lửa", "Legendary"],
  ["Maru", "maru", "Chó Shiba Nhật Bản", "Common"],
  ["Dori", "dori", "Chó Jindo Hàn Quốc", "Rare"],
  ["Kitsune", "kitsune", "Linh hồ Nhật Bản", "Epic"],
  ["Haetae", "haetae", "Linh thú hộ mệnh Hàn Quốc", "Legendary"],
];

// Mirrors frontend/src/pages/WorldMap.tsx ZONES.
const WORLDS: { key: string; name: string; topic: string; colorTheme: string; requiredStars: number }[] = [
  { key: "forest", name: "Forest", topic: "Animals & Nature", colorTheme: "#7CC24A", requiredStars: 0 },
  { key: "town", name: "Town", topic: "Places & People", colorTheme: "#F5822B", requiredStars: 0 },
  { key: "beach", name: "Beach", topic: "Weather & Food", colorTheme: "#57C6C6", requiredStars: 0 },
  { key: "school", name: "School", topic: "Objects & Numbers", colorTheme: "#9B7EDE", requiredStars: 20 },
  { key: "castle", name: "Castle", topic: "Stories", colorTheme: "#E8A22B", requiredStars: 30 },
  { key: "space", name: "Space", topic: "Advanced", colorTheme: "#6C8FE3", requiredStars: 30 },
  { key: "ielts", name: "IELTS Academy", topic: "Academic English · B1–C1", colorTheme: "#3D7FC4", requiredStars: 40 },
  { key: "toeic", name: "TOEIC Office", topic: "Workplace English · A2–B2", colorTheme: "#D66B45", requiredStars: 40 },
];

// Mirrors frontend/src/App.tsx LESSON_QUESTIONS.
const FOREST_QUESTIONS: { prompt: string; hint: string; answer: string; options: string[] }[] = [
  { prompt: "Find the flower!", hint: "Nghe rồi chọn hình đúng", answer: "Flower", options: ["Flower", "Bird", "Tree", "Stone"] },
  { prompt: "Which one is a bird?", hint: "Tap the picture", answer: "Bird", options: ["Cloud", "Bird", "River", "Leaf"] },
  { prompt: "Find the tree!", hint: "Nghe rồi chọn hình đúng", answer: "Tree", options: ["Tree", "Sun", "Rock", "Grass"] },
  { prompt: "Which one is the sun?", hint: "Tap the picture", answer: "Sun", options: ["Moon", "Star", "Sun", "Cloud"] },
  { prompt: "Find the river!", hint: "Nghe rồi chọn hình đúng", answer: "River", options: ["Hill", "River", "Bird", "Flower"] },
];

// ---------------------------------------------------------------------------
// Bulk lesson generator (2026-08-28) — user asked for ~10x more questions
// than the 78 hand-written ones added earlier. Hand-typing full Question
// objects (prompt+hint+answer+options, ~5 lines each) doesn't scale to
// hundreds; a 1-line-per-word bank does. `Question` has NO vi/ja/ko columns
// at all (only `Lesson`/topic-level content is multilingual) — a Question's
// `hint` is just 1 of 2 fixed Vietnamese/English UI strings, not a per-word
// translation — so generating from plain ENGLISH word lists needs zero
// translation work, unlike every other content type in this file.
// `genQuestions()` turns 1 word list into 1 question per word, alternating
// "Find the X!"/"Which one is X?" (same split as every hand-written lesson),
// with distractors drawn from the SAME list (same-category → same difficulty
// tier as the hand-written "Bài 2 (Trung bình)" lessons — genuinely harder
// than "Bài 1", not filler).
// ---------------------------------------------------------------------------
function titleCaseWord(w: string): string {
  return w
    .split(" ")
    .map((p) => (p.length ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
}
const NO_ARTICLE_WORDS = new Set([
  "water", "rain", "snow", "sunshine", "gravity", "magic", "music", "art", "homework", "spelling",
  "reading", "writing", "chess", "yoga", "ice cream", "juice", "milk", "lemonade", "popcorn",
  // School subjects (uncountable) — found missing while auditing the bulk
  // lesson generator's real output (2026-08-30): "science"/"history"/
  // "biology"/"geometry" etc were coming out as "Which one is a biology?".
  "science", "history", "biology", "chemistry", "geometry", "geography", "literature", "algebra",
  // Weather/materials that are always uncountable, same reasoning as rain/snow.
  "thunder", "hail", "chalk",
  // Number words used bare ("Find the twelve!") instead of "the number twelve" —
  // sounds better with no article than a random "a"/"an".
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
  "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
  "hundred", "thousand", "million", "billion",
  // Planet/astronomy proper nouns — like "Venus"/"Mars" (already correct by
  // accident, see NO_ARTICLE_S_HEURISTIC below), these take no article at all.
  "saturn", "neptune", "moon",
]);
// Singular countable nouns that end in "s" but are NOT plural — the crude
// "ends in s → no article" heuristic below wrongly swallows these (found
// while auditing real generated output: "Which one is octopus?"/"Which one
// is bus?"). Checked before that heuristic.
const FORCE_ARTICLE_WORDS = new Set(["bus", "octopus", "walrus"]);
// Proper-noun planet names (capitalized in their word lists) that should
// never get "the" in the "Find the X!" template — "Find the Mercury!" reads
// wrong the same way "Find the Earth!"/"Find the Sun!" reads right. Earth and
// Sun are deliberately excluded — both conventionally keep "the".
const NO_THE_WORDS = new Set(["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "moon"]);
function needsNoArticle(w: string): boolean {
  const lower = w.toLowerCase();
  if (FORCE_ARTICLE_WORDS.has(lower)) return false;
  if (/s$/.test(lower) && !lower.endsWith("ss")) return true; // crude plural heuristic
  return NO_ARTICLE_WORDS.has(lower);
}
// Vowel-LETTER heuristic below is wrong for words with a consonant SOUND
// ("unicorn" /j-/, "UFO" /j-/) — same exception EchoParrot's petEchoRounds()
// already special-cases inline for "unicorn"; centralized here so every
// generator sharing this helper (Lesson/Detective/Chat Buddy) gets it too.
const CONSONANT_SOUND_WORDS = new Set(["unicorn", "ufo"]);
function articleFor(w: string): string {
  if (CONSONANT_SOUND_WORDS.has(w.toLowerCase())) return "a";
  return /^[aeiou]/i.test(w) ? "an" : "a";
}
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
function genQuestions(words: string[]): { prompt: string; hint: string; answer: string; options: string[] }[] {
  return words.map((w, i) => {
    const answer = titleCaseWord(w);
    const wrongPool = words.filter((x) => x !== w);
    const wrong = shuffled(wrongPool).slice(0, 3).map(titleCaseWord);
    const options = shuffled([...wrong, answer]);
    const prompt = "What is this?";
    const hint = "Nhìn hình và chọn đáp án đúng";
    return { prompt, hint, answer, options };
  });
}

/** 7 extra topics × 19 words × 6 worlds = 798 extra questions, appended onto
 * WORLD_LESSONS below (see the `.push()` loop after that const). All labeled
 * "(Trung bình)" — accurate to their actual difficulty mechanism
 * (same-category distractors, no attribute/purpose questions mixed in like
 * the hand-written "Bài 3 (Khó)" lessons), not inflated to "(Khó)". */
const WORLD_BONUS_TOPICS: { worldKey: string; title: string; order: number; words: string[] }[] = [
  { worldKey: "forest", title: "Bài 4: Sinh vật biển (Trung bình)", order: 3, words: ["whale", "dolphin", "shark", "octopus", "crab", "starfish", "jellyfish", "seahorse", "lobster", "squid", "seal", "penguin", "otter", "walrus", "eel", "clam", "stingray", "swordfish", "pelican"] },
  { worldKey: "forest", title: "Bài 5: Động vật nông trại (Trung bình)", order: 4, words: ["cow", "pig", "sheep", "goat", "horse", "chicken", "duck", "rooster", "turkey", "rabbit", "donkey", "llama", "hen", "calf", "lamb", "goose", "mule", "ox", "pony"] },
  { worldKey: "forest", title: "Bài 6: Thế giới côn trùng (Trung bình)", order: 5, words: ["ant", "bee", "butterfly", "ladybug", "spider", "grasshopper", "dragonfly", "mosquito", "fly", "worm", "snail", "caterpillar", "cricket", "beetle", "moth", "firefly", "wasp", "cockroach", "centipede"] },
  { worldKey: "forest", title: "Bài 7: Cây cối trong rừng (Trung bình)", order: 6, words: ["tree", "flower", "leaf", "grass", "root", "branch", "seed", "bush", "vine", "petal", "stem", "bark", "moss", "fern", "thorn", "weed", "sprout", "blossom", "cactus"] },
  { worldKey: "forest", title: "Bài 8: Bầu trời và thời tiết (Trung bình)", order: 7, words: ["sun", "moon", "cloud", "rain", "snow", "wind", "storm", "rainbow", "lightning", "thunder", "fog", "star", "sky", "breeze", "mist", "hail", "sunshine", "drizzle", "hurricane"] },
  { worldKey: "forest", title: "Bài 9: Đi cắm trại (Trung bình)", order: 8, words: ["tent", "campfire", "backpack", "flashlight", "map", "compass", "rope", "boots", "lantern", "canoe", "trail", "cabin", "blanket", "matches", "whistle", "hammock", "kettle", "paddle", "binoculars"] },
  { worldKey: "forest", title: "Bài 10: Bò sát và lưỡng cư (Trung bình)", order: 9, words: ["snake", "lizard", "turtle", "frog", "toad", "crocodile", "alligator", "gecko", "iguana", "chameleon", "newt", "salamander", "tortoise", "python", "cobra", "viper", "dinosaur", "tadpole", "skink"] },

  { worldKey: "town", title: "Bài 4: Các toà nhà (Trung bình)", order: 3, words: ["house", "apartment", "tower", "factory", "warehouse", "skyscraper", "cottage", "cabin", "mansion", "garage", "shed", "barn", "mall", "stadium", "theater", "palace", "cathedral", "lighthouse", "windmill"] },
  { worldKey: "town", title: "Bài 5: Cửa hàng quanh ta (Trung bình)", order: 4, words: ["bakery", "bookstore", "toy store", "pharmacy", "supermarket", "butcher shop", "florist", "jewelry store", "shoe store", "pet store", "candy store", "barber shop", "laundromat", "gas station", "car wash", "ice cream shop", "coffee shop", "flower shop", "bike shop"] },
  { worldKey: "town", title: "Bài 6: Phương tiện giao thông (Trung bình)", order: 5, words: ["car", "bus", "bike", "motorbike", "train", "taxi", "truck", "subway", "scooter", "ambulance", "fire truck", "van", "tram", "ferry", "helicopter", "plane", "boat", "ship", "cable car"] },
  { worldKey: "town", title: "Bài 7: Gia đình và bạn bè (Trung bình)", order: 6, words: ["mother", "father", "sister", "brother", "grandmother", "grandfather", "aunt", "uncle", "cousin", "baby", "friend", "neighbor", "classmate", "driver", "dentist", "nurse", "pilot", "sailor", "artist"] },
  { worldKey: "town", title: "Bài 8: Cuộc sống thành phố (Trung bình)", order: 7, words: ["traffic light", "sidewalk", "crosswalk", "street", "sign", "lamp post", "bench", "fountain", "statue", "trash can", "mailbox", "fire hydrant", "bus stop", "parking lot", "elevator", "escalator", "alley", "plaza", "tunnel"] },
  { worldKey: "town", title: "Bài 9: Dụng cụ thể thao (Trung bình)", order: 8, words: ["soccer ball", "basketball", "tennis racket", "swimming pool", "running shoes", "dance shoes", "paintbrush", "microphone", "storybook", "sketchbook", "bicycle", "skateboard", "chessboard", "cooking pot", "garden hose", "camera", "jump rope", "surfboard", "fishing rod"] },
  { worldKey: "town", title: "Bài 10: Trang phục hằng ngày (Trung bình)", order: 9, words: ["shirt", "pants", "dress", "skirt", "shoe", "sock", "hat", "jacket", "coat", "glove", "scarf", "belt", "sweater", "shorts", "boot", "sandal", "T-shirt", "pajama", "button"] },

  { worldKey: "beach", title: "Bài 4: Sinh vật dưới biển (Trung bình)", order: 3, words: ["fish", "shark", "dolphin", "crab", "starfish", "jellyfish", "octopus", "shrimp", "clam", "seahorse", "seagull", "pelican", "turtle", "whale", "seaweed", "coral", "anemone", "urchin", "barnacle"] },
  { worldKey: "beach", title: "Bài 5: Trái cây nhiệt đới (Trung bình)", order: 4, words: ["apple", "banana", "orange", "grape", "strawberry", "mango", "pineapple", "watermelon", "peach", "cherry", "kiwi", "lemon", "lime", "coconut", "papaya", "blueberry", "raspberry", "pear", "plum"] },
  { worldKey: "beach", title: "Bài 6: Đồ uống và ăn vặt (Trung bình)", order: 5, words: ["juice", "water", "milk", "lemonade", "smoothie", "popsicle", "ice cream", "cookie", "chips", "sandwich", "pretzel", "popcorn", "muffin", "donut", "cracker", "yogurt", "milkshake", "soda", "cupcake"] },
  { worldKey: "beach", title: "Bài 7: Thời tiết bốn mùa (Trung bình)", order: 6, words: ["sunny", "rainy", "cloudy", "windy", "snowy", "hot", "cold", "warm", "cool", "stormy", "humid", "foggy", "breezy", "spring", "summer", "autumn", "winter", "dry", "wet"] },
  { worldKey: "beach", title: "Bài 8: Đồ dùng đi biển (Trung bình)", order: 7, words: ["towel", "umbrella", "sunscreen", "sunglasses", "swimsuit", "flip-flops", "bucket", "shovel", "beach ball", "cooler", "hat", "chair", "mat", "snorkel", "goggles", "life jacket", "kite", "camera", "sunhat"] },
  { worldKey: "beach", title: "Bài 9: Vui chơi ở biển (Trung bình)", order: 8, words: ["kayak", "surfboard", "paddle", "volleyball", "fishing rod", "jump rope", "inner tube", "snorkel mask", "diving fins", "wetsuit", "sailboat", "jet ski", "raft", "picnic basket", "frisbee", "sandcastle", "boogie board", "anchor", "compass"] },
  { worldKey: "beach", title: "Bài 10: Cảnh quan bờ biển (Trung bình)", order: 9, words: ["wave", "sand", "shell", "rock", "cliff", "cave", "tide", "current", "horizon", "dune", "lagoon", "reef", "pier", "dock", "lighthouse", "harbor", "island", "bay", "shore"] },

  { worldKey: "school", title: "Bài 4: Đồ dùng lớp học nâng cao (Trung bình)", order: 3, words: ["eraser", "scissors", "glue", "crayon", "marker", "chalk", "stapler", "backpack", "notebook", "textbook", "folder", "envelope", "pencil case", "highlighter", "paperclip", "tape", "calculator", "whiteboard", "projector"] },
  { worldKey: "school", title: "Bài 5: Các môn học (Trung bình)", order: 4, words: ["math", "science", "english", "art", "music", "history", "geography", "reading", "writing", "spelling", "gym", "computer", "drama", "biology", "chemistry", "physics", "literature", "geometry", "algebra"] },
  { worldKey: "school", title: "Bài 6: Các khu vực trong trường (Trung bình)", order: 5, words: ["classroom", "library", "playground", "cafeteria", "gym", "office", "hallway", "auditorium", "laboratory", "nurse's office", "principal's office", "restroom", "locker room", "staff room", "garden", "parking lot", "entrance", "staircase", "rooftop"] },
  { worldKey: "school", title: "Bài 7: Số lớn hơn (Trung bình)", order: 6, words: ["eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety", "hundred", "thousand"] },
  { worldKey: "school", title: "Bài 8: Các hình khối (Trung bình)", order: 7, words: ["circle", "square", "triangle", "rectangle", "star", "heart", "oval", "diamond", "pentagon", "hexagon", "octagon", "cube", "sphere", "cylinder", "cone", "arrow", "cross", "spiral", "zigzag"] },
  { worldKey: "school", title: "Bài 9: Mọi người trong trường (Trung bình)", order: 8, words: ["teacher", "student", "principal", "classmate", "librarian", "coach", "janitor", "nurse", "counselor", "bus driver", "headmaster", "tutor", "professor", "pupil", "monitor", "assistant", "guard", "cook", "receptionist"] },
  { worldKey: "school", title: "Bài 10: Sự kiện ở trường (Trung bình)", order: 9, words: ["field trip", "sports day", "art show", "science fair", "graduation", "assembly", "recess", "exam", "homework", "prize", "trophy", "medal", "certificate", "competition", "presentation", "group project", "book fair", "talent show", "spelling bee"] },

  { worldKey: "castle", title: "Bài 4: Hoàng tộc (Trung bình)", order: 3, words: ["king", "queen", "prince", "princess", "duke", "duchess", "baron", "knight", "lord", "lady", "heir", "royal guard", "chancellor", "page", "squire", "jester", "herald", "courtier", "noble"] },
  { worldKey: "castle", title: "Bài 5: Sinh vật phép thuật (Trung bình)", order: 4, words: ["dragon", "unicorn", "fairy", "witch", "wizard", "giant", "troll", "goblin", "elf", "dwarf", "mermaid", "phoenix", "griffin", "centaur", "ghost", "ogre", "sprite", "gnome", "pixie"] },
  { worldKey: "castle", title: "Bài 6: Các khu vực lâu đài (Trung bình)", order: 5, words: ["tower", "gate", "wall", "moat", "drawbridge", "dungeon", "throne room", "courtyard", "chapel", "battlement", "turret", "keep", "staircase", "hall", "chamber", "balcony", "garden", "stable", "watchtower"] },
  { worldKey: "castle", title: "Bài 7: Bảo vật trong truyện (Trung bình)", order: 6, words: ["sword", "shield", "crown", "wand", "potion", "treasure chest", "map", "scroll", "key", "mirror", "lantern", "cape", "armor", "bow and arrow", "spear", "banner", "goblet", "ring", "amulet"] },
  { worldKey: "castle", title: "Bài 8: Sự kiện trong lâu đài (Trung bình)", order: 7, words: ["feast", "tournament", "coronation", "wedding", "parade", "festival", "ceremony", "celebration", "battle", "siege", "quest", "journey", "victory", "hunt", "ball", "banquet", "procession", "duel", "contest"] },
  { worldKey: "castle", title: "Bài 9: Muông thú trong truyện cổ (Trung bình)", order: 8, words: ["horse", "falcon", "wolf", "owl", "raven", "bear", "lion", "eagle", "stag", "boar", "hound", "swan", "peacock", "hawk", "fox", "deer", "rabbit", "badger", "hare"] },
  { worldKey: "castle", title: "Bài 10: Nghề nghiệp thời xưa (Trung bình)", order: 9, words: ["blacksmith", "farmer", "baker", "weaver", "carpenter", "miller", "tailor", "cobbler", "merchant", "minstrel", "healer", "scribe", "guard", "hunter", "fisherman", "potter", "mason", "shepherd", "innkeeper"] },

  { worldKey: "space", title: "Bài 4: Các hành tinh (Trung bình)", order: 3, words: ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Moon", "Sun", "asteroid", "meteor", "comet", "satellite", "star", "galaxy", "nebula", "black hole"] },
  { worldKey: "space", title: "Bài 5: Thiết bị du hành (Trung bình)", order: 4, words: ["rocket", "spaceship", "astronaut", "space station", "spacesuit", "helmet", "launch pad", "capsule", "satellite dish", "control room", "mission", "orbit", "gravity", "spacewalk", "countdown", "engine", "fuel", "cockpit", "radar"] },
  { worldKey: "space", title: "Bài 6: Người ngoài hành tinh và robot (Trung bình)", order: 5, words: ["alien", "robot", "android", "UFO", "Martian", "extraterrestrial", "cyborg", "drone", "hologram", "laser", "probe", "rover", "telescope", "antenna", "transmitter", "scanner", "beam", "monitor", "sensor"] },
  { worldKey: "space", title: "Bài 7: Khoa học Trái Đất (Trung bình)", order: 6, words: ["volcano", "earthquake", "tornado", "hurricane", "glacier", "desert", "ocean", "mountain", "valley", "canyon", "island", "continent", "equator", "pole", "atmosphere", "climate", "temperature", "pressure", "magnetic field"] },
  { worldKey: "space", title: "Bài 8: Con số nâng cao (Trung bình)", order: 7, words: ["zero", "hundred", "thousand", "million", "billion", "half", "quarter", "double", "triple", "plus", "minus", "equal", "count", "measure", "distance", "speed", "size", "weight", "height"] },
  { worldKey: "space", title: "Bài 9: Thời gian trong vũ trụ (Trung bình)", order: 8, words: ["eclipse", "sunrise", "sunset", "midnight", "dawn", "dusk", "horizon", "calendar", "clock", "timer", "hourglass", "century", "decade", "season", "cycle", "phase", "orbit period", "light year", "stopwatch"] },
  { worldKey: "space", title: "Bài 10: Nghề nghiệp khoa học (Trung bình)", order: 9, words: ["scientist", "engineer", "pilot", "commander", "researcher", "technician", "navigator", "explorer", "inventor", "physicist", "astronomer", "geologist", "biologist", "chemist", "mathematician", "professor", "captain", "crew member", "specialist"] },

  // Exam-prep starters. These deliberately stop at vocabulary-focused B2/C1
  // rather than pretending the existing image-MCQ engine can assess full
  // IELTS/TOEIC writing, speaking or C2 reasoning.
  { worldKey: "ielts", title: "IELTS 1 · Environment (B1)", order: 0, words: ["climate", "temperature", "ocean", "forest", "desert", "glacier", "storm", "hurricane", "volcano", "earthquake", "river", "island", "continent", "atmosphere", "rain", "snow", "wind", "sunshine", "water"] },
  { worldKey: "ielts", title: "IELTS 2 · Education & Research (B1)", order: 1, words: ["student", "teacher", "professor", "researcher", "library", "laboratory", "textbook", "exam", "presentation", "certificate", "graduation", "science", "history", "literature", "writing", "reading", "computer", "projector", "calculator"] },
  { worldKey: "ielts", title: "IELTS 3 · Science & Technology (B2)", order: 2, words: ["scientist", "engineer", "inventor", "technician", "robot", "satellite", "telescope", "scanner", "sensor", "transmitter", "computer", "hologram", "drone", "radar", "rocket", "physics", "biology", "chemistry", "researcher"] },
  { worldKey: "ielts", title: "IELTS 4 · Society & Infrastructure (B2)", order: 3, words: ["hospital", "school", "factory", "warehouse", "airport", "bridge", "tunnel", "station", "market", "bank", "library", "stadium", "theater", "apartment", "skyscraper", "sidewalk", "crosswalk", "traffic light", "bus stop"] },

  { worldKey: "toeic", title: "TOEIC 1 · Office Basics (A2)", order: 0, words: ["computer", "desk", "chair", "notebook", "pen", "pencil", "folder", "calendar", "clock", "calculator", "stapler", "paperclip", "envelope", "printer", "projector", "telephone", "button", "monitor", "office"] },
  { worldKey: "toeic", title: "TOEIC 2 · People at Work (A2)", order: 1, words: ["manager", "assistant", "receptionist", "driver", "engineer", "technician", "researcher", "doctor", "nurse", "chef", "teacher", "pilot", "sailor", "artist", "carpenter", "tailor", "baker", "farmer", "guard"] },
  { worldKey: "toeic", title: "TOEIC 3 · Business Travel (B1)", order: 2, words: ["airport", "hotel", "train", "taxi", "bus", "subway", "plane", "ferry", "station", "passport", "suitcase", "map", "ticket", "calendar", "clock", "bridge", "tunnel", "car", "helicopter"] },
  { worldKey: "toeic", title: "TOEIC 4 · Meetings & Logistics (B2)", order: 3, words: ["presentation", "projector", "microphone", "warehouse", "factory", "truck", "ship", "package", "certificate", "calculator", "calendar", "office", "manager", "assistant", "engineer", "monitor", "scanner", "telephone", "airport"] },
];

/**
 * Lessons per world (Forest excluded — its Bài 1 stays in the separate
 * FOREST_QUESTIONS block above untouched; its Bài 2/3 live here alongside
 * everyone else's). Originally 1 lesson/world ("Bài 1"); expanded
 * (2026-08-28, per user request "thiết kế bài học theo chủ đề, theo lv từ
 * thấp đến cao") to 3 lessons/world — real difficulty progression using the
 * EXISTING `order` field (no schema/mechanism change, per user's own
 * decision): "Bài 1" (đã có sẵn) mixes cross-category distractors (easy to
 * eliminate wrong answers even without knowing the word); "Bài 2" narrows
 * every question's distractors to the SAME semantic category (all animals,
 * all foods...) — genuinely harder, guessing no longer works; "Bài 3" adds
 * attribute/purpose-based questions ("Which one can fly?", "Where do you buy
 * bread?") on top of same-category distractors, +1-2 more questions than
 * Bài 1/2. Titles for Bài 2/3 end in "(Trung bình)"/"(Khó)" so the level is
 * legible straight from `WorldLessons.tsx`'s picker (plain title list, no
 * numeric badge). `order` (0/1/2) is what the picker actually sorts by —
 * see the seeding loop below, which used to hardcode `order: 0` for every
 * entry (harmless when each world had exactly 1 lesson, but would leave
 * Bài 1/2/3 in unstable order once a world has more than one).
 */
const WORLD_LESSONS: { worldKey: string; title: string; order: number; questions: { prompt: string; hint: string; answer: string; options: string[] }[] }[] = [
  {
    worldKey: "town",
    title: "Bài 1: Quanh khu phố",
    order: 0,
    questions: [
      { prompt: "Find the park!", hint: "Nghe rồi chọn hình đúng", answer: "Park", options: ["Park", "Hospital", "Market", "Bridge"] },
      { prompt: "Which one is a hospital?", hint: "Tap the picture", answer: "Hospital", options: ["School", "Hospital", "Airport", "Bakery"] },
      { prompt: "Find the market!", hint: "Nghe rồi chọn hình đúng", answer: "Market", options: ["Market", "Museum", "Church", "Village"] },
      { prompt: "Which one is a bridge?", hint: "Tap the picture", answer: "Bridge", options: ["Bridge", "Street", "Station", "Playground"] },
      { prompt: "Find the airport!", hint: "Nghe rồi chọn hình đúng", answer: "Airport", options: ["Airport", "Hotel", "City", "Farm"] },
    ],
  },
  {
    worldKey: "beach",
    title: "Bài 1: Một ngày ở biển",
    order: 0,
    questions: [
      { prompt: "Find the sea!", hint: "Nghe rồi chọn hình đúng", answer: "Sea", options: ["Sea", "Mountain", "Forest", "Desert"] },
      { prompt: "Which one is a wave?", hint: "Tap the picture", answer: "Wave", options: ["Wave", "Cloud", "Rock", "Sand"] },
      { prompt: "Find the sun!", hint: "Nghe rồi chọn hình đúng", answer: "Sun", options: ["Sun", "Moon", "Star", "Rain"] },
      { prompt: "Which one is ice cream?", hint: "Tap the picture", answer: "Ice Cream", options: ["Ice Cream", "Watermelon", "Bread", "Egg"] },
      { prompt: "Find the watermelon!", hint: "Nghe rồi chọn hình đúng", answer: "Watermelon", options: ["Watermelon", "Mango", "Lemon", "Peach"] },
    ],
  },
  {
    worldKey: "school",
    title: "Bài 1: Đồ dùng học tập",
    order: 0,
    questions: [
      { prompt: "Find the pencil!", hint: "Nghe rồi chọn hình đúng", answer: "Pencil", options: ["Pencil", "Pen", "Eraser", "Ruler"] },
      { prompt: "Which one is a book?", hint: "Tap the picture", answer: "Book", options: ["Book", "Notebook", "Bag", "Chair"] },
      { prompt: "Find the ruler!", hint: "Nghe rồi chọn hình đúng", answer: "Ruler", options: ["Ruler", "Scissors", "Glue", "Crayon"] },
      { prompt: "Which number is three?", hint: "Tap the picture", answer: "Three", options: ["Two", "Three", "Four", "Five"] },
      { prompt: "Find the number five!", hint: "Nghe rồi chọn hình đúng", answer: "Five", options: ["Five", "One", "Six", "Ten"] },
    ],
  },
  {
    worldKey: "castle",
    title: "Bài 1: Lâu đài cổ tích",
    order: 0,
    questions: [
      { prompt: "Find the king!", hint: "Nghe rồi chọn hình đúng", answer: "King", options: ["King", "Queen", "Knight", "Dragon"] },
      { prompt: "Which one is a queen?", hint: "Tap the picture", answer: "Queen", options: ["Queen", "Princess", "King", "Knight"] },
      { prompt: "Find the dragon!", hint: "Nghe rồi chọn hình đúng", answer: "Dragon", options: ["Dragon", "Knight", "Castle", "Queen"] },
      { prompt: "Which one is a knight?", hint: "Tap the picture", answer: "Knight", options: ["Knight", "King", "Dragon", "Castle"] },
      { prompt: "Find the castle!", hint: "Nghe rồi chọn hình đúng", answer: "Castle", options: ["Castle", "Village", "Bridge", "Forest"] },
    ],
  },
  {
    worldKey: "space",
    title: "Bài 1: Khám phá vũ trụ",
    order: 0,
    questions: [
      { prompt: "Find the star!", hint: "Nghe rồi chọn hình đúng", answer: "Star", options: ["Star", "Moon", "Sun", "Cloud"] },
      { prompt: "Which one is the moon?", hint: "Tap the picture", answer: "Moon", options: ["Moon", "Star", "Planet", "Rocket"] },
      { prompt: "Find the rocket!", hint: "Nghe rồi chọn hình đúng", answer: "Rocket", options: ["Rocket", "Plane", "Helicopter", "Ship"] },
      { prompt: "Which one is an astronaut?", hint: "Tap the picture", answer: "Astronaut", options: ["Astronaut", "Pilot", "Doctor", "Scientist"] },
      { prompt: "Find the planet!", hint: "Nghe rồi chọn hình đúng", answer: "Planet", options: ["Planet", "Star", "Earth", "Moon"] },
    ],
  },

  // ---- Bài 2 (Trung bình) — same world, harder: distractors from the SAME
  // semantic category as the answer, so cross-category guessing no longer works.
  {
    worldKey: "forest",
    title: "Bài 2: Muông thú trong rừng (Trung bình)",
    order: 1,
    questions: [
      { prompt: "Find the deer!", hint: "Nghe rồi chọn hình đúng", answer: "Deer", options: ["Deer", "Fox", "Owl", "Squirrel"] },
      { prompt: "Which one is an owl?", hint: "Tap the picture", answer: "Owl", options: ["Fox", "Owl", "Deer", "Rabbit"] },
      { prompt: "Find the squirrel!", hint: "Nghe rồi chọn hình đúng", answer: "Squirrel", options: ["Squirrel", "Fox", "Owl", "Deer"] },
      { prompt: "Which one is a fox?", hint: "Tap the picture", answer: "Fox", options: ["Rabbit", "Fox", "Owl", "Deer"] },
      { prompt: "Find the butterfly!", hint: "Nghe rồi chọn hình đúng", answer: "Butterfly", options: ["Butterfly", "Bee", "Ant", "Spider"] },
      { prompt: "Which one is a bee?", hint: "Tap the picture", answer: "Bee", options: ["Ant", "Bee", "Spider", "Butterfly"] },
    ],
  },
  {
    worldKey: "town",
    title: "Bài 2: Những người trong thị trấn (Trung bình)",
    order: 1,
    questions: [
      { prompt: "Find the police officer!", hint: "Nghe rồi chọn hình đúng", answer: "Police Officer", options: ["Police Officer", "Doctor", "Firefighter", "Teacher"] },
      { prompt: "Which one is a doctor?", hint: "Tap the picture", answer: "Doctor", options: ["Nurse", "Doctor", "Dentist", "Teacher"] },
      { prompt: "Find the firefighter!", hint: "Nghe rồi chọn hình đúng", answer: "Firefighter", options: ["Firefighter", "Police Officer", "Farmer", "Chef"] },
      { prompt: "Which one is a chef?", hint: "Tap the picture", answer: "Chef", options: ["Chef", "Waiter", "Baker", "Farmer"] },
      { prompt: "Find the mailman!", hint: "Nghe rồi chọn hình đúng", answer: "Mailman", options: ["Mailman", "Driver", "Pilot", "Sailor"] },
      { prompt: "Which one is a farmer?", hint: "Tap the picture", answer: "Farmer", options: ["Farmer", "Fisherman", "Chef", "Baker"] },
    ],
  },
  {
    worldKey: "beach",
    title: "Bài 2: Đồ ăn ngày hè (Trung bình)",
    order: 1,
    questions: [
      { prompt: "Find the mango!", hint: "Nghe rồi chọn hình đúng", answer: "Mango", options: ["Mango", "Lemon", "Peach", "Grapes"] },
      { prompt: "Which one is a lemon?", hint: "Tap the picture", answer: "Lemon", options: ["Lemon", "Mango", "Orange", "Peach"] },
      { prompt: "Find the coconut!", hint: "Nghe rồi chọn hình đúng", answer: "Coconut", options: ["Coconut", "Pineapple", "Mango", "Banana"] },
      { prompt: "Which one is a pineapple?", hint: "Tap the picture", answer: "Pineapple", options: ["Pineapple", "Coconut", "Watermelon", "Grapes"] },
      { prompt: "Find the popsicle!", hint: "Nghe rồi chọn hình đúng", answer: "Popsicle", options: ["Popsicle", "Ice Cream", "Cake", "Candy"] },
      { prompt: "Which one is juice?", hint: "Tap the picture", answer: "Juice", options: ["Juice", "Milk", "Water", "Soup"] },
    ],
  },
  {
    worldKey: "school",
    title: "Bài 2: Trong lớp học (Trung bình)",
    order: 1,
    questions: [
      { prompt: "Find the eraser!", hint: "Nghe rồi chọn hình đúng", answer: "Eraser", options: ["Eraser", "Scissors", "Glue", "Crayon"] },
      { prompt: "Which one is scissors?", hint: "Tap the picture", answer: "Scissors", options: ["Scissors", "Glue", "Eraser", "Stapler"] },
      { prompt: "Find the crayon!", hint: "Nghe rồi chọn hình đúng", answer: "Crayon", options: ["Crayon", "Marker", "Chalk", "Pen"] },
      { prompt: "Which one is a backpack?", hint: "Tap the picture", answer: "Backpack", options: ["Backpack", "Desk", "Chair", "Board"] },
      { prompt: "Find the notebook!", hint: "Nghe rồi chọn hình đúng", answer: "Notebook", options: ["Notebook", "Textbook", "Folder", "Envelope"] },
      { prompt: "Which one is chalk?", hint: "Tap the picture", answer: "Chalk", options: ["Chalk", "Crayon", "Marker", "Pencil"] },
    ],
  },
  {
    worldKey: "castle",
    title: "Bài 2: Nhân vật cổ tích (Trung bình)",
    order: 1,
    questions: [
      { prompt: "Find the princess!", hint: "Nghe rồi chọn hình đúng", answer: "Princess", options: ["Princess", "Prince", "Witch", "Fairy"] },
      { prompt: "Which one is a wizard?", hint: "Tap the picture", answer: "Wizard", options: ["Wizard", "Witch", "King", "Knight"] },
      { prompt: "Find the fairy!", hint: "Nghe rồi chọn hình đúng", answer: "Fairy", options: ["Fairy", "Witch", "Princess", "Queen"] },
      { prompt: "Which one is a giant?", hint: "Tap the picture", answer: "Giant", options: ["Giant", "Dwarf", "Elf", "Knight"] },
      { prompt: "Find the witch!", hint: "Nghe rồi chọn hình đúng", answer: "Witch", options: ["Witch", "Fairy", "Queen", "Princess"] },
      { prompt: "Which one is a prince?", hint: "Tap the picture", answer: "Prince", options: ["Prince", "King", "Knight", "Wizard"] },
    ],
  },
  {
    worldKey: "space",
    title: "Bài 2: Hệ mặt trời (Trung bình)",
    order: 1,
    questions: [
      { prompt: "Find Earth!", hint: "Nghe rồi chọn hình đúng", answer: "Earth", options: ["Earth", "Mars", "Venus", "Jupiter"] },
      { prompt: "Which one is Mars?", hint: "Tap the picture", answer: "Mars", options: ["Mars", "Earth", "Saturn", "Mercury"] },
      { prompt: "Find the Sun!", hint: "Nghe rồi chọn hình đúng", answer: "Sun", options: ["Sun", "Moon", "Star", "Planet"] },
      { prompt: "Which planet has rings?", hint: "Tap the picture", answer: "Saturn", options: ["Saturn", "Mars", "Earth", "Venus"] },
      { prompt: "Find the comet!", hint: "Nghe rồi chọn hình đúng", answer: "Comet", options: ["Comet", "Star", "Moon", "Rocket"] },
      { prompt: "Which one is a galaxy?", hint: "Tap the picture", answer: "Galaxy", options: ["Galaxy", "Planet", "Star", "Comet"] },
    ],
  },

  // ---- Bài 3 (Khó) — same world, hardest: mixes attribute/purpose questions
  // ("Which one can fly?", "Where do you buy bread?") with same-category
  // distractors, +1-2 more questions than Bài 1/2.
  {
    worldKey: "forest",
    title: "Bài 3: Thiên nhiên kỳ diệu (Khó)",
    order: 2,
    questions: [
      { prompt: "Which one can fly?", hint: "Tap the picture", answer: "Butterfly", options: ["Butterfly", "Turtle", "Snail", "Frog"] },
      { prompt: "Find the waterfall!", hint: "Nghe rồi chọn hình đúng", answer: "Waterfall", options: ["Waterfall", "Lake", "Pond", "Swamp"] },
      { prompt: "Which one is green?", hint: "Tap the picture", answer: "Leaf", options: ["Leaf", "Rock", "Sand", "Cloud"] },
      { prompt: "Find the mushroom!", hint: "Nghe rồi chọn hình đúng", answer: "Mushroom", options: ["Mushroom", "Flower", "Bush", "Vine"] },
      { prompt: "Which animal lives in water?", hint: "Tap the picture", answer: "Fish", options: ["Fish", "Bird", "Fox", "Deer"] },
      { prompt: "Find the nest!", hint: "Nghe rồi chọn hình đúng", answer: "Nest", options: ["Nest", "Cave", "Hole", "Web"] },
      { prompt: "Which one is the tallest?", hint: "Tap the picture", answer: "Tree", options: ["Tree", "Flower", "Grass", "Mushroom"] },
    ],
  },
  {
    worldKey: "town",
    title: "Bài 3: Đi khắp thị trấn (Khó)",
    order: 2,
    questions: [
      { prompt: "Where do you buy bread?", hint: "Tap the picture", answer: "Bakery", options: ["Bakery", "Library", "Bank", "Gym"] },
      { prompt: "Find the library!", hint: "Nghe rồi chọn hình đúng", answer: "Library", options: ["Library", "Bank", "Bakery", "Museum"] },
      { prompt: "Where do you borrow books?", hint: "Tap the picture", answer: "Library", options: ["Library", "Market", "Hospital", "Station"] },
      { prompt: "Find the bank!", hint: "Nghe rồi chọn hình đúng", answer: "Bank", options: ["Bank", "Hotel", "Church", "Gym"] },
      { prompt: "Where do people sleep when traveling?", hint: "Tap the picture", answer: "Hotel", options: ["Hotel", "School", "Farm", "Church"] },
      { prompt: "Find the train station!", hint: "Nghe rồi chọn hình đúng", answer: "Station", options: ["Station", "Airport", "Port", "Bridge"] },
      { prompt: "Where do you go to pray?", hint: "Tap the picture", answer: "Church", options: ["Church", "Gym", "Bank", "Market"] },
    ],
  },
  {
    worldKey: "beach",
    title: "Bài 3: Thời tiết mùa hè (Khó)",
    order: 2,
    questions: [
      { prompt: "Which one is hot?", hint: "Tap the picture", answer: "Sun", options: ["Sun", "Moon", "Rain", "Snow"] },
      { prompt: "Find the umbrella!", hint: "Nghe rồi chọn hình đúng", answer: "Umbrella", options: ["Umbrella", "Towel", "Hat", "Bag"] },
      { prompt: "Which weather is windy?", hint: "Tap the picture", answer: "Wind", options: ["Wind", "Rain", "Sun", "Snow"] },
      { prompt: "Find the sandcastle!", hint: "Nghe rồi chọn hình đúng", answer: "Sandcastle", options: ["Sandcastle", "Shell", "Rock", "Boat"] },
      { prompt: "Which one do you wear to swim?", hint: "Tap the picture", answer: "Swimsuit", options: ["Swimsuit", "Coat", "Boots", "Scarf"] },
      { prompt: "Find the shell!", hint: "Nghe rồi chọn hình đúng", answer: "Shell", options: ["Shell", "Rock", "Coral", "Star"] },
      { prompt: "Which one floats on water?", hint: "Tap the picture", answer: "Boat", options: ["Boat", "Rock", "Anchor", "Shell"] },
    ],
  },
  {
    worldKey: "school",
    title: "Bài 3: Đếm số (Khó)",
    order: 2,
    questions: [
      { prompt: "Which number is seven?", hint: "Tap the picture", answer: "Seven", options: ["Six", "Seven", "Eight", "Nine"] },
      { prompt: "Find the number ten!", hint: "Nghe rồi chọn hình đúng", answer: "Ten", options: ["Ten", "Nine", "Eleven", "Twelve"] },
      { prompt: "Which number is twenty?", hint: "Tap the picture", answer: "Twenty", options: ["Twelve", "Twenty", "Two", "Twenty-two"] },
      { prompt: "Find the number fifty!", hint: "Nghe rồi chọn hình đúng", answer: "Fifty", options: ["Fifty", "Fifteen", "Fourteen", "Forty"] },
      { prompt: "Which one comes after eight?", hint: "Tap the picture", answer: "Nine", options: ["Nine", "Seven", "Ten", "Eight"] },
      { prompt: "Find the number one hundred!", hint: "Nghe rồi chọn hình đúng", answer: "Hundred", options: ["Hundred", "Ten", "Thousand", "Fifty"] },
      { prompt: "Which number is the smallest?", hint: "Tap the picture", answer: "One", options: ["One", "Ten", "Five", "Three"] },
    ],
  },
  {
    worldKey: "castle",
    title: "Bài 3: Phiêu lưu trong lâu đài (Khó)",
    order: 2,
    questions: [
      { prompt: "Which one can fly?", hint: "Tap the picture", answer: "Dragon", options: ["Dragon", "Horse", "Knight", "Giant"] },
      { prompt: "Find the sword!", hint: "Nghe rồi chọn hình đúng", answer: "Sword", options: ["Sword", "Shield", "Crown", "Wand"] },
      { prompt: "Which one protects the king?", hint: "Tap the picture", answer: "Knight", options: ["Knight", "Farmer", "Baker", "Fairy"] },
      { prompt: "Find the crown!", hint: "Nghe rồi chọn hình đúng", answer: "Crown", options: ["Crown", "Sword", "Shield", "Wand"] },
      { prompt: "Which one has magic?", hint: "Tap the picture", answer: "Wizard", options: ["Wizard", "Knight", "Farmer", "Guard"] },
      { prompt: "Find the tower!", hint: "Nghe rồi chọn hình đúng", answer: "Tower", options: ["Tower", "Bridge", "Gate", "Wall"] },
      { prompt: "Which one guards the gate?", hint: "Tap the picture", answer: "Guard", options: ["Guard", "Baker", "Farmer", "Fairy"] },
    ],
  },
  {
    worldKey: "space",
    title: "Bài 3: Du hành vũ trụ (Khó)",
    order: 2,
    questions: [
      { prompt: "Which one travels in space?", hint: "Tap the picture", answer: "Spaceship", options: ["Spaceship", "Car", "Boat", "Train"] },
      { prompt: "Find the space station!", hint: "Nghe rồi chọn hình đúng", answer: "Space Station", options: ["Space Station", "Rocket", "Satellite", "Planet"] },
      { prompt: "Which one orbits Earth?", hint: "Tap the picture", answer: "Satellite", options: ["Satellite", "Comet", "Sun", "Galaxy"] },
      { prompt: "Find the alien!", hint: "Nghe rồi chọn hình đúng", answer: "Alien", options: ["Alien", "Astronaut", "Robot", "Pilot"] },
      { prompt: "Which one has no air?", hint: "Tap the picture", answer: "Space", options: ["Space", "Ocean", "Forest", "Desert"] },
      { prompt: "Find the helmet!", hint: "Nghe rồi chọn hình đúng", answer: "Helmet", options: ["Helmet", "Hat", "Crown", "Cap"] },
      { prompt: "Which one is a robot?", hint: "Tap the picture", answer: "Robot", options: ["Robot", "Alien", "Astronaut", "Pilot"] },
    ],
  },
];

// Append the 42 bulk-generated lessons (see WORLD_BONUS_TOPICS/genQuestions
// above) onto the hand-written ones — .push() mutates in place, `const` only
// blocks reassignment, so this is safe.
for (const t of WORLD_BONUS_TOPICS) {
  WORLD_LESSONS.push({ worldKey: t.worldKey, title: t.title, order: t.order, questions: genQuestions(t.words) });
}

// 10 chủ đề × 20 từ cho màn "Chủ đề" (Topics.tsx / SRS). Vocab.worldId is not
// a real FK (see schema.prisma) — reused here as a free-form topic key.
// Tuple: [en, vi, ja, ko].
const VOCAB_TOPICS: Record<string, [string, string, string, string][]> = {
  animals: [
    ["dog", "chó", "犬", "개"], ["cat", "mèo", "猫", "고양이"], ["rabbit", "thỏ", "うさぎ", "토끼"], ["bird", "chim", "鳥", "새"], ["fish", "cá", "魚", "물고기"],
    ["elephant", "voi", "象", "코끼리"], ["lion", "sư tử", "ライオン", "사자"], ["tiger", "hổ", "虎", "호랑이"], ["bear", "gấu", "熊", "곰"], ["monkey", "khỉ", "猿", "원숭이"],
    ["horse", "ngựa", "馬", "말"], ["cow", "bò", "牛", "소"], ["pig", "lợn", "豚", "돼지"], ["duck", "vịt", "アヒル", "오리"], ["chicken", "gà", "鶏", "닭"],
    ["sheep", "cừu", "羊", "양"], ["frog", "ếch", "カエル", "개구리"], ["snake", "rắn", "蛇", "뱀"], ["turtle", "rùa", "カメ", "거북이"], ["butterfly", "bướm", "蝶", "나비"],
  ],
  colors: [
    ["red", "đỏ", "赤", "빨강"], ["blue", "xanh dương", "青", "파랑"], ["green", "xanh lá", "緑", "초록"], ["yellow", "vàng", "黄色", "노랑"], ["orange", "cam", "オレンジ", "주황"],
    ["purple", "tím", "紫", "보라"], ["pink", "hồng", "ピンク", "분홍"], ["black", "đen", "黒", "검정"], ["white", "trắng", "白", "하양"], ["brown", "nâu", "茶色", "갈색"],
    ["gray", "xám", "灰色", "회색"], ["gold", "vàng kim", "金色", "금색"], ["silver", "bạc", "銀色", "은색"], ["sky blue", "xanh da trời", "空色", "하늘색"], ["dark green", "xanh đậm", "深緑", "진초록"],
    ["light blue", "xanh nhạt", "水色", "연파랑"], ["cream", "kem", "クリーム色", "크림색"], ["beige", "be", "ベージュ", "베이지"], ["turquoise", "ngọc lam", "ターコイズ", "청록색"], ["maroon", "đỏ mận", "えんじ色", "밤색"],
  ],
  numbers: [
    ["one", "một", "一", "하나"], ["two", "hai", "二", "둘"], ["three", "ba", "三", "셋"], ["four", "bốn", "四", "넷"], ["five", "năm", "五", "다섯"],
    ["six", "sáu", "六", "여섯"], ["seven", "bảy", "七", "일곱"], ["eight", "tám", "八", "여덟"], ["nine", "chín", "九", "아홉"], ["ten", "mười", "十", "열"],
    ["eleven", "mười một", "十一", "열하나"], ["twelve", "mười hai", "十二", "열둘"], ["twenty", "hai mươi", "二十", "스물"], ["thirty", "ba mươi", "三十", "서른"], ["forty", "bốn mươi", "四十", "마흔"],
    ["fifty", "năm mươi", "五十", "쉰"], ["hundred", "một trăm", "百", "백"], ["thousand", "một nghìn", "千", "천"], ["first", "thứ nhất", "一番目", "첫째"], ["second", "thứ hai", "二番目", "둘째"],
  ],
  family: [
    ["mother", "mẹ", "母", "어머니"], ["father", "bố", "父", "아버지"], ["sister", "chị/em gái", "姉/妹", "언니/여동생"], ["brother", "anh/em trai", "兄/弟", "오빠/남동생"], ["grandmother", "bà", "祖母", "할머니"],
    ["grandfather", "ông", "祖父", "할아버지"], ["aunt", "cô/dì", "おば", "이모/고모"], ["uncle", "chú/bác", "おじ", "삼촌"], ["cousin", "anh chị em họ", "いとこ", "사촌"], ["baby", "em bé", "赤ちゃん", "아기"],
    ["parents", "bố mẹ", "両親", "부모님"], ["son", "con trai", "息子", "아들"], ["daughter", "con gái", "娘", "딸"], ["husband", "chồng", "夫", "남편"], ["wife", "vợ", "妻", "아내"],
    ["family", "gia đình", "家族", "가족"], ["twin", "sinh đôi", "双子", "쌍둥이"], ["niece", "cháu gái", "姪", "조카딸"], ["nephew", "cháu trai", "甥", "조카"], ["relative", "người thân", "親戚", "친척"],
  ],
  food: [
    ["apple", "táo", "りんご", "사과"], ["banana", "chuối", "バナナ", "바나나"], ["bread", "bánh mì", "パン", "빵"], ["rice", "cơm", "ご飯", "밥"], ["milk", "sữa", "牛乳", "우유"],
    ["egg", "trứng", "卵", "계란"], ["chicken", "thịt gà", "鶏肉", "닭고기"], ["fish", "cá", "魚", "생선"], ["vegetable", "rau", "野菜", "채소"], ["fruit", "trái cây", "果物", "과일"],
    ["water", "nước", "水", "물"], ["juice", "nước ép", "ジュース", "주스"], ["cake", "bánh ngọt", "ケーキ", "케이크"], ["candy", "kẹo", "キャンディ", "사탕"], ["soup", "súp", "スープ", "수프"],
    ["noodles", "mì", "麺", "국수"], ["cheese", "phô mai", "チーズ", "치즈"], ["butter", "bơ", "バター", "버터"], ["honey", "mật ong", "はちみつ", "꿀"], ["ice cream", "kem", "アイスクリーム", "아이스크림"],
  ],
  weather: [
    ["sunny", "nắng", "晴れ", "맑음"], ["rainy", "mưa", "雨", "비"], ["cloudy", "nhiều mây", "曇り", "흐림"], ["windy", "có gió", "風が強い", "바람이 붊"], ["snowy", "có tuyết", "雪", "눈"],
    ["hot", "nóng", "暑い", "더움"], ["cold", "lạnh", "寒い", "추움"], ["warm", "ấm", "暖かい", "따뜻함"], ["cool", "mát", "涼しい", "시원함"], ["storm", "bão", "嵐", "폭풍"],
    ["thunder", "sấm", "雷", "천둥"], ["lightning", "sét", "稲妻", "번개"], ["rainbow", "cầu vồng", "虹", "무지개"], ["fog", "sương mù", "霧", "안개"], ["humid", "ẩm ướt", "湿気が多い", "습함"],
    ["temperature", "nhiệt độ", "気温", "기온"], ["season", "mùa", "季節", "계절"], ["spring", "mùa xuân", "春", "봄"], ["summer", "mùa hè", "夏", "여름"], ["winter", "mùa đông", "冬", "겨울"],
  ],
  school: [
    ["book", "sách", "本", "책"], ["pen", "bút mực", "ペン", "펜"], ["pencil", "bút chì", "鉛筆", "연필"], ["eraser", "cục tẩy", "消しゴム", "지우개"], ["ruler", "thước kẻ", "定規", "자"],
    ["bag", "cặp sách", "かばん", "가방"], ["desk", "bàn học", "机", "책상"], ["chair", "ghế", "椅子", "의자"], ["teacher", "giáo viên", "先生", "선생님"], ["student", "học sinh", "生徒", "학생"],
    ["classroom", "lớp học", "教室", "교실"], ["blackboard", "bảng đen", "黒板", "칠판"], ["notebook", "vở", "ノート", "공책"], ["scissors", "kéo", "はさみ", "가위"], ["glue", "keo dán", "のり", "풀"],
    ["crayon", "bút sáp màu", "クレヨン", "크레용"], ["homework", "bài tập về nhà", "宿題", "숙제"], ["lesson", "bài học", "授業", "수업"], ["exam", "bài kiểm tra", "試験", "시험"], ["library", "thư viện", "図書館", "도서관"],
  ],
  body: [
    ["head", "đầu", "頭", "머리"], ["hair", "tóc", "髪", "머리카락"], ["eye", "mắt", "目", "눈"], ["ear", "tai", "耳", "귀"], ["nose", "mũi", "鼻", "코"],
    ["mouth", "miệng", "口", "입"], ["teeth", "răng", "歯", "이"], ["hand", "bàn tay", "手", "손"], ["finger", "ngón tay", "指", "손가락"], ["arm", "cánh tay", "腕", "팔"],
    ["leg", "chân", "脚", "다리"], ["foot", "bàn chân", "足", "발"], ["shoulder", "vai", "肩", "어깨"], ["back", "lưng", "背中", "등"], ["stomach", "bụng", "おなか", "배"],
    ["knee", "đầu gối", "ひざ", "무릎"], ["neck", "cổ", "首", "목"], ["chin", "cằm", "あご", "턱"], ["elbow", "khuỷu tay", "ひじ", "팔꿈치"], ["heart", "tim", "心臓", "심장"],
  ],
  clothes: [
    ["shirt", "áo sơ mi", "シャツ", "셔츠"], ["pants", "quần dài", "ズボン", "바지"], ["dress", "váy", "ワンピース", "원피스"], ["skirt", "chân váy", "スカート", "치마"], ["shoe", "giày", "靴", "신발"],
    ["sock", "tất", "靴下", "양말"], ["hat", "mũ", "帽子", "모자"], ["jacket", "áo khoác", "ジャケット", "재킷"], ["coat", "áo choàng", "コート", "코트"], ["glove", "găng tay", "手袋", "장갑"],
    ["scarf", "khăn quàng cổ", "マフラー", "목도리"], ["belt", "thắt lưng", "ベルト", "벨트"], ["T-shirt", "áo thun", "Tシャツ", "티셔츠"], ["shorts", "quần short", "半ズボン", "반바지"], ["sweater", "áo len", "セーター", "스웨터"],
    ["pajama", "đồ ngủ", "パジャマ", "잠옷"], ["boot", "ủng", "ブーツ", "부츠"], ["sandal", "dép", "サンダル", "샌들"], ["button", "cúc áo", "ボタン", "단추"], ["pocket", "túi áo", "ポケット", "주머니"],
  ],
  transport: [
    ["car", "ô tô", "車", "자동차"], ["bus", "xe buýt", "バス", "버스"], ["bike", "xe đạp", "自転車", "자전거"], ["motorbike", "xe máy", "バイク", "오토바이"], ["train", "tàu hoả", "電車", "기차"],
    ["plane", "máy bay", "飛行機", "비행기"], ["boat", "thuyền", "ボート", "보트"], ["ship", "tàu thuỷ", "船", "배"], ["taxi", "taxi", "タクシー", "택시"], ["truck", "xe tải", "トラック", "트럭"],
    ["subway", "tàu điện ngầm", "地下鉄", "지하철"], ["helicopter", "trực thăng", "ヘリコプター", "헬리콥터"], ["scooter", "xe scooter", "スクーター", "스쿠터"], ["ambulance", "xe cứu thương", "救急車", "구급차"], ["fire truck", "xe cứu hỏa", "消防車", "소방차"],
    ["ferry", "phà", "フェリー", "페리"], ["rocket", "tên lửa", "ロケット", "로켓"], ["van", "xe van", "バン", "밴"], ["tram", "xe điện", "路面電車", "트램"], ["cable car", "cáp treo", "ロープウェー", "케이블카"],
  ],
};

type ItemEffect = { stat: "hunger" | "happiness" | "health" | "coins" | "experience" | "resetLevel" | "renamePet" | "renameUser"; delta: number };
type ItemCategory = "food" | "toy" | "accessory" | "special";

// Mirrors frontend/src/pages/Bag.tsx's old BAG_DATA mock, now the real
// admin-managed catalog. defaultQty = the starting quantity every new child
// gets (see createChild() in child.service.ts). "Đồ ăn"→hunger,
// "Sức khoẻ"→health, "Vui vẻ"→happiness, "Coin"→coins; "Phong cách"
// (accessories) and the XP/Tim tickets (special) are flavor-only for now —
// no XP/hearts persistence exists yet to hook them into.
const ITEMS: { key: string; name: string; category: ItemCategory; color: string; radius: string; description: string; effects: ItemEffect[]; defaultQty: number; price?: number; currency?: "coin" | "gem"; imagePath?: string }[] = [
  { key: "banh-quy-buddy", name: "Bánh quy Buddy", category: "food", color: "#E8A94D", radius: "18px", description: "Giảm đói nhẹ và nhận 8 XP.", effects: [{ stat: "hunger", delta: 15 }, { stat: "experience", delta: 8 }], defaultQty: 0, price: 30, currency: "coin", imagePath: "/items/food/buddy-cookie.webp" },
  { key: "com-ga-cau-vong", name: "Cơm gà cầu vồng", category: "food", color: "#F7C95C", radius: "999px", description: "Bữa ăn no lâu, hồi 35 đồ ăn và nhận 18 XP.", effects: [{ stat: "hunger", delta: 35 }, { stat: "health", delta: 5 }, { stat: "experience", delta: 18 }], defaultQty: 0, price: 80, currency: "coin", imagePath: "/items/food/rainbow-chicken-bowl.webp" },
  { key: "sua-sao-kim-cuong", name: "Sữa sao kim cương", category: "food", color: "#70D7F2", radius: "16px", description: "Sữa phép thuật giúp pet nhận nhanh 100 XP.", effects: [{ stat: "hunger", delta: 20 }, { stat: "experience", delta: 100 }], defaultQty: 0, price: 12, currency: "gem", imagePath: "/items/food/diamond-star-milk.webp" },
  { key: "banh-tang-cap", name: "Bánh tăng cấp", category: "food", color: "#9B7EDE", radius: "999px", description: "Bánh hiếm giúp pet nhận ngay 300 XP.", effects: [{ stat: "hunger", delta: 30 }, { stat: "happiness", delta: 15 }, { stat: "experience", delta: 300 }], defaultQty: 0, price: 30, currency: "gem", imagePath: "/items/food/level-up-cake.webp" },
  { key: "kem-may-dau", name: "Kem mây dâu", category: "food", color: "#F69AB5", radius: "18px", description: "Ly kem mát lành — hồi 20 đồ ăn và 12 vui vẻ.", effects: [{ stat: "hunger", delta: 20 }, { stat: "happiness", delta: 12 }], defaultQty: 0, price: 35, currency: "coin", imagePath: "/items/food/strawberry-cloud-parfait.webp" },
  { key: "sup-bi-trang", name: "Súp bí trăng", category: "food", color: "#E99635", radius: "999px", description: "Bữa tối ấm áp — hồi 30 đồ ăn và 15 sức khoẻ.", effects: [{ stat: "hunger", delta: 30 }, { stat: "health", delta: 15 }], defaultQty: 0, price: 75, currency: "coin", imagePath: "/items/food/moon-pumpkin-soup.webp" },
  { key: "cupcake-pha-le", name: "Cupcake pha lê", category: "food", color: "#9C78E7", radius: "18px", description: "Bánh phép thuật — nhận 180 XP và 15 vui vẻ.", effects: [{ stat: "happiness", delta: 15 }, { stat: "experience", delta: 180 }], defaultQty: 0, price: 20, currency: "gem", imagePath: "/items/food/crystal-berry-cupcake.webp" },
  { key: "ca-sao-vang", name: "Cá sao vàng", category: "food", color: "#F2A43C", radius: "999px", description: "Món hoàng gia — hồi 45 đồ ăn, 20 sức khoẻ và nhận 80 XP.", effects: [{ stat: "hunger", delta: 45 }, { stat: "health", delta: 20 }, { stat: "experience", delta: 80 }], defaultQty: 0, price: 14, currency: "gem", imagePath: "/items/food/golden-starfish-steak.webp" },
  { key: "sakura-mochi", name: "Sakura Mochi", category: "food", color: "#F4A9BD", radius: "999px", description: "Bánh gạo hoa anh đào Nhật Bản — hồi 18 đồ ăn và 10 vui vẻ.", effects: [{ stat: "hunger", delta: 18 }, { stat: "happiness", delta: 10 }], defaultQty: 0, price: 40, currency: "coin", imagePath: "/items/food/sakura-mochi.webp" },
  { key: "taiyaki", name: "Taiyaki", category: "food", color: "#DFA451", radius: "18px", description: "Bánh cá nhân đậu đỏ Nhật Bản — hồi 25 đồ ăn và 8 sức khoẻ.", effects: [{ stat: "hunger", delta: 25 }, { stat: "health", delta: 8 }], defaultQty: 0, price: 55, currency: "coin", imagePath: "/items/food/taiyaki.webp" },
  { key: "songpyeon", name: "Songpyeon", category: "food", color: "#87C88B", radius: "999px", description: "Bánh gạo lễ Chuseok Hàn Quốc — hồi 20 đồ ăn và 12 vui vẻ.", effects: [{ stat: "hunger", delta: 20 }, { stat: "happiness", delta: 12 }], defaultQty: 0, price: 45, currency: "coin", imagePath: "/items/food/songpyeon.webp" },
  { key: "bungeoppang", name: "Bungeoppang", category: "food", color: "#E5A55F", radius: "18px", description: "Bánh cá đường phố Hàn Quốc — hồi 28 đồ ăn và 10 sức khoẻ.", effects: [{ stat: "hunger", delta: 28 }, { stat: "health", delta: 10 }], defaultQty: 0, price: 65, currency: "coin", imagePath: "/items/food/bungeoppang.webp" },
  // Vật phẩm test/dev — làm pet đói ngay lập tức để kiểm thử trạng thái
  // "đói" (speech bubble, cảnh báo...) mà không phải chờ hunger tự giảm.
  // Giá 1 coin theo yêu cầu; KHÔNG dùng ở bản thật, chỉ để test.
  { key: "bong", name: "Bóng", category: "toy", color: "#7CC24A", radius: "999px", description: "Ném bóng để chơi cùng pet.", effects: [{ stat: "happiness", delta: 15 }], defaultQty: 1 },
  { key: "chuot-bong", name: "Chuột bông", category: "toy", color: "#B3A691", radius: "14px", description: "Mèo cực thích.", effects: [{ stat: "happiness", delta: 12 }], defaultQty: 2 },
  { key: "dem-ngu", name: "Đệm ngủ", category: "toy", color: "#9B7EDE", radius: "16px", description: "Ngủ ngon hồi nhiều sức khoẻ hơn.", effects: [{ stat: "health", delta: 20 }], defaultQty: 1 },
  { key: "ban-cau-truot", name: "Bàn cầu trượt", category: "toy", color: "#57C6C6", radius: "10px", description: "Đồ chơi lớn, dùng ở sân sau.", effects: [{ stat: "happiness", delta: 22 }], defaultQty: 1 },
  { key: "mu-do", name: "Mũ đỏ", category: "accessory", color: "#EF6A5A", radius: "999px 999px 6px 6px", description: "Phụ kiện đầu, đội quanh năm.", effects: [], defaultQty: 1 },
  { key: "no-hong", name: "Nơ hồng", category: "accessory", color: "#F79BB0", radius: "999px", description: "Gắn ở cổ hoặc tai.", effects: [], defaultQty: 2 },
  { key: "kinh-ram", name: "Kính râm", category: "accessory", color: "#5C7BC9", radius: "4px", description: "Cho pet vẻ ngoài ngầu.", effects: [], defaultQty: 1 },
  { key: "khan-xanh", name: "Khăn xanh", category: "accessory", color: "#57C6C6", radius: "8px", description: "Ấm áp cho mùa đông.", effects: [], defaultQty: 3 },
  { key: "ve-xp", name: "Vé XP x2", category: "special", color: "#FFC93C", radius: "8px", description: "Nhân đôi XP trong 30 phút.", effects: [], defaultQty: 2 },
  { key: "ve-hoi-tim", name: "Vé hồi tim", category: "special", color: "#EF6A5A", radius: "999px", description: "Hồi đầy tim khi làm bài.", effects: [], defaultQty: 3 },
  { key: "tui-coin", name: "Túi coin", category: "special", color: "#F2A81C", radius: "12px", description: "Mở ra nhận 200 coin.", effects: [{ stat: "coins", delta: 200 }], defaultQty: 1 },
  { key: "dong-ho-tai-sinh", name: "Đồng hồ tái sinh", category: "special", color: "#57C6C6", radius: "999px", description: "Đưa pet đang đồng hành về Level 1 và 0 XP. Chỉ reset cấp, không làm mất chỉ số chăm sóc.", effects: [{ stat: "resetLevel", delta: 1 }], defaultQty: 0, price: 999, currency: "gem", imagePath: "/items/special/rebirth-clock.webp" },
  { key: "ve-doi-ten-pet", name: "Vé đổi tên pet", category: "special", color: "#42C7D7", radius: "16px", description: "Đổi tên cho pet đang đồng hành. Mỗi vé sử dụng được một lần.", effects: [{ stat: "renamePet", delta: 1 }], defaultQty: 0, price: 25, currency: "gem", imagePath: "/items/special/pet-rename-ticket.webp" },
  { key: "the-doi-ten-ho-so", name: "Thẻ đổi tên hồ sơ", category: "special", color: "#F47D7D", radius: "16px", description: "Đổi tên hiển thị của bạn. Mỗi thẻ sử dụng được một lần.", effects: [{ stat: "renameUser", delta: 1 }], defaultQty: 0, price: 49, currency: "gem", imagePath: "/items/special/profile-rename-card.webp" },
  { key: "background-hoang-hon", name: "Lâu đài hoàng hôn", category: "accessory", color: "#F29A5A", radius: "18px", description: "Vương quốc vàng trên đồi dưới ánh hoàng hôn.", effects: [], defaultQty: 0, price: 350, currency: "coin", imagePath: "/backgrounds/home-castle-sunset-v1.webp" },
  { key: "background-hoa-anh-dao", name: "Thung lũng hoa", category: "accessory", color: "#F3A9C7", radius: "18px", description: "Cổng trăng, suối mơ và hoa anh đào rực rỡ.", effects: [], defaultQty: 0, price: 650, currency: "coin", imagePath: "/backgrounds/home-cherry-valley-v1.webp" },
  { key: "background-lang-tuyet", name: "Làng tuyết", category: "accessory", color: "#B8E5F5", radius: "18px", description: "Ngôi làng mùa đông bên lâu đài pha lê.", effects: [], defaultQty: 0, price: 35, currency: "gem", imagePath: "/backgrounds/home-snow-village-v1.webp" },
  { key: "background-rung-phep-thuat", name: "Lâu đài huyền ảo", category: "accessory", color: "#8D72CB", radius: "18px", description: "Rừng trăng tím ma mị với lâu đài cổ và nấm phát sáng.", effects: [], defaultQty: 0, price: 70, currency: "gem", imagePath: "/backgrounds/home-mystic-castle-v1.webp" },
  { key: "background-cung-dien-bien", name: "Cung điện đại dương", category: "accessory", color: "#48CDE0", radius: "18px", description: "Vương quốc ngọc trai dưới làn nước xanh trong.", effects: [], defaultQty: 0, price: 900, currency: "coin", imagePath: "/backgrounds/home-underwater-palace-v1.webp" },
  { key: "background-dao-tren-may", name: "Đảo bay trên mây", category: "accessory", color: "#8FCDF1", radius: "18px", description: "Cầu vồng và lâu đài giữa những hòn đảo lơ lửng.", effects: [], defaultQty: 0, price: 60, currency: "gem", imagePath: "/backgrounds/home-sky-islands-v1.webp" },
  { key: "background-vuong-quoc-keo", name: "Vương quốc kẹo", category: "accessory", color: "#F49BC3", radius: "18px", description: "Lâu đài bánh ngọt và khu vườn kẹo đầy màu sắc.", effects: [], defaultQty: 0, price: 1200, currency: "coin", imagePath: "/backgrounds/home-candy-kingdom-v1.webp" },
];

// Mirrors frontend/src/pages/QuestStreak.tsx's old QUEST_DATA mock — minus
// "Ôn 10 từ cũ" (wordsReviewed), dropped for now since Topics/SrsCard aren't
// wired to real SRS review data yet, so it can never honestly be completed.
// trackKind drives real progress (see quest.service.ts's bumpQuestProgress —
// lessons/miniGame from client-confirmed completion, petCare straight from
// careForPet()); admin can add more via /admin once other actions are trackable.
type QuestTrackKind = "lessons" | "miniGame" | "petCare";
const DAILY_QUESTS: { key: string; title: string; trackKind: QuestTrackKind; target: number; rewardCoins: number; color: string }[] = [
  { key: "daily-lessons", title: "Học 2 bài học", trackKind: "lessons", target: 2, rewardCoins: 40, color: "#F5822B" },
  { key: "daily-minigame", title: "Chơi 1 mini-game", trackKind: "miniGame", target: 1, rewardCoins: 25, color: "#7CC24A" },
  { key: "daily-petcare", title: "Chăm pet 3 lần", trackKind: "petCare", target: 3, rewardCoins: 20, color: "#57C6C6" },
];

// ---------------------------------------------------------------------------
// Stories (Đọc truyện) — mirrors the old single hard-coded PAGES array in
// frontend/src/pages/Story.tsx, now 10 stories so the reader shows a list to
// pick from first. img1/img2 reuse existing Pet.key art (see PETS above) —
// same "cast of 40 mascots plays every part" convention already used by
// MiniGame/PetCollection/Rank, no new art assets needed.
// ---------------------------------------------------------------------------
type StoryWordSeed = [string, string, string, string, string]; // en, vi, ja, ko, color
type StoryPageSeed = { en: string; vi: string; ja: string; ko: string; img1: string; img2: string; label: string; sceneBg: string; ground: string; words: StoryWordSeed[] };
type StorySeed = { key: string; title: string; topic: string; colorTheme: string; pages: StoryPageSeed[] };

const STORIES: StorySeed[] = [
  {
    key: "farm",
    title: "Buddy Goes to the Farm",
    topic: "Animals & Nature",
    colorTheme: "#7CC24A",
    pages: [
      {
        en: 'Buddy opens the gate. "Good morning, farm!"',
        vi: 'Buddy mở cổng. "Chào buổi sáng, nông trại!"',
        ja: "バディが門を開けます。「おはよう、農場!」",
        ko: '버디가 문을 엽니다. "좋은 아침이야, 농장!"',
        img1: "buddy",
        img2: "ducky",
        label: "Cổng nông trại",
        sceneBg: "#DCEFC8",
        ground: "#8CC85A",
        words: [
          ["gate", "cái cổng", "門", "문", "#F5822B"],
          ["morning", "buổi sáng", "朝", "아침", "#57C6C6"],
          ["farm", "nông trại", "農場", "농장", "#7CC24A"],
        ],
      },
      {
        en: 'A duck says hello. "Quack! Do you want some corn?"',
        vi: 'Một con vịt chào. "Quạc! Bạn có muốn ăn ngô không?"',
        ja: "アヒルが挨拶します。「ガーガー!とうもろこし食べる?」",
        ko: '오리가 인사합니다. "꽥! 옥수수 먹을래?"',
        img1: "ducky",
        img2: "buddy",
        label: "Bên hồ nước",
        sceneBg: "#CFEAF6",
        ground: "#7FBEE0",
        words: [
          ["duck", "con vịt", "アヒル", "오리", "#F2A81C"],
          ["hello", "xin chào", "こんにちは", "안녕", "#F79BB0"],
          ["corn", "bắp ngô", "とうもろこし", "옥수수", "#FFC93C"],
        ],
      },
      {
        en: "They walk to the barn. Three cows are eating grass.",
        vi: "Hai bạn đi tới chuồng. Ba con bò đang ăn cỏ.",
        ja: "二人は納屋へ歩いていきます。三頭の牛が草を食べています。",
        ko: "둘은 헛간으로 걸어갑니다. 소 세 마리가 풀을 먹고 있어요.",
        img1: "coco",
        img2: "buddy",
        label: "Chuồng bò",
        sceneBg: "#F3E2C8",
        ground: "#C79A62",
        words: [
          ["barn", "nhà kho", "納屋", "헛간", "#8A5A3B"],
          ["cow", "con bò", "牛", "소", "#B3A691"],
          ["grass", "cỏ", "草", "풀", "#7CC24A"],
        ],
      },
      {
        en: "The sun is hot. Buddy finds water in a big bucket.",
        vi: "Trời nắng nóng. Buddy tìm thấy nước trong cái xô lớn.",
        ja: "太陽が熱いです。バディは大きなバケツの中に水を見つけます。",
        ko: "해가 뜨거워요. 버디는 큰 양동이에서 물을 찾아요.",
        img1: "buddy",
        img2: "mimi",
        label: "Giữa trưa",
        sceneBg: "#FFE9C9",
        ground: "#E8B96A",
        words: [
          ["sun", "mặt trời", "太陽", "해", "#FFC93C"],
          ["water", "nước", "水", "물", "#57C6C6"],
          ["bucket", "cái xô", "バケツ", "양동이", "#5C7BC9"],
        ],
      },
      {
        en: 'A cat jumps down from the roof. "Can I play too?"',
        vi: 'Một con mèo nhảy xuống từ mái nhà. "Tớ chơi cùng được không?"',
        ja: "猫が屋根から飛び降ります。「僕も遊んでいい?」",
        ko: '고양이가 지붕에서 뛰어내려요. "나도 같이 놀아도 돼?"',
        img1: "mimi",
        img2: "buddy",
        label: "Mái nhà kho",
        sceneBg: "#DCEFC8",
        ground: "#6FB544",
        words: [
          ["cat", "con mèo", "猫", "고양이", "#F79BB0"],
          ["jump", "nhảy", "跳ぶ", "뛰다", "#9B7EDE"],
          ["roof", "mái nhà", "屋根", "지붕", "#EF6A5A"],
        ],
      },
      {
        en: 'The sky turns orange. "See you tomorrow, farm!"',
        vi: 'Trời chuyển màu cam. "Hẹn gặp lại ngày mai, nông trại!"',
        ja: "空がオレンジ色になります。「また明日ね、農場!」",
        ko: '하늘이 주황색으로 변해요. "내일 또 봐, 농장!"',
        img1: "buddy",
        img2: "ducky",
        label: "Chiều tà",
        sceneBg: "#FFD9B0",
        ground: "#C98A4A",
        words: [
          ["sky", "bầu trời", "空", "하늘", "#5C7BC9"],
          ["orange", "màu cam", "オレンジ色", "주황색", "#F5822B"],
          ["tomorrow", "ngày mai", "明日", "내일", "#57C6C6"],
        ],
      },
    ],
  },
  {
    key: "rainy-day",
    title: "A Rainy Day",
    topic: "Weather",
    colorTheme: "#57C6C6",
    pages: [
      {
        en: "Mimi looks out the window. \"Oh no, it's raining!\"",
        vi: 'Mimi nhìn ra cửa sổ. "Ôi không, trời đang mưa!"',
        ja: "ミミが窓の外を見ます。「あら大変、雨が降ってる!」",
        ko: '미미가 창밖을 봐요. "이런, 비가 오고 있어!"',
        img1: "mimi",
        img2: "poppy",
        label: "Bên cửa sổ",
        sceneBg: "#CFEAF6",
        ground: "#7FBEE0",
        words: [
          ["rain", "mưa", "雨", "비", "#57C6C6"],
          ["window", "cửa sổ", "窓", "창문", "#5C7BC9"],
          ["cloud", "đám mây", "雲", "구름", "#B9C4CC"],
        ],
      },
      {
        en: 'Poppy brings a big yellow umbrella. "Let\'s go outside!"',
        vi: 'Poppy mang theo một chiếc ô vàng to. "Cùng ra ngoài nào!"',
        ja: "ポピーが大きな黄色い傘を持ってきます。「外に行こう!」",
        ko: '포피가 크고 노란 우산을 가져와요. "밖으로 나가자!"',
        img1: "poppy",
        img2: "mimi",
        label: "Trước hiên nhà",
        sceneBg: "#EAF6FF",
        ground: "#C9E5F7",
        words: [
          ["umbrella", "cái ô", "傘", "우산", "#FFC93C"],
          ["yellow", "màu vàng", "黄色", "노란색", "#FFC93C"],
          ["outside", "bên ngoài", "外", "밖", "#7CC24A"],
        ],
      },
      {
        en: "They jump into a puddle. Splash! Their boots get wet.",
        vi: "Hai bạn nhảy vào vũng nước. Tõm! Đôi ủng bị ướt.",
        ja: "二人は水たまりに飛び込みます。ジャブン!長靴が濡れます。",
        ko: "둘은 물웅덩이로 뛰어들어요. 첨벙! 장화가 젖어요.",
        img1: "mimi",
        img2: "poppy",
        label: "Vũng nước",
        sceneBg: "#DCEFC8",
        ground: "#7FBEE0",
        words: [
          ["puddle", "vũng nước", "水たまり", "물웅덩이", "#57C6C6"],
          ["boot", "ủng", "長靴", "장화", "#8A5A3B"],
          ["wet", "ướt", "濡れた", "젖은", "#5C7BC9"],
        ],
      },
      {
        en: 'After the rain, a rainbow appears. "It\'s so beautiful!"',
        vi: 'Sau cơn mưa, cầu vồng xuất hiện. "Đẹp quá đi!"',
        ja: "雨の後、虹が現れます。「とてもきれい!」",
        ko: '비가 온 뒤, 무지개가 나타나요. "정말 예쁘다!"',
        img1: "poppy",
        img2: "mimi",
        label: "Cầu vồng",
        sceneBg: "#FFE9C9",
        ground: "#E8B96A",
        words: [
          ["rainbow", "cầu vồng", "虹", "무지개", "#9B7EDE"],
          ["beautiful", "đẹp", "きれいな", "예쁜", "#F79BB0"],
          ["after", "sau khi", "後で", "~후에", "#F5822B"],
        ],
      },
    ],
  },
  {
    key: "birthday-party",
    title: "Lily's Birthday Party",
    topic: "Family & Celebration",
    colorTheme: "#F79BB0",
    pages: [
      {
        en: "Today is Lily's birthday! \"Happy birthday, Lily!\"",
        vi: 'Hôm nay là sinh nhật Lily! "Chúc mừng sinh nhật, Lily!"',
        ja: "今日はリリーの誕生日です!「誕生日おめでとう、リリー!」",
        ko: '오늘은 릴리의 생일이에요! "생일 축하해, 릴리!"',
        img1: "coco",
        img2: "waffle",
        label: "Cửa nhà Lily",
        sceneBg: "#FDF0EC",
        ground: "#F6C3BB",
        words: [
          ["birthday", "sinh nhật", "誕生日", "생일", "#EF6A5A"],
          ["today", "hôm nay", "今日", "오늘", "#F5822B"],
          ["happy", "vui vẻ", "嬉しい", "행복한", "#7CC24A"],
        ],
      },
      {
        en: "There is a big cake with five candles on the table.",
        vi: "Có một chiếc bánh to với năm ngọn nến trên bàn.",
        ja: "テーブルの上に、ろうそくが5本ある大きなケーキがあります。",
        ko: "테이블 위에 초 다섯 개가 꽂힌 큰 케이크가 있어요.",
        img1: "waffle",
        img2: "coco",
        label: "Bàn tiệc",
        sceneBg: "#FFF1DE",
        ground: "#F5C88F",
        words: [
          ["cake", "bánh kem", "ケーキ", "케이크", "#F79BB0"],
          ["candle", "ngọn nến", "ろうそく", "초", "#FFC93C"],
          ["table", "cái bàn", "テーブル", "테이블", "#8A5A3B"],
        ],
      },
      {
        en: 'Everyone sings together. "Blow out the candles, Lily!"',
        vi: 'Mọi người cùng hát. "Thổi nến đi, Lily!"',
        ja: "みんなで一緒に歌います。「ろうそくを吹き消して、リリー!」",
        ko: '모두 함께 노래해요. "촛불을 꺼, 릴리!"',
        img1: "coco",
        img2: "waffle",
        label: "Hát mừng sinh nhật",
        sceneBg: "#F1EAFB",
        ground: "#DDCFF5",
        words: [
          ["sing", "hát", "歌う", "노래하다", "#9B7EDE"],
          ["candle", "ngọn nến", "ろうそく", "초", "#FFC93C"],
          ["blow", "thổi", "吹く", "불다", "#57C6C6"],
        ],
      },
      {
        en: "Lily opens her presents. She gets a new red bike!",
        vi: "Lily mở quà. Bạn ấy nhận được một chiếc xe đạp đỏ mới!",
        ja: "リリーはプレゼントを開けます。新しい赤い自転車をもらいました!",
        ko: "릴리가 선물을 열어요. 새 빨간 자전거를 받았어요!",
        img1: "waffle",
        img2: "coco",
        label: "Mở quà",
        sceneBg: "#EEF9E3",
        ground: "#CDE7B4",
        words: [
          ["present", "món quà", "プレゼント", "선물", "#F5822B"],
          ["open", "mở", "開ける", "열다", "#5C7BC9"],
          ["bike", "xe đạp", "自転車", "자전거", "#EF6A5A"],
        ],
      },
    ],
  },
  {
    key: "first-day-school",
    title: "My First Day at School",
    topic: "School",
    colorTheme: "#6C8FE3",
    pages: [
      {
        en: 'Milky puts a book and a pencil in her bag. "I\'m ready!"',
        vi: 'Milky bỏ một quyển sách và một cây bút chì vào cặp. "Mình sẵn sàng rồi!"',
        ja: "ミルキーはかばんに本と鉛筆を入れます。「準備できた!」",
        ko: '밀키가 가방에 책과 연필을 넣어요. "준비됐어!"',
        img1: "milky",
        img2: "biscuit",
        label: "Ở nhà buổi sáng",
        sceneBg: "#EAF6FF",
        ground: "#C9E5F7",
        words: [
          ["book", "quyển sách", "本", "책", "#5C7BC9"],
          ["pencil", "bút chì", "鉛筆", "연필", "#F5822B"],
          ["bag", "cặp sách", "かばん", "가방", "#8A5A3B"],
        ],
      },
      {
        en: 'At school, a teacher smiles. "Welcome to class!"',
        vi: 'Ở trường, cô giáo mỉm cười. "Chào mừng đến lớp học!"',
        ja: "学校で、先生が微笑みます。「クラスへようこそ!」",
        ko: '학교에서 선생님이 미소 지어요. "교실에 온 걸 환영해!"',
        img1: "biscuit",
        img2: "milky",
        label: "Cổng trường",
        sceneBg: "#FFF1DE",
        ground: "#F5C88F",
        words: [
          ["school", "trường học", "学校", "학교", "#F5822B"],
          ["teacher", "giáo viên", "先生", "선생님", "#9B7EDE"],
          ["class", "lớp học", "クラス", "교실", "#57C6C6"],
        ],
      },
      {
        en: "Milky sits at a small desk next to a new friend.",
        vi: "Milky ngồi ở một cái bàn nhỏ cạnh một người bạn mới.",
        ja: "ミルキーは新しい友達の隣の小さな机に座ります。",
        ko: "밀키는 새 친구 옆 작은 책상에 앉아요.",
        img1: "milky",
        img2: "biscuit",
        label: "Trong lớp học",
        sceneBg: "#F3E2C8",
        ground: "#C79A62",
        words: [
          ["desk", "bàn học", "机", "책상", "#8A5A3B"],
          ["friend", "người bạn", "友達", "친구", "#F79BB0"],
          ["sit", "ngồi", "座る", "앉다", "#7CC24A"],
        ],
      },
      {
        en: 'At the end of the day, Milky says, "See you tomorrow, school!"',
        vi: 'Cuối ngày, Milky nói, "Hẹn gặp lại ngày mai, trường học ơi!"',
        ja: "一日の終わりに、ミルキーは言います。「また明日ね、学校!」",
        ko: '하루가 끝날 때, 밀키가 말해요. "내일 또 보자, 학교야!"',
        img1: "biscuit",
        img2: "milky",
        label: "Tan trường",
        sceneBg: "#DCEFC8",
        ground: "#8CC85A",
        words: [
          ["end", "kết thúc", "終わり", "끝", "#5C7BC9"],
          ["day", "một ngày", "一日", "하루", "#FFC93C"],
          ["tomorrow", "ngày mai", "明日", "내일", "#57C6C6"],
        ],
      },
    ],
  },
  {
    key: "fruit-market",
    title: "The Fruit Market",
    topic: "Food",
    colorTheme: "#F2A81C",
    pages: [
      {
        en: "Cocoa and Smokey go to the market. \"Let's buy some fruit!\"",
        vi: 'Cocoa và Smokey đi ra chợ. "Cùng mua trái cây nào!"',
        ja: "ココアとスモーキーは市場へ行きます。「果物を買おう!」",
        ko: '코코아와 스모키가 시장에 가요. "과일 좀 사자!"',
        img1: "cocoa",
        img2: "smokey",
        label: "Cổng chợ",
        sceneBg: "#FFE9C9",
        ground: "#E8B96A",
        words: [
          ["market", "cái chợ", "市場", "시장", "#F2A81C"],
          ["fruit", "trái cây", "果物", "과일", "#7CC24A"],
          ["buy", "mua", "買う", "사다", "#5C7BC9"],
        ],
      },
      {
        en: "Smokey picks a red apple and a yellow banana.",
        vi: "Smokey chọn một quả táo đỏ và một quả chuối vàng.",
        ja: "スモーキーは赤いりんごと黄色いバナナを選びます。",
        ko: "스모키는 빨간 사과와 노란 바나나를 골라요.",
        img1: "smokey",
        img2: "cocoa",
        label: "Quầy trái cây",
        sceneBg: "#FDF0EC",
        ground: "#F6C3BB",
        words: [
          ["apple", "quả táo", "りんご", "사과", "#EF6A5A"],
          ["banana", "quả chuối", "バナナ", "바나나", "#FFC93C"],
          ["pick", "chọn", "選ぶ", "고르다", "#9B7EDE"],
        ],
      },
      {
        en: 'Cocoa smells an orange. "It smells so sweet!"',
        vi: 'Cocoa ngửi một quả cam. "Thơm ngọt quá!"',
        ja: "ココアはオレンジの匂いを嗅ぎます。「とても甘い匂い!」",
        ko: '코코아가 오렌지 냄새를 맡아요. "정말 달콤한 냄새야!"',
        img1: "cocoa",
        img2: "smokey",
        label: "Quầy cam",
        sceneBg: "#FFF1DE",
        ground: "#F5C88F",
        words: [
          ["orange", "quả cam", "オレンジ", "오렌지", "#F5822B"],
          ["sweet", "ngọt", "甘い", "달콤한", "#F79BB0"],
          ["smell", "ngửi", "匂いを嗅ぐ", "냄새를 맡다", "#57C6C6"],
        ],
      },
      {
        en: "They pay for the fruit and carry it home in a basket.",
        vi: "Hai bạn trả tiền và mang trái cây về nhà trong một cái giỏ.",
        ja: "二人は果物の代金を払い、かごに入れて家に持ち帰ります。",
        ko: "둘은 과일값을 내고 바구니에 담아 집으로 가져가요.",
        img1: "smokey",
        img2: "cocoa",
        label: "Trên đường về",
        sceneBg: "#EEF9E3",
        ground: "#CDE7B4",
        words: [
          ["pay", "trả tiền", "払う", "지불하다", "#5C7BC9"],
          ["basket", "cái giỏ", "かご", "바구니", "#8A5A3B"],
          ["home", "nhà", "家", "집", "#7CC24A"],
        ],
      },
    ],
  },
  {
    key: "bedtime",
    title: "Bedtime with Buddy",
    topic: "Bedtime",
    colorTheme: "#9B7EDE",
    pages: [
      {
        en: 'It is night time. "Time to take a bath, Pepper!"',
        vi: 'Trời đã tối. "Đến giờ tắm rồi, Pepper!"',
        ja: "夜になりました。「お風呂の時間だよ、ペッパー!」",
        ko: '밤이 되었어요. "목욕할 시간이야, 페퍼!"',
        img1: "pepper",
        img2: "misty",
        label: "Phòng tắm",
        sceneBg: "#EAF6FF",
        ground: "#C9E5F7",
        words: [
          ["night", "ban đêm", "夜", "밤", "#5C7BC9"],
          ["bath", "tắm", "お風呂", "목욕", "#57C6C6"],
          ["time", "thời gian", "時間", "시간", "#FFC93C"],
        ],
      },
      {
        en: "Pepper puts on soft pajamas and brushes her teeth.",
        vi: "Pepper mặc bộ đồ ngủ mềm mại và đánh răng.",
        ja: "ペッパーは柔らかいパジャマを着て、歯を磨きます。",
        ko: "페퍼는 부드러운 잠옷을 입고 이를 닦아요.",
        img1: "pepper",
        img2: "misty",
        label: "Trước gương",
        sceneBg: "#F1EAFB",
        ground: "#DDCFF5",
        words: [
          ["pajama", "đồ ngủ", "パジャマ", "잠옷", "#9B7EDE"],
          ["teeth", "răng", "歯", "이", "#F79BB0"],
          ["soft", "mềm mại", "柔らかい", "부드러운", "#7CC24A"],
        ],
      },
      {
        en: 'Misty reads a story. "Once upon a time..."',
        vi: 'Misty đọc một câu chuyện. "Ngày xửa ngày xưa..."',
        ja: "ミスティがお話を読みます。「昔々……」",
        ko: '미스티가 이야기를 읽어줘요. "옛날 옛적에……"',
        img1: "misty",
        img2: "pepper",
        label: "Trên giường",
        sceneBg: "#FFF1DE",
        ground: "#F5C88F",
        words: [
          ["story", "câu chuyện", "お話", "이야기", "#F5822B"],
          ["read", "đọc", "読む", "읽다", "#5C7BC9"],
          ["bed", "cái giường", "ベッド", "침대", "#8A5A3B"],
        ],
      },
      {
        en: 'Pepper closes her eyes. "Good night, Misty."',
        vi: 'Pepper nhắm mắt lại. "Chúc ngủ ngon, Misty."',
        ja: "ペッパーは目を閉じます。「おやすみ、ミスティ。」",
        ko: '페퍼가 눈을 감아요. "잘 자, 미스티."',
        img1: "pepper",
        img2: "misty",
        label: "Ngủ ngon",
        sceneBg: "#DCEFC8",
        ground: "#6FB544",
        words: [
          ["sleep", "ngủ", "眠る", "자다", "#9B7EDE"],
          ["eye", "đôi mắt", "目", "눈", "#57C6C6"],
          ["good night", "chúc ngủ ngon", "おやすみ", "잘 자", "#F79BB0"],
        ],
      },
    ],
  },
  {
    key: "trip-to-beach",
    title: "A Trip to the Beach",
    topic: "Beach & Summer",
    colorTheme: "#57C6C6",
    pages: [
      {
        en: 'Kiwi and Rosie arrive at the beach. "The sea is so big!"',
        vi: 'Kiwi và Rosie đến bãi biển. "Biển rộng quá!"',
        ja: "キウイとロージーがビーチに着きます。「海がとても大きい!」",
        ko: '키위와 로지가 해변에 도착해요. "바다가 정말 커!"',
        img1: "kiwi",
        img2: "rosie",
        label: "Bãi biển",
        sceneBg: "#CFEAF6",
        ground: "#7FBEE0",
        words: [
          ["beach", "bãi biển", "ビーチ", "해변", "#57C6C6"],
          ["sea", "biển", "海", "바다", "#5C7BC9"],
          ["big", "to lớn", "大きい", "큰", "#F5822B"],
        ],
      },
      {
        en: "They build a sandcastle with a red bucket and a shovel.",
        vi: "Hai bạn xây một lâu đài cát bằng một cái xô đỏ và cái xẻng.",
        ja: "二人は赤いバケツとスコップで砂のお城を作ります。",
        ko: "둘은 빨간 양동이와 삽으로 모래성을 만들어요.",
        img1: "rosie",
        img2: "kiwi",
        label: "Trên bãi cát",
        sceneBg: "#FFE9C9",
        ground: "#E8B96A",
        words: [
          ["sand", "cát", "砂", "모래", "#F2A81C"],
          ["shovel", "cái xẻng", "スコップ", "삽", "#8A5A3B"],
          ["build", "xây dựng", "作る", "만들다", "#7CC24A"],
        ],
      },
      {
        en: 'Kiwi finds a small crab. "Look, a crab!"',
        vi: 'Kiwi tìm thấy một con cua nhỏ. "Nhìn kìa, một con cua!"',
        ja: "キウイは小さなカニを見つけます。「見て、カニだ!」",
        ko: '키위가 작은 게를 발견해요. "봐, 게야!"',
        img1: "kiwi",
        img2: "rosie",
        label: "Bên tảng đá",
        sceneBg: "#EAF6FF",
        ground: "#C9E5F7",
        words: [
          ["crab", "con cua", "カニ", "게", "#EF6A5A"],
          ["find", "tìm thấy", "見つける", "발견하다", "#9B7EDE"],
          ["small", "nhỏ", "小さい", "작은", "#FFC93C"],
        ],
      },
      {
        en: "They swim in the cool water until the sun sets.",
        vi: "Hai bạn bơi trong làn nước mát cho đến khi mặt trời lặn.",
        ja: "二人は日が沈むまで涼しい水の中で泳ぎます。",
        ko: "둘은 해가 질 때까지 시원한 물에서 수영해요.",
        img1: "rosie",
        img2: "kiwi",
        label: "Hoàng hôn trên biển",
        sceneBg: "#FFD9B0",
        ground: "#C98A4A",
        words: [
          ["swim", "bơi", "泳ぐ", "수영하다", "#57C6C6"],
          ["cool", "mát mẻ", "涼しい", "시원한", "#5C7BC9"],
          ["sunset", "hoàng hôn", "夕日", "석양", "#F5822B"],
        ],
      },
    ],
  },
  {
    key: "counting-stars",
    title: "Counting Stars",
    topic: "Numbers",
    colorTheme: "#6C8FE3",
    pages: [
      {
        en: 'Frosty looks at the night sky. "So many stars!"',
        vi: 'Frosty ngắm bầu trời đêm. "Nhiều sao quá!"',
        ja: "フロスティが夜空を見上げます。「星がいっぱい!」",
        ko: '프로스티가 밤하늘을 봐요. "별이 정말 많다!"',
        img1: "frosty",
        img2: "leo",
        label: "Đêm đầy sao",
        sceneBg: "#EAF6FF",
        ground: "#C9E5F7",
        words: [
          ["star", "ngôi sao", "星", "별", "#FFC93C"],
          ["sky", "bầu trời", "空", "하늘", "#5C7BC9"],
          ["night", "ban đêm", "夜", "밤", "#9B7EDE"],
        ],
      },
      {
        en: 'Leo counts with his paw. "One, two, three stars!"',
        vi: 'Leo đếm bằng chân. "Một, hai, ba ngôi sao!"',
        ja: "レオが前足で数えます。「1、2、3個の星!」",
        ko: '레오가 발로 세어요. "하나, 둘, 셋, 별이 세 개!"',
        img1: "leo",
        img2: "frosty",
        label: "Đếm sao",
        sceneBg: "#F1EAFB",
        ground: "#DDCFF5",
        words: [
          ["count", "đếm", "数える", "세다", "#F5822B"],
          ["one", "một", "一", "하나", "#7CC24A"],
          ["three", "ba", "三", "셋", "#57C6C6"],
        ],
      },
      {
        en: "They count four more stars, and then five bright ones.",
        vi: "Hai bạn đếm thêm bốn ngôi sao nữa, rồi năm ngôi sao sáng.",
        ja: "二人はさらに星を4個数え、それから明るい星を5個数えます。",
        ko: "둘은 별 네 개를 더 세고, 그다음 밝은 별 다섯 개를 세요.",
        img1: "frosty",
        img2: "leo",
        label: "Trên đồi cao",
        sceneBg: "#FFF1DE",
        ground: "#F5C88F",
        words: [
          ["four", "bốn", "四", "넷", "#F79BB0"],
          ["five", "năm", "五", "다섯", "#EF6A5A"],
          ["bright", "sáng", "明るい", "밝은", "#FFC93C"],
        ],
      },
      {
        en: 'A shooting star flies by. "Make a wish!"',
        vi: 'Một ngôi sao băng bay qua. "Ước một điều gì đi!"',
        ja: "流れ星が飛んでいきます。「願い事をして!」",
        ko: '별똥별이 날아가요. "소원을 빌어!"',
        img1: "leo",
        img2: "frosty",
        label: "Sao băng",
        sceneBg: "#DCEFC8",
        ground: "#6FB544",
        words: [
          ["wish", "điều ước", "願い事", "소원", "#9B7EDE"],
          ["fly", "bay", "飛ぶ", "날다", "#5C7BC9"],
          ["shooting star", "sao băng", "流れ星", "별똥별", "#F5822B"],
        ],
      },
    ],
  },
  {
    key: "rainbow-garden",
    title: "The Rainbow Garden",
    topic: "Colors & Nature",
    colorTheme: "#7CC24A",
    pages: [
      {
        en: 'Stripe and Ellie visit a garden. "Look at all the flowers!"',
        vi: 'Stripe và Ellie ghé thăm một khu vườn. "Nhìn hoa nhiều quá!"',
        ja: "ストライプとエリーが庭を訪れます。「お花がいっぱい!」",
        ko: '스트라이프와 엘리가 정원을 방문해요. "꽃이 정말 많다!"',
        img1: "stripe",
        img2: "ellie",
        label: "Cổng vườn hoa",
        sceneBg: "#DCEFC8",
        ground: "#8CC85A",
        words: [
          ["garden", "khu vườn", "庭", "정원", "#7CC24A"],
          ["flower", "bông hoa", "花", "꽃", "#F79BB0"],
          ["visit", "ghé thăm", "訪れる", "방문하다", "#5C7BC9"],
        ],
      },
      {
        en: 'Ellie points at a red rose. "This one is red!"',
        vi: 'Ellie chỉ vào một bông hồng đỏ. "Bông này màu đỏ!"',
        ja: "エリーが赤いバラを指さします。「これは赤色!」",
        ko: '엘리가 빨간 장미를 가리켜요. "이건 빨간색이야!"',
        img1: "ellie",
        img2: "stripe",
        label: "Luống hồng",
        sceneBg: "#FDF0EC",
        ground: "#F6C3BB",
        words: [
          ["red", "màu đỏ", "赤", "빨강", "#EF6A5A"],
          ["rose", "hoa hồng", "バラ", "장미", "#F79BB0"],
          ["point", "chỉ vào", "指さす", "가리키다", "#F5822B"],
        ],
      },
      {
        en: "They see yellow, blue, and purple flowers too.",
        vi: "Hai bạn cũng thấy cả hoa vàng, hoa xanh và hoa tím.",
        ja: "二人は黄色、青、紫の花も見つけます。",
        ko: "둘은 노란색, 파란색, 보라색 꽃도 봐요.",
        img1: "stripe",
        img2: "ellie",
        label: "Vườn nhiều màu",
        sceneBg: "#F1EAFB",
        ground: "#DDCFF5",
        words: [
          ["yellow", "màu vàng", "黄色", "노랑", "#FFC93C"],
          ["blue", "màu xanh dương", "青", "파랑", "#5C7BC9"],
          ["purple", "màu tím", "紫", "보라", "#9B7EDE"],
        ],
      },
      {
        en: 'A real rainbow appears over the garden. "It has every color!"',
        vi: 'Một cầu vồng thật xuất hiện trên khu vườn. "Nó có đủ mọi màu sắc!"',
        ja: "本物の虹が庭の上に現れます。「全部の色がある!」",
        ko: '진짜 무지개가 정원 위에 나타나요. "모든 색깔이 다 있어!"',
        img1: "ellie",
        img2: "stripe",
        label: "Cầu vồng trên vườn",
        sceneBg: "#EAF6FF",
        ground: "#7FBEE0",
        words: [
          ["rainbow", "cầu vồng", "虹", "무지개", "#9B7EDE"],
          ["color", "màu sắc", "色", "색깔", "#F5822B"],
          ["every", "mọi", "すべての", "모든", "#57C6C6"],
        ],
      },
    ],
  },
  {
    key: "zoo-trip",
    title: "Going to the Zoo",
    topic: "Zoo Animals",
    colorTheme: "#F5822B",
    pages: [
      {
        en: 'Bamboo and Nimbus visit the zoo. "I can\'t wait to see the animals!"',
        vi: 'Bamboo và Nimbus đi sở thú. "Mình nóng lòng muốn xem các con vật quá!"',
        ja: "バンブーとニンバスが動物園を訪れます。「動物を見るのが待ちきれない!」",
        ko: '뱀부와 님버스가 동물원에 가요. "동물들이 너무 보고 싶어!"',
        img1: "bamboo",
        img2: "nimbus",
        label: "Cổng sở thú",
        sceneBg: "#FFE9C9",
        ground: "#E8B96A",
        words: [
          ["zoo", "sở thú", "動物園", "동물원", "#F5822B"],
          ["animal", "con vật", "動物", "동물", "#7CC24A"],
          ["visit", "ghé thăm", "訪れる", "방문하다", "#5C7BC9"],
        ],
      },
      {
        en: 'A tall giraffe eats leaves from a tree. "Wow, it\'s so tall!"',
        vi: 'Một con hươu cao cổ cao lớn đang ăn lá cây. "Ồ, cao thật đấy!"',
        ja: "背の高いキリンが木の葉を食べています。「わあ、とても高い!」",
        ko: '키 큰 기린이 나뭇잎을 먹고 있어요. "와, 정말 크다!"',
        img1: "nimbus",
        img2: "bamboo",
        label: "Chuồng hươu cao cổ",
        sceneBg: "#DCEFC8",
        ground: "#8CC85A",
        words: [
          ["giraffe", "hươu cao cổ", "キリン", "기린", "#FFC93C"],
          ["tall", "cao", "高い", "큰", "#5C7BC9"],
          ["leaf", "chiếc lá", "葉っぱ", "나뭇잎", "#7CC24A"],
        ],
      },
      {
        en: 'A monkey swings from branch to branch. "He is so funny!"',
        vi: 'Một con khỉ đu từ cành này sang cành khác. "Nó vui tính ghê!"',
        ja: "猿が枝から枝へ飛び移ります。「とても面白い!」",
        ko: '원숭이가 나뭇가지에서 나뭇가지로 옮겨 다녀요. "정말 재밌다!"',
        img1: "bamboo",
        img2: "nimbus",
        label: "Khu vực khỉ",
        sceneBg: "#F3E2C8",
        ground: "#C79A62",
        words: [
          ["monkey", "con khỉ", "猿", "원숭이", "#8A5A3B"],
          ["swing", "đu đưa", "揺れる", "흔들리다", "#9B7EDE"],
          ["funny", "vui tính", "面白い", "재미있는", "#F79BB0"],
        ],
      },
      {
        en: "At the end, they wave goodbye to a sleepy lion.",
        vi: "Cuối buổi, hai bạn vẫy tay chào tạm biệt một chú sư tử đang buồn ngủ.",
        ja: "最後に、二人は眠そうなライオンに手を振ってさよならします。",
        ko: "마지막으로, 둘은 졸린 사자에게 손을 흔들며 작별해요.",
        img1: "nimbus",
        img2: "bamboo",
        label: "Chuồng sư tử",
        sceneBg: "#FFF1DE",
        ground: "#F5C88F",
        words: [
          ["lion", "sư tử", "ライオン", "사자", "#F2A81C"],
          ["sleepy", "buồn ngủ", "眠い", "졸린", "#5C7BC9"],
          ["goodbye", "tạm biệt", "さよなら", "작별", "#EF6A5A"],
        ],
      },
    ],
  },
];

type LocalizedStoryNoun = [string, string, string, string];
const BONUS_STORY_THEMES: [string, string, string, string, string, LocalizedStoryNoun, LocalizedStoryNoun, string][] = [
  ["moon-lantern","Buddy and the Moon Lantern","A1 · Friendship","buddy","mimi",["moon garden","khu vườn trăng","月の庭","달빛 정원"],["lantern","đèn lồng","ランタン","등불"],"#8E7BD8"],
  ["lost-kite","Poppy's Lost Kite","A1 · Outdoors","poppy","buddy",["green hill","ngọn đồi xanh","緑の丘","초록 언덕"],["kite","cánh diều","たこ","연"],"#62B5D5"],
  ["tiny-seed","Sprout's Tiny Seed","A1 · Nature","sprout","bamboo",["sunny garden","khu vườn nắng","日当たりの良い庭","햇살 정원"],["seed","hạt giống","種","씨앗"],"#79BE55"],
  ["blue-shell","Aqua and the Blue Shell","A1 · Beach","aqua","ducky",["quiet beach","bãi biển yên tĩnh","静かな浜辺","조용한 해변"],["blue shell","vỏ sò xanh","青い貝殻","파란 조개"],"#55BED2"],
  ["warm-scarf","Frosty's Warm Scarf","A1 · Winter","frosty","cocoa",["snowy village","ngôi làng tuyết","雪の村","눈 마을"],["warm scarf","khăn quàng ấm","暖かいマフラー","따뜻한 목도리"],"#8FCDE8"],
  ["picnic-basket","Coco's Picnic Basket","A1 · Food","coco","waffle",["flower meadow","đồng cỏ hoa","花畑","꽃밭"],["picnic basket","giỏ dã ngoại","ピクニックかご","소풍 바구니"],"#E7A95F"],
  ["library-key","Mimi Finds a Library Key","A2 · School","mimi","ellie",["old library","thư viện cổ","古い図書館","오래된 도서관"],["golden key","chìa khóa vàng","金の鍵","황금 열쇠"],"#A58AD9"],
  ["rainbow-paint","Berry's Rainbow Paint","A2 · Colors","berry","prism",["art room","phòng mỹ thuật","美術室","미술실"],["rainbow paint","màu vẽ cầu vồng","虹色の絵の具","무지개 물감"],"#EE83AA"],
  ["night-train","Nocty and the Night Train","A2 · Travel","nocty","ember",["star station","ga ngôi sao","星の駅","별빛 역"],["silver ticket","vé bạc","銀の切符","은빛 표"],"#5967B8"],
  ["music-box","Lila's Music Box","A2 · Music","lila","rosie",["music room","phòng âm nhạc","音楽室","음악실"],["music box","hộp nhạc","オルゴール","오르골"],"#D58BC5"],
  ["forest-map","Bamboo's Forest Map","A2 · Directions","bamboo","stripe",["bamboo forest","rừng tre","竹林","대나무 숲"],["secret map","bản đồ bí mật","秘密の地図","비밀 지도"],"#5BA66A"],
  ["cloud-castle","Nimbus Visits the Cloud Castle","A2 · Fantasy","nimbus","angel",["cloud castle","lâu đài mây","雲の城","구름 성"],["crystal bell","chuông pha lê","水晶の鐘","수정 종"],"#83BFE6"],
  ["broken-bridge","Ember Repairs the Bridge","B1 · Teamwork","ember","gargo",["dragon valley","thung lũng rồng","竜の谷","용의 계곡"],["wooden bridge","cây cầu gỗ","木の橋","나무 다리"],"#E77849"],
  ["coral-rescue","Aqua's Coral Rescue","B1 · Environment","aqua","mystic",["coral reef","rạn san hô","サンゴ礁","산호초"],["young coral","san hô non","若いサンゴ","어린 산호"],"#38B8B5"],
  ["kind-robot","Ellie and the Kind Robot","B1 · Technology","ellie","milky",["science museum","bảo tàng khoa học","科学博物館","과학 박물관"],["kind robot","robot tốt bụng","親切なロボット","친절한 로봇"],"#6D92CC"],
  ["windmill-mystery","Stripe and the Windmill Mystery","B1 · Mystery","stripe","pepper",["windy farm","nông trại lộng gió","風の農場","바람 농장"],["missing gear","bánh răng bị mất","なくなった歯車","사라진 톱니바퀴"],"#B88A55"],
  ["star-compass","Stella's Star Compass","B1 · Space","stella","void",["space observatory","đài quan sát vũ trụ","宇宙観測所","우주 관측소"],["star compass","la bàn ngôi sao","星のコンパス","별 나침반"],"#6559B8"],
  ["festival-drum","Haetae's Festival Drum","B1 · Culture","haetae","maru",["festival square","quảng trường lễ hội","祭りの広場","축제 광장"],["festival drum","trống lễ hội","祭り太鼓","축제 북"],"#E85F55"],
  ["sakura-letter","Kitsune's Sakura Letter","B1 · Culture","kitsune","sia",["sakura path","con đường hoa anh đào","桜の道","벚꽃길"],["thank-you letter","lá thư cảm ơn","感謝の手紙","감사 편지"],"#E997B7"],
  ["city-garden","Maru Builds a City Garden","B2 · Community","maru","sprout",["busy city","thành phố nhộn nhịp","にぎやかな町","분주한 도시"],["community garden","vườn cộng đồng","共同庭園","공동체 정원"],"#6AAF72"],
];

function makeBonusStory([key, title, topic, hero, friend, place, object, color]: (typeof BONUS_STORY_THEMES)[number]): StorySeed {
  const word = (en: string, vi: string, ja: string, ko: string, wordColor: string): StoryWordSeed => [en, vi, ja, ko, wordColor];
  const heroName = hero[0]!.toUpperCase() + hero.slice(1);
  const friendName = friend[0]!.toUpperCase() + friend.slice(1);
  return { key, title, topic, colorTheme: color, pages: [
    { en: `${heroName} visits the ${place[0]} early in the morning.`, vi: `${heroName} đến ${place[1]} vào sáng sớm.`, ja: `${heroName}は朝早く${place[2]}を訪れます。`, ko: `${heroName}는 아침 일찍 ${place[3]}에 가요.`, img1: hero, img2: friend, label: place[1], sceneBg: `${color}33`, ground: `${color}88`, words: [word("visit","ghé thăm","訪れる","방문하다",color), word(place[0],place[1],place[2],place[3],"#57C6C6"), word("morning","buổi sáng","朝","아침","#FFC93C")] },
    { en: `${heroName} finds a ${object[0]} beside the path.`, vi: `${heroName} tìm thấy ${object[1]} bên cạnh con đường.`, ja: `${heroName}は道のそばで${object[2]}を見つけます。`, ko: `${heroName}는 길가에서 ${object[3]}을 찾아요.`, img1: hero, img2: friend, label: object[1], sceneBg: `${color}44`, ground: `${color}99`, words: [word("find","tìm thấy","見つける","찾다","#F5822B"), word(object[0],object[1],object[2],object[3],color), word("path","con đường","道","길","#8A5A3B")] },
    { en: `${friendName} listens carefully and helps solve the problem.`, vi: `${friendName} chăm chú lắng nghe và giúp giải quyết vấn đề.`, ja: `${friendName}はよく話を聞き、問題を解決するのを手伝います。`, ko: `${friendName}는 잘 듣고 문제를 해결하도록 도와줘요.`, img1: friend, img2: hero, label: "Cùng nhau tìm cách", sceneBg: "#EAF6E4", ground: "#94C86C", words: [word("listen","lắng nghe","聞く","듣다","#5C7BC9"), word("help","giúp đỡ","手伝う","돕다","#7CC24A"), word("problem","vấn đề","問題","문제","#EF6A5A")] },
    { en: `Together they return the ${object[0]} and celebrate with their friends.`, vi: `Cả hai cùng trả lại ${object[1]} và ăn mừng với bạn bè.`, ja: `二人は一緒に${object[2]}を返し、友達とお祝いします。`, ko: `둘은 함께 ${object[3]}을 돌려주고 친구들과 축하해요.`, img1: hero, img2: friend, label: "Kết thúc vui vẻ", sceneBg: "#FFF0C9", ground: "#E7B85F", words: [word("together","cùng nhau","一緒に","함께","#9B7EDE"), word("return","trả lại","返す","돌려주다","#57C6C6"), word("celebrate","ăn mừng","祝う","축하하다","#F79BB0")] },
  ] };
}
STORIES.push(...BONUS_STORY_THEMES.map(makeBonusStory));

// ---------------------------------------------------------------------------
// Memory Match topics — mirrors the old single hard-coded WORDS array in
// frontend/src/pages/MiniGame.tsx, now 10 topics with a picker before play.
// `img` is either a Pet.key (reuses pet art — only the "animals" topic does
// this, matching the original set) or a single emoji glyph for topics with
// no matching pet illustration (see frontend's isPetKey()).
// ---------------------------------------------------------------------------
type MiniGameWordSeed = [string, string, string | null, string | null, string]; // en, vi, ja, ko, img
type MiniGameTopicSeed = { key: string; name: string; color: string; words: MiniGameWordSeed[] };

const MINIGAME_TOPICS: MiniGameTopicSeed[] = [
  {
    key: "animals",
    name: "Động vật",
    color: "#7CC24A",
    words: [
      ["Dog", "con chó", "犬", "개", "buddy"],
      ["Cat", "con mèo", "猫", "고양이", "mimi"],
      ["Rabbit", "con thỏ", "うさぎ", "토끼", "poppy"],
      ["Panda", "gấu trúc", "パンダ", "판다", "bamboo"],
    ],
  },
  {
    key: "farm-animals",
    name: "Động vật nông trại",
    color: "#8A5A3B",
    words: [
      ["Cow", "con bò", "牛", "소", "🐄"],
      ["Horse", "con ngựa", "馬", "말", "🐴"],
      ["Pig", "con lợn", "豚", "돼지", "🐷"],
      ["Sheep", "con cừu", "羊", "양", "🐑"],
    ],
  },
  {
    key: "colors",
    name: "Màu sắc",
    color: "#F5822B",
    words: [
      ["Red", "màu đỏ", "赤", "빨강", "🔴"],
      ["Blue", "màu xanh dương", "青", "파랑", "🔵"],
      ["Yellow", "màu vàng", "黄色", "노랑", "🟡"],
      ["Green", "màu xanh lá", "緑", "초록", "🟢"],
    ],
  },
  {
    key: "numbers",
    name: "Số đếm",
    color: "#5C7BC9",
    words: [
      ["One", "một", "一", "하나", "1️⃣"],
      ["Two", "hai", "二", "둘", "2️⃣"],
      ["Three", "ba", "三", "셋", "3️⃣"],
      ["Four", "bốn", "四", "넷", "4️⃣"],
    ],
  },
  {
    key: "fruits",
    name: "Trái cây",
    color: "#EF6A5A",
    words: [
      ["Apple", "quả táo", "りんご", "사과", "🍎"],
      ["Banana", "quả chuối", "バナナ", "바나나", "🍌"],
      ["Orange", "quả cam", "オレンジ", "오렌지", "🍊"],
      ["Grapes", "chùm nho", "ぶどう", "포도", "🍇"],
    ],
  },
  {
    key: "family",
    name: "Gia đình",
    color: "#F79BB0",
    words: [
      ["Mom", "mẹ", "ママ", "엄마", "👩"],
      ["Dad", "bố", "パパ", "아빠", "👨"],
      ["Baby", "em bé", "赤ちゃん", "아기", "👶"],
      ["Grandma", "bà", "おばあちゃん", "할머니", "👵"],
    ],
  },
  {
    key: "weather",
    name: "Thời tiết",
    color: "#57C6C6",
    words: [
      ["Sun", "mặt trời", "太陽", "해", "☀️"],
      ["Rain", "mưa", "雨", "비", "🌧️"],
      ["Cloud", "đám mây", "雲", "구름", "☁️"],
      ["Snow", "tuyết", "雪", "눈", "❄️"],
    ],
  },
  {
    key: "school",
    name: "Đồ dùng học tập",
    color: "#9B7EDE",
    words: [
      ["Book", "quyển sách", "本", "책", "📖"],
      ["Pencil", "bút chì", "鉛筆", "연필", "✏️"],
      ["Bag", "cặp sách", "かばん", "가방", "🎒"],
      ["Chair", "cái ghế", "椅子", "의자", "🪑"],
    ],
  },
  {
    key: "body",
    name: "Bộ phận cơ thể",
    color: "#FFC93C",
    words: [
      ["Hand", "bàn tay", "手", "손", "✋"],
      ["Eye", "mắt", "目", "눈", "👁️"],
      ["Nose", "mũi", "鼻", "코", "👃"],
      ["Ear", "tai", "耳", "귀", "👂"],
    ],
  },
  {
    key: "transportation",
    name: "Phương tiện",
    color: "#6C8FE3",
    words: [
      ["Car", "ô tô", "車", "자동차", "🚗"],
      ["Bus", "xe buýt", "バス", "버스", "🚌"],
      ["Bike", "xe đạp", "自転車", "자전거", "🚲"],
      ["Plane", "máy bay", "飛行機", "비행기", "✈️"],
    ],
  },
];

// 20 distinct visual concepts × 5 useful forms = 100 entries per topic.
// The client samples distinct images, so no round contains ambiguous cards.
const MEMORY_IMAGES: Record<string, string[]> = {
  animals: ["🐶","🐱","🐰","🐦","🐟","🐘","🦁","🐯","🐻","🐵","🐴","🐄","🐷","🦆","🐔","🐑","🐸","🐍","🐢","🦋"],
  "farm-animals": ["🐄","🐴","🐷","🐑","🐐","🐔","🦆","🪿","🦃","🐇","🐕","🐈","🐂","🐃","🫏","🐖","🐏","🐣","🐝","🪱"],
  colors: ["🍎","💧","🍀","🌟","🍊","🍇","🌸","🖤","🤍","🪵","🩶","🏆","🥈","🌌","🌲","🧊","🍦","🏖️","🦚","🍒"],
  fruits: ["🍎","🍌","🍊","🍇","🍓","🍉","🍍","🥭","🍑","🍐","🍒","🥝","🍋","🥥","🫐","🍈","🍅","🥑","🫒","🌰"],
  family: ["👩","👨","👧","👦","👵","👴","👩‍🦰","👨‍🦱","🧑","👶","👨‍👩‍👧","🧒","👱‍♀️","🤵","👰","👪","👯","🙋‍♀️","🙋‍♂️","🫂"],
  weather: ["☀️","🌧️","☁️","💨","❄️","🔥","🥶","🌤️","🍃","⛈️","🌩️","⚡","🌈","🌫️","💧","🌡️","🍂","🌱","🏖️","⛄"],
  school: ["📖","🖊️","✏️","🧽","📏","🎒","🪵","🪑","👩‍🏫","🧑‍🎓","🏫","🟩","📓","✂️","🧴","🖍️","📝","📚","📄","🏛️"],
  body: ["🙂","💇","👁️","👂","👃","👄","🦷","✋","☝️","💪","🦵","🦶","🤷","🔙","🫃","🦿","🧣","🤔","💪🏻","❤️"],
  transportation: ["🚗","🚌","🚲","🏍️","🚆","✈️","🚤","🚢","🚕","🚚","🚇","🚁","🛴","🚑","🚒","⛴️","🚀","🚐","🚋","🚡"],
};
const FARM_MEMORY_ROOTS: [string, string][] = [["cow","bò"],["horse","ngựa"],["pig","lợn"],["sheep","cừu"],["goat","dê"],["chicken","gà"],["duck","vịt"],["goose","ngỗng"],["turkey","gà tây"],["rabbit","thỏ"],["farm dog","chó nông trại"],["barn cat","mèo trong chuồng"],["bull","bò đực"],["buffalo","trâu"],["donkey","lừa"],["piglet","lợn con"],["ram","cừu đực"],["chick","gà con"],["bee","ong"],["earthworm","giun đất"]];
const FRUIT_MEMORY_ROOTS: [string, string][] = [["apple","táo"],["banana","chuối"],["orange","cam"],["grape","nho"],["strawberry","dâu tây"],["watermelon","dưa hấu"],["pineapple","dứa"],["mango","xoài"],["peach","đào"],["pear","lê"],["cherry","anh đào"],["kiwi","kiwi"],["lemon","chanh vàng"],["coconut","dừa"],["blueberry","việt quất"],["melon","dưa lưới"],["tomato","cà chua"],["avocado","bơ"],["olive","ô-liu"],["chestnut","hạt dẻ"]];
const MEMORY_FORMS: Record<string, [string, string][]> = {
  animals: [["", ""],["baby ","con non: "],["big ","con lớn: "],["small ","con nhỏ: "],["wild ","con hoang dã: "]],
  "farm-animals": [["", ""],["baby ","con non: "],["big ","con lớn: "],["small ","con nhỏ: "],["friendly ","con thân thiện: "]],
  colors: [["", ""],["light ","màu nhạt: "],["dark ","màu đậm: "],["bright ","màu sáng: "],["pale ","màu phấn: "]],
  fruits: [["", ""],["ripe ","chín: "],["sweet ","ngọt: "],["fresh ","tươi: "],["sliced ","đã cắt: "]],
  family: [["", ""],["my ","của tôi: "],["your ","của bạn: "],["our ","của chúng ta: "],["kind ","tốt bụng: "]],
  weather: [["", ""],["very ","rất: "],["slightly ","hơi: "],["unusually ","bất thường: "],["becoming ","đang trở nên: "]],
  school: [["", ""],["new ","mới: "],["old ","cũ: "],["my ","của tôi: "],["classroom ","trong lớp: "]],
  body: [["", ""],["my ","của tôi: "],["your ","của bạn: "],["left ","bên trái: "],["right ","bên phải: "]],
  transportation: [["", ""],["fast ","nhanh: "],["slow ","chậm: "],["new ","mới: "],["electric ","chạy điện: "]],
};
function numberWord(n: number) { const s=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"]; const t=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"]; return n<20?s[n]!:n===100?"one hundred":`${t[Math.floor(n/10)]}${n%10?`-${s[n%10]}`:""}`; }
function vietnameseNumber(n: number) { const d=["không","một","hai","ba","bốn","năm","sáu","bảy","tám","chín"]; if(n<10)return d[n]!; if(n===10)return "mười"; if(n<20)return `mười ${n%10===5?"lăm":d[n%10]}`; if(n===100)return "một trăm"; const u=n%10===0?"":n%10===1?" mốt":n%10===5?" lăm":` ${d[n%10]}`; return `${d[Math.floor(n/10)]} mươi${u}`; }
function expandMemoryTopic(topic: MiniGameTopicSeed): MiniGameWordSeed[] {
  if (topic.key === "numbers") return Array.from({ length: 100 }, (_, i) => [numberWord(i + 1), vietnameseNumber(i + 1), null, null, String(i + 1)]);
  const vocabKey = topic.key === "transportation" ? "transport" : topic.key;
  const source = topic.key === "farm-animals" ? FARM_MEMORY_ROOTS : topic.key === "fruits" ? FRUIT_MEMORY_ROOTS : VOCAB_TOPICS[vocabKey]!.slice(0, 20).map(([en, vi]) => [en, vi] as [string, string]);
  return MEMORY_FORMS[topic.key]!.flatMap(([ep, vp], form) => source.map(([en, vi], i) => [form ? `${ep}${en}` : en, form ? `${vp}${vi}` : vi, null, null, MEMORY_IMAGES[topic.key]![i]!]));
}
for (const topic of MINIGAME_TOPICS) topic.words = expandMemoryTopic(topic);

// ---------------------------------------------------------------------------
// Word Catch topics — mirrors the old single hard-coded ROUNDS array in
// frontend/src/pages/WordCatch.tsx, now 10 topics with a picker before play.
// ---------------------------------------------------------------------------
type WordCatchRoundSeed = { vi: string; ja: string; ko: string; answer: string; options: string[] };
type WordCatchTopicSeed = { key: string; name: string; rounds: WordCatchRoundSeed[] };

const WORDCATCH_TOPICS: WordCatchTopicSeed[] = [
  {
    key: "basics",
    name: "Từ vựng cơ bản",
    rounds: [
      { vi: "con chó", ja: "犬", ko: "개", answer: "Dog", options: ["Dog", "Cat", "Duck", "Lion"] },
      { vi: "quả táo", ja: "りんご", ko: "사과", answer: "Apple", options: ["Apple", "Bread", "Milk", "Candy"] },
      { vi: "cái mũ", ja: "帽子", ko: "모자", answer: "Hat", options: ["Shoe", "Hat", "Bag", "Cup"] },
      { vi: "con voi", ja: "象", ko: "코끼리", answer: "Elephant", options: ["Tiger", "Panda", "Elephant", "Bird"] },
      { vi: "màu xanh lá", ja: "緑", ko: "초록", answer: "Green", options: ["Green", "Blue", "Red", "Pink"] },
    ],
  },
  {
    key: "animals",
    name: "Động vật",
    rounds: [
      { vi: "con mèo", ja: "猫", ko: "고양이", answer: "Cat", options: ["Cat", "Dog", "Fish", "Bird"] },
      { vi: "con bò", ja: "牛", ko: "소", answer: "Cow", options: ["Pig", "Cow", "Horse", "Sheep"] },
      { vi: "con vịt", ja: "アヒル", ko: "오리", answer: "Duck", options: ["Duck", "Chicken", "Goose", "Swan"] },
      { vi: "con thỏ", ja: "うさぎ", ko: "토끼", answer: "Rabbit", options: ["Rabbit", "Mouse", "Squirrel", "Hamster"] },
      { vi: "con cá", ja: "魚", ko: "물고기", answer: "Fish", options: ["Fish", "Frog", "Turtle", "Crab"] },
    ],
  },
  {
    key: "fruits",
    name: "Trái cây",
    rounds: [
      { vi: "quả chuối", ja: "バナナ", ko: "바나나", answer: "Banana", options: ["Banana", "Apple", "Orange", "Grapes"] },
      { vi: "quả cam", ja: "オレンジ", ko: "오렌지", answer: "Orange", options: ["Orange", "Lemon", "Mango", "Peach"] },
      { vi: "quả dưa hấu", ja: "スイカ", ko: "수박", answer: "Watermelon", options: ["Watermelon", "Melon", "Pineapple", "Coconut"] },
      { vi: "chùm nho", ja: "ぶどう", ko: "포도", answer: "Grapes", options: ["Grapes", "Cherry", "Strawberry", "Blueberry"] },
      { vi: "quả xoài", ja: "マンゴー", ko: "망고", answer: "Mango", options: ["Mango", "Papaya", "Guava", "Lychee"] },
    ],
  },
  {
    key: "colors",
    name: "Màu sắc",
    rounds: [
      { vi: "màu đỏ", ja: "赤", ko: "빨강", answer: "Red", options: ["Red", "Blue", "Yellow", "Green"] },
      { vi: "màu vàng", ja: "黄色", ko: "노랑", answer: "Yellow", options: ["Yellow", "Orange", "Pink", "Purple"] },
      { vi: "màu tím", ja: "紫", ko: "보라", answer: "Purple", options: ["Purple", "Black", "White", "Brown"] },
      { vi: "màu hồng", ja: "ピンク", ko: "분홍", answer: "Pink", options: ["Pink", "Red", "Gray", "Gold"] },
      { vi: "màu đen", ja: "黒", ko: "검정", answer: "Black", options: ["Black", "White", "Silver", "Beige"] },
    ],
  },
  {
    key: "numbers",
    name: "Số đếm",
    rounds: [
      { vi: "số một", ja: "一", ko: "하나", answer: "One", options: ["One", "Two", "Three", "Four"] },
      { vi: "số ba", ja: "三", ko: "셋", answer: "Three", options: ["Three", "Five", "Six", "Seven"] },
      { vi: "số năm", ja: "五", ko: "다섯", answer: "Five", options: ["Five", "Four", "Eight", "Nine"] },
      { vi: "số bảy", ja: "七", ko: "일곱", answer: "Seven", options: ["Seven", "Six", "Ten", "Two"] },
      { vi: "số mười", ja: "十", ko: "열", answer: "Ten", options: ["Ten", "Nine", "One", "Three"] },
    ],
  },
  {
    key: "family",
    name: "Gia đình",
    rounds: [
      { vi: "mẹ", ja: "母", ko: "어머니", answer: "Mother", options: ["Mother", "Father", "Sister", "Brother"] },
      { vi: "bố", ja: "父", ko: "아버지", answer: "Father", options: ["Father", "Uncle", "Grandfather", "Cousin"] },
      { vi: "chị/em gái", ja: "姉/妹", ko: "언니/여동생", answer: "Sister", options: ["Sister", "Brother", "Aunt", "Niece"] },
      { vi: "ông", ja: "祖父", ko: "할아버지", answer: "Grandfather", options: ["Grandfather", "Grandmother", "Father", "Uncle"] },
      { vi: "em bé", ja: "赤ちゃん", ko: "아기", answer: "Baby", options: ["Baby", "Son", "Daughter", "Twin"] },
    ],
  },
  {
    key: "school",
    name: "Trường học",
    rounds: [
      { vi: "quyển sách", ja: "本", ko: "책", answer: "Book", options: ["Book", "Pencil", "Bag", "Chair"] },
      { vi: "bút chì", ja: "鉛筆", ko: "연필", answer: "Pencil", options: ["Pencil", "Pen", "Eraser", "Ruler"] },
      { vi: "cặp sách", ja: "かばん", ko: "가방", answer: "Bag", options: ["Bag", "Desk", "Chair", "Shelf"] },
      { vi: "cái bàn học", ja: "机", ko: "책상", answer: "Desk", options: ["Desk", "Chair", "Table", "Bench"] },
      { vi: "giáo viên", ja: "先生", ko: "선생님", answer: "Teacher", options: ["Teacher", "Student", "Friend", "Doctor"] },
    ],
  },
  {
    key: "weather",
    name: "Thời tiết",
    rounds: [
      { vi: "mặt trời", ja: "太陽", ko: "해", answer: "Sun", options: ["Sun", "Moon", "Star", "Cloud"] },
      { vi: "mưa", ja: "雨", ko: "비", answer: "Rain", options: ["Rain", "Snow", "Wind", "Storm"] },
      { vi: "tuyết", ja: "雪", ko: "눈", answer: "Snow", options: ["Snow", "Rain", "Fog", "Ice"] },
      { vi: "cầu vồng", ja: "虹", ko: "무지개", answer: "Rainbow", options: ["Rainbow", "Cloud", "Sun", "Storm"] },
      { vi: "gió", ja: "風", ko: "바람", answer: "Wind", options: ["Wind", "Rain", "Thunder", "Snow"] },
    ],
  },
  {
    key: "body",
    name: "Cơ thể",
    rounds: [
      { vi: "bàn tay", ja: "手", ko: "손", answer: "Hand", options: ["Hand", "Foot", "Arm", "Leg"] },
      { vi: "đôi mắt", ja: "目", ko: "눈", answer: "Eyes", options: ["Eyes", "Ears", "Nose", "Mouth"] },
      { vi: "cái mũi", ja: "鼻", ko: "코", answer: "Nose", options: ["Nose", "Mouth", "Ear", "Chin"] },
      { vi: "đôi tai", ja: "耳", ko: "귀", answer: "Ears", options: ["Ears", "Eyes", "Hair", "Neck"] },
      { vi: "cái đầu", ja: "頭", ko: "머리", answer: "Head", options: ["Head", "Shoulder", "Knee", "Back"] },
    ],
  },
  {
    key: "transportation",
    name: "Phương tiện",
    rounds: [
      { vi: "ô tô", ja: "車", ko: "자동차", answer: "Car", options: ["Car", "Bus", "Bike", "Truck"] },
      { vi: "xe buýt", ja: "バス", ko: "버스", answer: "Bus", options: ["Bus", "Car", "Train", "Taxi"] },
      { vi: "máy bay", ja: "飛行機", ko: "비행기", answer: "Plane", options: ["Plane", "Helicopter", "Rocket", "Boat"] },
      { vi: "tàu hoả", ja: "電車", ko: "기차", answer: "Train", options: ["Train", "Subway", "Tram", "Bus"] },
      { vi: "thuyền", ja: "ボート", ko: "보트", answer: "Boat", options: ["Boat", "Ship", "Ferry", "Canoe"] },
    ],
  },
];

// Reuse the 100-entry learning pools to keep Memory Match and Word Catch in
// sync. Distractors stay in the same 20-word form group, so choices remain
// plausible instead of mixing unrelated difficulty levels.
function wordCatchPool(key: string): MiniGameWordSeed[] {
  if (key === "basics") {
    return ["animals", "fruits", "colors", "school", "numbers"].flatMap((topicKey) => MINIGAME_TOPICS.find((topic) => topic.key === topicKey)!.words.slice(0, 20));
  }
  const memoryKey = key === "transportation" ? "transportation" : key;
  return MINIGAME_TOPICS.find((topic) => topic.key === memoryKey)!.words;
}
function makeWordCatchRounds(key: string): WordCatchRoundSeed[] {
  const pool = wordCatchPool(key);
  return pool.map(([answer, vi, ja, ko], index) => {
    const groupStart = Math.floor(index / 20) * 20;
    const options = [0, 1, 2, 3].map((offset) => pool[groupStart + ((index - groupStart + offset) % Math.min(20, pool.length - groupStart))]![0]);
    const shift = index % options.length;
    return { vi, ja: ja ?? vi, ko: ko ?? vi, answer, options: [...options.slice(shift), ...options.slice(0, shift)] };
  });
}
for (const topic of WORDCATCH_TOPICS) topic.rounds = makeWordCatchRounds(topic.key);

// ---------------------------------------------------------------------------
// English Shop topics — "Buy 2 apples and 1 banana." style shopping-list
// rounds. `shelf` is the full display (needed items + decoy copies/other
// items); `required` is what actually has to land in the cart. See
// services/admin/shopRounds.service.ts for the "shelf must cover required"
// validation and frontend/src/pages/Shop.tsx for the actual gameplay.
// ---------------------------------------------------------------------------
type ShopItemKey =
  // Siêu thị (Supermarket)
  | "apple"
  | "banana"
  | "orange"
  | "egg"
  | "milk"
  | "bread"
  | "grapes"
  | "cookie"
  | "carrot"
  | "tomato"
  | "potato"
  | "onion"
  | "cheese"
  | "fish"
  // Cửa hàng trái cây (Fruit Stand)
  | "mango"
  | "strawberry"
  | "watermelon"
  | "pineapple"
  | "lemon"
  | "peach"
  // Văn phòng phẩm (Stationery Shop)
  | "pencil"
  | "pen"
  | "notebook"
  | "ruler"
  | "scissors"
  | "crayon"
  | "book"
  | "bag"
  // Cửa hàng đồ chơi (Toy Store)
  | "ball"
  | "doll"
  | "car"
  | "kite"
  | "robot"
  | "blocks"
  | "teddybear"
  | "balloon"
  | "yoyo"
  // Cửa hàng quần áo (Clothing Store)
  | "shirt"
  | "hat"
  | "socks"
  | "shoes"
  | "dress"
  | "jacket"
  | "scarf"
  | "gloves"
  | "shorts"
  // Tiệm bánh (Bakery)
  | "cake"
  | "donut"
  | "cupcake"
  | "pie"
  | "croissant"
  | "candy"
  | "chocolate"
  // Cửa hàng rau củ (Vegetable Stand)
  | "corn"
  | "pepper"
  | "cucumber"
  | "broccoli"
  | "cabbage";

const SHOP_ITEMS: Record<ShopItemKey, { en: string; vi: string; ja: string; ko: string; emoji: string; price: number }> = {
  apple: { en: "Apple", vi: "quả táo", ja: "りんご", ko: "사과", emoji: "🍎", price: 1 },
  banana: { en: "Banana", vi: "quả chuối", ja: "バナナ", ko: "바나나", emoji: "🍌", price: 1 },
  orange: { en: "Orange", vi: "quả cam", ja: "オレンジ", ko: "오렌지", emoji: "🍊", price: 1 },
  egg: { en: "Egg", vi: "quả trứng", ja: "卵", ko: "계란", emoji: "🥚", price: 1 },
  milk: { en: "Milk", vi: "chai sữa", ja: "牛乳", ko: "우유", emoji: "🥛", price: 2 },
  bread: { en: "Bread", vi: "ổ bánh mì", ja: "パン", ko: "빵", emoji: "🍞", price: 2 },
  grapes: { en: "Grapes", vi: "chùm nho", ja: "ぶどう", ko: "포도", emoji: "🍇", price: 2 },
  cookie: { en: "Cookie", vi: "cái bánh quy", ja: "クッキー", ko: "쿠키", emoji: "🍪", price: 2 },
  carrot: { en: "Carrot", vi: "củ cà rốt", ja: "にんじん", ko: "당근", emoji: "🥕", price: 1 },
  tomato: { en: "Tomato", vi: "quả cà chua", ja: "トマト", ko: "토마토", emoji: "🍅", price: 1 },
  potato: { en: "Potato", vi: "củ khoai tây", ja: "じゃがいも", ko: "감자", emoji: "🥔", price: 1 },
  onion: { en: "Onion", vi: "củ hành tây", ja: "たまねぎ", ko: "양파", emoji: "🧅", price: 1 },
  cheese: { en: "Cheese", vi: "miếng phô mai", ja: "チーズ", ko: "치즈", emoji: "🧀", price: 3 },
  fish: { en: "Fish", vi: "con cá", ja: "魚", ko: "생선", emoji: "🐟", price: 3 },

  mango: { en: "Mango", vi: "quả xoài", ja: "マンゴー", ko: "망고", emoji: "🥭", price: 2 },
  strawberry: { en: "Strawberry", vi: "quả dâu tây", ja: "いちご", ko: "딸기", emoji: "🍓", price: 2 },
  watermelon: { en: "Watermelon", vi: "quả dưa hấu", ja: "スイカ", ko: "수박", emoji: "🍉", price: 3 },
  pineapple: { en: "Pineapple", vi: "quả dứa", ja: "パイナップル", ko: "파인애플", emoji: "🍍", price: 3 },
  lemon: { en: "Lemon", vi: "quả chanh", ja: "レモン", ko: "레몬", emoji: "🍋", price: 1 },
  peach: { en: "Peach", vi: "quả đào", ja: "もも", ko: "복숭아", emoji: "🍑", price: 2 },

  pencil: { en: "Pencil", vi: "bút chì", ja: "鉛筆", ko: "연필", emoji: "✏️", price: 1 },
  pen: { en: "Pen", vi: "bút bi", ja: "ペン", ko: "펜", emoji: "🖊️", price: 1 },
  notebook: { en: "Notebook", vi: "quyển vở", ja: "ノート", ko: "공책", emoji: "📓", price: 2 },
  ruler: { en: "Ruler", vi: "cái thước", ja: "定規", ko: "자", emoji: "📏", price: 1 },
  scissors: { en: "Scissors", vi: "cái kéo", ja: "はさみ", ko: "가위", emoji: "✂️", price: 2 },
  crayon: { en: "Crayon", vi: "bút sáp màu", ja: "クレヨン", ko: "크레용", emoji: "🖍️", price: 1 },
  book: { en: "Book", vi: "quyển sách", ja: "本", ko: "책", emoji: "📖", price: 3 },
  bag: { en: "Bag", vi: "cặp sách", ja: "かばん", ko: "가방", emoji: "🎒", price: 3 },

  ball: { en: "Ball", vi: "quả bóng", ja: "ボール", ko: "공", emoji: "⚽", price: 2 },
  doll: { en: "Doll", vi: "con búp bê", ja: "人形", ko: "인형", emoji: "🪆", price: 3 },
  car: { en: "Car", vi: "xe ô tô đồ chơi", ja: "車のおもちゃ", ko: "장난감 자동차", emoji: "🚗", price: 3 },
  kite: { en: "Kite", vi: "con diều", ja: "凧", ko: "연", emoji: "🪁", price: 2 },
  robot: { en: "Robot", vi: "người máy", ja: "ロボット", ko: "로봇", emoji: "🤖", price: 3 },
  blocks: { en: "Blocks", vi: "khối xếp hình", ja: "積み木", ko: "블록", emoji: "🧱", price: 2 },
  teddybear: { en: "Teddy Bear", vi: "gấu bông", ja: "クマのぬいぐるみ", ko: "곰 인형", emoji: "🧸", price: 3 },
  balloon: { en: "Balloon", vi: "bóng bay", ja: "風船", ko: "풍선", emoji: "🎈", price: 1 },
  yoyo: { en: "Yo-yo", vi: "con quay yo-yo", ja: "ヨーヨー", ko: "요요", emoji: "🪀", price: 1 },

  shirt: { en: "Shirt", vi: "áo sơ mi", ja: "シャツ", ko: "셔츠", emoji: "👕", price: 2 },
  hat: { en: "Hat", vi: "cái mũ", ja: "帽子", ko: "모자", emoji: "🧢", price: 1 },
  socks: { en: "Socks", vi: "đôi tất", ja: "靴下", ko: "양말", emoji: "🧦", price: 1 },
  shoes: { en: "Shoes", vi: "đôi giày", ja: "靴", ko: "신발", emoji: "👟", price: 3 },
  dress: { en: "Dress", vi: "váy đầm", ja: "ワンピース", ko: "원피스", emoji: "👗", price: 3 },
  jacket: { en: "Jacket", vi: "áo khoác", ja: "ジャケット", ko: "재킷", emoji: "🧥", price: 3 },
  scarf: { en: "Scarf", vi: "khăn quàng", ja: "マフラー", ko: "목도리", emoji: "🧣", price: 1 },
  gloves: { en: "Gloves", vi: "đôi găng tay", ja: "手袋", ko: "장갑", emoji: "🧤", price: 1 },
  shorts: { en: "Shorts", vi: "quần short", ja: "半ズボン", ko: "반바지", emoji: "🩳", price: 2 },

  cake: { en: "Cake", vi: "bánh kem", ja: "ケーキ", ko: "케이크", emoji: "🎂", price: 3 },
  donut: { en: "Donut", vi: "bánh donut", ja: "ドーナツ", ko: "도넛", emoji: "🍩", price: 1 },
  cupcake: { en: "Cupcake", vi: "bánh cupcake", ja: "カップケーキ", ko: "컵케이크", emoji: "🧁", price: 2 },
  pie: { en: "Pie", vi: "bánh pie", ja: "パイ", ko: "파이", emoji: "🥧", price: 2 },
  croissant: { en: "Croissant", vi: "bánh sừng bò", ja: "クロワッサン", ko: "크루아상", emoji: "🥐", price: 2 },
  candy: { en: "Candy", vi: "viên kẹo", ja: "キャンディ", ko: "사탕", emoji: "🍬", price: 1 },
  chocolate: { en: "Chocolate", vi: "sô-cô-la", ja: "チョコレート", ko: "초콜릿", emoji: "🍫", price: 2 },

  corn: { en: "Corn", vi: "bắp ngô", ja: "とうもろこし", ko: "옥수수", emoji: "🌽", price: 1 },
  pepper: { en: "Pepper", vi: "quả ớt chuông", ja: "ピーマン", ko: "피망", emoji: "🫑", price: 1 },
  cucumber: { en: "Cucumber", vi: "quả dưa chuột", ja: "きゅうり", ko: "오이", emoji: "🥒", price: 1 },
  broccoli: { en: "Broccoli", vi: "bông cải xanh", ja: "ブロッコリー", ko: "브로콜리", emoji: "🥦", price: 1 },
  cabbage: { en: "Cabbage", vi: "bắp cải", ja: "キャベツ", ko: "양배추", emoji: "🥬", price: 1 },
};

function buildShelf(counts: [ShopItemKey, number][]) {
  const shelf: { en: string; vi: string; ja: string; ko: string; emoji: string; price: number }[] = [];
  for (const [key, count] of counts) {
    const { en, vi, ja, ko, emoji, price } = SHOP_ITEMS[key];
    for (let i = 0; i < count; i++) shelf.push({ en, vi, ja, ko, emoji, price });
  }
  return shelf;
}

/**
 * Every round's instructionEn/instructionVi is a literal, hand-written "Buy
 * N X and M Y." sentence — but ja/ko never need custom grammar for this
 * exact shape (no plural marking to get right in either language), so
 * instead of hand-translating all 35 of them, generate instructionJa/
 * instructionKo straight from `required` (which is already the source of
 * truth for the numbers/items) — see buildShopInstruction() below.
 */
function buildShopInstruction(lang: "ja" | "ko", required: [ShopItemKey, number][]): string {
  if (lang === "ja") {
    return required.map(([key, qty]) => `${SHOP_ITEMS[key].ja}を${qty}個`).join("と") + "買ってください。";
  }
  return required.map(([key, qty]) => `${SHOP_ITEMS[key].ko} ${qty}개`).join("와 ") + "를 사세요.";
}

type ShopRoundSeed = { instructionEn: string; instructionVi: string; shelfCounts: [ShopItemKey, number][]; required: [ShopItemKey, number][] };
type ShopTopicSeed = { key: string; name: string; color: string; rounds: ShopRoundSeed[] };

const SHOP_TOPICS: ShopTopicSeed[] = [
  {
    key: "supermarket",
    name: "Siêu thị",
    color: "#7CC24A",
    rounds: [
      {
        instructionEn: "Buy 2 apples and 1 banana.",
        instructionVi: "Mua 2 quả táo và 1 quả chuối.",
        shelfCounts: [
          ["apple", 3],
          ["banana", 1],
          ["milk", 1],
          ["bread", 1],
        ],
        required: [
          ["apple", 2],
          ["banana", 1],
        ],
      },
      {
        instructionEn: "Buy 3 oranges and 2 eggs.",
        instructionVi: "Mua 3 quả cam và 2 quả trứng.",
        shelfCounts: [
          ["orange", 4],
          ["egg", 3],
          ["grapes", 1],
          ["cookie", 1],
        ],
        required: [
          ["orange", 3],
          ["egg", 2],
        ],
      },
      {
        instructionEn: "Buy 1 bread and 2 milk.",
        instructionVi: "Mua 1 ổ bánh mì và 2 chai sữa.",
        shelfCounts: [
          ["bread", 2],
          ["milk", 3],
          ["cheese", 1],
          ["fish", 1],
        ],
        required: [
          ["bread", 1],
          ["milk", 2],
        ],
      },
      {
        instructionEn: "Buy 2 carrots and 3 tomatoes.",
        instructionVi: "Mua 2 củ cà rốt và 3 quả cà chua.",
        shelfCounts: [
          ["carrot", 3],
          ["tomato", 4],
          ["potato", 1],
          ["onion", 1],
        ],
        required: [
          ["carrot", 2],
          ["tomato", 3],
        ],
      },
      {
        instructionEn: "Buy 1 cookie and 2 fish.",
        instructionVi: "Mua 1 cái bánh quy và 2 con cá.",
        shelfCounts: [
          ["cookie", 2],
          ["fish", 3],
          ["cheese", 1],
          ["egg", 1],
        ],
        required: [
          ["cookie", 1],
          ["fish", 2],
        ],
      },
    ],
  },
  {
    key: "fruit-stand",
    name: "Cửa hàng trái cây",
    color: "#EF6A5A",
    rounds: [
      {
        instructionEn: "Buy 2 mangoes and 1 pineapple.",
        instructionVi: "Mua 2 quả xoài và 1 quả dứa.",
        shelfCounts: [
          ["mango", 3],
          ["pineapple", 2],
          ["lemon", 1],
          ["peach", 1],
        ],
        required: [
          ["mango", 2],
          ["pineapple", 1],
        ],
      },
      {
        instructionEn: "Buy 3 strawberries and 2 lemons.",
        instructionVi: "Mua 3 quả dâu tây và 2 quả chanh.",
        shelfCounts: [
          ["strawberry", 4],
          ["lemon", 3],
          ["watermelon", 1],
          ["apple", 1],
        ],
        required: [
          ["strawberry", 3],
          ["lemon", 2],
        ],
      },
      {
        instructionEn: "Buy 1 watermelon and 2 peaches.",
        instructionVi: "Mua 1 quả dưa hấu và 2 quả đào.",
        shelfCounts: [
          ["watermelon", 2],
          ["peach", 3],
          ["banana", 1],
          ["orange", 1],
        ],
        required: [
          ["watermelon", 1],
          ["peach", 2],
        ],
      },
      {
        instructionEn: "Buy 2 apples and 3 grapes.",
        instructionVi: "Mua 2 quả táo và 3 chùm nho.",
        shelfCounts: [
          ["apple", 3],
          ["grapes", 4],
          ["mango", 1],
          ["lemon", 1],
        ],
        required: [
          ["apple", 2],
          ["grapes", 3],
        ],
      },
      {
        instructionEn: "Buy 1 pineapple and 2 oranges.",
        instructionVi: "Mua 1 quả dứa và 2 quả cam.",
        shelfCounts: [
          ["pineapple", 2],
          ["orange", 3],
          ["strawberry", 1],
          ["peach", 1],
        ],
        required: [
          ["pineapple", 1],
          ["orange", 2],
        ],
      },
    ],
  },
  {
    key: "stationery-shop",
    name: "Văn phòng phẩm",
    color: "#9B7EDE",
    rounds: [
      {
        instructionEn: "Buy 2 pencils and 1 notebook.",
        instructionVi: "Mua 2 cây bút chì và 1 quyển vở.",
        shelfCounts: [
          ["pencil", 3],
          ["notebook", 2],
          ["ruler", 1],
          ["bag", 1],
        ],
        required: [
          ["pencil", 2],
          ["notebook", 1],
        ],
      },
      {
        instructionEn: "Buy 1 ruler and 2 crayons.",
        instructionVi: "Mua 1 cái thước và 2 cây bút sáp màu.",
        shelfCounts: [
          ["ruler", 2],
          ["crayon", 3],
          ["scissors", 1],
          ["pen", 1],
        ],
        required: [
          ["ruler", 1],
          ["crayon", 2],
        ],
      },
      {
        instructionEn: "Buy 3 pens and 1 bag.",
        instructionVi: "Mua 3 cây bút bi và 1 cái cặp sách.",
        shelfCounts: [
          ["pen", 4],
          ["bag", 2],
          ["book", 1],
          ["pencil", 1],
        ],
        required: [
          ["pen", 3],
          ["bag", 1],
        ],
      },
      {
        instructionEn: "Buy 2 books and 1 scissors.",
        instructionVi: "Mua 2 quyển sách và 1 cái kéo.",
        shelfCounts: [
          ["book", 3],
          ["scissors", 2],
          ["crayon", 1],
          ["ruler", 1],
        ],
        required: [
          ["book", 2],
          ["scissors", 1],
        ],
      },
      {
        instructionEn: "Buy 1 notebook and 2 pencils.",
        instructionVi: "Mua 1 quyển vở và 2 cây bút chì.",
        shelfCounts: [
          ["notebook", 2],
          ["pencil", 3],
          ["pen", 1],
          ["bag", 1],
        ],
        required: [
          ["notebook", 1],
          ["pencil", 2],
        ],
      },
    ],
  },
  {
    key: "toy-store",
    name: "Cửa hàng đồ chơi",
    color: "#F79BB0",
    rounds: [
      {
        instructionEn: "Buy 1 teddy bear and 2 balloons.",
        instructionVi: "Mua 1 con gấu bông và 2 quả bóng bay.",
        shelfCounts: [
          ["teddybear", 2],
          ["balloon", 3],
          ["ball", 1],
          ["kite", 1],
        ],
        required: [
          ["teddybear", 1],
          ["balloon", 2],
        ],
      },
      {
        instructionEn: "Buy 2 balls and 1 kite.",
        instructionVi: "Mua 2 quả bóng và 1 con diều.",
        shelfCounts: [
          ["ball", 3],
          ["kite", 2],
          ["robot", 1],
          ["doll", 1],
        ],
        required: [
          ["ball", 2],
          ["kite", 1],
        ],
      },
      {
        instructionEn: "Buy 1 robot and 2 blocks.",
        instructionVi: "Mua 1 người máy và 2 khối xếp hình.",
        shelfCounts: [
          ["robot", 2],
          ["blocks", 3],
          ["yoyo", 1],
          ["car", 1],
        ],
        required: [
          ["robot", 1],
          ["blocks", 2],
        ],
      },
      {
        instructionEn: "Buy 2 dolls and 1 yo-yo.",
        instructionVi: "Mua 2 con búp bê và 1 con quay yo-yo.",
        shelfCounts: [
          ["doll", 3],
          ["yoyo", 2],
          ["teddybear", 1],
          ["ball", 1],
        ],
        required: [
          ["doll", 2],
          ["yoyo", 1],
        ],
      },
      {
        instructionEn: "Buy 1 car and 2 kites.",
        instructionVi: "Mua 1 xe ô tô đồ chơi và 2 con diều.",
        shelfCounts: [
          ["car", 2],
          ["kite", 3],
          ["robot", 1],
          ["balloon", 1],
        ],
        required: [
          ["car", 1],
          ["kite", 2],
        ],
      },
    ],
  },
  {
    key: "clothing-store",
    name: "Cửa hàng quần áo",
    color: "#6C8FE3",
    rounds: [
      {
        instructionEn: "Buy 1 shirt and 2 socks.",
        instructionVi: "Mua 1 cái áo sơ mi và 2 đôi tất.",
        shelfCounts: [
          ["shirt", 2],
          ["socks", 3],
          ["hat", 1],
          ["shoes", 1],
        ],
        required: [
          ["shirt", 1],
          ["socks", 2],
        ],
      },
      {
        instructionEn: "Buy 2 hats and 1 scarf.",
        instructionVi: "Mua 2 cái mũ và 1 cái khăn quàng.",
        shelfCounts: [
          ["hat", 3],
          ["scarf", 2],
          ["gloves", 1],
          ["jacket", 1],
        ],
        required: [
          ["hat", 2],
          ["scarf", 1],
        ],
      },
      {
        instructionEn: "Buy 1 dress and 2 gloves.",
        instructionVi: "Mua 1 cái váy đầm và 2 đôi găng tay.",
        shelfCounts: [
          ["dress", 2],
          ["gloves", 3],
          ["shorts", 1],
          ["shirt", 1],
        ],
        required: [
          ["dress", 1],
          ["gloves", 2],
        ],
      },
      {
        instructionEn: "Buy 2 shoes and 1 jacket.",
        instructionVi: "Mua 2 đôi giày và 1 cái áo khoác.",
        shelfCounts: [
          ["shoes", 3],
          ["jacket", 2],
          ["socks", 1],
          ["hat", 1],
        ],
        required: [
          ["shoes", 2],
          ["jacket", 1],
        ],
      },
      {
        instructionEn: "Buy 1 shorts and 2 scarves.",
        instructionVi: "Mua 1 cái quần short và 2 cái khăn quàng.",
        shelfCounts: [
          ["shorts", 2],
          ["scarf", 3],
          ["dress", 1],
          ["jacket", 1],
        ],
        required: [
          ["shorts", 1],
          ["scarf", 2],
        ],
      },
    ],
  },
  {
    key: "bakery",
    name: "Tiệm bánh",
    color: "#F5822B",
    rounds: [
      {
        instructionEn: "Buy 2 cookies and 1 cake.",
        instructionVi: "Mua 2 cái bánh quy và 1 cái bánh kem.",
        shelfCounts: [
          ["cookie", 3],
          ["cake", 2],
          ["donut", 1],
          ["pie", 1],
        ],
        required: [
          ["cookie", 2],
          ["cake", 1],
        ],
      },
      {
        instructionEn: "Buy 1 donut and 2 cupcakes.",
        instructionVi: "Mua 1 cái bánh donut và 2 cái bánh cupcake.",
        shelfCounts: [
          ["donut", 2],
          ["cupcake", 3],
          ["croissant", 1],
          ["candy", 1],
        ],
        required: [
          ["donut", 1],
          ["cupcake", 2],
        ],
      },
      {
        instructionEn: "Buy 3 candies and 1 chocolate.",
        instructionVi: "Mua 3 viên kẹo và 1 thanh sô-cô-la.",
        shelfCounts: [
          ["candy", 4],
          ["chocolate", 2],
          ["cookie", 1],
          ["cake", 1],
        ],
        required: [
          ["candy", 3],
          ["chocolate", 1],
        ],
      },
      {
        instructionEn: "Buy 2 croissants and 1 pie.",
        instructionVi: "Mua 2 cái bánh sừng bò và 1 cái bánh pie.",
        shelfCounts: [
          ["croissant", 3],
          ["pie", 2],
          ["donut", 1],
          ["cupcake", 1],
        ],
        required: [
          ["croissant", 2],
          ["pie", 1],
        ],
      },
      {
        instructionEn: "Buy 1 cake and 2 chocolates.",
        instructionVi: "Mua 1 cái bánh kem và 2 thanh sô-cô-la.",
        shelfCounts: [
          ["cake", 2],
          ["chocolate", 3],
          ["candy", 1],
          ["cookie", 1],
        ],
        required: [
          ["cake", 1],
          ["chocolate", 2],
        ],
      },
    ],
  },
  {
    key: "vegetable-stand",
    name: "Cửa hàng rau củ",
    color: "#57C6C6",
    rounds: [
      {
        instructionEn: "Buy 2 carrots and 1 cabbage.",
        instructionVi: "Mua 2 củ cà rốt và 1 cái bắp cải.",
        shelfCounts: [
          ["carrot", 3],
          ["cabbage", 2],
          ["potato", 1],
          ["onion", 1],
        ],
        required: [
          ["carrot", 2],
          ["cabbage", 1],
        ],
      },
      {
        instructionEn: "Buy 1 broccoli and 2 peppers.",
        instructionVi: "Mua 1 bông cải xanh và 2 quả ớt chuông.",
        shelfCounts: [
          ["broccoli", 2],
          ["pepper", 3],
          ["cucumber", 1],
          ["corn", 1],
        ],
        required: [
          ["broccoli", 1],
          ["pepper", 2],
        ],
      },
      {
        instructionEn: "Buy 3 corns and 1 cucumber.",
        instructionVi: "Mua 3 bắp ngô và 1 quả dưa chuột.",
        shelfCounts: [
          ["corn", 4],
          ["cucumber", 2],
          ["tomato", 1],
          ["onion", 1],
        ],
        required: [
          ["corn", 3],
          ["cucumber", 1],
        ],
      },
      {
        instructionEn: "Buy 2 tomatoes and 1 onion.",
        instructionVi: "Mua 2 quả cà chua và 1 củ hành tây.",
        shelfCounts: [
          ["tomato", 3],
          ["onion", 2],
          ["potato", 1],
          ["pepper", 1],
        ],
        required: [
          ["tomato", 2],
          ["onion", 1],
        ],
      },
      {
        instructionEn: "Buy 1 potato and 2 cabbages.",
        instructionVi: "Mua 1 củ khoai tây và 2 cái bắp cải.",
        shelfCounts: [
          ["potato", 2],
          ["cabbage", 3],
          ["carrot", 1],
          ["broccoli", 1],
        ],
        required: [
          ["potato", 1],
          ["cabbage", 2],
        ],
      },
    ],
  },
];

function pluralShopName(name: string, qty: number) {
  if (qty === 1 || name.endsWith("s")) return name;
  if (name.endsWith("y") && !/[aeiou]y$/i.test(name)) return `${name.slice(0, -1)}ies`;
  if (/(ch|sh|x|o)$/i.test(name)) return `${name}es`;
  return `${name}s`;
}
function expandShopTopic(topic: ShopTopicSeed): ShopRoundSeed[] {
  const pool = [...new Set(topic.rounds.flatMap((round) => round.shelfCounts.map(([key]) => key)))];
  return Array.from({ length: 100 }, (_, index) => {
    const tier = index < 34 ? 0 : index < 67 ? 1 : 2;
    const typeCount = tier === 0 ? 1 + (index % 2) : tier === 1 ? 2 + (index % 2) : 3;
    const required = Array.from({ length: typeCount }, (_, offset) => {
      const key = pool[(index + offset * 2) % pool.length]!;
      const qty = 1 + ((index + offset) % (tier === 2 ? 3 : 2));
      return [key, qty] as [ShopItemKey, number];
    });
    const requiredKeys = new Set(required.map(([key]) => key));
    const decoys = pool.filter((key) => !requiredKeys.has(key)).slice(index % Math.max(1, pool.length - typeCount), index % Math.max(1, pool.length - typeCount) + 2);
    while (decoys.length < 2) { const candidate = pool[(index + decoys.length + typeCount) % pool.length]!; if (!requiredKeys.has(candidate) && !decoys.includes(candidate)) decoys.push(candidate); else break; }
    const shelfCounts: [ShopItemKey, number][] = [...required.map(([key, qty]) => [key, qty + 1] as [ShopItemKey, number]), ...decoys.map((key) => [key, 1] as [ShopItemKey, number])];
    const enItems = required.map(([key, qty]) => `${qty} ${pluralShopName(SHOP_ITEMS[key].en.toLowerCase(), qty)}`);
    const viItems = required.map(([key, qty]) => `${qty} ${SHOP_ITEMS[key].vi}`);
    return { instructionEn: `Buy ${enItems.join(enItems.length > 2 ? ", " : " and ").replace(/, ([^,]+)$/, ", and $1")}.`, instructionVi: `Mua ${viItems.join(" và ")}.`, shelfCounts, required };
  });
}
for (const topic of SHOP_TOPICS) topic.rounds = expandShopTopic(topic);

// ---------------------------------------------------------------------------
// English Home topics — "Put the red ball under the table." style placement
// rounds: pick the right object (color + noun, among decoys) then the right
// zone (preposition + furniture, among decoys). Each round is self-contained
// (unlike Shop's shared item dictionary, there's no "quantity" concept here
// and object/zone lists barely repeat across rounds, so no dictionary is
// worth the indirection — see frontend/src/pages/EnglishHome.tsx for the
// actual two-step tap gameplay this feeds.
// ---------------------------------------------------------------------------
interface HomeObjectSeed {
  key: string;
  en: string;
  emoji: string;
  color: string;
}
interface HomeZoneSeed {
  key: string;
  label: string;
  emoji: string;
}
interface HomeRoundSeed {
  instructionEn: string;
  instructionVi: string;
  objects: HomeObjectSeed[];
  correctObjectKey: string;
  zones: HomeZoneSeed[];
  correctZoneKey: string;
}
interface HomeTopicSeed {
  key: string;
  name: string;
  color: string;
  rounds: HomeRoundSeed[];
}

const RED = "#EF6A5A";
const BLUE = "#6C8FE3";
const YELLOW = "#FFC93C";
const GREEN = "#7CC24A";
const ORANGE = "#F5822B";
const PURPLE = "#9B7EDE";
const BROWN = "#8A5A3B";
const WHITE = "#F1E7D3";
const BLACK = "#4A3728";

const HOME_TOPICS: HomeTopicSeed[] = [
  {
    key: "living-room",
    name: "Phòng khách",
    color: "#5C7BC9",
    rounds: [
      {
        instructionEn: "Put the red ball under the table.",
        instructionVi: "Đặt quả bóng đỏ dưới cái bàn.",
        objects: [
          { key: "red-ball", en: "Red Ball", emoji: "⚽", color: RED },
          { key: "blue-ball", en: "Blue Ball", emoji: "⚽", color: BLUE },
          { key: "red-car", en: "Red Car", emoji: "🚗", color: RED },
        ],
        correctObjectKey: "red-ball",
        zones: [
          { key: "under-table", label: "Under the table", emoji: "🍽️" },
          { key: "on-table", label: "On the table", emoji: "🍽️" },
          { key: "next-sofa", label: "Next to the sofa", emoji: "🛋️" },
          { key: "behind-door", label: "Behind the door", emoji: "🚪" },
        ],
        correctZoneKey: "under-table",
      },
      {
        instructionEn: "Put the blue book on the table.",
        instructionVi: "Đặt quyển sách xanh dương trên cái bàn.",
        objects: [
          { key: "blue-book", en: "Blue Book", emoji: "📖", color: BLUE },
          { key: "red-book", en: "Red Book", emoji: "📖", color: RED },
          { key: "blue-box", en: "Blue Box", emoji: "📦", color: BLUE },
        ],
        correctObjectKey: "blue-book",
        zones: [
          { key: "on-table", label: "On the table", emoji: "🍽️" },
          { key: "under-chair", label: "Under the chair", emoji: "🪑" },
          { key: "next-window", label: "Next to the window", emoji: "🪟" },
          { key: "behind-sofa", label: "Behind the sofa", emoji: "🛋️" },
        ],
        correctZoneKey: "on-table",
      },
      {
        instructionEn: "Put the yellow teddy bear next to the sofa.",
        instructionVi: "Đặt gấu bông vàng cạnh cái ghế sofa.",
        objects: [
          { key: "yellow-teddy", en: "Yellow Teddy Bear", emoji: "🧸", color: YELLOW },
          { key: "brown-teddy", en: "Brown Teddy Bear", emoji: "🧸", color: BROWN },
          { key: "yellow-ball", en: "Yellow Ball", emoji: "⚽", color: YELLOW },
        ],
        correctObjectKey: "yellow-teddy",
        zones: [
          { key: "next-sofa", label: "Next to the sofa", emoji: "🛋️" },
          { key: "under-table", label: "Under the table", emoji: "🍽️" },
          { key: "on-chair", label: "On the chair", emoji: "🪑" },
          { key: "behind-door", label: "Behind the door", emoji: "🚪" },
        ],
        correctZoneKey: "next-sofa",
      },
      {
        instructionEn: "Put the green box behind the door.",
        instructionVi: "Đặt cái hộp xanh lá sau cánh cửa.",
        objects: [
          { key: "green-box", en: "Green Box", emoji: "📦", color: GREEN },
          { key: "red-box", en: "Red Box", emoji: "📦", color: RED },
          { key: "green-ball", en: "Green Ball", emoji: "⚽", color: GREEN },
        ],
        correctObjectKey: "green-box",
        zones: [
          { key: "behind-door", label: "Behind the door", emoji: "🚪" },
          { key: "on-table", label: "On the table", emoji: "🍽️" },
          { key: "under-window", label: "Under the window", emoji: "🪟" },
          { key: "next-chair", label: "Next to the chair", emoji: "🪑" },
        ],
        correctZoneKey: "behind-door",
      },
      {
        instructionEn: "Put the purple ball on the chair.",
        instructionVi: "Đặt quả bóng tím trên cái ghế.",
        objects: [
          { key: "purple-ball", en: "Purple Ball", emoji: "⚽", color: PURPLE },
          { key: "purple-book", en: "Purple Book", emoji: "📖", color: PURPLE },
          { key: "blue-ball", en: "Blue Ball", emoji: "⚽", color: BLUE },
        ],
        correctObjectKey: "purple-ball",
        zones: [
          { key: "on-chair", label: "On the chair", emoji: "🪑" },
          { key: "under-sofa", label: "Under the sofa", emoji: "🛋️" },
          { key: "next-table", label: "Next to the table", emoji: "🍽️" },
          { key: "behind-window", label: "Behind the window", emoji: "🪟" },
        ],
        correctZoneKey: "on-chair",
      },
    ],
  },
  {
    key: "bedroom",
    name: "Phòng ngủ",
    color: "#9B7EDE",
    rounds: [
      {
        instructionEn: "Put the red sock under the bed.",
        instructionVi: "Đặt chiếc tất đỏ dưới gầm giường.",
        objects: [
          { key: "red-sock", en: "Red Sock", emoji: "🧦", color: RED },
          { key: "blue-sock", en: "Blue Sock", emoji: "🧦", color: BLUE },
          { key: "red-hat", en: "Red Hat", emoji: "🧢", color: RED },
        ],
        correctObjectKey: "red-sock",
        zones: [
          { key: "under-bed", label: "Under the bed", emoji: "🛏️" },
          { key: "on-bed", label: "On the bed", emoji: "🛏️" },
          { key: "next-lamp", label: "Next to the lamp", emoji: "💡" },
          { key: "in-closet", label: "In the closet", emoji: "🗄️" },
        ],
        correctZoneKey: "under-bed",
      },
      {
        instructionEn: "Put the blue book on the bed.",
        instructionVi: "Đặt quyển sách xanh dương trên giường.",
        objects: [
          { key: "blue-book", en: "Blue Book", emoji: "📖", color: BLUE },
          { key: "yellow-book", en: "Yellow Book", emoji: "📖", color: YELLOW },
          { key: "blue-teddy", en: "Blue Teddy Bear", emoji: "🧸", color: BLUE },
        ],
        correctObjectKey: "blue-book",
        zones: [
          { key: "on-bed", label: "On the bed", emoji: "🛏️" },
          { key: "under-window", label: "Under the window", emoji: "🪟" },
          { key: "next-closet", label: "Next to the closet", emoji: "🗄️" },
          { key: "behind-lamp", label: "Behind the lamp", emoji: "💡" },
        ],
        correctZoneKey: "on-bed",
      },
      {
        instructionEn: "Put the yellow teddy bear next to the lamp.",
        instructionVi: "Đặt gấu bông vàng cạnh cái đèn.",
        objects: [
          { key: "yellow-teddy", en: "Yellow Teddy Bear", emoji: "🧸", color: YELLOW },
          { key: "brown-teddy", en: "Brown Teddy Bear", emoji: "🧸", color: BROWN },
          { key: "yellow-ball", en: "Yellow Ball", emoji: "⚽", color: YELLOW },
        ],
        correctObjectKey: "yellow-teddy",
        zones: [
          { key: "next-lamp", label: "Next to the lamp", emoji: "💡" },
          { key: "under-bed", label: "Under the bed", emoji: "🛏️" },
          { key: "in-closet", label: "In the closet", emoji: "🗄️" },
          { key: "on-window", label: "On the window", emoji: "🪟" },
        ],
        correctZoneKey: "next-lamp",
      },
      {
        instructionEn: "Put the green shirt in the closet.",
        instructionVi: "Đặt cái áo xanh lá vào tủ đồ.",
        objects: [
          { key: "green-shirt", en: "Green Shirt", emoji: "👕", color: GREEN },
          { key: "red-shirt", en: "Red Shirt", emoji: "👕", color: RED },
          { key: "green-sock", en: "Green Sock", emoji: "🧦", color: GREEN },
        ],
        correctObjectKey: "green-shirt",
        zones: [
          { key: "in-closet", label: "In the closet", emoji: "🗄️" },
          { key: "under-bed", label: "Under the bed", emoji: "🛏️" },
          { key: "on-lamp", label: "On the lamp", emoji: "💡" },
          { key: "next-window", label: "Next to the window", emoji: "🪟" },
        ],
        correctZoneKey: "in-closet",
      },
      {
        instructionEn: "Put the orange ball under the window.",
        instructionVi: "Đặt quả bóng cam dưới cửa sổ.",
        objects: [
          { key: "orange-ball", en: "Orange Ball", emoji: "⚽", color: ORANGE },
          { key: "orange-book", en: "Orange Book", emoji: "📖", color: ORANGE },
          { key: "blue-ball", en: "Blue Ball", emoji: "⚽", color: BLUE },
        ],
        correctObjectKey: "orange-ball",
        zones: [
          { key: "under-window", label: "Under the window", emoji: "🪟" },
          { key: "on-bed", label: "On the bed", emoji: "🛏️" },
          { key: "next-closet", label: "Next to the closet", emoji: "🗄️" },
          { key: "behind-lamp", label: "Behind the lamp", emoji: "💡" },
        ],
        correctZoneKey: "under-window",
      },
    ],
  },
  {
    key: "kitchen",
    name: "Nhà bếp",
    color: "#F5822B",
    rounds: [
      {
        instructionEn: "Put the red apple on the table.",
        instructionVi: "Đặt quả táo đỏ trên bàn.",
        objects: [
          { key: "red-apple", en: "Red Apple", emoji: "🍎", color: RED },
          { key: "green-apple", en: "Green Apple", emoji: "🍏", color: GREEN },
          { key: "red-cup", en: "Red Cup", emoji: "☕", color: RED },
        ],
        correctObjectKey: "red-apple",
        zones: [
          { key: "on-table", label: "On the table", emoji: "🍽️" },
          { key: "in-cabinet", label: "In the cabinet", emoji: "🗄️" },
          { key: "next-sink", label: "Next to the sink", emoji: "🚰" },
          { key: "under-chair", label: "Under the chair", emoji: "🪑" },
        ],
        correctZoneKey: "on-table",
      },
      {
        instructionEn: "Put the blue cup in the cabinet.",
        instructionVi: "Đặt cái cốc xanh dương vào tủ chén.",
        objects: [
          { key: "blue-cup", en: "Blue Cup", emoji: "☕", color: BLUE },
          { key: "yellow-cup", en: "Yellow Cup", emoji: "☕", color: YELLOW },
          { key: "blue-bowl", en: "Blue Bowl", emoji: "🥣", color: BLUE },
        ],
        correctObjectKey: "blue-cup",
        zones: [
          { key: "in-cabinet", label: "In the cabinet", emoji: "🗄️" },
          { key: "on-table", label: "On the table", emoji: "🍽️" },
          { key: "next-chair", label: "Next to the chair", emoji: "🪑" },
          { key: "under-sink", label: "Under the sink", emoji: "🚰" },
        ],
        correctZoneKey: "in-cabinet",
      },
      {
        instructionEn: "Put the yellow bowl next to the sink.",
        instructionVi: "Đặt cái tô vàng cạnh bồn rửa.",
        objects: [
          { key: "yellow-bowl", en: "Yellow Bowl", emoji: "🥣", color: YELLOW },
          { key: "red-bowl", en: "Red Bowl", emoji: "🥣", color: RED },
          { key: "yellow-spoon", en: "Yellow Spoon", emoji: "🥄", color: YELLOW },
        ],
        correctObjectKey: "yellow-bowl",
        zones: [
          { key: "next-sink", label: "Next to the sink", emoji: "🚰" },
          { key: "on-chair", label: "On the chair", emoji: "🪑" },
          { key: "in-cabinet", label: "In the cabinet", emoji: "🗄️" },
          { key: "under-table", label: "Under the table", emoji: "🍽️" },
        ],
        correctZoneKey: "next-sink",
      },
      {
        instructionEn: "Put the green spoon under the chair.",
        instructionVi: "Đặt cái thìa xanh lá dưới ghế.",
        objects: [
          { key: "green-spoon", en: "Green Spoon", emoji: "🥄", color: GREEN },
          { key: "red-spoon", en: "Red Spoon", emoji: "🥄", color: RED },
          { key: "green-cup", en: "Green Cup", emoji: "☕", color: GREEN },
        ],
        correctObjectKey: "green-spoon",
        zones: [
          { key: "under-chair", label: "Under the chair", emoji: "🪑" },
          { key: "on-table", label: "On the table", emoji: "🍽️" },
          { key: "in-cabinet", label: "In the cabinet", emoji: "🗄️" },
          { key: "next-sink", label: "Next to the sink", emoji: "🚰" },
        ],
        correctZoneKey: "under-chair",
      },
      {
        instructionEn: "Put the purple grapes on the table.",
        instructionVi: "Đặt chùm nho tím trên bàn.",
        objects: [
          { key: "purple-grapes", en: "Purple Grapes", emoji: "🍇", color: PURPLE },
          { key: "green-grapes", en: "Green Grapes", emoji: "🍇", color: GREEN },
          { key: "purple-cup", en: "Purple Cup", emoji: "☕", color: PURPLE },
        ],
        correctObjectKey: "purple-grapes",
        zones: [
          { key: "on-table", label: "On the table", emoji: "🍽️" },
          { key: "in-cabinet", label: "In the cabinet", emoji: "🗄️" },
          { key: "next-sink", label: "Next to the sink", emoji: "🚰" },
          { key: "under-chair", label: "Under the chair", emoji: "🪑" },
        ],
        correctZoneKey: "on-table",
      },
    ],
  },
  {
    key: "bathroom",
    name: "Phòng tắm",
    color: "#57C6C6",
    rounds: [
      {
        instructionEn: "Put the yellow duck in the bathtub.",
        instructionVi: "Đặt con vịt vàng vào bồn tắm.",
        objects: [
          { key: "yellow-duck", en: "Yellow Duck", emoji: "🦆", color: YELLOW },
          { key: "blue-duck", en: "Blue Duck", emoji: "🦆", color: BLUE },
          { key: "yellow-soap", en: "Yellow Soap", emoji: "🧼", color: YELLOW },
        ],
        correctObjectKey: "yellow-duck",
        zones: [
          { key: "in-bathtub", label: "In the bathtub", emoji: "🛁" },
          { key: "on-shelf", label: "On the shelf", emoji: "🗄️" },
          { key: "next-sink", label: "Next to the sink", emoji: "🚰" },
          { key: "front-mirror", label: "In front of the mirror", emoji: "🪞" },
        ],
        correctZoneKey: "in-bathtub",
      },
      {
        instructionEn: "Put the blue soap next to the sink.",
        instructionVi: "Đặt bánh xà phòng xanh dương cạnh bồn rửa.",
        objects: [
          { key: "blue-soap", en: "Blue Soap", emoji: "🧼", color: BLUE },
          { key: "red-soap", en: "Red Soap", emoji: "🧼", color: RED },
          { key: "blue-cup", en: "Blue Cup", emoji: "☕", color: BLUE },
        ],
        correctObjectKey: "blue-soap",
        zones: [
          { key: "next-sink", label: "Next to the sink", emoji: "🚰" },
          { key: "in-bathtub", label: "In the bathtub", emoji: "🛁" },
          { key: "on-shelf", label: "On the shelf", emoji: "🗄️" },
          { key: "front-mirror", label: "In front of the mirror", emoji: "🪞" },
        ],
        correctZoneKey: "next-sink",
      },
      {
        instructionEn: "Put the red toothbrush on the shelf.",
        instructionVi: "Đặt bàn chải đánh răng đỏ lên kệ.",
        objects: [
          { key: "red-toothbrush", en: "Red Toothbrush", emoji: "🪥", color: RED },
          { key: "green-toothbrush", en: "Green Toothbrush", emoji: "🪥", color: GREEN },
          { key: "red-cup", en: "Red Cup", emoji: "☕", color: RED },
        ],
        correctObjectKey: "red-toothbrush",
        zones: [
          { key: "on-shelf", label: "On the shelf", emoji: "🗄️" },
          { key: "in-bathtub", label: "In the bathtub", emoji: "🛁" },
          { key: "next-sink", label: "Next to the sink", emoji: "🚰" },
          { key: "front-mirror", label: "In front of the mirror", emoji: "🪞" },
        ],
        correctZoneKey: "on-shelf",
      },
      {
        instructionEn: "Put the green cup in front of the mirror.",
        instructionVi: "Đặt cái cốc xanh lá trước gương.",
        objects: [
          { key: "green-cup", en: "Green Cup", emoji: "☕", color: GREEN },
          { key: "yellow-cup", en: "Yellow Cup", emoji: "☕", color: YELLOW },
          { key: "green-soap", en: "Green Soap", emoji: "🧼", color: GREEN },
        ],
        correctObjectKey: "green-cup",
        zones: [
          { key: "front-mirror", label: "In front of the mirror", emoji: "🪞" },
          { key: "in-bathtub", label: "In the bathtub", emoji: "🛁" },
          { key: "on-shelf", label: "On the shelf", emoji: "🗄️" },
          { key: "next-sink", label: "Next to the sink", emoji: "🚰" },
        ],
        correctZoneKey: "front-mirror",
      },
      {
        instructionEn: "Put the purple duck in the bathtub.",
        instructionVi: "Đặt con vịt tím vào bồn tắm.",
        objects: [
          { key: "purple-duck", en: "Purple Duck", emoji: "🦆", color: PURPLE },
          { key: "yellow-duck", en: "Yellow Duck", emoji: "🦆", color: YELLOW },
          { key: "purple-soap", en: "Purple Soap", emoji: "🧼", color: PURPLE },
        ],
        correctObjectKey: "purple-duck",
        zones: [
          { key: "in-bathtub", label: "In the bathtub", emoji: "🛁" },
          { key: "on-shelf", label: "On the shelf", emoji: "🗄️" },
          { key: "next-sink", label: "Next to the sink", emoji: "🚰" },
          { key: "front-mirror", label: "In front of the mirror", emoji: "🪞" },
        ],
        correctZoneKey: "in-bathtub",
      },
    ],
  },
  {
    key: "garden",
    name: "Khu vườn",
    color: "#4F7C2A",
    rounds: [
      {
        instructionEn: "Put the brown dog under the tree.",
        instructionVi: "Đặt chú chó nâu dưới gốc cây.",
        objects: [
          { key: "brown-dog", en: "Brown Dog", emoji: "🐶", color: BROWN },
          { key: "black-cat", en: "Black Cat", emoji: "🐱", color: BLACK },
          { key: "brown-ball", en: "Brown Ball", emoji: "⚽", color: BROWN },
        ],
        correctObjectKey: "brown-dog",
        zones: [
          { key: "under-tree", label: "Under the tree", emoji: "🌳" },
          { key: "on-bench", label: "On the bench", emoji: "🪑" },
          { key: "next-flower", label: "Next to the flower", emoji: "🌷" },
          { key: "near-gate", label: "Near the gate", emoji: "🚪" },
        ],
        correctZoneKey: "under-tree",
      },
      {
        instructionEn: "Put the black cat on the bench.",
        instructionVi: "Đặt chú mèo đen lên băng ghế.",
        objects: [
          { key: "black-cat", en: "Black Cat", emoji: "🐱", color: BLACK },
          { key: "white-cat", en: "White Cat", emoji: "🐱", color: WHITE },
          { key: "black-dog", en: "Black Dog", emoji: "🐶", color: BLACK },
        ],
        correctObjectKey: "black-cat",
        zones: [
          { key: "on-bench", label: "On the bench", emoji: "🪑" },
          { key: "under-tree", label: "Under the tree", emoji: "🌳" },
          { key: "near-gate", label: "Near the gate", emoji: "🚪" },
          { key: "next-flower", label: "Next to the flower", emoji: "🌷" },
        ],
        correctZoneKey: "on-bench",
      },
      {
        instructionEn: "Put the blue butterfly next to the flower.",
        instructionVi: "Đặt con bướm xanh dương cạnh bông hoa.",
        objects: [
          { key: "blue-butterfly", en: "Blue Butterfly", emoji: "🦋", color: BLUE },
          { key: "orange-butterfly", en: "Orange Butterfly", emoji: "🦋", color: ORANGE },
          { key: "blue-bird", en: "Blue Bird", emoji: "🐦", color: BLUE },
        ],
        correctObjectKey: "blue-butterfly",
        zones: [
          { key: "next-flower", label: "Next to the flower", emoji: "🌷" },
          { key: "under-tree", label: "Under the tree", emoji: "🌳" },
          { key: "on-bench", label: "On the bench", emoji: "🪑" },
          { key: "near-gate", label: "Near the gate", emoji: "🚪" },
        ],
        correctZoneKey: "next-flower",
      },
      {
        instructionEn: "Put the red ball near the gate.",
        instructionVi: "Đặt quả bóng đỏ gần cổng.",
        objects: [
          { key: "red-ball", en: "Red Ball", emoji: "⚽", color: RED },
          { key: "yellow-ball", en: "Yellow Ball", emoji: "⚽", color: YELLOW },
          { key: "red-bird", en: "Red Bird", emoji: "🐦", color: RED },
        ],
        correctObjectKey: "red-ball",
        zones: [
          { key: "near-gate", label: "Near the gate", emoji: "🚪" },
          { key: "under-tree", label: "Under the tree", emoji: "🌳" },
          { key: "on-bench", label: "On the bench", emoji: "🪑" },
          { key: "next-flower", label: "Next to the flower", emoji: "🌷" },
        ],
        correctZoneKey: "near-gate",
      },
      {
        instructionEn: "Put the yellow bird under the tree.",
        instructionVi: "Đặt con chim vàng dưới gốc cây.",
        objects: [
          { key: "yellow-bird", en: "Yellow Bird", emoji: "🐦", color: YELLOW },
          { key: "blue-bird", en: "Blue Bird", emoji: "🐦", color: BLUE },
          { key: "yellow-butterfly", en: "Yellow Butterfly", emoji: "🦋", color: YELLOW },
        ],
        correctObjectKey: "yellow-bird",
        zones: [
          { key: "under-tree", label: "Under the tree", emoji: "🌳" },
          { key: "on-bench", label: "On the bench", emoji: "🪑" },
          { key: "near-gate", label: "Near the gate", emoji: "🚪" },
          { key: "next-flower", label: "Next to the flower", emoji: "🌷" },
        ],
        correctZoneKey: "under-tree",
      },
    ],
  },
];

// Every HomeRound's instructionEn/instructionVi is a literal "Put the {color}
// {noun} {preposition} the {furniture}." sentence — rather than hand-
// translating all 25 of them, derive instructionJa/instructionKo straight
// from correctObjectKey ("red-ball") and correctZoneKey ("under-table"),
// which already encode exactly this color+noun / preposition+furniture
// structure (see the doc comment on HomeRoundSeed above).
const HOME_COLOR_WORDS: Record<string, [string, string]> = {
  red: ["赤", "빨간"], blue: ["青", "파란"], yellow: ["黄色", "노란"], green: ["緑", "초록"], orange: ["オレンジ色", "주황색"],
  purple: ["紫", "보라"], brown: ["茶色", "갈색"], white: ["白", "하얀"], black: ["黒", "검은"],
};
const HOME_NOUN_WORDS: Record<string, [string, string]> = {
  ball: ["ボール", "공"], book: ["本", "책"], teddy: ["クマのぬいぐるみ", "곰 인형"], box: ["箱", "상자"], car: ["車", "자동차"],
  sock: ["靴下", "양말"], hat: ["帽子", "모자"], shirt: ["シャツ", "셔츠"], apple: ["りんご", "사과"], cup: ["カップ", "컵"],
  bowl: ["ボウル", "그릇"], spoon: ["スプーン", "숟가락"], grapes: ["ぶどう", "포도"], duck: ["アヒル", "오리"], soap: ["石鹸", "비누"],
  toothbrush: ["歯ブラシ", "칫솔"], dog: ["犬", "개"], cat: ["猫", "고양이"], butterfly: ["蝶", "나비"], bird: ["鳥", "새"],
};
const HOME_FURNITURE_WORDS: Record<string, [string, string]> = {
  table: ["テーブル", "테이블"], sofa: ["ソファー", "소파"], door: ["ドア", "문"], chair: ["椅子", "의자"], bed: ["ベッド", "침대"],
  lamp: ["ランプ", "램프"], closet: ["クローゼット", "옷장"], window: ["窓", "창문"], cabinet: ["戸棚", "찬장"], sink: ["シンク", "싱크대"],
  bathtub: ["浴槽", "욕조"], shelf: ["棚", "선반"], mirror: ["鏡", "거울"], tree: ["木", "나무"], bench: ["ベンチ", "벤치"],
  flower: ["花", "꽃"], gate: ["門", "대문"],
};
// JA suffix, KO suffix — attach directly after the furniture word (KO adds a space).
const HOME_PREP_WORDS: Record<string, [string, string]> = {
  under: ["の下に", "아래에"], on: ["の上に", "위에"], next: ["の隣に", "옆에"], behind: ["の後ろに", "뒤에"],
  in: ["の中に", "안에"], front: ["の前に", "앞에"], near: ["の近くに", "근처에"],
};
/** true = the word needs 을 (ends in a consonant/받침), false = 를 (ends in a vowel). */
function hasKoBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}
function buildHomeInstruction(lang: "ja" | "ko", correctObjectKey: string, correctZoneKey: string): string {
  const [colorKey, ...nounParts] = correctObjectKey.split("-");
  const noun = nounParts.join("-");
  const [prepKey, ...furnitureParts] = correctZoneKey.split("-");
  const furniture = furnitureParts.join("-");
  const idx = lang === "ja" ? 0 : 1;
  const color = HOME_COLOR_WORDS[colorKey!]![idx];
  const nounWord = HOME_NOUN_WORDS[noun]![idx];
  const furnitureWord = HOME_FURNITURE_WORDS[furniture]![idx];
  const prepWord = HOME_PREP_WORDS[prepKey!]![idx];
  if (lang === "ja") return `${furnitureWord}${prepWord}${color}の${nounWord}を置いてください。`;
  const object = `${color} ${nounWord}`;
  return `${furnitureWord} ${prepWord} ${object}${hasKoBatchim(nounWord) ? "을" : "를"} 놓으세요.`;
}

// ---------------------------------------------------------------------------
// Word RPG dungeons — a sequence of monsters, each with a few "what does
// this word mean?" questions; a monster's HP bar is just 100/questions.length
// per correct hit, so no separate HP number needs tuning by hand. The last
// monster in each dungeon is the boss (isBoss: true — only affects the
// reward amount, see services/rpg.service.ts, not the fight itself).
// ---------------------------------------------------------------------------
// Every question's answer/options are short emotion/action words that
// already repeat heavily across the 34 questions below — rather than hand-
// translating each options array, translate the small unique-word set once
// here and derive answerJa/optionsJa/answerKo/optionsKo at insert time
// (see rpgJa()/rpgKo() and main()) — translating `optionsVi` preserving
// array order keeps answerJa/answerKo correctly index-matched into it.
const RPG_WORD_JA_KO: Record<string, [string, string]> = {
  Đói: ["お腹が空いた", "배고픈"],
  "Buồn ngủ": ["眠い", "졸린"],
  "Vui vẻ": ["嬉しい", "행복한"],
  "Tức giận": ["怒っている", "화난"],
  Buồn: ["悲しい", "슬픈"],
  "Sợ hãi": ["怖い", "무서운"],
  "Hào hứng": ["わくわくする", "신난"],
  "Mệt mỏi": ["疲れた", "피곤한"],
  "Ngạc nhiên": ["驚いた", "놀란"],
  "Tự hào": ["誇らしい", "자랑스러운"],
  "Lo lắng": ["心配な", "걱정되는"],
  Chán: ["退屈な", "지루한"],
  Chạy: ["走る", "달리다"],
  Nhảy: ["跳ぶ", "뛰다"],
  Bơi: ["泳ぐ", "수영하다"],
  "Leo trèo": ["登る", "오르다"],
  Bay: ["飛ぶ", "날다"],
  Đào: ["掘る", "파다"],
  Bò: ["はう", "기다"],
  "Đi bộ": ["歩く", "걷다"],
  Ngồi: ["座る", "앉다"],
  Ném: ["投げる", "던지다"],
  Bắt: ["捕まえる", "잡다"],
  Đá: ["蹴る", "차다"],
};
function rpgJa(vi: string): string {
  return RPG_WORD_JA_KO[vi]![0];
}
function rpgKo(vi: string): string {
  return RPG_WORD_JA_KO[vi]![1];
}

interface RpgQuestionSeed {
  en: string;
  answerVi: string;
  optionsVi: string[];
}
interface RpgMonsterSeed {
  name: string;
  emoji: string;
  isBoss?: boolean;
  questions: RpgQuestionSeed[];
}
interface RpgTopicSeed {
  key: string;
  name: string;
  color: string;
  monsters: RpgMonsterSeed[];
}

const RPG_TOPICS: RpgTopicSeed[] = [
  {
    key: "emotion-forest",
    name: "Khu Rừng Cảm Xúc",
    color: "#9B7EDE",
    monsters: [
      {
        name: "Slime Buồn Ngủ",
        emoji: "🫧",
        questions: [
          { en: "hungry", answerVi: "Đói", optionsVi: ["Đói", "Buồn ngủ", "Vui vẻ"] },
          { en: "sleepy", answerVi: "Buồn ngủ", optionsVi: ["Buồn ngủ", "Đói", "Buồn"] },
          { en: "happy", answerVi: "Vui vẻ", optionsVi: ["Vui vẻ", "Tức giận", "Sợ hãi"] },
        ],
      },
      {
        name: "Yêu Tinh Giận Dữ",
        emoji: "👺",
        questions: [
          { en: "angry", answerVi: "Tức giận", optionsVi: ["Tức giận", "Vui vẻ", "Buồn"] },
          { en: "sad", answerVi: "Buồn", optionsVi: ["Buồn", "Hào hứng", "Mệt mỏi"] },
          { en: "scared", answerVi: "Sợ hãi", optionsVi: ["Sợ hãi", "Tức giận", "Ngạc nhiên"] },
        ],
      },
      {
        name: "Ma Sợ Hãi",
        emoji: "👻",
        questions: [
          { en: "excited", answerVi: "Hào hứng", optionsVi: ["Hào hứng", "Mệt mỏi", "Chán"] },
          { en: "tired", answerVi: "Mệt mỏi", optionsVi: ["Mệt mỏi", "Hào hứng", "Tự hào"] },
          { en: "surprised", answerVi: "Ngạc nhiên", optionsVi: ["Ngạc nhiên", "Lo lắng", "Sợ hãi"] },
        ],
      },
      {
        name: "Rồng Con Bối Rối",
        emoji: "🐉",
        questions: [
          { en: "proud", answerVi: "Tự hào", optionsVi: ["Tự hào", "Lo lắng", "Chán"] },
          { en: "nervous", answerVi: "Lo lắng", optionsVi: ["Lo lắng", "Tự hào", "Ngạc nhiên"] },
          { en: "bored", answerVi: "Chán", optionsVi: ["Chán", "Hào hứng", "Vui vẻ"] },
        ],
      },
      {
        name: "Chúa Tể Cảm Xúc",
        emoji: "👹",
        isBoss: true,
        questions: [
          { en: "hungry", answerVi: "Đói", optionsVi: ["Đói", "Chán", "Tự hào"] },
          { en: "angry", answerVi: "Tức giận", optionsVi: ["Tức giận", "Hào hứng", "Buồn ngủ"] },
          { en: "excited", answerVi: "Hào hứng", optionsVi: ["Hào hứng", "Sợ hãi", "Mệt mỏi"] },
          { en: "nervous", answerVi: "Lo lắng", optionsVi: ["Lo lắng", "Vui vẻ", "Đói"] },
          { en: "surprised", answerVi: "Ngạc nhiên", optionsVi: ["Ngạc nhiên", "Buồn", "Tự hào"] },
        ],
      },
    ],
  },
  {
    key: "action-cave",
    name: "Hang Động Hành Động",
    color: "#57C6C6",
    monsters: [
      {
        name: "Dơi Nhảy Múa",
        emoji: "🦇",
        questions: [
          { en: "run", answerVi: "Chạy", optionsVi: ["Chạy", "Nhảy", "Bơi"] },
          { en: "jump", answerVi: "Nhảy", optionsVi: ["Nhảy", "Chạy", "Bay"] },
          { en: "swim", answerVi: "Bơi", optionsVi: ["Bơi", "Đào", "Bò"] },
        ],
      },
      {
        name: "Nhện Leo Trèo",
        emoji: "🕷️",
        questions: [
          { en: "climb", answerVi: "Leo trèo", optionsVi: ["Leo trèo", "Bay", "Đào"] },
          { en: "fly", answerVi: "Bay", optionsVi: ["Bay", "Leo trèo", "Chạy"] },
          { en: "dig", answerVi: "Đào", optionsVi: ["Đào", "Bơi", "Ngồi"] },
        ],
      },
      {
        name: "Rắn Trườn Bò",
        emoji: "🐍",
        questions: [
          { en: "crawl", answerVi: "Bò", optionsVi: ["Bò", "Đi bộ", "Ngồi"] },
          { en: "walk", answerVi: "Đi bộ", optionsVi: ["Đi bộ", "Bò", "Chạy"] },
          { en: "sit", answerVi: "Ngồi", optionsVi: ["Ngồi", "Đi bộ", "Nhảy"] },
        ],
      },
      {
        name: "Cua Đi Ngang",
        emoji: "🦀",
        questions: [
          { en: "throw", answerVi: "Ném", optionsVi: ["Ném", "Bắt", "Đá"] },
          { en: "catch", answerVi: "Bắt", optionsVi: ["Bắt", "Ném", "Đá"] },
          { en: "kick", answerVi: "Đá", optionsVi: ["Đá", "Ném", "Bắt"] },
        ],
      },
      {
        name: "Vua Hang Động",
        emoji: "🗿",
        isBoss: true,
        questions: [
          { en: "run", answerVi: "Chạy", optionsVi: ["Chạy", "Bay", "Ngồi"] },
          { en: "climb", answerVi: "Leo trèo", optionsVi: ["Leo trèo", "Bơi", "Đá"] },
          { en: "crawl", answerVi: "Bò", optionsVi: ["Bò", "Nhảy", "Bắt"] },
          { en: "throw", answerVi: "Ném", optionsVi: ["Ném", "Đào", "Đi bộ"] },
          { en: "fly", answerVi: "Bay", optionsVi: ["Bay", "Chạy", "Ngồi"] },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Word Train topics — a "train" is a run of small puzzles: fill in the
// missing letter of a word ("C _ T" -> "A"), then a couple of harder
// "unscramble this sentence" rounds at the end of each run. See
// frontend/src/pages/WordTrain.tsx for the actual two-mode gameplay this
// feeds ("kind" picks which one a round renders as).
// ---------------------------------------------------------------------------
interface WordTrainFillSeed {
  kind: "fill";
  vi: string;
  ja: string;
  ko: string;
  word: string;
  blankIndex: number;
  options: string[];
}
interface WordTrainScrambleSeed {
  kind: "scramble";
  vi: string;
  ja: string;
  ko: string;
  words: string[];
}
type WordTrainRoundSeed = WordTrainFillSeed | WordTrainScrambleSeed;
interface WordTrainTopicSeed {
  key: string;
  name: string;
  color: string;
  rounds: WordTrainRoundSeed[];
}

const WORD_TRAIN_TOPICS: WordTrainTopicSeed[] = [
  {
    key: "animal-train",
    name: "Chuyến Tàu Động Vật",
    color: "#F5822B",
    rounds: [
      { kind: "fill", vi: "con mèo", ja: "猫", ko: "고양이", word: "CAT", blankIndex: 1, options: ["A", "E", "I"] },
      { kind: "fill", vi: "con chó", ja: "犬", ko: "개", word: "DOG", blankIndex: 1, options: ["O", "A", "U"] },
      { kind: "fill", vi: "con lợn", ja: "豚", ko: "돼지", word: "PIG", blankIndex: 2, options: ["G", "T", "N"] },
      { kind: "fill", vi: "con bò", ja: "牛", ko: "소", word: "COW", blankIndex: 0, options: ["C", "H", "B"] },
      { kind: "fill", vi: "con gà mái", ja: "めんどり", ko: "암탉", word: "HEN", blankIndex: 1, options: ["E", "A", "O"] },
      { kind: "scramble", vi: "Con mèo đang ngủ.", ja: "猫が眠っています。", ko: "고양이가 자고 있어요.", words: ["The", "cat", "is", "sleeping."] },
    ],
  },
  {
    key: "food-train",
    name: "Chuyến Tàu Đồ Ăn",
    color: "#7CC24A",
    rounds: [
      { kind: "fill", vi: "mứt", ja: "ジャム", ko: "잼", word: "JAM", blankIndex: 1, options: ["A", "E", "I"] },
      { kind: "fill", vi: "quả trứng", ja: "卵", ko: "계란", word: "EGG", blankIndex: 0, options: ["E", "A", "I"] },
      { kind: "fill", vi: "trà", ja: "紅茶", ko: "차", word: "TEA", blankIndex: 2, options: ["A", "O", "U"] },
      { kind: "fill", vi: "thịt nguội", ja: "ハム", ko: "햄", word: "HAM", blankIndex: 0, options: ["H", "B", "P"] },
      { kind: "fill", vi: "bánh bao nhỏ", ja: "小さいパン", ko: "작은 빵", word: "BUN", blankIndex: 1, options: ["U", "A", "O"] },
      { kind: "scramble", vi: "Cái bánh này ngọt.", ja: "このパイは甘いです。", ko: "이 파이는 달아요.", words: ["The", "pie", "is", "sweet."] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Detective cases — "English Detective" (nhắm tới người lớn/trẻ lớn hơn, xem
// TASKS.md). Mỗi vụ án kể 1 tình huống bằng tiếng Anh, người chơi hỏi cung
// từng nghi phạm (đọc lời khai tiếng Anh, trả lời trắc nghiệm để hiểu ý, lộ
// ra 1 manh mối tiếng Việt) rồi buộc tội ở lượt cuối. Bản đầu dùng trắc
// nghiệm cho cả hỏi cung lẫn buộc tội (không nhập câu tự do) — xem
// frontend/src/pages/EnglishDetective.tsx.
// ---------------------------------------------------------------------------
interface DetectiveInterrogateSeed {
  kind: "interrogate";
  vi: string;
  ja: string;
  ko: string;
  npcName: string;
  npcEmoji: string;
  testimony: string;
  testimonyVi: string;
  testimonyJa: string;
  testimonyKo: string;
  question: string;
  options: string[];
  answerIndex: number;
  clueVi: string;
  clueJa: string;
  clueKo: string;
}
interface DetectiveAccuseSeed {
  kind: "accuse";
  vi: string;
  ja: string;
  ko: string;
  suspects: string[];
  correctSuspect: string;
}
type DetectiveRoundSeed = DetectiveInterrogateSeed | DetectiveAccuseSeed;
interface DetectiveCaseSeed {
  key: string;
  name: string;
  scenario: string;
  scenarioVi: string;
  scenarioJa: string;
  scenarioKo: string;
  color: string;
  rounds: DetectiveRoundSeed[];
}

const DETECTIVE_CASES: DetectiveCaseSeed[] = [
  {
    key: "jewelry-heist",
    name: "Vụ Trộm Vòng Cổ",
    scenario: "A diamond necklace disappeared from Mrs. Parker's mansion last night. Find the thief among the three guests.",
    scenarioVi: "Một chiếc vòng cổ kim cương biến mất khỏi biệt thự của bà Parker vào đêm qua. Hãy tìm ra tên trộm trong số ba vị khách.",
    scenarioJa: "昨夜、パーカー夫人の邸宅からダイヤモンドのネックレスが消えました。3人の客の中から犯人を見つけてください。",
    scenarioKo: "어젯밤 파커 부인의 저택에서 다이아몬드 목걸이가 사라졌습니다. 세 명의 손님 중에서 범인을 찾아보세요.",
    color: "#5C7BC9",
    rounds: [
      {
        kind: "interrogate",
        vi: "Hỏi cung ông Reed — quản gia",
        ja: "リード氏(執事)を尋問する",
        ko: "리드 씨(집사) 심문하기",
        npcName: "Mr. Reed",
        npcEmoji: "🎩",
        testimony: "I was cleaning the kitchen at 10 PM. I didn't see anything strange.",
        testimonyVi: "Tôi đang dọn bếp lúc 10 giờ tối. Tôi không thấy gì bất thường.",
        testimonyJa: "私は夜10時に台所を掃除していました。何もおかしなことは見ませんでした。",
        testimonyKo: "저는 밤 10시에 부엌을 청소하고 있었어요. 이상한 건 못 봤어요.",
        question: "What was Mr. Reed doing at 10 PM?",
        options: ["Cleaning the kitchen", "Sleeping upstairs", "Walking the dog"],
        answerIndex: 0,
        clueVi: "Đầu bếp xác nhận có thấy ông Reed trong bếp lúc đó — lời khai của ông có vẻ đúng.",
        clueJa: "料理人がその時間にリード氏を台所で見たと確認しました——彼の証言は正しいようです。",
        clueKo: "요리사가 그 시간에 리드 씨를 부엌에서 봤다고 확인해줬어요 — 그의 진술은 사실인 것 같아요.",
      },
      {
        kind: "interrogate",
        vi: "Hỏi cung cô Bloom — khách mời",
        ja: "ブルームさん(招待客)を尋問する",
        ko: "블룸 씨(초대 손님) 심문하기",
        npcName: "Ms. Bloom",
        npcEmoji: "💃",
        testimony: "I was in the garden all night. I love looking at the stars.",
        testimonyVi: "Tôi ở ngoài vườn cả đêm. Tôi thích ngắm sao.",
        testimonyJa: "私は一晩中庭にいました。星を見るのが好きなんです。",
        testimonyKo: "저는 밤새 정원에 있었어요. 별 보는 걸 좋아하거든요.",
        question: "Where did Ms. Bloom say she was?",
        options: ["In the garden", "In her bedroom", "In the kitchen"],
        answerIndex: 0,
        clueVi: "Nhưng trời đêm qua nhiều mây, không thể ngắm sao được — lời khai của cô Bloom có vẻ không đúng!",
        clueJa: "でも昨夜は曇っていて星は見えませんでした——ブルームさんの証言はおかしいようです!",
        clueKo: "하지만 어젯밤은 구름이 많아서 별을 볼 수 없었어요 — 블룸 씨의 진술이 이상한 것 같아요!",
      },
      {
        kind: "interrogate",
        vi: "Hỏi cung đầu bếp Tony",
        ja: "料理人トニーを尋問する",
        ko: "요리사 토니 심문하기",
        npcName: "Chef Tony",
        npcEmoji: "👨‍🍳",
        testimony: "I saw Ms. Bloom near the necklace display around 10 PM.",
        testimonyVi: "Tôi thấy cô Bloom gần tủ trưng bày vòng cổ lúc khoảng 10 giờ tối.",
        testimonyJa: "私は夜10時頃、ブルームさんがネックレスの展示ケースの近くにいるのを見ました。",
        testimonyKo: "저는 밤 10시쯤 블룸 씨가 목걸이 진열장 근처에 있는 걸 봤어요.",
        question: "Who did Chef Tony see near the necklace?",
        options: ["Ms. Bloom", "Mr. Reed", "Nobody"],
        answerIndex: 0,
        clueVi: "Đầu bếp xác nhận nhìn thấy cô Bloom gần hiện trường — càng thêm nghi ngờ.",
        clueJa: "料理人がブルームさんを現場近くで見たと確認しました——疑いがさらに強まります。",
        clueKo: "요리사가 블룸 씨를 현장 근처에서 봤다고 확인했어요 — 의심이 더 커집니다.",
      },
      {
        kind: "accuse",
        vi: "Ai là kẻ đã lấy trộm vòng cổ kim cương?",
        ja: "ダイヤモンドのネックレスを盗んだのは誰でしょう?",
        ko: "다이아몬드 목걸이를 훔친 사람은 누구일까요?",
        suspects: ["Mr. Reed", "Ms. Bloom", "Chef Tony"],
        correctSuspect: "Ms. Bloom",
      },
    ],
  },
  {
    key: "office-laptop",
    name: "Vụ Mất Laptop Văn Phòng",
    scenario: "Someone stole a laptop from the office last night. Three coworkers stayed late. Find out who did it.",
    scenarioVi: "Có người đã lấy trộm một chiếc laptop trong văn phòng vào đêm qua. Ba đồng nghiệp đã ở lại làm việc muộn. Hãy tìm ra thủ phạm.",
    scenarioJa: "昨夜、オフィスからノートパソコンが盗まれました。3人の同僚が遅くまで残っていました。犯人を見つけてください。",
    scenarioKo: "어젯밤 사무실에서 노트북이 도난당했습니다. 세 명의 동료가 늦게까지 남아 있었어요. 범인을 찾아보세요.",
    color: "#EF6A5A",
    rounds: [
      {
        kind: "interrogate",
        vi: "Hỏi cung Anna",
        ja: "アンナを尋問する",
        ko: "안나 심문하기",
        npcName: "Anna",
        npcEmoji: "👩‍💼",
        testimony: "I left the office at 9 PM. The lights were still on when I left.",
        testimonyVi: "Tôi rời văn phòng lúc 9 giờ tối. Đèn vẫn còn sáng khi tôi rời đi.",
        testimonyJa: "私は夜9時にオフィスを出ました。出る時、電気はまだついていました。",
        testimonyKo: "저는 밤 9시에 사무실을 나갔어요. 나갈 때 불이 아직 켜져 있었어요.",
        question: "What time did Anna say she left?",
        options: ["9 PM", "10 PM", "11 PM"],
        answerIndex: 0,
        clueVi: "Bảo vệ xác nhận thấy Anna rời đi đúng giờ đó — có vẻ Anna nói thật.",
        clueJa: "警備員がその時間にアンナが出て行くのを見たと確認しました——アンナは本当のことを言っているようです。",
        clueKo: "경비원이 그 시간에 안나가 나가는 걸 봤다고 확인했어요 — 안나는 사실을 말하는 것 같아요.",
      },
      {
        kind: "interrogate",
        vi: "Hỏi cung Mark",
        ja: "マークを尋問する",
        ko: "마크 심문하기",
        npcName: "Mark",
        npcEmoji: "👨‍💻",
        testimony: "I was fixing my computer until midnight. Nobody else was there.",
        testimonyVi: "Tôi sửa máy tính đến tận nửa đêm. Không có ai khác ở đó.",
        testimonyJa: "私は真夜中までパソコンを直していました。他には誰もいませんでした。",
        testimonyKo: "저는 자정까지 컴퓨터를 고치고 있었어요. 다른 사람은 없었어요.",
        question: "Until what time did Mark say he stayed?",
        options: ["Midnight", "10 PM", "9 PM"],
        answerIndex: 0,
        clueVi: "Camera an ninh cho thấy Mark rời văn phòng lúc 10 giờ tối — lời khai của anh ấy có vẻ không đúng!",
        clueJa: "防犯カメラには、マークが夜10時にオフィスを出たと映っていました——彼の証言はおかしいようです!",
        clueKo: "보안 카메라에는 마크가 밤 10시에 사무실을 나가는 모습이 찍혀 있었어요 — 그의 진술이 이상한 것 같아요!",
      },
      {
        kind: "interrogate",
        vi: "Hỏi cung Sam",
        ja: "サムを尋問する",
        ko: "샘 심문하기",
        npcName: "Sam",
        npcEmoji: "🧑‍🔧",
        testimony: "I saw Mark carrying a big bag when he left.",
        testimonyVi: "Tôi thấy Mark mang theo một túi to khi anh ấy rời đi.",
        testimonyJa: "マークが帰るとき、大きなかばんを持っているのを見ました。",
        testimonyKo: "마크가 나갈 때 큰 가방을 들고 있는 걸 봤어요.",
        question: "What did Sam see Mark carrying?",
        options: ["A big bag", "A cup of coffee", "Nothing"],
        answerIndex: 0,
        clueVi: "Một túi to đủ để giấu 1 chiếc laptop — càng thêm nghi ngờ Mark.",
        clueJa: "ノートパソコンを隠せるほど大きなかばんです——マークへの疑いがさらに強まります。",
        clueKo: "노트북을 숨길 수 있을 만큼 큰 가방이에요 — 마크에 대한 의심이 더 커집니다.",
      },
      {
        kind: "accuse",
        vi: "Ai đã lấy trộm chiếc laptop?",
        ja: "ノートパソコンを盗んだのは誰でしょう?",
        ko: "노트북을 훔친 사람은 누구일까요?",
        suspects: ["Anna", "Mark", "Sam"],
        correctSuspect: "Mark",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Detective case GENERATOR (2026-08-28) — user asked for 100 more cases.
// Hand-plotting 100 unique whodunits (each needs a coherent lie/contradiction
// a kid can actually piece together, PLUS vi/ja/ko translation for every
// testimony+clue+scenario, unlike Question which has zero translation
// fields) doesn't scale by hand. Reused the exact 3-suspect logic shape the
// 2 hand-written cases already use — round 1 = an innocent suspect whose
// alibi gets CONFIRMED, round 2 = the guilty suspect whose alibi gets
// CONTRADICTED, round 3 = a witness who saw the guilty suspect near the
// scene — as a reusable TEMPLATE, parametrized by suspect/item/location/
// activity word banks (small, each translated ONCE) instead of writing 100
// bespoke plots. `key`/order come from array position in the seeding loop
// below (same as the 2 hand-written cases), so no explicit key/order needed.
// ---------------------------------------------------------------------------
interface Suspect { name: string; emoji: string; jobEn: string; jobVi: string; jobJa: string; jobKo: string }
const SUSPECT_POOL: Suspect[] = [
  { name: "Mr. Reed", emoji: "🎩", jobEn: "butler", jobVi: "quản gia", jobJa: "執事", jobKo: "집사" },
  { name: "Ms. Bloom", emoji: "💃", jobEn: "guest", jobVi: "khách mời", jobJa: "招待客", jobKo: "초대 손님" },
  { name: "Chef Tony", emoji: "👨‍🍳", jobEn: "chef", jobVi: "đầu bếp", jobJa: "料理人", jobKo: "요리사" },
  { name: "Mrs. Chen", emoji: "🧹", jobEn: "housekeeper", jobVi: "quản lý nhà cửa", jobJa: "家政婦", jobKo: "가정부" },
  { name: "Mr. Diaz", emoji: "🌱", jobEn: "gardener", jobVi: "người làm vườn", jobJa: "庭師", jobKo: "정원사" },
  { name: "Ms. Patel", emoji: "💼", jobEn: "secretary", jobVi: "thư ký", jobJa: "秘書", jobKo: "비서" },
  { name: "Dr. Kim", emoji: "🩺", jobEn: "family doctor", jobVi: "bác sĩ gia đình", jobJa: "かかりつけ医", jobKo: "주치의" },
  { name: "Mr. Wolfe", emoji: "🛡️", jobEn: "security guard", jobVi: "bảo vệ", jobJa: "警備員", jobKo: "경비원" },
  { name: "Ms. Ivy", emoji: "💐", jobEn: "florist", jobVi: "người bán hoa", jobJa: "花屋", jobKo: "꽃집 주인" },
  { name: "Mr. Grant", emoji: "🚗", jobEn: "driver", jobVi: "tài xế", jobJa: "運転手", jobKo: "운전기사" },
  { name: "Mrs. White", emoji: "🍳", jobEn: "cook", jobVi: "đầu bếp phụ", jobJa: "コック", jobKo: "요리사 보조" },
  { name: "Mr. Lopez", emoji: "🔧", jobEn: "handyman", jobVi: "thợ sửa chữa", jobJa: "修理工", jobKo: "수리공" },
  { name: "Ms. Turner", emoji: "📚", jobEn: "tutor", jobVi: "gia sư", jobJa: "家庭教師", jobKo: "과외 선생님" },
  { name: "Mr. Kane", emoji: "📊", jobEn: "accountant", jobVi: "kế toán", jobJa: "会計士", jobKo: "회계사" },
  { name: "Mrs. Ford", emoji: "🏠", jobEn: "neighbor", jobVi: "hàng xóm", jobJa: "隣人", jobKo: "이웃" },
  { name: "Mr. Silva", emoji: "📷", jobEn: "photographer", jobVi: "nhiếp ảnh gia", jobJa: "写真家", jobKo: "사진작가" },
  { name: "Ms. Reyes", emoji: "🎻", jobEn: "musician", jobVi: "nhạc công", jobJa: "音楽家", jobKo: "음악가" },
  { name: "Mr. Hale", emoji: "🎓", jobEn: "family lawyer", jobVi: "luật sư gia đình", jobJa: "顧問弁護士", jobKo: "가족 변호사" },
  { name: "Mrs. Lin", emoji: "🧺", jobEn: "maid", jobVi: "người giúp việc", jobJa: "メイド", jobKo: "가정 도우미" },
  { name: "Mr. Novak", emoji: "🚘", jobEn: "chauffeur", jobVi: "tài xế riêng", jobJa: "お抱え運転手", jobKo: "전속 운전기사" },
];

interface Phrase { en: string; vi: string; ja: string; ko: string }
// A's alibi is TRUE — round 1 clue confirms it, matching case 1's Mr. Reed.
const CONFIRMED_ACTIVITIES: { activity: Phrase; confirm: Phrase }[] = [
  { activity: { en: "cleaning the kitchen", vi: "đang dọn bếp", ja: "台所を掃除していました", ko: "부엌을 청소하고 있었어요" }, confirm: { en: "the chef confirms seeing them in the kitchen at that time — their alibi checks out.", vi: "Đầu bếp xác nhận có thấy họ trong bếp lúc đó — lời khai có vẻ đúng.", ja: "料理人がその時間に台所で彼らを見たと確認しました——証言は正しいようです。", ko: "요리사가 그 시간에 부엌에서 그들을 봤다고 확인해줬어요 — 진술이 사실인 것 같아요." } },
  { activity: { en: "watering the plants in the garden", vi: "đang tưới cây ngoài vườn", ja: "庭で植物に水をやっていました", ko: "정원에서 식물에 물을 주고 있었어요" }, confirm: { en: "the gardener saw them watering the plants the whole time — their alibi checks out.", vi: "Người làm vườn thấy họ tưới cây suốt lúc đó — lời khai có vẻ đúng.", ja: "庭師がその間ずっと水やりをしているのを見ました——証言は正しいようです。", ko: "정원사가 그동안 계속 물을 주는 걸 봤어요 — 진술이 사실인 것 같아요." } },
  { activity: { en: "doing paperwork in the office", vi: "đang làm giấy tờ trong văn phòng", ja: "オフィスで書類仕事をしていました", ko: "사무실에서 서류 작업을 하고 있었어요" }, confirm: { en: "the security log shows they badged into the office at that exact time — their alibi checks out.", vi: "Nhật ký an ninh cho thấy họ quẹt thẻ vào văn phòng đúng lúc đó — lời khai có vẻ đúng.", ja: "警備記録では、ちょうどその時間にオフィスに入館していました——証言は正しいようです。", ko: "보안 기록에 따르면 정확히 그 시간에 사무실에 출입했어요 — 진술이 사실인 것 같아요." } },
  { activity: { en: "walking the dog outside", vi: "đang dắt chó đi dạo", ja: "外で犬を散歩させていました", ko: "밖에서 개를 산책시키고 있었어요" }, confirm: { en: "a neighbor saw them walking the dog on the street — their alibi checks out.", vi: "Một người hàng xóm thấy họ dắt chó đi dạo trên phố — lời khai có vẻ đúng.", ja: "近所の人が通りで犬を散歩させているのを見ました——証言は正しいようです。", ko: "이웃이 거리에서 개를 산책시키는 걸 봤어요 — 진술이 사실인 것 같아요." } },
  { activity: { en: "cooking dinner", vi: "đang nấu bữa tối", ja: "夕食を作っていました", ko: "저녁을 요리하고 있었어요" }, confirm: { en: "everyone in the house noticed the smell of dinner cooking at that time — their alibi checks out.", vi: "Mọi người trong nhà đều ngửi thấy mùi bữa tối lúc đó — lời khai có vẻ đúng.", ja: "家中の人がその時間に夕食の匂いに気づきました——証言は正しいようです。", ko: "집안 사람 모두 그 시간에 저녁 냄새를 맡았어요 — 진술이 사실인 것 같아요." } },
  { activity: { en: "practicing the piano", vi: "đang tập đàn piano", ja: "ピアノを練習していました", ko: "피아노를 연습하고 있었어요" }, confirm: { en: "another guest heard the piano playing from upstairs the whole time — their alibi checks out.", vi: "Một vị khách khác nghe tiếng đàn piano từ trên lầu suốt lúc đó — lời khai có vẻ đúng.", ja: "他の客がずっと2階でピアノの音を聞いていました——証言は正しいようです。", ko: "다른 손님이 그동안 계속 위층에서 피아노 소리를 들었어요 — 진술이 사실인 것 같아요." } },
  { activity: { en: "reading in their room", vi: "đang đọc sách trong phòng", ja: "自分の部屋で本を読んでいました", ko: "자기 방에서 책을 읽고 있었어요" }, confirm: { en: "the butler brought them tea and saw them reading — their alibi checks out.", vi: "Quản gia mang trà lên và thấy họ đang đọc sách — lời khai có vẻ đúng.", ja: "執事がお茶を持っていったとき、本を読んでいるのを見ました——証言は正しいようです。", ko: "집사가 차를 가져갔을 때 책을 읽고 있는 걸 봤어요 — 진술이 사실인 것 같아요." } },
  { activity: { en: "washing the car in the driveway", vi: "đang rửa xe ở lối vào nhà", ja: "私道で車を洗っていました", ko: "진입로에서 세차를 하고 있었어요" }, confirm: { en: "a neighbor saw them washing the car the whole time — their alibi checks out.", vi: "Một người hàng xóm thấy họ rửa xe suốt lúc đó — lời khai có vẻ đúng.", ja: "近所の人がその間ずっと車を洗っているのを見ました——証言は正しいようです。", ko: "이웃이 그동안 계속 세차하는 걸 봤어요 — 진술이 사실인 것 같아요." } },
  { activity: { en: "organizing files in the study", vi: "đang sắp xếp hồ sơ trong phòng làm việc", ja: "書斎で書類を整理していました", ko: "서재에서 서류를 정리하고 있었어요" }, confirm: { en: "their assistant was there helping the whole time — their alibi checks out.", vi: "Trợ lý của họ ở đó giúp suốt lúc đó — lời khai có vẻ đúng.", ja: "アシスタントがその間ずっと手伝っていました——証言は正しいようです。", ko: "비서가 그동안 계속 도와주고 있었어요 — 진술이 사실인 것 같아요." } },
  { activity: { en: "watching TV in the living room", vi: "đang xem TV trong phòng khách", ja: "リビングでテレビを見ていました", ko: "거실에서 TV를 보고 있었어요" }, confirm: { en: "the TV was still on and warm when someone checked — their alibi checks out.", vi: "TV vẫn đang bật và còn ấm khi có người kiểm tra — lời khai có vẻ đúng.", ja: "誰かが確認したとき、テレビはまだついていて温かかった——証言は正しいようです。", ko: "누군가 확인했을 때 TV가 아직 켜져 있고 따뜻했어요 — 진술이 사실인 것 같아요." } },
];
// B's alibi is FALSE — round 2 clue contradicts it, matching case 1's Ms. Bloom.
const LIE_ACTIVITIES: { activity: Phrase; contradiction: Phrase }[] = [
  { activity: { en: "stargazing in the garden", vi: "đang ngắm sao ngoài vườn", ja: "庭で星を見ていました", ko: "정원에서 별을 보고 있었어요" }, contradiction: { en: "the sky was completely cloudy that night — no stars were visible. The alibi doesn't add up!", vi: "Nhưng trời đêm đó nhiều mây, không thể ngắm sao được — lời khai có vẻ không đúng!", ja: "でもその夜は雲が多く、星は見えませんでした——証言はおかしいようです!", ko: "하지만 그날 밤은 구름이 많아서 별을 볼 수 없었어요 — 진술이 이상한 것 같아요!" } },
  { activity: { en: "watching a movie in the cinema room", vi: "đang xem phim trong phòng chiếu phim", ja: "シアタールームで映画を見ていました", ko: "영화 감상실에서 영화를 보고 있었어요" }, contradiction: { en: "the cinema room's projector has been broken all week. The alibi doesn't add up!", vi: "Nhưng máy chiếu phòng chiếu bị hỏng cả tuần nay — lời khai có vẻ không đúng!", ja: "でもシアタールームのプロジェクターは1週間ずっと壊れていました——証言はおかしいようです!", ko: "하지만 영화 감상실 프로젝터는 일주일 내내 고장나 있었어요 — 진술이 이상한 것 같아요!" } },
  { activity: { en: "playing the piano in the music room", vi: "đang chơi đàn piano trong phòng nhạc", ja: "音楽室でピアノを弾いていました", ko: "음악실에서 피아노를 치고 있었어요" }, contradiction: { en: "the piano is covered in a thick layer of dust — it hasn't been touched in weeks. The alibi doesn't add up!", vi: "Nhưng cây đàn piano phủ đầy bụi — không ai chạm vào suốt nhiều tuần — lời khai có vẻ không đúng!", ja: "でもそのピアノは厚いほこりに覆われていて何週間も触られていません——証言はおかしいようです!", ko: "하지만 그 피아노는 먼지가 두껍게 쌓여 있고 몇 주 동안 손댄 적이 없어요 — 진술이 이상한 것 같아요!" } },
  { activity: { en: "walking in the garden", vi: "đang đi dạo ngoài vườn", ja: "庭を散歩していました", ko: "정원을 산책하고 있었어요" }, contradiction: { en: "it was raining heavily that night — the garden path was flooded. The alibi doesn't add up!", vi: "Nhưng đêm đó mưa rất to — lối đi trong vườn bị ngập nước — lời khai có vẻ không đúng!", ja: "でもその夜は大雨で、庭の小道は水浸しでした——証言はおかしいようです!", ko: "하지만 그날 밤은 비가 심하게 와서 정원 길이 물에 잠겼어요 — 진술이 이상한 것 같아요!" } },
  { activity: { en: "reading in the library", vi: "đang đọc sách trong thư viện", ja: "図書室で本を読んでいました", ko: "도서실에서 책을 읽고 있었어요" }, contradiction: { en: "two other guests confirm the library was completely empty all evening. The alibi doesn't add up!", vi: "Nhưng hai vị khách khác xác nhận thư viện không có ai suốt buổi tối — lời khai có vẻ không đúng!", ja: "でも他の2人の客が、その夜ずっと図書室は誰もいなかったと確認しました——証言はおかしいようです!", ko: "하지만 다른 손님 두 명이 그날 저녁 내내 도서실에 아무도 없었다고 확인했어요 — 진술이 이상한 것 같아요!" } },
  { activity: { en: "resting in their bedroom", vi: "đang nghỉ ngơi trong phòng ngủ", ja: "自分の寝室で休んでいました", ko: "자기 침실에서 쉬고 있었어요" }, contradiction: { en: "the bedroom light was off all night, but a witness saw them walking the halls. The alibi doesn't add up!", vi: "Nhưng đèn phòng ngủ tắt suốt đêm, còn có người thấy họ đi lại trong hành lang — lời khai có vẻ không đúng!", ja: "でも寝室の明かりは一晩中消えていて、目撃者は廊下を歩いている姿を見ました——証言はおかしいようです!", ko: "하지만 침실 불은 밤새 꺼져 있었고, 목격자가 복도를 걸어다니는 걸 봤어요 — 진술이 이상한 것 같아요!" } },
  { activity: { en: "in the kitchen making tea", vi: "đang pha trà trong bếp", ja: "台所でお茶を入れていました", ko: "부엌에서 차를 끓이고 있었어요" }, contradiction: { en: "the kitchen door was locked from the outside that whole hour. The alibi doesn't add up!", vi: "Nhưng cửa bếp bị khoá từ bên ngoài suốt cả giờ đó — lời khai có vẻ không đúng!", ja: "でも台所のドアはその1時間ずっと外から鍵がかかっていました——証言はおかしいようです!", ko: "하지만 부엌 문은 그 시간 내내 밖에서 잠겨 있었어요 — 진술이 이상한 것 같아요!" } },
  { activity: { en: "on the phone in the study", vi: "đang gọi điện trong phòng làm việc", ja: "書斎で電話をしていました", ko: "서재에서 전화를 하고 있었어요" }, contradiction: { en: "the phone records show no calls were made during that time. The alibi doesn't add up!", vi: "Nhưng lịch sử cuộc gọi cho thấy không có cuộc gọi nào lúc đó — lời khai có vẻ không đúng!", ja: "でも通話記録では、その時間に電話はかかっていませんでした——証言はおかしいようです!", ko: "하지만 통화 기록을 보면 그 시간에는 전화한 기록이 없어요 — 진술이 이상한 것 같아요!" } },
  { activity: { en: "cleaning the pool area", vi: "đang dọn khu vực hồ bơi", ja: "プールエリアを掃除していました", ko: "수영장 구역을 청소하고 있었어요" }, contradiction: { en: "the pool area was closed for maintenance all day. The alibi doesn't add up!", vi: "Nhưng khu vực hồ bơi đóng cửa để bảo trì cả ngày — lời khai có vẻ không đúng!", ja: "でもプールエリアはその日ずっとメンテナンスで閉鎖されていました——証言はおかしいようです!", ko: "하지만 수영장 구역은 그날 하루 종일 보수 공사로 닫혀 있었어요 — 진술이 이상한 것 같아요!" } },
  { activity: { en: "practicing golf on the lawn", vi: "đang tập golf trên bãi cỏ", ja: "芝生でゴルフの練習をしていました", ko: "잔디밭에서 골프 연습을 하고 있었어요" }, contradiction: { en: "it was already too dark outside to see a golf ball at that hour. The alibi doesn't add up!", vi: "Nhưng lúc đó trời đã tối, không thể nhìn thấy bóng golf — lời khai có vẻ không đúng!", ja: "でもその時間はもう暗すぎてゴルフボールが見えませんでした——証言はおかしいようです!", ko: "하지만 그 시간에는 너무 어두워서 골프공이 안 보였어요 — 진술이 이상한 것 같아요!" } },
];

const STOLEN_ITEMS: Phrase[] = [
  { en: "diamond necklace", vi: "vòng cổ kim cương", ja: "ダイヤモンドのネックレス", ko: "다이아몬드 목걸이" },
  { en: "silver trophy", vi: "chiếc cúp bạc", ja: "銀のトロフィー", ko: "은 트로피" },
  { en: "antique vase", vi: "chiếc bình cổ", ja: "アンティークの花瓶", ko: "골동품 꽃병" },
  { en: "gold watch", vi: "chiếc đồng hồ vàng", ja: "金の腕時計", ko: "금시계" },
  { en: "rare painting", vi: "bức tranh quý hiếm", ja: "希少な絵画", ko: "희귀한 그림" },
  { en: "family heirloom ring", vi: "chiếc nhẫn gia truyền", ja: "先祖代々の指輪", ko: "가보 반지" },
  { en: "vintage violin", vi: "cây vĩ cầm cổ", ja: "ヴィンテージのバイオリン", ko: "빈티지 바이올린" },
  { en: "ancient manuscript", vi: "bản thảo cổ", ja: "古文書", ko: "고대 문서" },
  { en: "jeweled crown", vi: "vương miện đính đá quý", ja: "宝石の王冠", ko: "보석 왕관" },
  { en: "silver chalice", vi: "chiếc chén bạc", ja: "銀の聖杯", ko: "은 성배" },
  { en: "pearl bracelet", vi: "chiếc vòng tay ngọc trai", ja: "真珠のブレスレット", ko: "진주 팔찌" },
  { en: "marble sculpture", vi: "bức tượng đá cẩm thạch", ja: "大理石の彫刻", ko: "대리석 조각상" },
  { en: "rare stamp collection", vi: "bộ sưu tập tem quý hiếm", ja: "希少な切手コレクション", ko: "희귀 우표 수집품" },
  { en: "antique clock", vi: "chiếc đồng hồ cổ", ja: "アンティークの時計", ko: "골동품 시계" },
  { en: "ruby brooch", vi: "chiếc trâm cài hồng ngọc", ja: "ルビーのブローチ", ko: "루비 브로치" },
];
const LOCATIONS: Phrase[] = [
  { en: "mansion", vi: "biệt thự", ja: "邸宅", ko: "저택" },
  { en: "art gallery", vi: "phòng trưng bày nghệ thuật", ja: "美術館", ko: "미술관" },
  { en: "museum", vi: "viện bảo tàng", ja: "博物館", ko: "박물관" },
  { en: "country club", vi: "câu lạc bộ đồng quê", ja: "カントリークラブ", ko: "컨트리클럽" },
  { en: "office building", vi: "toà nhà văn phòng", ja: "オフィスビル", ko: "사무실 건물" },
  { en: "opera house", vi: "nhà hát opera", ja: "オペラハウス", ko: "오페라 하우스" },
  { en: "grand hotel", vi: "khách sạn lớn", ja: "グランドホテル", ko: "그랜드 호텔" },
  { en: "library", vi: "thư viện", ja: "図書館", ko: "도서관" },
  { en: "university", vi: "trường đại học", ja: "大学", ko: "대학교" },
  { en: "theater", vi: "nhà hát", ja: "劇場", ko: "극장" },
  { en: "yacht", vi: "du thuyền", ja: "ヨット", ko: "요트" },
  { en: "old castle", vi: "toà lâu đài cổ", ja: "古い城", ko: "오래된 성" },
  { en: "botanical garden", vi: "vườn bách thảo", ja: "植物園", ko: "식물원" },
  { en: "antique shop", vi: "cửa hàng đồ cổ", ja: "骨董品店", ko: "골동품 가게" },
  { en: "concert hall", vi: "phòng hoà nhạc", ja: "コンサートホール", ko: "콘서트홀" },
];
const VICTIMS = ["Mrs. Parker", "Mr. Lawson", "Ms. Hartley", "Mr. Bennett", "Mrs. Coleman", "Dr. Sinclair", "Mr. Whitfield", "Mrs. Ashworth", "Lord Harrington", "Lady Pemberton", "Mr. Grayson", "Mrs. Fairfax", "Professor Wells", "Captain Reid", "Baroness Voss"];
const CRIME_TIMES: Phrase[] = [
  { en: "last night", vi: "đêm qua", ja: "昨夜", ko: "어젯밤" },
  { en: "yesterday evening", vi: "chiều tối hôm qua", ja: "昨日の夕方", ko: "어제 저녁" },
  { en: "this morning", vi: "sáng nay", ja: "今朝", ko: "오늘 아침" },
  { en: "during the party", vi: "trong lúc bữa tiệc diễn ra", ja: "パーティーの最中", ko: "파티가 진행되는 동안" },
  { en: "over the weekend", vi: "vào cuối tuần", ja: "週末の間に", ko: "주말 동안" },
];
const CLOCK_TIMES = ["at 7 PM", "at 8 PM", "at 9 PM", "at 10 PM", "at 11 PM"];
const DETECTIVE_COLORS = ["#5C7BC9", "#7CC24A", "#F5822B", "#9B7EDE", "#57C6C6", "#EF6A5A", "#F79BB0", "#FFC93C"];

/** 3 distinct pool indices, RANDOM (not index-derived). A first version used
 * `(i * stride + k) % poolSize`-style linear-congruence picks keyed off the
 * case index `i` — looked fine spot-checked individually, but every formula
 * tied to a fixed-size pool (all word banks below are 15-20 entries) repeats
 * with a period dividing that pool size, so case `i` and `i + poolSize`
 * always landed on the IDENTICAL item/location/victim, and since the
 * suspect pool (20) and item/location/victim pools (15) don't share the
 * same period, case `i` and `i + lcm(15, 20) = i + 60` came out as a fully
 * duplicated case (same everyone, same everything). Caught this by
 * diffing 2 sampled cases 75 apart that turned out identical. Math.random()
 * has no such structural periodicity — reproducibility across reseeds was
 * never a requirement (seed is idempotent-skip-if-exists; this only needs
 * to look varied within ONE generation run). */
function pickThreeDistinct(poolSize: number): [number, number, number] {
  const idx: number[] = [];
  while (idx.length < 3) {
    const candidate = Math.floor(Math.random() * poolSize);
    if (!idx.includes(candidate)) idx.push(candidate);
  }
  return [idx[0]!, idx[1]!, idx[2]!];
}
function pickRandom<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function buildDetectiveCase(i: number): DetectiveCaseSeed {
  const [sA, sB, sC] = pickThreeDistinct(SUSPECT_POOL.length);
  const A = SUSPECT_POOL[sA]!;
  const B = SUSPECT_POOL[sB]!;
  const C = SUSPECT_POOL[sC]!;
  const item = pickRandom(STOLEN_ITEMS);
  const location = pickRandom(LOCATIONS);
  const victim = pickRandom(VICTIMS);
  const crimeTime = pickRandom(CRIME_TIMES);
  const clockA = pickRandom(CLOCK_TIMES);
  const clockB = pickRandom(CLOCK_TIMES);
  const { activity: actA, confirm } = pickRandom(CONFIRMED_ACTIVITIES);
  const { activity: actB, contradiction } = pickRandom(LIE_ACTIVITIES);
  const color = DETECTIVE_COLORS[i % DETECTIVE_COLORS.length]!;
  // A random "wrong activity" for multiple-choice distractors, distinct from actA/actB.
  let wrongAct1 = pickRandom(CONFIRMED_ACTIVITIES).activity;
  while (wrongAct1.en === actA.en) wrongAct1 = pickRandom(CONFIRMED_ACTIVITIES).activity;
  let wrongAct2 = pickRandom(LIE_ACTIVITIES).activity;
  while (wrongAct2.en === actB.en) wrongAct2 = pickRandom(LIE_ACTIVITIES).activity;

  const scenarioArticle = articleFor(item.en);
  const scenario = `${scenarioArticle.charAt(0).toUpperCase()}${scenarioArticle.slice(1)} ${item.en} disappeared from ${victim}'s ${location.en} ${crimeTime.en}. Find the thief among the three suspects.`;
  const scenarioVi = `Một ${item.vi} biến mất khỏi ${location.vi} của ${victim} ${crimeTime.vi}. Hãy tìm ra tên trộm trong số ba nghi phạm.`;
  const scenarioJa = `${crimeTime.ja}、${victim}の${location.ja}から${item.ja}が消えました。3人の容疑者の中から犯人を見つけてください。`;
  const scenarioKo = `${crimeTime.ko} ${victim}의 ${location.ko}에서 ${item.ko}가 사라졌습니다. 세 명의 용의자 중에서 범인을 찾아보세요.`;

  const roundA: DetectiveInterrogateSeed = {
    kind: "interrogate",
    vi: `Hỏi cung ${A.name} — ${A.jobVi}`,
    ja: `${A.name}（${A.jobJa}）を尋問する`,
    ko: `${A.name}(${A.jobKo}) 심문하기`,
    npcName: A.name,
    npcEmoji: A.emoji,
    testimony: `I was ${actA.en} ${clockA}. I didn't see anything strange.`,
    testimonyVi: `Tôi ${actA.vi} lúc ${clockA.replace("at ", "")}. Tôi không thấy gì bất thường.`,
    testimonyJa: `私は${clockA.replace("at ", "")}に${actA.ja}。何もおかしなことは見ませんでした。`,
    testimonyKo: `저는 ${clockA.replace("at ", "")}에 ${actA.ko}. 이상한 건 못 봤어요.`,
    question: `What was ${A.name} doing ${clockA}?`,
    options: shuffled([titleCaseWord(actA.en), titleCaseWord(wrongAct1.en), titleCaseWord(wrongAct2.en)]),
    answerIndex: 0, // fixed up below after shuffle
    clueVi: confirm.vi,
    clueJa: confirm.ja,
    clueKo: confirm.ko,
  };
  roundA.answerIndex = roundA.options.indexOf(titleCaseWord(actA.en));

  const roundB: DetectiveInterrogateSeed = {
    kind: "interrogate",
    vi: `Hỏi cung ${B.name} — ${B.jobVi}`,
    ja: `${B.name}（${B.jobJa}）を尋問する`,
    ko: `${B.name}(${B.jobKo}) 심문하기`,
    npcName: B.name,
    npcEmoji: B.emoji,
    testimony: `I was ${actB.en} ${clockB}. I didn't do anything wrong.`,
    testimonyVi: `Tôi ${actB.vi} lúc ${clockB.replace("at ", "")}. Tôi không làm gì sai cả.`,
    testimonyJa: `私は${clockB.replace("at ", "")}に${actB.ja}。何も悪いことはしていません。`,
    testimonyKo: `저는 ${clockB.replace("at ", "")}에 ${actB.ko}. 저는 아무 잘못도 안 했어요.`,
    question: `Where did ${B.name} say they were?`,
    options: shuffled([titleCaseWord(actB.en), titleCaseWord(wrongAct1.en), titleCaseWord(actA.en)]),
    answerIndex: 0,
    clueVi: contradiction.vi,
    clueJa: contradiction.ja,
    clueKo: contradiction.ko,
  };
  roundB.answerIndex = roundB.options.indexOf(titleCaseWord(actB.en));

  const roundC: DetectiveInterrogateSeed = {
    kind: "interrogate",
    vi: `Hỏi cung ${C.name} — ${C.jobVi}`,
    ja: `${C.name}（${C.jobJa}）を尋問する`,
    ko: `${C.name}(${C.jobKo}) 심문하기`,
    npcName: C.name,
    npcEmoji: C.emoji,
    testimony: `I saw ${B.name} near the ${item.en} ${clockB}.`,
    testimonyVi: `Tôi thấy ${B.name} gần ${item.vi} vào khoảng ${clockB.replace("at ", "")}.`,
    testimonyJa: `${clockB.replace("at ", "")}頃、${B.name}が${item.ja}の近くにいるのを見ました。`,
    testimonyKo: `${clockB.replace("at ", "")}쯤 ${B.name}이(가) ${item.ko} 근처에 있는 걸 봤어요.`,
    question: `Who did ${C.name} see near the ${item.en}?`,
    options: shuffled([B.name, A.name, "Nobody"]),
    answerIndex: 0,
    clueVi: `${C.name} xác nhận nhìn thấy ${B.name} gần hiện trường — càng thêm nghi ngờ.`,
    clueJa: `${C.name}が${B.name}を現場近くで見たと確認しました——疑いがさらに強まります。`,
    clueKo: `${C.name}이(가) ${B.name}을(를) 현장 근처에서 봤다고 확인했어요 — 의심이 더 커집니다.`,
  };
  roundC.answerIndex = roundC.options.indexOf(B.name);

  const roundAccuse: DetectiveAccuseSeed = {
    kind: "accuse",
    vi: `Ai là kẻ đã lấy trộm ${item.vi}?`,
    ja: `${item.ja}を盗んだのは誰でしょう?`,
    ko: `${item.ko}을(를) 훔친 사람은 누구일까요?`,
    suspects: [A.name, B.name, C.name],
    correctSuspect: B.name,
  };

  return {
    key: `generated-case-${i + 1}`,
    // Vietnamese phrases here are multi-SYLLABLE (space-separated syllables
    // form 1 word, e.g. "kim cương" = "diamond") — capitalizing just the
    // first syllable of the whole phrase reads correctly as a title, unlike
    // trying to isolate "the last word" (meaningless for Vietnamese).
    // Folds in `victim` too (not just item+location) — with all 3 pools
    // drawn independently at random, relying on just item+location left ~14%
    // of 100 generated cases with an identical-looking title (spotted via
    // direct API check); adding victim's name shrinks the collision space
    // from 15×15=225 combos to 15×15×15=3375, cutting expected duplicates to
    // roughly 1-2 instead of ~14.
    name: `Vụ Mất ${item.vi.charAt(0).toUpperCase()}${item.vi.slice(1)} Của ${victim} Ở ${location.vi.charAt(0).toUpperCase()}${location.vi.slice(1)}`,
    scenario,
    scenarioVi,
    scenarioJa,
    scenarioKo,
    color,
    rounds: [roundA, roundB, roundC, roundAccuse],
  };
}

const GENERATED_DETECTIVE_CASES: DetectiveCaseSeed[] = Array.from({ length: 100 }, (_, i) => buildDetectiveCase(i));
DETECTIVE_CASES.push(...GENERATED_DETECTIVE_CASES);

// ---------------------------------------------------------------------------
// Echo Parrot topics — "Vẹt Con Tập Nói": mỗi round là 1 từ/câu tiếng Anh
// ngắn để bé nghe mẫu (server TTS) rồi tự nói lại; app so khớp văn bản nhận
// dạng được từ giọng nói với `en` để chấm (không chấm phát âm/âm vị chi
// tiết ở bản đầu — xem frontend/src/pages/EchoParrot.tsx).
// ---------------------------------------------------------------------------
interface EchoParrotRoundSeed {
  en: string;
  vi: string;
  ja: string;
  ko: string;
  // Optional (was required) — the pet-name rounds added below are full
  // sentences ("This is Buddy."), not single words, so a clean 1-word IPA
  // transcription doesn't really apply the way it does for "Cat"/"Hello!".
  phonetic?: string;
  /** Optional — matches Pet.key, shows that pet's real portrait as an illustration (2026-08-28). */
  petKey?: string;
}
interface EchoParrotTopicSeed {
  key: string;
  name: string;
  color: string;
  rounds: EchoParrotRoundSeed[];
}

const ECHO_PARROT_TOPICS: EchoParrotTopicSeed[] = [
  {
    key: "animals",
    name: "Động Vật",
    color: "#7CC24A",
    rounds: [
      { en: "Cat", vi: "con mèo", ja: "猫", ko: "고양이", phonetic: "/kæt/" },
      { en: "Dog", vi: "con chó", ja: "犬", ko: "개", phonetic: "/dɒɡ/" },
      { en: "Bird", vi: "con chim", ja: "鳥", ko: "새", phonetic: "/bɜːd/" },
      { en: "Fish", vi: "con cá", ja: "魚", ko: "물고기", phonetic: "/fɪʃ/" },
      { en: "Rabbit", vi: "con thỏ", ja: "うさぎ", ko: "토끼", phonetic: "/ˈræb.ɪt/" },
    ],
  },
  {
    key: "everyday-phrases",
    name: "Câu Giao Tiếp",
    color: "#5C7BC9",
    rounds: [
      { en: "Hello!", vi: "Xin chào!", ja: "こんにちは!", ko: "안녕하세요!", phonetic: "/həˈloʊ/" },
      { en: "Thank you!", vi: "Cảm ơn bạn!", ja: "ありがとう!", ko: "고마워요!", phonetic: "/θæŋk juː/" },
      { en: "Good morning!", vi: "Chào buổi sáng!", ja: "おはようございます!", ko: "좋은 아침이에요!", phonetic: "/ɡʊd ˈmɔːr.nɪŋ/" },
      { en: "How are you?", vi: "Bạn khoẻ không?", ja: "元気ですか?", ko: "잘 지내요?", phonetic: "/haʊ ɑːr juː/" },
      { en: "Goodbye!", vi: "Tạm biệt!", ja: "さようなら!", ko: "안녕히 가세요!", phonetic: "/ɡʊdˈbaɪ/" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Echo Parrot — rounds about the app's OWN 40 pets (2026-08-28, user request:
// "dựa vào list pet hiện có, thêm 100 hội thoại liên quan đến những con pet
// đang có", then follow-up "thêm 200 300 từ nữa... bên trong dùng pet để làm
// hình minh hoạ" — first pass shipped 100 rounds across 3 uneven templates;
// this pass redesigns it as 9 EQUAL templates × all 40 pets = 360 rounds,
// and every round now carries `petKey` (see EchoParrotRound.petKey doc
// comment in schema.prisma) so EchoParrot.tsx shows that pet's real portrait
// as illustration instead of pure text). Reuses `PETS` (the real catalog
// seeded above — same 40 names/species/rarities a child actually unlocks)
// instead of inventing new characters, so practicing here feels connected to
// the pets the child already has. `species` in PETS is Vietnamese-only
// (display label, e.g. "Chó Golden") — needed a matching EN/JA/KO
// translation per pet for the 2nd template, kept simple/literal on purpose
// (same "golden dog" not "golden retriever" simplicity as the Vietnamese
// original).
// ---------------------------------------------------------------------------
const PET_SPECIES_EN_JA_KO: Record<string, { en: string; ja: string; ko: string }> = {
  buddy: { en: "golden dog", ja: "金色の犬", ko: "금색 강아지" },
  mimi: { en: "orange cat", ja: "オレンジ色の猫", ko: "주황색 고양이" },
  poppy: { en: "white rabbit", ja: "白いうさぎ", ko: "하얀 토끼" },
  snowy: { en: "white goose", ja: "白いガチョウ", ko: "하얀 거위" },
  ducky: { en: "yellow duck", ja: "黄色いアヒル", ko: "노란 오리" },
  coco: { en: "brown cat", ja: "茶色い猫", ko: "갈색 고양이" },
  milky: { en: "white cat", ja: "白い猫", ko: "하얀 고양이" },
  smokey: { en: "gray cat", ja: "灰色の猫", ko: "회색 고양이" },
  pepper: { en: "calico cat", ja: "三毛猫", ko: "삼색 고양이" },
  misty: { en: "smoke gray cat", ja: "スモークグレーの猫", ko: "연회색 고양이" },
  biscuit: { en: "cream puppy", ja: "クリーム色の子犬", ko: "크림색 강아지" },
  cocoa: { en: "brown dog", ja: "茶色い犬", ko: "갈색 강아지" },
  waffle: { en: "spotted dog", ja: "斑点の犬", ko: "점박이 강아지" },
  bamboo: { en: "panda", ja: "パンダ", ko: "판다" },
  kiwi: { en: "blue bird", ja: "青い鳥", ko: "파란 새" },
  rosie: { en: "pink bird", ja: "ピンクの鳥", ko: "분홍 새" },
  frosty: { en: "penguin", ja: "ペンギン", ko: "펭귄" },
  leo: { en: "lion", ja: "ライオン", ko: "사자" },
  stripe: { en: "baby tiger", ja: "子トラ", ko: "아기 호랑이" },
  ellie: { en: "baby elephant", ja: "子ゾウ", ko: "아기 코끼리" },
  lila: { en: "purple cat", ja: "紫の猫", ko: "보라색 고양이" },
  sia: { en: "Siamese cat", ja: "シャム猫", ko: "샴 고양이" },
  nimbus: { en: "husky dog", ja: "ハスキー犬", ko: "허스키 강아지" },
  sunny: { en: "golden lion", ja: "金色のライオン", ko: "금색 사자" },
  gargo: { en: "little purple monster", ja: "小さな紫の怪獣", ko: "작은 보라색 괴물" },
  sprout: { en: "baby sprout dragon", ja: "新芽の子ドラゴン", ko: "새싹 아기 드래곤" },
  angel: { en: "winged cat", ja: "羽のある猫", ko: "날개 달린 고양이" },
  glacio: { en: "ice bear", ja: "氷のクマ", ko: "얼음 곰" },
  mystic: { en: "wizard cat", ja: "魔法使いの猫", ko: "마법사 고양이" },
  berry: { en: "blue bear", ja: "青いクマ", ko: "파란 곰" },
  nocty: { en: "bat dragon", ja: "コウモリドラゴン", ko: "박쥐 드래곤" },
  papillon: { en: "butterfly fairy", ja: "蝶の妖精", ko: "나비 요정" },
  frostwing: { en: "ice dragon", ja: "氷のドラゴン", ko: "얼음 드래곤" },
  prism: { en: "rainbow dragon", ja: "虹のドラゴン", ko: "무지개 드래곤" },
  stella: { en: "unicorn", ja: "ユニコーン", ko: "유니콘" },
  blaze: { en: "phoenix", ja: "フェニックス", ko: "불사조" },
  aqua: { en: "water spirit", ja: "水の精霊", ko: "물의 정령" },
  umbra: { en: "shadow dragon", ja: "影のドラゴン", ko: "그림자 드래곤" },
  void: { en: "void dragon", ja: "虚無のドラゴン", ko: "공허의 드래곤" },
  ember: { en: "fire dragon", ja: "炎のドラゴン", ko: "불의 드래곤" },
  maru: { en: "Shiba Inu puppy", ja: "柴犬の子犬", ko: "시바견 강아지" },
  dori: { en: "Jindo puppy", ja: "珍島犬の子犬", ko: "진돗개 강아지" },
  kitsune: { en: "fox spirit", ja: "狐の精霊", ko: "여우 정령" },
  haetae: { en: "guardian lion", ja: "守護獣ヘテ", ko: "수호신 해태" },
};
/** 9 equal templates × 40 pets = 360 rounds. Every round carries `petKey` so
 * the game shows that pet's real portrait as illustration. */
function petEchoRounds(name: string, key: string, speciesVi: string): EchoParrotRoundSeed[] {
  const sp = PET_SPECIES_EN_JA_KO[key];
  if (!sp) throw new Error(`Missing PET_SPECIES_EN_JA_KO entry for pet key "${key}"`);
  // Only the first syllable's case changes (mid-sentence, not a title anymore) — rest of the label (e.g. "Golden" in "Chó Golden") stays as-is.
  const speciesViMidSentence = speciesVi.charAt(0).toLowerCase() + speciesVi.slice(1);
  // articleFor() is a pure vowel-LETTER heuristic — wrong for "unicorn"
  // (spelled with a leading vowel but pronounced with a consonant "y" sound,
  // so "a unicorn" is correct, not "an unicorn"). Only 1 of the 40 species
  // hits this, so special-cased directly rather than teaching the shared
  // helper English phonetics.
  const article = sp.en === "unicorn" ? "a" : articleFor(sp.en);
  const templates: Omit<EchoParrotRoundSeed, "petKey">[] = [
    { en: `This is ${name}.`, vi: `Đây là ${name}.`, ja: `これは${name}だよ。`, ko: `얘는 ${name}이야.` },
    { en: `${name} is ${article} ${sp.en}.`, vi: `${name} là một ${speciesViMidSentence}.`, ja: `${name}は${sp.ja}だよ。`, ko: `${name}는 ${sp.ko}야.` },
    { en: `I love ${name}!`, vi: `Mình yêu ${name}!`, ja: `${name}が大好き!`, ko: `나는 ${name}을 사랑해!` },
    { en: `Look at ${name}!`, vi: `Nhìn ${name} kìa!`, ja: `${name}を見て!`, ko: `${name}을 봐!` },
    { en: `${name} is so cute!`, vi: `${name} dễ thương quá!`, ja: `${name}はとてもかわいい!`, ko: `${name}은 정말 귀여워!` },
    { en: `Good morning, ${name}!`, vi: `Chào buổi sáng, ${name}!`, ja: `おはよう、${name}!`, ko: `좋은 아침, ${name}!` },
    { en: `${name} likes to play.`, vi: `${name} thích chơi đùa.`, ja: `${name}は遊ぶのが好きだよ。`, ko: `${name}은 노는 걸 좋아해.` },
    { en: `Come here, ${name}!`, vi: `Lại đây nào, ${name}!`, ja: `こっちおいで、${name}!`, ko: `이리 와, ${name}!` },
    { en: `${name} is my best friend.`, vi: `${name} là bạn thân nhất của mình.`, ja: `${name}はぼくの親友だよ。`, ko: `${name}은 내 가장 친한 친구야.` },
  ];
  return templates.map((tpl) => ({ ...tpl, petKey: key }));
}

function petTopicRounds(rarity: Rarity): EchoParrotRoundSeed[] {
  return PETS.filter(([, , , r]) => r === rarity).flatMap(([name, key, speciesVi]) => petEchoRounds(name, key, speciesVi));
}

const PET_ECHO_TOPICS: EchoParrotTopicSeed[] = [
  { key: "pets-common", name: "Thú Cưng Phổ Biến", color: "#7CC24A", rounds: petTopicRounds("Common") },
  { key: "pets-rare", name: "Thú Cưng Hiếm", color: "#5C7BC9", rounds: petTopicRounds("Rare") },
  { key: "pets-epic", name: "Thú Cưng Sử Thi", color: "#9B7EDE", rounds: petTopicRounds("Epic") },
  { key: "pets-legendary", name: "Thú Cưng Huyền Thoại", color: "#F5822B", rounds: petTopicRounds("Legendary") },
];
ECHO_PARROT_TOPICS.push(...PET_ECHO_TOPICS);

// ---------------------------------------------------------------------------
// Chat with Buddy topics — "Trò Chuyện Cùng Bạn Thú": mỗi topic là 1 tình
// huống hội thoại gồm nhiều lượt nối tiếp nhau, pet hỏi 1 câu tiếng Anh (TTS),
// bé chọn 1 trong vài câu trả lời phù hợp ngữ cảnh, đúng thì pet phản hồi lại
// rồi sang lượt kế — bản nhẹ hơn của English Detective, nhắm đúng trẻ em (xem
// frontend/src/pages/ChatBuddy.tsx).
// ---------------------------------------------------------------------------
interface ChatBuddyRoundSeed {
  petLine: string;
  petLineVi: string;
  petLineJa: string;
  petLineKo: string;
  options: string[];
  optionsVi: string[];
  optionsJa: string[];
  optionsKo: string[];
  answerIndex: number;
  replyLine: string;
  replyLineVi: string;
  replyLineJa: string;
  replyLineKo: string;
}
interface ChatBuddyTopicSeed {
  key: string;
  name: string;
  color: string;
  rounds: ChatBuddyRoundSeed[];
}

const CHAT_BUDDY_TOPICS: ChatBuddyTopicSeed[] = [
  {
    key: "good-morning",
    name: "Chào buổi sáng",
    color: "#FFC93C",
    rounds: [
      {
        petLine: "Good morning! How are you today?",
        petLineVi: "Chào buổi sáng! Hôm nay bạn thế nào?",
        petLineJa: "おはよう!今日の調子はどう?",
        petLineKo: "좋은 아침이야! 오늘 기분 어때?",
        options: ["I'm great, thank you!", "I have a red bicycle.", "The book is on the table."],
        optionsVi: ["Mình khoẻ lắm, cảm ơn bạn!", "Mình có một chiếc xe đạp màu đỏ.", "Quyển sách ở trên bàn."],
        optionsJa: ["元気だよ、ありがとう!", "赤い自転車を持っているよ。", "本は机の上にあるよ。"],
        optionsKo: ["나 정말 좋아, 고마워!", "나는 빨간 자전거가 있어.", "책은 탁자 위에 있어."],
        answerIndex: 0,
        replyLine: "Yay! That makes me happy!",
        replyLineVi: "Yay! Điều đó làm mình vui quá!",
        replyLineJa: "やった!それを聞いて嬉しいよ!",
        replyLineKo: "야호! 그 말을 들으니 기뻐!",
      },
      {
        petLine: "Did you sleep well last night?",
        petLineVi: "Tối qua bạn có ngủ ngon không?",
        petLineJa: "昨日の夜、よく眠れた?",
        petLineKo: "어젯밤에 잘 잤어?",
        options: ["Yes, I slept very well!", "I like to eat pizza.", "My shoes are blue."],
        optionsVi: ["Có, mình ngủ rất ngon!", "Mình thích ăn pizza.", "Giày của mình màu xanh."],
        optionsJa: ["うん、よく眠れたよ!", "ピザを食べるのが好きだよ。", "私の靴は青いよ。"],
        optionsKo: ["응, 정말 잘 잤어!", "나는 피자를 좋아해.", "내 신발은 파란색이야."],
        answerIndex: 0,
        replyLine: "Wonderful! A good sleep makes a great day.",
        replyLineVi: "Tuyệt vời! Ngủ ngon giúp một ngày thật tuyệt.",
        replyLineJa: "素晴らしい!よく眠ると一日が最高になるよ。",
        replyLineKo: "멋져! 잘 자면 하루가 정말 좋아져.",
      },
      {
        petLine: "What do you want to do today?",
        petLineVi: "Hôm nay bạn muốn làm gì?",
        petLineJa: "今日は何をしたい?",
        petLineKo: "오늘은 뭐 하고 싶어?",
        options: ["Let's play together!", "It is raining outside.", "I have three brothers."],
        optionsVi: ["Mình cùng chơi nhé!", "Bên ngoài trời đang mưa.", "Mình có ba anh em trai."],
        optionsJa: ["一緒に遊ぼう!", "外は雨が降っているよ。", "私には兄弟が3人いるよ。"],
        optionsKo: ["같이 놀자!", "밖에 비가 오고 있어.", "나는 남자 형제가 셋 있어."],
        answerIndex: 0,
        replyLine: "Yes! Let's play together, best friend!",
        replyLineVi: "Đúng vậy! Cùng chơi nhé, bạn thân của mình!",
        replyLineJa: "うん!一緒に遊ぼう、親友!",
        replyLineKo: "그래! 같이 놀자, 내 단짝 친구!",
      },
    ],
  },
  {
    key: "asking-for-food",
    name: "Xin đồ ăn",
    color: "#F5822B",
    rounds: [
      {
        petLine: "I'm hungry! Can I have a snack, please?",
        petLineVi: "Mình đói bụng quá! Cho mình xin chút đồ ăn nhé?",
        petLineJa: "お腹が空いたよ!おやつをもらえる?",
        petLineKo: "배고파! 간식 좀 줄 수 있어?",
        options: ["Sure, here you go!", "The car is very fast.", "I can swim in the pool."],
        optionsVi: ["Được chứ, đây nè!", "Chiếc xe hơi chạy rất nhanh.", "Mình có thể bơi trong hồ bơi."],
        optionsJa: ["いいよ、はいどうぞ!", "車はとても速いよ。", "私はプールで泳げるよ。"],
        optionsKo: ["그럼, 여기 있어!", "그 차는 정말 빨라.", "나는 수영장에서 수영할 수 있어."],
        answerIndex: 0,
        replyLine: "Yummy! Thank you so much!",
        replyLineVi: "Ngon quá! Cảm ơn bạn rất nhiều!",
        replyLineJa: "おいしい!本当にありがとう!",
        replyLineKo: "맛있다! 정말 고마워!",
      },
      {
        petLine: "Mmm, this is tasty! Do you like apples too?",
        petLineVi: "Mmm, ngon quá! Bạn có thích táo không?",
        petLineJa: "うーん、おいしい!リンゴも好き?",
        petLineKo: "음, 맛있다! 너도 사과 좋아해?",
        options: ["Yes, I love apples!", "My sister is tall.", "The clock is on the wall."],
        optionsVi: ["Có, mình rất thích táo!", "Chị mình rất cao.", "Đồng hồ ở trên tường."],
        optionsJa: ["うん、リンゴが大好きだよ!", "私の姉は背が高いよ。", "時計は壁にかかっているよ。"],
        optionsKo: ["응, 나는 사과를 정말 좋아해!", "내 언니는 키가 커.", "시계는 벽에 걸려 있어."],
        answerIndex: 0,
        replyLine: "Apples are the best! Let's eat together.",
        replyLineVi: "Táo là ngon nhất! Cùng ăn nhé.",
        replyLineJa: "リンゴが一番だよ!一緒に食べよう。",
        replyLineKo: "사과가 최고야! 같이 먹자.",
      },
      {
        petLine: "Can I have some water now, please?",
        petLineVi: "Cho mình xin chút nước được không?",
        petLineJa: "お水をもらえる?",
        petLineKo: "물 좀 마셔도 될까?",
        options: ["Of course, here's some water.", "I have a new toy.", "The sun is very bright."],
        optionsVi: ["Tất nhiên rồi, đây là nước cho bạn.", "Mình có một món đồ chơi mới.", "Mặt trời rất sáng."],
        optionsJa: ["もちろん、お水どうぞ。", "新しいおもちゃがあるよ。", "太陽はとても明るいよ。"],
        optionsKo: ["물론이지, 여기 물 있어.", "나는 새 장난감이 있어.", "해가 정말 밝아."],
        answerIndex: 0,
        replyLine: "Ahh, refreshing! Thank you, friend!",
        replyLineVi: "Ahh, mát quá! Cảm ơn bạn nhé!",
        replyLineJa: "ああ、さっぱりする!ありがとう、友達!",
        replyLineKo: "아, 시원하다! 고마워, 친구!",
      },
    ],
  },
  {
    key: "introduce-yourself",
    name: "Giới thiệu bản thân",
    color: "#57C6C6",
    rounds: [
      {
        petLine: "Hi! I'm Buddy. What's your name?",
        petLineVi: "Chào bạn! Mình là Buddy. Bạn tên gì?",
        petLineJa: "やあ!ぼくはバディだよ。君の名前は?",
        petLineKo: "안녕! 나는 버디야. 네 이름은 뭐야?",
        options: ["My name is Alex.", "I have two cats.", "The weather is cold."],
        optionsVi: ["Mình tên là Alex.", "Mình có hai con mèo.", "Thời tiết hôm nay lạnh."],
        optionsJa: ["私の名前はアレックスです。", "私は猫を2匹飼っているよ。", "天気は寒いよ。"],
        optionsKo: ["내 이름은 알렉스야.", "나는 고양이가 두 마리 있어.", "날씨가 추워."],
        answerIndex: 0,
        replyLine: "Nice to meet you, Alex!",
        replyLineVi: "Rất vui được gặp bạn, Alex!",
        replyLineJa: "会えて嬉しいよ、アレックス!",
        replyLineKo: "만나서 반가워, 알렉스!",
      },
      {
        petLine: "How old are you?",
        petLineVi: "Bạn bao nhiêu tuổi rồi?",
        petLineJa: "君は何歳?",
        petLineKo: "너는 몇 살이야?",
        options: ["I am eight years old.", "I live in a big house.", "My favorite color is blue."],
        optionsVi: ["Mình tám tuổi.", "Mình sống trong một ngôi nhà lớn.", "Màu mình thích nhất là màu xanh dương."],
        optionsJa: ["私は8歳です。", "私は大きな家に住んでいるよ。", "私の好きな色は青だよ。"],
        optionsKo: ["나는 여덟 살이야.", "나는 큰 집에 살아.", "내가 제일 좋아하는 색은 파란색이야."],
        answerIndex: 0,
        replyLine: "Wow, eight years old! That's great!",
        replyLineVi: "Wow, tám tuổi rồi! Tuyệt quá!",
        replyLineJa: "わあ、8歳なんだ!すごいね!",
        replyLineKo: "와, 여덟 살이구나! 멋지다!",
      },
      {
        petLine: "Do you like animals?",
        petLineVi: "Bạn có thích động vật không?",
        petLineJa: "動物は好き?",
        petLineKo: "너는 동물을 좋아해?",
        options: ["Yes, I love animals!", "I can ride a bike.", "The movie was fun."],
        optionsVi: ["Có, mình rất thích động vật!", "Mình biết đi xe đạp.", "Bộ phim đó rất vui."],
        optionsJa: ["うん、動物が大好きだよ!", "私は自転車に乗れるよ。", "その映画は楽しかったよ。"],
        optionsKo: ["응, 나는 동물을 정말 좋아해!", "나는 자전거를 탈 수 있어.", "그 영화는 재미있었어."],
        answerIndex: 0,
        replyLine: "Me too! Animals are wonderful!",
        replyLineVi: "Mình cũng vậy! Động vật thật tuyệt vời!",
        replyLineJa: "ぼくも!動物は素晴らしいよね!",
        replyLineKo: "나도 그래! 동물은 정말 멋져!",
      },
    ],
  },
  {
    key: "saying-goodbye",
    name: "Tạm biệt",
    color: "#9B7EDE",
    rounds: [
      {
        petLine: "It's time to go now. Goodbye!",
        petLineVi: "Đến giờ phải đi rồi. Tạm biệt nhé!",
        petLineJa: "もう行く時間だよ。さようなら!",
        petLineKo: "이제 가야 할 시간이야. 안녕!",
        options: ["Goodbye! See you soon!", "I want a new book.", "The dog is very big."],
        optionsVi: ["Tạm biệt! Hẹn gặp lại bạn sớm nhé!", "Mình muốn có một quyển sách mới.", "Con chó đó rất to."],
        optionsJa: ["さようなら!またすぐ会おうね!", "新しい本が欲しいな。", "その犬はとても大きいよ。"],
        optionsKo: ["안녕! 곧 또 보자!", "나는 새 책을 갖고 싶어.", "그 개는 정말 커."],
        answerIndex: 0,
        replyLine: "See you soon, my friend!",
        replyLineVi: "Hẹn gặp lại bạn sớm nhé, bạn của mình!",
        replyLineJa: "またね、ぼくの友達!",
        replyLineKo: "곧 또 보자, 내 친구!",
      },
      {
        petLine: "Did you have fun today?",
        petLineVi: "Hôm nay bạn có vui không?",
        petLineJa: "今日は楽しかった?",
        petLineKo: "오늘 재미있었어?",
        options: ["Yes, I had a lot of fun!", "My room is very clean.", "The bird can fly high."],
        optionsVi: ["Có, mình đã rất vui!", "Phòng của mình rất sạch sẽ.", "Con chim đó bay rất cao."],
        optionsJa: ["うん、とても楽しかったよ!", "私の部屋はとてもきれいだよ。", "その鳥は高く飛べるよ。"],
        optionsKo: ["응, 정말 재미있었어!", "내 방은 아주 깨끗해.", "그 새는 높이 날 수 있어."],
        answerIndex: 0,
        replyLine: "I'm so glad! Let's play again tomorrow!",
        replyLineVi: "Mình rất vui vì điều đó! Mai cùng chơi tiếp nhé!",
        replyLineJa: "それは良かった!また明日遊ぼうね!",
        replyLineKo: "정말 기쁘다! 내일 또 같이 놀자!",
      },
      {
        petLine: "Sweet dreams tonight, okay?",
        petLineVi: "Chúc bạn có giấc mơ đẹp tối nay nhé?",
        petLineJa: "今夜はいい夢を見てね?",
        petLineKo: "오늘 밤 좋은 꿈 꿔, 알겠지?",
        options: ["Okay, sweet dreams to you too!", "I have five fingers.", "The ice cream is cold."],
        optionsVi: ["Được rồi, chúc bạn cũng có giấc mơ đẹp nhé!", "Mình có năm ngón tay.", "Kem thì lạnh."],
        optionsJa: ["うん、君もいい夢を見てね!", "私には指が5本あるよ。", "アイスクリームは冷たいよ。"],
        optionsKo: ["응, 너도 좋은 꿈 꿔!", "나는 손가락이 다섯 개 있어.", "아이스크림은 차가워."],
        answerIndex: 0,
        replyLine: "Goodnight! See you tomorrow!",
        replyLineVi: "Chúc ngủ ngon! Hẹn gặp lại bạn vào ngày mai!",
        replyLineJa: "おやすみ!また明日ね!",
        replyLineKo: "잘자! 내일 또 보자!",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Chat with Buddy — 100 GENERATED topics, "từ dễ đến khó" (2026-08-28, user:
// "cũng ít data, add thêm 100 chủ đề từ dễ đến khó"). Same generator strategy
// as Lesson/Detective/Echo Parrot: 1 reusable conversation TEMPLATE (2 rounds
// "do you like X" + "what's your favorite X", matching the shape of the 4
// hand-written topics above) parametrized by 10 CATEGORIES (8 reused
// straight from `VOCAB_TOPICS` — already vi/ja/ko translated, "school" and
// "body" skipped because "favorite classmate"/"favorite body part" read
// oddly for a kids' app; 2 new small banks — toys, sports — plus "family"
// with its own non-ranking phrasing since "favorite family member" isn't a
// fair question to ask a kid). Each category contributes 10 topics (1 per
// word, 10 words picked per category) split 3 Dễ + 4 Trung bình + 3 Khó =
// 10 × 10 = 100. Difficulty is real, not just a label — reuses the exact
// same rule as the Lesson generator: Dễ = wrong options are the 24 generic
// unrelated sentences already used in the 4 hand-written topics above; Khó =
// wrong options are the SAME "My favorite X is ___" sentence with a
// DIFFERENT word from the SAME category (genuine near-miss, must listen for
// the specific word, not just recognize the sentence shape); Trung bình
// mixes 1 of each.
// ---------------------------------------------------------------------------
interface WordVi {
  en: string;
  vi: string;
  ja: string;
  ko: string;
}

/** The 24 wrong-answer sentences already written (with translations) for the
 * 4 hand-written topics above — reused verbatim as the "obviously unrelated"
 * decoy pool instead of re-authoring/re-translating a new one. */
const CHAT_GENERIC_DECOYS: WordVi[] = [
  { en: "I have a red bicycle.", vi: "Mình có một chiếc xe đạp màu đỏ.", ja: "赤い自転車を持っているよ。", ko: "나는 빨간 자전거가 있어." },
  { en: "The book is on the table.", vi: "Quyển sách ở trên bàn.", ja: "本は机の上にあるよ。", ko: "책은 탁자 위에 있어." },
  { en: "I like to eat pizza.", vi: "Mình thích ăn pizza.", ja: "ピザを食べるのが好きだよ。", ko: "나는 피자를 좋아해." },
  { en: "My shoes are blue.", vi: "Giày của mình màu xanh.", ja: "私の靴は青いよ。", ko: "내 신발은 파란색이야." },
  { en: "It is raining outside.", vi: "Bên ngoài trời đang mưa.", ja: "外は雨が降っているよ。", ko: "밖에 비가 오고 있어." },
  { en: "I have three brothers.", vi: "Mình có ba anh em trai.", ja: "私には兄弟が3人いるよ。", ko: "나는 남자 형제가 셋 있어." },
  { en: "The car is very fast.", vi: "Chiếc xe hơi chạy rất nhanh.", ja: "車はとても速いよ。", ko: "그 차는 정말 빨라." },
  { en: "I can swim in the pool.", vi: "Mình có thể bơi trong hồ bơi.", ja: "私はプールで泳げるよ。", ko: "나는 수영장에서 수영할 수 있어." },
  { en: "My sister is tall.", vi: "Chị mình rất cao.", ja: "私の姉は背が高いよ。", ko: "내 언니는 키가 커." },
  { en: "The clock is on the wall.", vi: "Đồng hồ ở trên tường.", ja: "時計は壁にかかっているよ。", ko: "시계는 벽에 걸려 있어." },
  { en: "I have a new toy.", vi: "Mình có một món đồ chơi mới.", ja: "新しいおもちゃがあるよ。", ko: "나는 새 장난감이 있어." },
  { en: "The sun is very bright.", vi: "Mặt trời rất sáng.", ja: "太陽はとても明るいよ。", ko: "해가 정말 밝아." },
  { en: "I have two cats.", vi: "Mình có hai con mèo.", ja: "私は猫を2匹飼っているよ。", ko: "나는 고양이가 두 마리 있어." },
  { en: "The weather is cold.", vi: "Thời tiết hôm nay lạnh.", ja: "天気は寒いよ。", ko: "날씨가 추워." },
  { en: "I live in a big house.", vi: "Mình sống trong một ngôi nhà lớn.", ja: "私は大きな家に住んでいるよ。", ko: "나는 큰 집에 살아." },
  { en: "My favorite color is blue.", vi: "Màu mình thích nhất là màu xanh dương.", ja: "私の好きな色は青だよ。", ko: "내가 제일 좋아하는 색은 파란색이야." },
  { en: "I can ride a bike.", vi: "Mình biết đi xe đạp.", ja: "私は自転車に乗れるよ。", ko: "나는 자전거를 탈 수 있어." },
  { en: "The movie was fun.", vi: "Bộ phim đó rất vui.", ja: "その映画は楽しかったよ。", ko: "그 영화는 재미있었어." },
  { en: "I want a new book.", vi: "Mình muốn có một quyển sách mới.", ja: "新しい本が欲しいな。", ko: "나는 새 책을 갖고 싶어." },
  { en: "The dog is very big.", vi: "Con chó đó rất to.", ja: "その犬はとても大きいよ。", ko: "그 개는 정말 커." },
  { en: "My room is very clean.", vi: "Phòng của mình rất sạch sẽ.", ja: "私の部屋はとてもきれいだよ。", ko: "내 방은 아주 깨끗해." },
  { en: "The bird can fly high.", vi: "Con chim đó bay rất cao.", ja: "その鳥は高く飛べるよ。", ko: "그 새는 높이 날 수 있어." },
  { en: "I have five fingers.", vi: "Mình có năm ngón tay.", ja: "私には指が5本あるよ。", ko: "나는 손가락이 다섯 개 있어." },
  { en: "The ice cream is cold.", vi: "Kem thì lạnh.", ja: "アイスクリームは冷たいよ。", ko: "아이스크림은 차가워." },
];

const CHAT_TOY_WORDS: [string, string, string, string][] = [
  ["ball", "quả bóng", "ボール", "공"],
  ["doll", "búp bê", "人形", "인형"],
  ["teddy bear", "gấu bông", "テディベア", "곰인형"],
  ["blocks", "khối xếp hình", "積み木", "블록"],
  ["puzzle", "trò chơi ghép hình", "パズル", "퍼즐"],
  ["kite", "con diều", "凧", "연"],
  ["robot toy", "robot đồ chơi", "ロボットのおもちゃ", "로봇 장난감"],
  ["toy car", "xe hơi đồ chơi", "おもちゃの車", "장난감 자동차"],
  ["yo-yo", "con quay yo-yo", "ヨーヨー", "요요"],
  ["balloon", "quả bóng bay", "風船", "풍선"],
];
const CHAT_SPORT_WORDS: [string, string, string, string][] = [
  ["soccer", "bóng đá", "サッカー", "축구"],
  ["basketball", "bóng rổ", "バスケットボール", "농구"],
  ["swimming", "bơi lội", "水泳", "수영"],
  ["tennis", "quần vợt", "テニス", "테니스"],
  ["running", "chạy bộ", "ランニング", "달리기"],
  ["cycling", "đạp xe", "サイクリング", "자전거 타기"],
  ["badminton", "cầu lông", "バドミントン", "배드민턴"],
  ["volleyball", "bóng chuyền", "バレーボール", "배구"],
  ["table tennis", "bóng bàn", "卓球", "탁구"],
  ["gymnastics", "thể dục dụng cụ", "体操", "체조"],
];

interface ChatCategory {
  key: string;
  words: [string, string, string, string][];
  nameEn: string;
  namePluralEn: string;
  nameVi: string;
  nameJa: string;
  nameKo: string;
  useArticle: boolean;
  isFamily?: boolean;
}
const CHAT_CATEGORIES: ChatCategory[] = [
  { key: "animals", words: VOCAB_TOPICS.animals!.slice(0, 10), nameEn: "animal", namePluralEn: "animals", nameVi: "động vật", nameJa: "動物", nameKo: "동물", useArticle: true },
  { key: "colors", words: VOCAB_TOPICS.colors!.slice(0, 10), nameEn: "color", namePluralEn: "colors", nameVi: "màu sắc", nameJa: "色", nameKo: "색깔", useArticle: false },
  { key: "numbers", words: VOCAB_TOPICS.numbers!.slice(0, 10), nameEn: "number", namePluralEn: "numbers", nameVi: "con số", nameJa: "数字", nameKo: "숫자", useArticle: false },
  { key: "food", words: VOCAB_TOPICS.food!.slice(0, 10), nameEn: "food", namePluralEn: "food", nameVi: "món ăn", nameJa: "食べ物", nameKo: "음식", useArticle: true },
  { key: "weather", words: VOCAB_TOPICS.weather!.slice(0, 10), nameEn: "weather", namePluralEn: "weather", nameVi: "thời tiết", nameJa: "天気", nameKo: "날씨", useArticle: false },
  { key: "clothes", words: VOCAB_TOPICS.clothes!.slice(0, 10), nameEn: "thing to wear", namePluralEn: "clothes", nameVi: "trang phục", nameJa: "服", nameKo: "옷", useArticle: true },
  { key: "transport", words: VOCAB_TOPICS.transport!.slice(0, 10), nameEn: "vehicle", namePluralEn: "vehicles", nameVi: "phương tiện", nameJa: "乗り物", nameKo: "탈것", useArticle: true },
  { key: "toys", words: CHAT_TOY_WORDS, nameEn: "toy", namePluralEn: "toys", nameVi: "đồ chơi", nameJa: "おもちゃ", nameKo: "장난감", useArticle: true },
  { key: "sports", words: CHAT_SPORT_WORDS, nameEn: "sport", namePluralEn: "sports", nameVi: "môn thể thao", nameJa: "スポーツ", nameKo: "운동", useArticle: false },
  { key: "family", words: VOCAB_TOPICS.family!.slice(0, 10), nameEn: "family member", namePluralEn: "family members", nameVi: "thành viên gia đình", nameJa: "家族", nameKo: "가족", useArticle: false, isFamily: true },
];

type ChatTier = "easy" | "medium" | "hard";
const CHAT_TIER_LABEL: Record<ChatTier, string> = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const CHAT_TIER_COLOR: Record<ChatTier, string> = { easy: "#7CC24A", medium: "#F5822B", hard: "#EF6A5A" };

function chatSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "");
}

function chatDecoys(n: number): WordVi[] {
  const out: WordVi[] = [];
  while (out.length < n) {
    const d = CHAT_GENERIC_DECOYS[Math.floor(Math.random() * CHAT_GENERIC_DECOYS.length)]!;
    if (!out.includes(d)) out.push(d);
  }
  return out;
}

/** Builds & shuffles a round's 3 options from 1 correct + N wrong WordVi-like entries, fixing up answerIndex to match. */
function chatRoundFrom(
  petLine: WordVi,
  correct: WordVi,
  wrong: WordVi[],
  reply: WordVi,
): ChatBuddyRoundSeed {
  const optionSlots = shuffled([correct, ...wrong]);
  return {
    petLine: petLine.en,
    petLineVi: petLine.vi,
    petLineJa: petLine.ja,
    petLineKo: petLine.ko,
    options: optionSlots.map((o) => o.en),
    optionsVi: optionSlots.map((o) => o.vi),
    optionsJa: optionSlots.map((o) => o.ja),
    optionsKo: optionSlots.map((o) => o.ko),
    answerIndex: optionSlots.indexOf(correct),
    replyLine: reply.en,
    replyLineVi: reply.vi,
    replyLineJa: reply.ja,
    replyLineKo: reply.ko,
  };
}

function buildChatTopic(cat: ChatCategory, word: [string, string, string, string], tier: ChatTier): ChatBuddyTopicSeed {
  const [wordEn, wordVi, wordJa, wordKo] = word;
  const article = cat.useArticle ? `${articleFor(wordEn)} ` : "";
  // Definite reference ("the tiger"), for when the round refers BACK to the
  // word just mentioned rather than introducing it — different from
  // `article` above (indefinite "a/an", for first mention).
  const theArticle = cat.useArticle ? "the " : "";

  // ---- Round 1: generic opener — same wording per category, only the wrong-option SOURCE varies by tier. ----
  const round1 = cat.isFamily
    ? chatRoundFrom(
        { en: "Do you have a family?", vi: "Bạn có gia đình không?", ja: "家族はいる?", ko: "가족 있어?" },
        { en: "Yes, I have a family!", vi: "Có, mình có gia đình!", ja: "うん、家族がいるよ!", ko: "응, 나는 가족이 있어!" },
        chatDecoys(2),
        { en: "Family is wonderful!", vi: "Gia đình thật tuyệt vời!", ja: "家族って素敵だね!", ko: "가족은 정말 소중해!" },
      )
    : chatRoundFrom(
        { en: `Do you like ${cat.namePluralEn}?`, vi: `Bạn có thích ${cat.nameVi} không?`, ja: `${cat.nameJa}は好き?`, ko: `${cat.nameKo} 좋아해?` },
        { en: `Yes, I like ${cat.namePluralEn}!`, vi: `Có, mình thích ${cat.nameVi}!`, ja: `うん、${cat.nameJa}が好きだよ!`, ko: `응, ${cat.nameKo} 좋아해!` },
        chatDecoys(2),
        { en: `Great! I like ${cat.namePluralEn} too!`, vi: `Tuyệt! Mình cũng thích ${cat.nameVi}!`, ja: `やった!ぼくも${cat.nameJa}が好きだよ!`, ko: `좋아! 나도 ${cat.nameKo} 좋아해!` },
      );

  // ---- Round 2: the specific-word question — where difficulty actually lives. ----
  let round2: ChatBuddyRoundSeed;
  if (cat.isFamily) {
    round2 = chatRoundFrom(
      { en: "Who is in your family?", vi: "Ai ở trong gia đình bạn?", ja: "家族には誰がいる?", ko: "가족에는 누가 있어?" },
      { en: `My ${wordEn} is in my family.`, vi: `${wordVi.charAt(0).toUpperCase()}${wordVi.slice(1)} là người trong gia đình mình.`, ja: `私の${wordJa}は家族だよ。`, ko: `내 ${wordKo}는 우리 가족이야.` },
      chatDecoys(2),
      { en: "That's wonderful! Family is special!", vi: "Tuyệt quá! Gia đình thật đặc biệt!", ja: "素晴らしいね!家族は特別だよ!", ko: "멋지다! 가족은 특별해!" },
    );
  } else {
    // Same-category "near-miss" — the SAME sentence shape with a DIFFERENT
    // word from this category, only for tiers above Dễ. Genuinely harder:
    // a kid has to catch the specific word said, not just the sentence shape.
    const others = cat.words.filter((w) => w[0] !== wordEn);
    function nearMissWrongs(n: number): WordVi[] {
      const picked: [string, string, string, string][] = [];
      const pool = [...others];
      while (picked.length < n && pool.length > 0) {
        const i = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(i, 1)[0]!);
      }
      return picked.map(([oEn, oVi, oJa, oKo]) => ({
        en: `My favorite ${cat.nameEn} is ${cat.useArticle ? `${articleFor(oEn)} ` : ""}${oEn}.`,
        vi: `${cat.nameVi.charAt(0).toUpperCase()}${cat.nameVi.slice(1)} mình thích nhất là ${oVi}.`,
        ja: `好きな${cat.nameJa}は${oJa}だよ。`,
        ko: `제일 좋아하는 ${cat.nameKo}는 ${oKo}야.`,
      }));
    }
    const wrong2: WordVi[] = tier === "easy" ? chatDecoys(2) : tier === "medium" ? [...nearMissWrongs(1), ...chatDecoys(1)] : nearMissWrongs(2);
    // "The tiger is wonderful!" for countable categories, "Red is wonderful!" for the rest — theArticle already carries its own trailing space or "".
    const wordRefCapitalized = theArticle ? `${theArticle}${wordEn}` : `${wordEn.charAt(0).toUpperCase()}${wordEn.slice(1)}`;
    round2 = chatRoundFrom(
      { en: `What is your favorite ${cat.nameEn}?`, vi: `${cat.nameVi.charAt(0).toUpperCase()}${cat.nameVi.slice(1)} bạn thích nhất là gì?`, ja: `好きな${cat.nameJa}は何?`, ko: `제일 좋아하는 ${cat.nameKo}는 뭐야?` },
      { en: `My favorite ${cat.nameEn} is ${article}${wordEn}.`, vi: `${cat.nameVi.charAt(0).toUpperCase()}${cat.nameVi.slice(1)} mình thích nhất là ${wordVi}.`, ja: `好きな${cat.nameJa}は${wordJa}だよ。`, ko: `제일 좋아하는 ${cat.nameKo}는 ${wordKo}야.` },
      wrong2,
      { en: `${wordRefCapitalized.charAt(0).toUpperCase()}${wordRefCapitalized.slice(1)} is wonderful! Great choice!`, vi: `${wordVi.charAt(0).toUpperCase()}${wordVi.slice(1)} tuyệt quá! Lựa chọn hay đấy!`, ja: `${wordJa}っていいね!いい選択だね!`, ko: `${wordKo} 멋지다! 훌륭한 선택이야!` },
    );
  }

  // ---- Round 3: closer — same wording per category, tier only affects wrong-option source. ----
  const round3 = cat.isFamily
    ? chatRoundFrom(
        { en: `What do you do with your ${wordEn}?`, vi: `Bạn làm gì cùng ${wordVi}?`, ja: `${wordJa}と何をするの?`, ko: `${wordKo}랑 뭐 해?` },
        { en: "We play games together!", vi: "Cùng nhau chơi trò chơi!", ja: "一緒にゲームをするよ!", ko: "같이 게임을 해!" },
        chatDecoys(2),
        { en: "That sounds like so much fun!", vi: "Nghe vui quá đấy!", ja: "それは楽しそうだね!", ko: "정말 재미있겠다!" },
      )
    : chatRoundFrom(
        { en: `Why do you like ${theArticle}${wordEn}?`, vi: `Vì sao bạn thích ${wordVi}?`, ja: `どうして${wordJa}が好きなの?`, ko: `왜 ${wordKo}를 좋아해?` },
        { en: "Because it makes me happy!", vi: "Vì nó làm mình vui!", ja: "楽しい気分になるからだよ!", ko: "그게 나를 행복하게 해줘서!" },
        chatDecoys(2),
        { en: "That's so sweet! Thanks for sharing!", vi: "Dễ thương quá! Cảm ơn bạn đã chia sẻ!", ja: "優しいね!教えてくれてありがとう!", ko: "너무 착하다! 말해줘서 고마워!" },
      );

  const wordViTitle = wordVi.charAt(0).toUpperCase() + wordVi.slice(1);
  const catNameViTitle = cat.nameVi.charAt(0).toUpperCase() + cat.nameVi.slice(1);
  return {
    key: `chat-gen-${cat.key}-${chatSlug(wordEn)}`,
    name: cat.isFamily ? `Gia đình: ${wordViTitle} (${CHAT_TIER_LABEL[tier]})` : `${catNameViTitle} yêu thích: ${wordViTitle} (${CHAT_TIER_LABEL[tier]})`,
    color: CHAT_TIER_COLOR[tier],
    rounds: [round1, round2, round3],
  };
}

// 3 Dễ + 4 Trung bình + 3 Khó words per category × 10 categories = 100
// topics; grouped Dễ-all → Trung bình-all → Khó-all so `order` (assigned
// below by array position, same convention as WORLD_LESSONS/DETECTIVE_CASES)
// gives a genuine "từ dễ đến khó" sequence in the topic picker.
const CHAT_TIER_BANDS: { tier: ChatTier; wordRange: [number, number] }[] = [
  { tier: "easy", wordRange: [0, 3] },
  { tier: "medium", wordRange: [3, 7] },
  { tier: "hard", wordRange: [7, 10] },
];
const GENERATED_CHAT_TOPICS: ChatBuddyTopicSeed[] = CHAT_TIER_BANDS.flatMap(({ tier, wordRange }) =>
  CHAT_CATEGORIES.flatMap((cat) => cat.words.slice(wordRange[0], wordRange[1]).map((word) => buildChatTopic(cat, word, tier))),
);
CHAT_BUDDY_TOPICS.push(...GENERATED_CHAT_TOPICS);

async function main() {
  const passwordHash = await argon2.hash(ADMIN_PASSWORD);
  const admin = await prisma.parent.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", isActive: true },
    create: { email: ADMIN_EMAIL, passwordHash, role: "ADMIN" },
  });
  console.log(`✔ Admin account ready: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (change this password after first login)`);

  for (const [order, [name, key, species, rarity]] of PETS.entries()) {
    const { price, currency } = RARITY_PRICE[rarity];
    await prisma.pet.upsert({
      where: { key },
      update: { name, species, rarity, price, currency, imagePath: `/pets/${key}.webp`, order },
      create: { key, name, species, rarity, price, currency, imagePath: `/pets/${key}.webp`, order },
    });
  }
  console.log(`✔ Seeded ${PETS.length} pets`);

  for (const [order, w] of WORLDS.entries()) {
    await prisma.world.upsert({ where: { key: w.key }, update: {}, create: { ...w, order } });
  }
  console.log(`✔ Seeded ${WORLDS.length} worlds`);

  const forest = await prisma.world.findUniqueOrThrow({ where: { key: "forest" } });
  const existingLesson = await prisma.lesson.findFirst({ where: { worldId: forest.id, title: "Bài 1: Thiên nhiên quanh ta" } });
  const lesson =
    existingLesson ??
    (await prisma.lesson.create({ data: { worldId: forest.id, title: "Bài 1: Thiên nhiên quanh ta", order: 0 } }));

  const questionCount = await prisma.question.count({ where: { lessonId: lesson.id } });
  if (questionCount === 0) {
    await prisma.question.createMany({
      data: FOREST_QUESTIONS.map((q, order) => ({ ...q, lessonId: lesson.id, order })),
    });
  }
  console.log(`✔ Seeded lesson "${lesson.title}" with ${FOREST_QUESTIONS.length} questions`);

  let worldLessonsAdded = 0;
  for (const wl of WORLD_LESSONS) {
    const world = await prisma.world.findUniqueOrThrow({ where: { key: wl.worldKey } });
    const existingWorldLesson = await prisma.lesson.findFirst({ where: { worldId: world.id, title: wl.title } });
    const worldLesson = existingWorldLesson ?? (await prisma.lesson.create({ data: { worldId: world.id, title: wl.title, order: wl.order } }));
    const worldQuestionCount = await prisma.question.count({ where: { lessonId: worldLesson.id } });
    if (worldQuestionCount === 0) {
      await prisma.question.createMany({ data: wl.questions.map((q, order) => ({ ...q, lessonId: worldLesson.id, order })) });
      worldLessonsAdded++;
    }
  }
  console.log(`✔ Seeded ${worldLessonsAdded} new world lessons (Town/Beach/School/Castle/Space)`);

  let vocabAdded = 0;
  for (const [topic, words] of Object.entries(VOCAB_TOPICS)) {
    const existing = await prisma.vocab.count({ where: { worldId: topic } });
    if (existing > 0) continue; // topic already seeded, don't duplicate on re-run
    await prisma.vocab.createMany({ data: words.map(([word, meaningVi, meaningJa, meaningKo]) => ({ word, meaningVi, meaningJa, meaningKo, worldId: topic })) });
    vocabAdded += words.length;
  }
  console.log(`✔ Seeded ${vocabAdded} vocab words across ${Object.keys(VOCAB_TOPICS).length} topics`);

  for (const [order, item] of ITEMS.entries()) {
    await prisma.item.upsert({ where: { key: item.key }, update: { ...item, order }, create: { ...item, order } });
  }
  console.log(`✔ Seeded ${ITEMS.length} items`);

  let adminTestChild = await prisma.child.findFirst({ where: { parentId: admin.id, displayName: "Admin Test" } });
  if (!adminTestChild) {
    adminTestChild = await prisma.child.create({ data: { parentId: admin.id, displayName: "Admin Test", avatarId: "buddy", birthYear: 2018 } });
  }
  await prisma.progress.upsert({
    where: { childId: adminTestChild.id },
    update: { coins: ADMIN_COINS, gems: 99999, unlockedPets: PETS.map(([, key]) => key), unlockedWorlds: ["forest", "town"], activePetId: "buddy" },
    create: { childId: adminTestChild.id, coins: ADMIN_COINS, gems: 99999, unlockedPets: PETS.map(([, key]) => key), unlockedWorlds: ["forest", "town"], activePetId: "buddy" },
  });
  await prisma.progress.updateMany({
    where: { child: { parentId: admin.id } },
    data: { coins: ADMIN_COINS, gems: 99999 },
  });
  console.log(`✔ Every admin child profile funded with ${ADMIN_COINS.toLocaleString("en-US")} coins and 99,999 gems`);

  for (const [order, quest] of DAILY_QUESTS.entries()) {
    await prisma.dailyQuest.upsert({ where: { key: quest.key }, update: {}, create: { ...quest, order } });
  }
  console.log(`✔ Seeded ${DAILY_QUESTS.length} daily quests`);

  let storyPagesAdded = 0;
  for (const [order, s] of STORIES.entries()) {
    const story = await prisma.story.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, title: s.title, topic: s.topic, colorTheme: s.colorTheme, order },
    });
    const existingPages = await prisma.storyPage.count({ where: { storyId: story.id } });
    if (existingPages === 0) {
      await prisma.storyPage.createMany({
        data: s.pages.map((p, pageOrder) => ({
          storyId: story.id,
          en: p.en,
          vi: p.vi,
          ja: p.ja,
          ko: p.ko,
          img1: p.img1,
          img2: p.img2,
          label: p.label,
          sceneBg: p.sceneBg,
          ground: p.ground,
          words: p.words.map(([en, vi, ja, ko, color]) => ({ en, vi, ja, ko, color })),
          order: pageOrder,
        })),
      });
      storyPagesAdded += s.pages.length;
    }
  }
  console.log(`✔ Seeded ${STORIES.length} stories with ${storyPagesAdded} pages`);

  let miniGameWordsAdded = 0;
  for (const [order, t] of MINIGAME_TOPICS.entries()) {
    const topic = await prisma.miniGameTopic.upsert({
      where: { key: t.key },
      update: {},
      create: { key: t.key, name: t.name, color: t.color, order },
    });
    const existingWords = await prisma.miniGameWord.count({ where: { topicId: topic.id } });
    if (existingWords !== t.words.length) {
      await prisma.miniGameWord.deleteMany({ where: { topicId: topic.id } });
      await prisma.miniGameWord.createMany({
        data: t.words.map(([en, vi, ja, ko, img], wordOrder) => ({ topicId: topic.id, en, vi, ja, ko, img, order: wordOrder })),
      });
      miniGameWordsAdded += t.words.length;
    }
  }
  console.log(`✔ Seeded ${MINIGAME_TOPICS.length} Memory Match topics with ${miniGameWordsAdded} word pairs`);

  let wordCatchRoundsAdded = 0;
  for (const [order, t] of WORDCATCH_TOPICS.entries()) {
    const topic = await prisma.wordCatchTopic.upsert({
      where: { key: t.key },
      update: {},
      create: { key: t.key, name: t.name, order },
    });
    const existingRounds = await prisma.wordCatchRound.count({ where: { topicId: topic.id } });
    if (existingRounds !== t.rounds.length) {
      await prisma.wordCatchRound.deleteMany({ where: { topicId: topic.id } });
      await prisma.wordCatchRound.createMany({
        data: t.rounds.map((r, roundOrder) => ({ topicId: topic.id, vi: r.vi, ja: r.ja, ko: r.ko, answer: r.answer, options: r.options, order: roundOrder })),
      });
      wordCatchRoundsAdded += t.rounds.length;
    }
  }
  console.log(`✔ Seeded ${WORDCATCH_TOPICS.length} Word Catch topics with ${wordCatchRoundsAdded} rounds`);

  let shopRoundsAdded = 0;
  for (const [order, t] of SHOP_TOPICS.entries()) {
    const topic = await prisma.shopTopic.upsert({
      where: { key: t.key },
      update: {},
      create: { key: t.key, name: t.name, color: t.color, order },
    });
    const existingRounds = await prisma.shopRound.count({ where: { topicId: topic.id } });
    if (existingRounds !== t.rounds.length) {
      await prisma.shopRound.deleteMany({ where: { topicId: topic.id } });
      await prisma.shopRound.createMany({
        data: t.rounds.map((r, roundOrder) => ({
          topicId: topic.id,
          instructionEn: r.instructionEn,
          instructionVi: r.instructionVi,
          instructionJa: buildShopInstruction("ja", r.required),
          instructionKo: buildShopInstruction("ko", r.required),
          shelf: buildShelf(r.shelfCounts),
          required: r.required.map(([key, qty]) => ({ en: SHOP_ITEMS[key].en, qty })),
          order: roundOrder,
        })),
      });
      shopRoundsAdded += t.rounds.length;
    }
  }
  console.log(`✔ Seeded ${SHOP_TOPICS.length} English Shop topics with ${shopRoundsAdded} rounds`);

  let homeRoundsAdded = 0;
  for (const [order, t] of HOME_TOPICS.entries()) {
    const topic = await prisma.homeTopic.upsert({
      where: { key: t.key },
      update: {},
      create: { key: t.key, name: t.name, color: t.color, order },
    });
    const existingRounds = await prisma.homeRound.count({ where: { topicId: topic.id } });
    if (existingRounds === 0) {
      await prisma.homeRound.createMany({
        data: t.rounds.map((r, roundOrder) => ({
          topicId: topic.id,
          instructionEn: r.instructionEn,
          instructionVi: r.instructionVi,
          instructionJa: buildHomeInstruction("ja", r.correctObjectKey, r.correctZoneKey),
          instructionKo: buildHomeInstruction("ko", r.correctObjectKey, r.correctZoneKey),
          objects: r.objects,
          correctObjectKey: r.correctObjectKey,
          zones: r.zones,
          correctZoneKey: r.correctZoneKey,
          order: roundOrder,
        })),
      });
      homeRoundsAdded += t.rounds.length;
    }
  }
  console.log(`✔ Seeded ${HOME_TOPICS.length} English Home topics with ${homeRoundsAdded} rounds`);

  let rpgMonstersAdded = 0;
  for (const [order, t] of RPG_TOPICS.entries()) {
    const topic = await prisma.rpgTopic.upsert({
      where: { key: t.key },
      update: {},
      create: { key: t.key, name: t.name, color: t.color, order },
    });
    const existingMonsters = await prisma.rpgMonster.count({ where: { topicId: topic.id } });
    if (existingMonsters === 0) {
      await prisma.rpgMonster.createMany({
        data: t.monsters.map((m, monsterOrder) => ({
          topicId: topic.id,
          name: m.name,
          emoji: m.emoji,
          isBoss: m.isBoss ?? false,
          questions: m.questions.map((q) => ({
            en: q.en,
            answerVi: q.answerVi,
            optionsVi: q.optionsVi,
            answerJa: rpgJa(q.answerVi),
            optionsJa: q.optionsVi.map(rpgJa),
            answerKo: rpgKo(q.answerVi),
            optionsKo: q.optionsVi.map(rpgKo),
          })),
          order: monsterOrder,
        })),
      });
      rpgMonstersAdded += t.monsters.length;
    }
  }
  console.log(`✔ Seeded ${RPG_TOPICS.length} Word RPG dungeons with ${rpgMonstersAdded} monsters`);

  let wordTrainRoundsAdded = 0;
  for (const [order, t] of WORD_TRAIN_TOPICS.entries()) {
    const topic = await prisma.wordTrainTopic.upsert({
      where: { key: t.key },
      update: {},
      create: { key: t.key, name: t.name, color: t.color, order },
    });
    const existingRounds = await prisma.wordTrainRound.count({ where: { topicId: topic.id } });
    if (existingRounds === 0) {
      await prisma.wordTrainRound.createMany({
        data: t.rounds.map((r, roundOrder) => ({
          topicId: topic.id,
          kind: r.kind,
          vi: r.vi,
          ja: r.ja,
          ko: r.ko,
          data: r.kind === "fill" ? { word: r.word, blankIndex: r.blankIndex, options: r.options } : { words: r.words },
          order: roundOrder,
        })),
      });
      wordTrainRoundsAdded += t.rounds.length;
    }
  }
  console.log(`✔ Seeded ${WORD_TRAIN_TOPICS.length} Word Train topics with ${wordTrainRoundsAdded} rounds`);

  let detectiveRoundsAdded = 0;
  for (const [order, c] of DETECTIVE_CASES.entries()) {
    const detectiveCase = await prisma.detectiveCase.upsert({
      where: { key: c.key },
      update: {},
      create: { key: c.key, name: c.name, scenario: c.scenario, scenarioVi: c.scenarioVi, scenarioJa: c.scenarioJa, scenarioKo: c.scenarioKo, color: c.color, order },
    });
    const existingRounds = await prisma.detectiveRound.count({ where: { caseId: detectiveCase.id } });
    if (existingRounds === 0) {
      await prisma.detectiveRound.createMany({
        data: c.rounds.map((r, roundOrder) => ({
          caseId: detectiveCase.id,
          kind: r.kind,
          vi: r.vi,
          ja: r.ja,
          ko: r.ko,
          data:
            r.kind === "interrogate"
              ? {
                  npcName: r.npcName,
                  npcEmoji: r.npcEmoji,
                  testimony: r.testimony,
                  testimonyVi: r.testimonyVi,
                  testimonyJa: r.testimonyJa,
                  testimonyKo: r.testimonyKo,
                  question: r.question,
                  options: r.options,
                  answerIndex: r.answerIndex,
                  clueVi: r.clueVi,
                  clueJa: r.clueJa,
                  clueKo: r.clueKo,
                }
              : { suspects: r.suspects, correctSuspect: r.correctSuspect },
          order: roundOrder,
        })),
      });
      detectiveRoundsAdded += c.rounds.length;
    }
  }
  console.log(`✔ Seeded ${DETECTIVE_CASES.length} Detective cases with ${detectiveRoundsAdded} rounds`);

  let echoParrotRoundsAdded = 0;
  for (const [order, t] of ECHO_PARROT_TOPICS.entries()) {
    const topic = await prisma.echoParrotTopic.upsert({
      where: { key: t.key },
      update: {},
      create: { key: t.key, name: t.name, color: t.color, order },
    });
    const existingRounds = await prisma.echoParrotRound.count({ where: { topicId: topic.id } });
    if (existingRounds === 0) {
      await prisma.echoParrotRound.createMany({
        data: t.rounds.map((r, roundOrder) => ({ topicId: topic.id, en: r.en, vi: r.vi, ja: r.ja, ko: r.ko, phonetic: r.phonetic, petKey: r.petKey, order: roundOrder })),
      });
      echoParrotRoundsAdded += t.rounds.length;
    }
  }
  console.log(`✔ Seeded ${ECHO_PARROT_TOPICS.length} Echo Parrot topics with ${echoParrotRoundsAdded} rounds`);

  let chatBuddyRoundsAdded = 0;
  for (const [order, t] of CHAT_BUDDY_TOPICS.entries()) {
    const topic = await prisma.chatBuddyTopic.upsert({
      where: { key: t.key },
      update: {},
      create: { key: t.key, name: t.name, color: t.color, order },
    });
    const existingRounds = await prisma.chatBuddyRound.count({ where: { topicId: topic.id } });
    if (existingRounds === 0) {
      await prisma.chatBuddyRound.createMany({
        data: t.rounds.map((r, roundOrder) => ({
          topicId: topic.id,
          data: {
            petLine: r.petLine,
            petLineVi: r.petLineVi,
            petLineJa: r.petLineJa,
            petLineKo: r.petLineKo,
            options: r.options,
            optionsVi: r.optionsVi,
            optionsJa: r.optionsJa,
            optionsKo: r.optionsKo,
            answerIndex: r.answerIndex,
            replyLine: r.replyLine,
            replyLineVi: r.replyLineVi,
            replyLineJa: r.replyLineJa,
            replyLineKo: r.replyLineKo,
          },
          order: roundOrder,
        })),
      });
      chatBuddyRoundsAdded += t.rounds.length;
    }
  }
  console.log(`✔ Seeded ${CHAT_BUDDY_TOPICS.length} Chat with Buddy topics with ${chatBuddyRoundsAdded} rounds`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
