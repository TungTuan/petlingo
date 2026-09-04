import { useState } from "react";
import { api, ApiError, type Child } from "../lib/api";
import { useLang, useT } from "../lib/i18n";
import { ShieldCheck } from "lucide-react";

interface CreateChildProps {
  onCreated: (child: Child) => Promise<void>;
}

const AVATARS = ["buddy", "mimi", "poppy", "bamboo", "stella", "ember"];
const AVATAR_NAMES_VI = ["Buddy · Chó Golden", "Mimi · Mèo cam", "Poppy · Thỏ trắng", "Bamboo · Gấu trúc", "Stella · Kỳ lân", "Ember · Rồng lửa"];
const AVATAR_NAMES_EN = ["Buddy · Golden Dog", "Mimi · Orange Cat", "Poppy · White Rabbit", "Bamboo · Panda", "Stella · Unicorn", "Ember · Fire Dragon"];
const AGES = ["4-6", "7-9", "10-12", "13+"];

/** Create child profile — matches the reference sheet's "Chọn bạn đồng hành" / "Tạo tài khoản" panel. */
export default function CreateChild({ onCreated }: CreateChildProps) {
  const t = useT();
  const { lang } = useLang();
  const [avatar, setAvatar] = useState(0);
  const [displayName, setDisplayName] = useState("Lily");
  const [age, setAge] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const avatarNames = lang === "en" ? AVATAR_NAMES_EN : AVATAR_NAMES_VI;

  const handleSubmit = async () => {
    setMsg("");
    setLoading(true);
    try {
      const { child } = await api.createChild(displayName, AVATARS[avatar]!);
      await onCreated(child);
    } catch (err) {
      setMsg(err instanceof ApiError ? t(err.message) : t("Không tạo được hồ sơ, thử lại nhé."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex w-[430px] flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#CFEAF6] to-[#DCEFC8] p-8">
        <div className="font-baloo text-[30px] font-extrabold text-ink">{t("Chọn bạn đồng hành")}</div>
        <div className="grid grid-cols-3 gap-3.5">
          {AVATARS.map((id, i) => (
            <button
              key={id}
              onClick={() => setAvatar(i)}
              className="grid h-[110px] w-[110px] place-items-center rounded-[22px] border-4"
              style={{
                borderColor: avatar === i ? "#F5822B" : "#E7D4B2",
                background: avatar === i ? "#FFF1DE" : "#FFFFFF",
                boxShadow: `0 5px 0 ${avatar === i ? "#F5822B" : "#E7D4B2"}`,
              }}
            >
              <img
                src={`/pets/${id}.webp`}
                alt={id}
                className="h-[80%] w-[80%] object-contain"
                style={avatar === i ? { animation: "bob 2.8s ease-in-out infinite" } : undefined}
              />
            </button>
          ))}
        </div>
        <div className="font-baloo text-base font-bold text-[#5A7080]">{avatarNames[avatar]}</div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-9">
        <div>
          <div className="font-baloo text-[32px] font-extrabold">{t("Tạo tài khoản")}</div>
          <div className="font-baloo text-sm font-semibold text-[#8A7A62]">{t("Dùng tên gọi ở nhà, không cần tên thật.")}</div>
        </div>

        <label className="flex flex-col gap-1.5 font-baloo text-[13px] font-bold text-[#8A7A62]">
          {t("Tên hiển thị")}
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-2xl border-[3px] border-line bg-cream-card px-4 py-3.5 font-baloo text-[17px] font-bold text-ink outline-none focus:border-brand-orange"
          />
        </label>

        <div className="flex flex-col gap-2">
          <div className="font-baloo text-[13px] font-bold text-[#8A7A62]">{t("Độ tuổi")}</div>
          <div className="flex gap-2.5">
            {AGES.map((label, i) => (
              <button
                key={label}
                onClick={() => setAge(i)}
                className="flex-1 rounded-2xl border-[3px] py-3.5 font-baloo text-[17px] font-extrabold"
                style={{
                  borderColor: age === i ? "#F5822B" : "#E7D4B2",
                  background: age === i ? "#FFF1DE" : "#FFF9EC",
                  color: age === i ? "#C7551A" : "#8A5A3B",
                  boxShadow: `0 4px 0 ${age === i ? "#F5822B" : "#E7D4B2"}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-slide-down flex items-center gap-3 rounded-[20px] border-[3px] border-[#C9E5F7] bg-[#EAF6FF] p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#5C7BC9] text-white"><ShieldCheck size={24} /></span>
          <div><div className="font-baloo text-base font-extrabold text-[#3E7FB0]">{t("Hồ sơ do phụ huynh quản lý")}</div><div className="font-baloo text-[12.5px] font-semibold leading-snug text-[#5A7080]">{t("Điều khoản và Chính sách quyền riêng tư đã được xác nhận trên tài khoản phụ huynh.")}</div></div>
        </div>

        <div className="mt-auto flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading || !displayName}
            className="rounded-[20px] bg-brand-green px-11 py-4 font-baloo text-xl font-extrabold text-white shadow-[0_6px_0_#5C9C31] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#5C9C31] disabled:opacity-50"
          >
            {loading ? t("Đang tạo...") : t("Tạo tài khoản")}
          </button>
          <div className="font-baloo text-sm font-bold text-[#8A7A62]">{msg}</div>
        </div>
      </div>
    </div>
  );
}
