/**
 * WebSocket hook for tracking Minecraft bot positions in real-time.
 *
 * Connects to /ws/minecraft, subscribes to specified botIds,
 * and maintains a Map of botId -> BotState.
 */

import { useCallback, useState, useEffect } from "react";
import { useWebSocket } from "./use-websocket";
import type { BotState, WsServerMessage } from "@/types/bot";

export function useBotPositions(botIds: string[]) {
  const [bots, setBots] = useState<Map<string, BotState>>(new Map());

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
    enabled: botIds.length > 0,
    onMessage: handleMessage,
  });

  // Subscribe to bot IDs when connected
  useEffect(() => {
    if (status === "connected" && botIds.length > 0) {
      send({ type: "subscribe", botIds });
    }
  }, [status, botIds, send]);

  // Clear state when bot IDs change
  useEffect(() => {
    setBots(new Map());
  }, [botIds.join(",")]);

  return { status, bots };
}
