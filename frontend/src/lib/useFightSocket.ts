import { useEffect, useRef, useState } from "react";
import { API_URL, type RankTier } from "./api";
import { tokenStorage } from "./tokenStorage";

/**
 * The live half of a fight room — everything that happens after both kids
 * are in the room, over one WebSocket connection instead of polling (see
 * backend's services/fight/liveRoomManager.ts for the server side of this
 * same protocol). REST (lib/api.ts's createFightRoom/joinFightRoom) only
 * covers getting INTO a room; this hook takes over from there.
 */

export interface RosterPlayer {
  childId: string;
  displayName: string;
  avatarId: string;
  connected: boolean;
}

export interface FightQuestion {
  questionId: string;
  index: number;
  total: number;
  prompt: string;
  hint: string;
  options: string[];
  seconds: number;
}

export interface FightRoundResult {
  index: number;
  correctAnswer: string;
  roundWinnerChildId: string | null;
  scores: Record<string, number>;
}

export interface FightMatchEnd {
  winnerChildId: string | null;
  scores: Record<string, number>;
  rewardCoins: number;
  /** Rating delta per childId — only populated for a room that ends up with EXACTLY 2 players (empty for a 3-10 player room or a draw). */
  ratingChanges: Record<string, number>;
  newRatings: Record<string, number>;
  tiers: Record<string, RankTier>;
}

type ConnStatus = "connecting" | "open" | "closed" | "error";

export function useFightSocket(code: string | null, childId: string | null) {
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [matchStarted, setMatchStarted] = useState(false);
  const [matchStartingIn, setMatchStartingIn] = useState<number | null>(null);
  const [question, setQuestion] = useState<FightQuestion | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [roundResult, setRoundResult] = useState<FightRoundResult | null>(null);
  const [matchEnd, setMatchEnd] = useState<FightMatchEnd | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState("");
  /** Set while at most 1 opponent is left connected mid-match — see backend's
   * liveRoomManager.ts handleDisconnect(). Cleared once they reconnect, or by
   * `match_end` (own effect clears it too, belt-and-suspenders) once the grace
   * period actually runs out and the match gets forfeited. */
  const [reconnectGrace, setReconnectGrace] = useState<{ childId: string; graceSeconds: number } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!code || !childId) return;
    const token = tokenStorage.getAccess();
    const wsUrl = `${API_URL.replace(/^http/, "ws")}/fight/rooms/${code}/ws?childId=${encodeURIComponent(childId)}&token=${encodeURIComponent(token ?? "")}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => setStatus("open");
    ws.onerror = () => setStatus("error");
    ws.onclose = () => setStatus("closed");
    ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }
      switch (msg.type) {
        case "joined":
          setIsHost(!!msg.isHost);
          setMatchStarted(!!msg.started);
          setScores((msg.scores as Record<string, number>) ?? {});
          break;
        case "roster":
          setRoster((msg.players as RosterPlayer[]) ?? []);
          setMatchStarted(!!msg.started);
          break;
        case "match_starting":
          setMatchStartingIn(msg.seconds as number);
          break;
        case "question":
          setMatchStartingIn(null);
          setLastAnswerCorrect(null);
          setRoundResult(null);
          setQuestion(msg as unknown as FightQuestion);
          break;
        case "answer_ack":
          setLastAnswerCorrect(!!msg.correct);
          break;
        case "round_result":
          setRoundResult(msg as unknown as FightRoundResult);
          setScores((msg.scores as Record<string, number>) ?? {});
          break;
        case "match_end":
          // Clearing `question` here matters: FightRoom.tsx flips to the
          // "battle" phase whenever it sees a truthy `question`, and this
          // was the very last one broadcast — left in place, it would race
          // the "flip to result" effect and immediately bounce the UI back
          // to the battle screen the instant match_end set phase to "result".
          setQuestion(null);
          setMatchEnd(msg as unknown as FightMatchEnd);
          setScores((msg.scores as Record<string, number>) ?? {});
          setReconnectGrace(null);
          break;
        case "opponent_disconnected":
          setReconnectGrace({ childId: msg.childId as string, graceSeconds: msg.graceSeconds as number });
          break;
        case "opponent_reconnected":
          setReconnectGrace(null);
          break;
        case "error":
          setErrorMessage((msg.message as string) ?? "");
          break;
      }
    };

    return () => ws.close();
  }, [code, childId]);

  // Tick the grace countdown down locally once a second — the server only
  // sends the starting `graceSeconds` once, not a message per second. Each
  // tick's state update re-triggers this effect, which schedules the next
  // one second later, until `reconnectGrace` gets cleared (reconnect/match_end).
  useEffect(() => {
    if (!reconnectGrace || reconnectGrace.graceSeconds <= 0) return;
    const timer = setTimeout(() => {
      setReconnectGrace((g) => (g ? { ...g, graceSeconds: g.graceSeconds - 1 } : g));
    }, 1000);
    return () => clearTimeout(timer);
  }, [reconnectGrace]);

  function answer(questionId: string, choice: string) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "answer", questionId, choice }));
    }
  }

  /** Host-only — kicks off the match for whoever's in the room right now. Backend ignores this from a non-host or once already started. */
  function start() {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "start" }));
    }
  }

  return { status, roster, isHost, matchStarted, matchStartingIn, question, lastAnswerCorrect, roundResult, matchEnd, scores, errorMessage, reconnectGrace, answer, start };
}
