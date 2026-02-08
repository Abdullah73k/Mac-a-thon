/**
 * WebSocket hook for tracking Minecraft bot positions in real-time.
 *
 * Connects to /ws/minecraft, subscribes to specified botIds,
 * and maintains a Map of botId -> BotState.
 */

import { useCallback, useState, useEffect, useMemo } from "react";
import { useWebSocket } from "./use-websocket";
import type { BotState, WsServerMessage } from "@/types/bot";

export function useBotPositions(botIds: string[]) {
  const [bots, setBots] = useState<Map<string, BotState>>(new Map());

  // Stabilize the bot IDs key to avoid unnecessary effect re-runs
  const botIdsKey = useMemo(() => botIds.slice().sort().join(","), [botIds]);
  const hasBots = botIds.length > 0;

  const handleMessage = useCallback((raw: unknown) => {
    const msg = raw as WsServerMessage;
    if (!msg || typeof msg !== "object" || !("type" in msg)) return;

    if (msg.type === "bot-state-update") {
      setBots((prev) => {
        const next = new Map(prev);
        next.set(msg.state.botId, msg.state);
        return next;
      });
    }
  }, []);

  const { status, send } = useWebSocket({
    path: "/ws/minecraft",
    enabled: hasBots,
    onMessage: handleMessage,
  });

  // Subscribe to bot IDs when connected
  useEffect(() => {
    if (status === "connected" && hasBots) {
      send({ type: "subscribe", botIds });
    }
  }, [status, botIdsKey, hasBots, send]);

  // Clear state when bot IDs change
  useEffect(() => {
    setBots(new Map());
  }, [botIdsKey]);

  return { status, bots };
}
