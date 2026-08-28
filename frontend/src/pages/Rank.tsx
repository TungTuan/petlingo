import { useEffect, useState } from "react";
import { BackIcon } from "../components/ui";
import { api, type Child, type LeaderboardEntry, type MyRank } from "../lib/api";
import { useT } from "../lib/i18n";

interface RankProps {
  child: Child;
  onExit: () => void;
  onStudyMore: () => void;
}

const PODIUM_HEIGHT = ["132px", "150px", "124px"];
const PODIUM_PET_SIZE = ["116px", "146px", "96px"];

/**
 * Rank / Leaderboard — "Đường đua Hạng". Every rating point here comes from
 * real Đấu trường (fight room) matches (see backend's services/fight/rank.ts
 * for the scoring math); there is no separate XP or weekly-reset system, so
 * unlike the old mocked design this has no tabs/timers, just a persistent
 * ladder that only moves when a child actually plays a match.
 */
export default function Rank({ child, onExit, onStudyMore }: RankProps) {
  const t = useT();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getLeaderboard(), api.getMyRank(child.id)])
      .then(([lb, rank]) => {
        if (cancelled) return;
        setLeaderboard(lb.leaderboard);
        setMyRank(rank);
      })
      .catch(() => !cancelled && setError(t("Không tải được bảng xếp hạng, thử lại sau nhé.")));
    return () => {
      cancelled = true;
    };
  }, [child.id, t]);

  const podium = leaderboard?.slice(0, 3) ?? [];
  // Center podium display order: 2nd - 1st - 3rd, matching the old visual layout.
  const podiumOrder = podium.length === 3 ? [podium[1]!, podium[0]!, podium[2]!] : podium;
  const rest = leaderboard?.slice(3) ?? [];

  return (
    <div className="flex h-full flex-col bg-[#F7F4EE]">
      <div className="flex items-center gap-3.5 border-b-[3px] border-[#EADAB8] bg-gradient-to-b from-[#FFE9C9] to-[#FFF6E6] p-4">
        <button onClick={onExit} className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#5C7BC9] shadow-[0_4px_0_#43609F]">
          <BackIcon />
        </button>
        <div className="flex flex-col">
          <span className="font-baloo text-[25px] font-extrabold">{t("Đường đua Hạng")}</span>
          <span className="font-baloo text-[12.5px] font-semibold text-[#8A7A62]">{t("Thắng trận Đấu trường để leo hạng")}</span>
        </div>
        <div className="flex-1" />
        {myRank?.hasPlayed && (
          <div className="flex items-center gap-2 rounded-full bg-white px-4.5 py-2.5 font-baloo text-[15.5px] font-extrabold shadow-[0_3px_0_#E3CFA8]" style={{ color: myRank.tier.color }}>
            {t(myRank.tier.name)}
          </div>
        )}
      </div>

      {error && <div className="p-5 font-baloo text-sm font-bold text-[#B3402F]">{error}</div>}

      {!error && !leaderboard && <div className="flex flex-1 items-center justify-center font-baloo text-base font-bold text-[#8A7A62]">{t("Đang tải...")}</div>}

      {!error && leaderboard && (
        <div className="flex flex-1 gap-5 overflow-hidden p-5">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {leaderboard.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="font-baloo text-lg font-extrabold text-[#8A7A62]">{t("Chưa có ai leo hạng cả!")}</div>
                <div className="max-w-xs font-baloo text-sm font-semibold text-[#A2947C]">{t("Thắng một trận Đấu trường để trở thành người đầu tiên xuất hiện ở đây.")}</div>
              </div>
            ) : (
              <>
                {podium.length === 3 && (
                  <div className="flex items-end justify-center gap-4 py-1.5">
                    {podiumOrder.map((entry) => {
                      const rank = entry.rank;
                      const pos = rank === 1 ? 1 : rank === 2 ? 0 : 2;
                      return (
                        <div key={entry.childId} className="flex flex-col items-center gap-2" style={{ width: rank === 1 ? "190px" : "166px" }}>
                          <img
                            src={`/pets/${entry.avatarId}.png`}
                            alt=""
                            className="object-contain"
                            style={{ width: PODIUM_PET_SIZE[pos], height: PODIUM_PET_SIZE[pos], animation: `bob ${rank === 1 ? "3.2s" : rank === 2 ? "3.6s" : "4s"} ease-in-out infinite` }}
                          />
                          <div
                            className="flex w-full flex-col items-center gap-1 rounded-t-[18px] p-3"
                            style={{ background: rank === 1 ? "#FFF1DE" : "#fff", borderWidth: 3, borderStyle: "solid", borderColor: rank === 1 ? "#F5C88F" : "#EBD9B8", height: PODIUM_HEIGHT[pos], boxSizing: "border-box" }}
                          >
                            <span className="animate-pulse-soft grid h-[34px] w-[34px] place-items-center rounded-full font-baloo text-[17px] font-extrabold text-white shadow-[0_3px_0_rgba(0,0,0,.16)]" style={{ background: entry.tier.color }}>
                              {rank}
                            </span>
                            <span className="font-baloo text-base font-extrabold">{entry.displayName}</span>
                            <span className="font-baloo text-[15px] font-extrabold" style={{ color: entry.tier.color }}>
                              {entry.rating} {t("điểm")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
                  {(podium.length === 3 ? rest : leaderboard).map((entry) => {
                    const mine = entry.childId === child.id;
                    return (
                      <div
                        key={entry.childId}
                        className="flex items-center gap-3.5 rounded-[18px] border-[3px] px-4.5 py-3"
                        style={{ background: mine ? "#FFF1DE" : "#fff", borderColor: mine ? "#F5822B" : "#EBD9B8", boxShadow: `0 4px 0 ${mine ? "#EFBA76" : "#EADAB8"}` }}
                      >
                        <span className="w-8.5 text-center font-baloo text-[17px] font-extrabold text-[#8A7A62]">{entry.rank}</span>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: mine ? "#FFE9C9" : "#F7F0E2" }}>
                          <img src={`/pets/${entry.avatarId}.png`} alt="" className="h-4/5 w-4/5 object-contain" />
                        </span>
                        <div className="flex-1">
                          <div className="font-baloo text-[16.5px] font-extrabold">{entry.displayName}</div>
                          <div className="font-baloo text-[12.5px] font-semibold" style={{ color: entry.tier.color }}>
                            {t(entry.tier.name)}
                          </div>
                        </div>
                        <span className="font-baloo text-[17px] font-extrabold text-[#3E7FB0]">
                          {entry.rating} {t("điểm")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex w-[280px] flex-col gap-4">
            <div className="flex flex-col gap-2.5 rounded-[22px] border-[3px] border-[#F5C88F] bg-[#FFF1DE] p-4.5 shadow-[0_5px_0_#EFBA76]">
              <div className="font-baloo text-lg font-extrabold text-[#C7551A]">{t("Hạng thưởng")}</div>
              <div className="font-baloo text-[13px] font-semibold leading-snug text-[#8A5A3B]">
                {t("Hạng càng cao, thắng trận Đấu trường càng được nhiều xu hơn.")}
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-[22px] border-[3px] border-line2 bg-white p-4.5 shadow-[0_5px_0_#EADAB8]">
              <div className="font-baloo text-lg font-extrabold">{t("Vị trí của")} {child.displayName}</div>
              {myRank?.hasPlayed ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-baloo text-[40px] font-extrabold leading-none text-brand-orange">#{myRank.position}</span>
                    <span className="font-baloo text-sm font-bold text-[#8A7A62]">
                      {t("trên")} {myRank.totalPlayers} {t("bạn")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-baloo text-base font-extrabold" style={{ color: myRank.tier.color }}>
                    {t(myRank.tier.name)} · {myRank.rating} {t("điểm")}
                  </div>
                  {myRank.nextTier && (
                    <>
                      <div className="h-3.5 overflow-hidden rounded-full bg-[#F1E7D3]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round(((myRank.rating - myRank.tier.min) / (myRank.nextTier.min - myRank.tier.min)) * 100))}%`,
                            background: myRank.nextTier.color,
                          }}
                        />
                      </div>
                      <div className="font-baloo text-[13px] font-semibold leading-snug text-[#6E6047]">
                        {t("Còn")} {Math.max(0, myRank.nextTier.min - myRank.rating)} {t("điểm nữa để lên hạng")} {t(myRank.nextTier.name)}.
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="font-baloo text-[13px] font-semibold leading-snug text-[#6E6047]">{t("Chưa có hạng — hãy đấu 1 trận ở Đấu trường để bắt đầu leo hạng nhé!")}</div>
              )}
              <button
                onClick={onStudyMore}
                className="rounded-2xl bg-brand-orange py-3.5 font-baloo text-base font-extrabold text-white shadow-[0_5px_0_#C9631A] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#C9631A]"
              >
                {t("Học thêm 1 bài")}
              </button>
            </div>
            <div className="mt-auto font-mono text-[10.5px] leading-relaxed text-[#A2947C]">{t("Toàn bộ trẻ trong app đều thấy bảng này. Tên hiển thị do phụ huynh đặt.")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
