import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Bird, Check, Copy, Gift, Mail, PawPrint, Send, UserPlus, Users, X } from "lucide-react";
import { BackIcon } from "../components/ui";
import PetPortrait from "../components/PetPortrait";
import { FLYING_PET_IDS, PETS } from "../components/ui/tokens";
import { api, ApiError, type FriendRanchSnapshot, type FriendSummary, type GiftMail, type InventoryEntry, type PetStatsState } from "../lib/api";
import { useT } from "../lib/i18n";

interface PetRanchProps {
  childId: string;
  owned: string[];
  petCopies: Record<string, number>;
  petEggs: Record<string, number>;
  petStatsById: Record<string, PetStatsState>;
  activePetId: string;
  onSelectActive: (id: string) => Promise<unknown>;
  onInventoryChanged: () => Promise<unknown>;
  onExit: () => void;
}

type RanchStyle = CSSProperties & { "--ranch-delay": string; "--ranch-duration": string; "--ranch-distance": string };

export default function PetRanch({ childId, owned, petCopies, petEggs, petStatsById, activePetId, onSelectActive, onInventoryChanged, onExit }: PetRanchProps) {
  const t = useT();
  const [showFriends, setShowFriends] = useState(false);
  const [visited, setVisited] = useState<FriendRanchSnapshot | null>(null);
  const displayOwned = visited?.progress.unlockedPets ?? owned;
  const displayCopies = visited?.progress.petCopies ?? petCopies;
  const displayEggs = visited?.progress.petEggs ?? petEggs;
  const displayStats = visited ? Object.fromEntries(visited.petStats.map((stats) => [stats.petKey, stats])) : petStatsById;
  const residents = displayOwned.flatMap((petId) => {
    const quantity = Math.max(1, displayCopies[petId] ?? 1);
    const eggCount = Math.min(quantity, displayEggs[petId] ?? 0);
    return Array.from({ length: quantity }, (_, copyIndex) => ({ petId, copyIndex, isEgg: (displayStats[petId]?.level ?? 1) <= 1 || copyIndex >= quantity - eggCount }));
  });
  const total = residents.length;
  const size = total <= 10 ? 84 : total <= 24 ? 66 : total <= 44 ? 54 : 44;

  return (
    <div className="relative h-full overflow-hidden bg-[#9bd970]">
      <img src="/backgrounds/pet-ranch-v1.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(30,92,117,.12),transparent_28%,rgba(48,91,28,.08))]" />
      <header className="absolute inset-x-0 top-0 z-30 flex items-center gap-3 p-4">
        <button onClick={onExit} className="grid h-12 w-12 place-items-center rounded-full border-2 border-white/80 bg-[#5C7BC9] shadow-[0_4px_0_#43609F]"><BackIcon /></button>
        <div className="rounded-[22px] border-2 border-white/80 bg-white/88 px-5 py-2 shadow-[0_5px_0_rgba(85,113,52,.24)] backdrop-blur-md">
          <div className="flex items-center gap-2 font-baloo text-[22px] font-extrabold leading-none text-[#4C3B2B]"><PawPrint size={22} className="text-[#E77849]" /> {visited ? `${t("Trang trại của")} ${visited.owner.displayName}` : t("Nông trại Pet")}</div>
          <div className="mt-1 font-baloo text-[11px] font-bold text-[#75805D]">{visited ? t("Bạn đang ghé thăm · chỉ xem") : t("Chạm vào một bạn thú để chọn làm bạn đồng hành")}</div>
        </div>
        <div className="ml-auto flex gap-2">
          <div className="flex items-center gap-2 rounded-full border-2 border-white/80 bg-white/88 px-4 py-2 font-baloo text-[13px] font-extrabold text-[#558341] shadow-sm backdrop-blur-md"><PawPrint size={17} /> {total} {t("pet")}</div>
          <div className="flex items-center gap-2 rounded-full border-2 border-white/80 bg-white/88 px-4 py-2 font-baloo text-[13px] font-extrabold text-[#4A88A1] shadow-sm backdrop-blur-md"><Bird size={17} /> {residents.filter(({ petId }) => FLYING_PET_IDS.has(petId)).length} {t("biết bay")}</div>
          <button onClick={() => visited ? setVisited(null) : setShowFriends(true)} className="flex items-center gap-2 rounded-full border-2 border-white/80 bg-[#F27A91] px-4 py-2 font-baloo text-[13px] font-extrabold text-white shadow-[0_3px_0_#C85670]"><Users size={17} /> {visited ? t("Về nhà") : t("Bạn bè")}</button>
        </div>
      </header>
      <div className="absolute inset-x-[5%] bottom-[7%] top-[20%] z-10">
        {residents.map(({ petId, copyIndex, isEgg }, index) => {
          const pet = PETS.find((entry) => entry.id === petId);
          if (!pet) return null;
          const flying = !isEgg && FLYING_PET_IDS.has(petId);
          const columns = Math.max(5, Math.ceil(Math.sqrt(Math.max(total, 1) * 1.75)));
          const row = Math.floor(index / columns);
          const col = index % columns;
          const rows = Math.max(1, Math.ceil(total / columns));
          const x = 4 + (col / Math.max(1, columns - 1)) * 88 + (row % 2) * 2.5;
          const y = flying ? 4 + ((index * 19) % 38) : 40 + (row / Math.max(1, rows - 1)) * 50;
          const style: RanchStyle = { left: `${Math.min(93, x)}%`, top: `${y}%`, width: size, height: size, "--ranch-delay": `${-(index * .83)}s`, "--ranch-duration": `${flying ? 6.5 + index % 4 : 8.5 + index % 5}s`, "--ranch-distance": `${18 + index % 4 * 7}px`, zIndex: flying ? 20 + row : 50 + row };
          const name = displayStats[petId]?.customName || pet.name;
          return (
            <button key={`${petId}-${copyIndex}`} style={style} disabled={!!visited || isEgg} onClick={() => void onSelectActive(petId)} className={`absolute -translate-x-1/2 -translate-y-1/2 ${isEgg ? "ranch-pet-egg" : `ranch-pet ${flying ? "ranch-pet-flying" : "ranch-pet-walking"}`}`} aria-label={isEgg ? `${t("Trứng")} ${name}` : `${t("Chọn")} ${name}`}>
              {!visited && petId === activePetId && copyIndex === 0 && !isEgg && <Check className="absolute -right-1 -top-2 z-20 rounded-full bg-[#FFD85A] p-1 text-[#68450A] drop-shadow-md" size={22} strokeWidth={4} />}
              <span className="ranch-pet-shadow absolute bottom-[4%] left-[14%] h-[13%] w-[72%] rounded-full bg-[#355523]/25 blur-[1px]" />
              <PetPortrait petId={petId} name={name} level={isEgg ? 1 : displayStats[petId]?.level ?? 2} animated={!isEgg} mediaAnimated className="relative z-10 h-full w-full drop-shadow-[0_4px_3px_rgba(54,61,27,.25)]" />
              <span className={`absolute -bottom-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/80 px-2 py-0.5 font-baloo text-[9px] font-extrabold shadow-sm ${petId === activePetId && copyIndex === 0 ? "bg-[#FFCF4B] text-[#68450A]" : "bg-white/86 text-[#5B4938]"}`}>{name}{copyIndex > 0 ? ` · ${copyIndex + 1}` : ""}</span>
            </button>
          );
        })}
      </div>
      {total === 0 && <div className="absolute inset-0 z-20 grid place-items-center"><div className="rounded-3xl bg-white/90 px-8 py-5 text-center font-baloo font-extrabold text-[#5B4938] shadow-xl">{t("Nông trại đang chờ những người bạn đầu tiên!")}</div></div>}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/70 bg-[#31542D]/72 px-4 py-1.5 font-baloo text-[10px] font-bold text-white backdrop-blur-sm">{t("Pet có cánh sẽ bay · Pet mặt đất sẽ dạo chơi")}</div>
      {showFriends && <FriendsPanel childId={childId} onInventoryChanged={onInventoryChanged} onClose={() => setShowFriends(false)} onVisit={(ranch) => { setVisited(ranch); setShowFriends(false); }} />}
    </div>
  );
}

function FriendsPanel({ childId, onInventoryChanged, onClose, onVisit }: { childId: string; onInventoryChanged: () => Promise<unknown>; onClose: () => void; onVisit: (ranch: FriendRanchSnapshot) => void }) {
  const t = useT();
  const [friendCode, setFriendCode] = useState("");
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"friends" | "mail">("friends");
  const [mail, setMail] = useState<GiftMail[]>([]);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [giftFriend, setGiftFriend] = useState<FriendSummary | null>(null);
  const [giftItemId, setGiftItemId] = useState("");
  const load = useCallback(() => Promise.all([api.listFriends(childId), api.listMailbox(childId), api.listInventory(childId)]).then(([result, mailbox, bag]) => { setFriendCode(result.friendCode); setFriends(result.friendships); setMail(mailbox.gifts); setInventory(bag.items); }).catch(() => setMessage(t("Không tải được bạn bè hoặc hòm thư."))), [childId, t]);
  useEffect(() => { void load(); }, [load]);
  async function requestFriend() { if (!input.trim() || busy) return; setBusy(true); try { await api.sendFriendRequest(childId, input.trim()); setInput(""); setMessage(t("Đã gửi lời mời kết bạn!")); await load(); } catch (error) { setMessage(error instanceof ApiError ? t(error.message) : t("Không gửi được lời mời.")); } finally { setBusy(false); } }
  async function accept(id: string) { await api.acceptFriendRequest(childId, id); await load(); }
  async function visit(friendId: string) { setBusy(true); try { const { ranch } = await api.visitFriendRanch(childId, friendId); onVisit(ranch); } catch (error) { setMessage(error instanceof ApiError ? t(error.message) : t("Không thể ghé thăm lúc này.")); } finally { setBusy(false); } }
  async function give() { if (!giftFriend || !giftItemId || busy) return; setBusy(true); try { const result = await api.sendGift(childId, giftFriend.friend.id, giftItemId, 1); setMessage(t(result.message)); setGiftFriend(null); setGiftItemId(""); await Promise.all([load(), onInventoryChanged()]); } catch (error) { setMessage(error instanceof ApiError ? t(error.message) : t("Không thể gửi quà lúc này.")); } finally { setBusy(false); } }
  return <div className="absolute inset-0 z-50 grid place-items-center bg-[#20351D]/45 p-6 backdrop-blur-[2px]">
    <div className="flex max-h-[84%] w-[560px] flex-col overflow-hidden rounded-[28px] border-[3px] border-white bg-[#FFF9EA] shadow-2xl">
      <div className="flex items-center gap-3 bg-[#E8F5D9] px-5 py-4"><Users className="text-[#65A947]" /><div className="font-baloo text-[22px] font-extrabold text-[#4A3B2D]">{t("Bạn bè & Hòm thư")}</div><button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white text-[#8A6B59]"><X /></button></div>
      <div className="flex gap-2 bg-[#E8F5D9] px-5 pb-3"><button onClick={() => setTab("friends")} className={`flex items-center gap-2 rounded-full px-4 py-2 font-baloo text-xs font-extrabold ${tab === "friends" ? "bg-[#65A947] text-white" : "bg-white text-[#65805A]"}`}><Users size={15}/>Bạn bè</button><button onClick={() => setTab("mail")} className={`flex items-center gap-2 rounded-full px-4 py-2 font-baloo text-xs font-extrabold ${tab === "mail" ? "bg-[#F27A91] text-white" : "bg-white text-[#8B6470]"}`}><Mail size={15}/>Hòm thư {mail.filter((g) => g.direction === "received" && !g.readAt).length > 0 && `(${mail.filter((g) => g.direction === "received" && !g.readAt).length})`}</button></div>
      {tab === "friends" && <>
      <div className="grid grid-cols-2 gap-3 border-b-2 border-dashed border-[#E6D5B8] p-4">
        <div className="rounded-2xl bg-white p-3"><div className="font-baloo text-[11px] font-bold text-[#897B6E]">{t("Mã kết bạn của bạn")}</div><button onClick={() => void navigator.clipboard.writeText(friendCode)} className="mt-1 flex w-full items-center justify-between rounded-xl bg-[#F3EAFB] px-3 py-2 font-mono text-[11px] font-bold text-[#7855A6]"><span className="truncate">{friendCode || "…"}</span><Copy size={15} /></button></div>
        <div className="rounded-2xl bg-white p-3"><div className="font-baloo text-[11px] font-bold text-[#897B6E]">{t("Nhập mã của bạn")}</div><div className="mt-1 flex gap-1"><input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Mã kết bạn")} className="min-w-0 flex-1 rounded-xl border-2 border-[#E6D5B8] px-3 font-baloo text-[11px] outline-none focus:border-[#65A947]"/><button onClick={() => void requestFriend()} disabled={busy} className="grid h-9 w-9 place-items-center rounded-xl bg-[#65A947] text-white"><UserPlus size={17}/></button></div></div>
      </div>
      {message && <div className="px-4 pt-3 font-baloo text-[11px] font-bold text-[#B0653E]">{message}</div>}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">{giftFriend && <div className="mb-3 rounded-2xl border-2 border-[#F4D7A0] bg-[#FFF5D9] p-3"><div className="mb-2 flex items-center gap-2 font-baloo text-sm font-extrabold"><Gift size={17} className="text-[#E28B31]"/>Tặng quà cho {giftFriend.friend.displayName}</div><div className="flex gap-2"><select value={giftItemId} onChange={(e) => setGiftItemId(e.target.value)} className="min-w-0 flex-1 rounded-xl border-2 border-[#E6D5B8] bg-white px-3 font-baloo text-xs font-bold"><option value="">Chọn vật phẩm…</option>{inventory.map(({item,quantity}) => <option key={item.id} value={item.id}>{item.name} · x{quantity}</option>)}</select><button onClick={() => void give()} disabled={!giftItemId || busy} className="flex items-center gap-1 rounded-xl bg-[#F27A91] px-3 py-2 font-baloo text-xs font-extrabold text-white disabled:opacity-50"><Send size={14}/>Gửi</button></div></div>}{friends.length === 0 ? <div className="py-8 text-center font-baloo font-bold text-[#9A8B78]">{t("Chưa có bạn bè. Hãy chia sẻ mã để cùng chơi!")}</div> : friends.map((entry) => <div key={entry.friendshipId} className="flex items-center gap-3 rounded-2xl border-2 border-[#EFE1C8] bg-white p-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#DDF3F1] text-xl">👧</div><div className="min-w-0 flex-1"><div className="font-baloo text-[14px] font-extrabold text-[#4A3B2D]">{entry.friend.displayName}</div><div className="font-baloo text-[10px] font-bold text-[#938574]">{entry.status === "accepted" ? t("Bạn bè") : entry.direction === "received" ? t("Muốn kết bạn với bạn") : t("Đang chờ chấp nhận")}</div></div>{entry.status === "pending" && entry.direction === "received" ? <button onClick={() => void accept(entry.friendshipId)} className="rounded-xl bg-[#65A947] px-3 py-2 font-baloo text-[11px] font-extrabold text-white">{t("Chấp nhận")}</button> : entry.status === "accepted" ? <><button onClick={() => setGiftFriend(entry)} className="grid h-8 w-8 place-items-center rounded-xl bg-[#FFF0C8] text-[#D58023]" title="Tặng quà"><Gift size={16}/></button><button onClick={() => void visit(entry.friend.id)} disabled={busy} className="rounded-xl bg-[#5C7BC9] px-3 py-2 font-baloo text-[11px] font-extrabold text-white">{t("Ghé thăm")}</button></> : null}</div>)}</div></>}
      {tab === "mail" && <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">{mail.length === 0 ? <div className="py-10 text-center font-baloo font-bold text-[#9A8B78]"><Mail className="mx-auto mb-2"/>Hòm thư chưa có quà</div> : mail.map((gift) => <div key={gift.id} className="flex items-center gap-3 rounded-2xl border-2 border-[#EFE1C8] bg-white p-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#FFF3DD]">{gift.item.imagePath ? <img src={gift.item.imagePath} alt="" className="h-10 w-10 object-contain"/> : <Gift className="text-[#E28B31]"/>}</div><div className="min-w-0 flex-1"><div className="font-baloo text-sm font-extrabold text-[#4A3B2D]">{gift.direction === "received" ? `${gift.sender.displayName} tặng bạn` : `Bạn đã tặng ${gift.receiver.displayName}`}</div><div className="font-baloo text-xs font-bold text-[#927F68]">{gift.item.name} · x{gift.quantity}</div></div><span className="text-xl">{gift.direction === "received" ? "🎁" : "💌"}</span></div>)}</div>}
    </div>
  </div>;
}
