/**
 * React hook wrapping WebSocketManager for component lifecycle.
 *
 * Connects on mount, disconnects on unmount, exposes status and send.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { WebSocketManager } from "@/lib/api/websocket";

export type WsStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

export interface UseWebSocketOptions {
  /** WebSocket path, e.g. "/ws/tests" */
  path: string;
  /** Whether to connect immediately (default true) */
  enabled?: boolean;
  /** Called for every parsed message */
  onMessage?: (message: unknown) => void;
}

export function useWebSocket({ path, enabled = true, onMessage }: UseWebSocketOptions) {
  const [status, setStatus] = useState<WsStatus>("disconnected");
  const managerRef = useRef<WebSocketManager | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled) {
      setStatus("disconnected");
      return;
    }

    const manager = new WebSocketManager(path);
    managerRef.current = manager;

    const unsubscribe = manager.subscribe((msg) => {
      onMessageRef.current?.(msg);
    });

    // Poll connection status since WebSocketManager doesn't expose callbacks
    const statusInterval = setInterval(() => {
      setStatus(manager.connected ? "connected" : "reconnecting");
    }, 1000);

    setStatus("connecting");
    manager.connect();

    return () => {
      clearInterval(statusInterval);
      unsubscribe();
      manager.disconnect();
      managerRef.current = null;
      setStatus("disconnected");
    };
  }, [path, enabled]);

  const send = useCallback((message: unknown) => {
    managerRef.current?.send(message);
  }, []);

  return { status, send };
}
