import { useEffect, useState } from "react";
import { api, type Parent } from "../lib/api";
import { tokenStorage } from "../lib/tokenStorage";
import AdminLogin from "./AdminLogin";
import BattlePassPage from "./pages/BattlePassPage";
import ItemsPage from "./pages/ItemsPage";
import LessonsPage from "./pages/LessonsPage";
import MiniGamePage from "./pages/MiniGamePage";
import PetsPage from "./pages/PetsPage";
import QuestsPage from "./pages/QuestsPage";
import ShopPackagesPage from "./pages/ShopPackagesPage";
import StoriesPage from "./pages/StoriesPage";
import UsersPage from "./pages/UsersPage";
import WordCatchPage from "./pages/WordCatchPage";

type Tab = "users" | "lessons" | "pets" | "items" | "quests" | "battlepass" | "packages" | "stories" | "minigame" | "wordcatch";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "users", label: "Người dùng", icon: "👤" },
  { id: "lessons", label: "Bài học", icon: "📚" },
  { id: "stories", label: "Truyện", icon: "📖" },
  { id: "minigame", label: "Memory Match", icon: "🧠" },
  { id: "wordcatch", label: "Word Catch", icon: "🎣" },
  { id: "pets", label: "Pet", icon: "🐾" },
  { id: "items", label: "Vật phẩm", icon: "🎒" },
  { id: "quests", label: "Nhiệm vụ", icon: "🎯" },
  { id: "battlepass", label: "Battle Pass", icon: "🏆" },
  { id: "packages", label: "Gói vật phẩm", icon: "💰" },
];

type AuthState = "checking" | "loggedOut" | "loggedIn";

export default function AdminApp() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [admin, setAdmin] = useState<Parent | null>(null);
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    (async () => {
      if (!tokenStorage.getAccess()) {
        setAuth("loggedOut");
        return;
      }
      try {
        const { parent } = await api.me();
        if (parent.role !== "ADMIN") {
          tokenStorage.clear();
          setAuth("loggedOut");
          return;
        }
        setAdmin(parent);
        setAuth("loggedIn");
      } catch {
        tokenStorage.clear();
        setAuth("loggedOut");
      }
    })();
  }, []);

  function handleLogout() {
    tokenStorage.clear();
    setAdmin(null);
    setAuth("loggedOut");
  }

  if (auth === "checking") {
    return <div className="grid min-h-dvh place-items-center bg-cream text-ink/50">Đang tải…</div>;
  }
  if (auth === "loggedOut" || !admin) {
    return (
      <AdminLogin
        onLoggedIn={(parent) => {
          setAdmin(parent);
          setAuth("loggedIn");
        }}
      />
    );
  }

  return (
    <div className="flex min-h-dvh bg-cream text-ink">
      <aside className="flex w-60 shrink-0 flex-col gap-1 border-r border-line bg-white p-4">
        <div className="mb-4 font-baloo text-xl font-extrabold">
          Pet<span className="text-brand-orange">lin</span>
          <span className="text-brand-teal">go</span>
          <span className="ml-1.5 align-middle text-[11px] font-bold text-ink/40">ADMIN</span>
        </div>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-[#FFF1DE] text-[#C7551A]" : "text-ink/70 hover:bg-cream"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
        <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4 text-xs text-ink/50">
          <div className="truncate" title={admin.email}>
            {admin.email}
          </div>
          <div className="flex flex-col gap-1.5">
            <a href="/" className="text-brand-blue hover:underline">
              ← Mở app học
            </a>
            <button onClick={handleLogout} className="w-fit text-left text-[#B3402F] hover:underline">
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {tab === "users" && <UsersPage currentUserId={admin.id} />}
        {tab === "lessons" && <LessonsPage />}
        {tab === "stories" && <StoriesPage />}
        {tab === "minigame" && <MiniGamePage />}
        {tab === "wordcatch" && <WordCatchPage />}
        {tab === "pets" && <PetsPage />}
        {tab === "items" && <ItemsPage />}
        {tab === "quests" && <QuestsPage />}
        {tab === "battlepass" && <BattlePassPage />}
        {tab === "packages" && <ShopPackagesPage />}
      </main>
    </div>
  );
}
