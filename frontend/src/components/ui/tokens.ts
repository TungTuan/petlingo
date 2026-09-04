export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";
export type Currency = "coin" | "gem";

/** Must match backend's petStats.service.ts MAX_PET_LEVEL exactly — used by
 * PetCollection.tsx's "Phối pet" fusion panel to know which owned pets
 * qualify as fusion material (see petFusion.service.ts). */
export const MAX_PET_LEVEL = 30;

/** Pet có cánh/khả năng bay — chỉ nhóm này được hover nhẹ ở max level. */
export const FLYING_PET_IDS = new Set([
  "kiwi", "rosie", "sprout", "angel", "nocty", "papillon",
  "frostwing", "prism", "blaze", "umbra", "void", "ember",
]);

export type PetCuteMotion = "tilt" | "hop" | "wiggle" | "stretch";

/** Tính cách chuyển động ở max level cho pet không bay. Buddy dùng WebP riêng. */
export const PET_CUTE_MOTION: Record<string, PetCuteMotion> = {
  mimi: "tilt", coco: "tilt", milky: "tilt", smokey: "tilt", pepper: "tilt", misty: "tilt", lila: "tilt", sia: "tilt", mystic: "tilt",
  biscuit: "wiggle", cocoa: "wiggle", waffle: "wiggle", nimbus: "wiggle", bamboo: "wiggle", berry: "wiggle", glacio: "wiggle",
  poppy: "hop", snowy: "hop", ducky: "hop", frosty: "hop", kiwi: "hop",
  leo: "stretch", stripe: "stretch", ellie: "stretch", sunny: "stretch", gargo: "stretch", stella: "stretch", aqua: "stretch",
  maru: "wiggle", dori: "hop", kitsune: "tilt", haetae: "stretch",
};

export const RARITY: Record<Rarity, { tint: string; slot: string; price: number; currency: Currency }> = {
  // Common pets are free in the backend catalog/seed. Keeping a client-only
  // price here made Pet Collection block a purchase the server considers free.
  Common: { tint: "#8FA8C8", slot: "#F5EBD8", price: 100, currency: "coin" },
  Rare: { tint: "#5C9BD6", slot: "#E9F1FA", price: 500, currency: "coin" },
  Epic: { tint: "#9B7EDE", slot: "#F2EBFB", price: 300, currency: "gem" },
  Legendary: { tint: "#E8A22B", slot: "#FDF3DE", price: 999, currency: "gem" },
};

export interface PetDef {
  name: string;
  id: string;
  species: string;
  rarity: Rarity;
  tint: string;
  slot: string;
  price: number;
  currency: Currency;
}

const PET_DATA: [string, string, string, Rarity][] = [
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

export const PETS: PetDef[] = PET_DATA.map(([name, id, species, rarity]) => ({
  name,
  id,
  species,
  rarity,
  ...RARITY[rarity],
}));

export const petSrc = (id: string) => `/pets/${id}.webp`;
