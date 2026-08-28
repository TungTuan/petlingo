export type HomeBackgroundId = "garden" | "sunset" | "cherry" | "snow" | "magic" | "underwater" | "sky" | "candy";
export type HomeWeatherMode = "none" | "rain" | "snow";

export interface HomeCustomization {
  backgroundId: HomeBackgroundId;
  weather: HomeWeatherMode;
}

export interface HomeBackgroundDefinition {
  id: HomeBackgroundId;
  itemKey: string | null;
  name: string;
  icon: string;
  description: string;
  previewClass: string;
  overlay: string;
}

export const DEFAULT_HOME_CUSTOMIZATION: HomeCustomization = {
  backgroundId: "garden",
  weather: "none",
};

export const HOME_BACKGROUNDS: HomeBackgroundDefinition[] = [
  { id: "garden", itemKey: null, name: "Vườn Buddy", icon: "🌿", description: "Khu vườn thân quen", previewClass: "home-bg-garden", overlay: "linear-gradient(180deg,rgba(27,91,151,.08),transparent 32%,rgba(23,68,42,.08))" },
  { id: "sunset", itemKey: "background-hoang-hon", name: "Lâu đài hoàng hôn", icon: "🏰", description: "Vương quốc vàng trên đồi", previewClass: "home-bg-sunset", overlay: "linear-gradient(180deg,rgba(255,126,70,.08),transparent 52%,rgba(84,45,100,.08))" },
  { id: "cherry", itemKey: "background-hoa-anh-dao", name: "Thung lũng hoa", icon: "🌸", description: "Cổng trăng và suối mơ", previewClass: "home-bg-cherry", overlay: "linear-gradient(180deg,rgba(255,174,211,.06),transparent 55%,rgba(246,111,173,.05))" },
  { id: "snow", itemKey: "background-lang-tuyet", name: "Làng tuyết", icon: "❄️", description: "Lâu đài băng xanh biếc", previewClass: "home-bg-snow", overlay: "linear-gradient(180deg,rgba(214,245,255,.08),transparent 55%,rgba(170,224,245,.06))" },
  { id: "magic", itemKey: "background-rung-phep-thuat", name: "Lâu đài huyền ảo", icon: "🔮", description: "Rừng trăng tím ma mị", previewClass: "home-bg-magic", overlay: "radial-gradient(circle at 50% 38%,rgba(143,246,255,.07),transparent 28%),linear-gradient(180deg,rgba(70,44,132,.08),transparent 52%,rgba(32,95,82,.08))" },
  { id: "underwater", itemKey: "background-cung-dien-bien", name: "Cung điện đại dương", icon: "🫧", description: "Vương quốc ngọc trai", previewClass: "home-bg-underwater", overlay: "linear-gradient(180deg,rgba(52,224,255,.06),transparent 52%,rgba(21,105,151,.08))" },
  { id: "sky", itemKey: "background-dao-tren-may", name: "Đảo bay trên mây", icon: "🌈", description: "Cầu vồng giữa tầng không", previewClass: "home-bg-sky", overlay: "linear-gradient(180deg,rgba(255,224,150,.05),transparent 58%,rgba(95,190,255,.05))" },
  { id: "candy", itemKey: "background-vuong-quoc-keo", name: "Vương quốc kẹo", icon: "🍭", description: "Lâu đài bánh ngọt", previewClass: "home-bg-candy", overlay: "linear-gradient(180deg,rgba(255,174,217,.05),transparent 55%,rgba(255,153,190,.06))" },
];

export function loadHomeCustomization(childId: string): HomeCustomization {
  try {
    const value = JSON.parse(localStorage.getItem(`petlingo.homeCustomization.${childId}`) ?? "null") as Partial<HomeCustomization> | null;
    if (!value) return DEFAULT_HOME_CUSTOMIZATION;
    return {
      backgroundId: HOME_BACKGROUNDS.some((bg) => bg.id === value.backgroundId) ? value.backgroundId! : "garden",
      weather: value.weather === "rain" || value.weather === "snow" ? value.weather : "none",
    };
  } catch {
    return DEFAULT_HOME_CUSTOMIZATION;
  }
}

export function saveHomeCustomization(childId: string, value: HomeCustomization) {
  localStorage.setItem(`petlingo.homeCustomization.${childId}`, JSON.stringify(value));
}
