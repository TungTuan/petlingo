import { TabBar, type TabDef } from "./ui";
import type { NavTab } from "../types/nav";
import { Backpack, BookOpen, Ellipsis, House, PawPrint, Store } from "lucide-react";

const iconProps = { size: 25, strokeWidth: 2.6 } as const;

const TABS: (TabDef & { key: NavTab })[] = [
  { key: "Home", label: "Home", color: "#F5822B", icon: <House {...iconProps} /> },
  { key: "Game", label: "Học tập", color: "#38BFC4", icon: <BookOpen {...iconProps} /> },
  { key: "Pets", label: "Pets", color: "#F0779B", icon: <PawPrint {...iconProps} /> },
  { key: "Bag", label: "Bag", color: "#6689E8", icon: <Backpack {...iconProps} /> },
  { key: "Shop", label: "Shop", color: "#E9A91D", icon: <Store {...iconProps} /> },
  { key: "More", label: "More", color: "#8C9BAE", icon: <Ellipsis {...iconProps} /> },
];

export default function BottomTabs({ active, onChange, className = "" }: { active: NavTab; onChange: (tab: NavTab) => void; className?: string }) {
  const index = TABS.findIndex((t) => t.key === active);
  return <TabBar tabs={TABS} active={index} onChange={(i) => onChange(TABS[i]!.key)} className={className} />;
}
