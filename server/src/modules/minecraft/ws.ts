/**
 * WebSocket controller for real-time Minecraft bot communication.
 *
 * Uses Elysia's native `.ws()` route pattern.
 * Clients connect to /ws/minecraft, subscribe to bot state updates,
 * and can execute actions on bots through the WebSocket.
 *
 * Connection tracking uses a Set of ws references for broadcasting.
 * Each connection maintains a Set<botId> of subscriptions.
 */

import { Elysia, t } from "elysia";
import { botManager } from "./bot/bot-manager";
import { dispatchAction } from "./bot/actions/action-dispatcher";
import { WsClientMessageModel } from "./model";
import type { BotAction, BotState } from "./types";

// ---------------------------------------------------------------------------
// Connection tracking
// ---------------------------------------------------------------------------

interface WsConnection {
  /** Which bot IDs this client is subscribed to. */
  subscribedBotIds: Set<string>;
  /** The ws object reference for sending messages. */
  ws: unknown;
}

/** All active WebSocket connections. */
const connections = new Map<string, WsConnection>();

/** Generate a unique connection ID. */
let connectionCounter = 0;
function nextConnectionId(): string {
  connectionCounter += 1;
  return `ws-${connectionCounter}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Broadcast helpers
// ---------------------------------------------------------------------------

/**
 * Send a message to all connections subscribed to a specific bot.
 */
function broadcastToBotSubscribers(
  botId: string,
  message: Record<string, unknown>,
): void {
  for (const [, conn] of connections) {
    if (conn.subscribedBotIds.has(botId)) {
      try {
        (conn.ws as { send: (data: unknown) => void }).send(message);
      } catch {
        // Connection may have closed; will be cleaned up on close event
      }
    }
  }
}

/**
 * Send a message to all connected clients.
 */
function broadcastToAll(message: Record<string, unknown>): void {
  for (const [, conn] of connections) {
    try {
      (conn.ws as { send: (data: unknown) => void }).send(message);
    } catch {
      // Ignore send failures on stale connections
    }
  }
}

// ---------------------------------------------------------------------------
// BotManager event forwarding
// ---------------------------------------------------------------------------

// Forward bot state updates to subscribed WebSocket clients
botManager.on("bot-state-update", (state: BotState) => {
  broadcastToBotSubscribers(state.botId, {
    type: "bot-state-update",
    state,
  });
});

botManager.on(
  "bot-chat",
  (botId: string, username: string, message: string) => {
    broadcastToBotSubscribers(botId, {
      type: "bot-event",
      botId,
      event: "chat",
      data: { username, message },
    });
  },
);

botManager.on("bot-error", (botId: string, error: Error) => {
  broadcastToBotSubscribers(botId, {
    type: "bot-event",
    botId,
    event: "error",
    data: { message: error.message },
  });
});

// ---------------------------------------------------------------------------
// WebSocket Elysia Plugin
// ---------------------------------------------------------------------------

export const minecraftWs = new Elysia({
  name: "Minecraft.WebSocket",
}).ws("/ws/minecraft", {
  body: WsClientMessageModel,
  response: t.Unknown(),

  open(ws) {
    const connId = nextConnectionId();
    // Store connection ID on the ws data object for retrieval on close
    (ws.data as Record<string, unknown>).__connId = connId;

    connections.set(connId, {
      subscribedBotIds: new Set(),
      ws,
    });

    console.log(
      `[WS] Client connected (${connId}). Total: ${connections.size}`,
    );
  },

  message(ws, body) {
    const connId = (ws.data as Record<string, unknown>).__connId as string;
    const conn = connections.get(connId);

    if (!conn) {
      ws.send({ type: "error", message: "Connection not found" });
      return;
    }

    switch (body.type) {
      case "subscribe": {
        for (const botId of body.botIds) {
          conn.subscribedBotIds.add(botId);
          // Immediately send current state for each subscribed bot
          const state = botManager.getBotState(botId);
          if (state) {
            ws.send({ type: "bot-state-update", state });
          }
        }
        break;
      }

      case "unsubscribe": {
        for (const botId of body.botIds) {
          conn.subscribedBotIds.delete(botId);
        }
        break;
      }

      case "execute-action": {
        const action = body.action as BotAction;

        dispatchAction(action)
          .then((result) => {
            // Send result back to the requesting client
            ws.send({ type: "action-result", result });

            // Also broadcast to all subscribers of this bot
            broadcastToBotSubscribers(action.botId, {
              type: "action-result",
              result,
            });
          })
          .catch((err: unknown) => {
            const message =
              err instanceof Error ? err.message : "Unknown action error";
            ws.send({
              type: "error",
              message,
              code: "ACTION_EXECUTION_ERROR",
            });
          });
        break;
      }

      case "ping": {
        ws.send({ type: "pong" });
        break;
      }
    }
  },

  close(ws) {
    const connId = (ws.data as Record<string, unknown>).__connId as string;
    connections.delete(connId);
    console.log(
      `[WS] Client disconnected (${connId}). Total: ${connections.size}`,
    );
  },
});

/** Expose connection count for health checks. */
export function getWsConnectionCount(): number {
  return connections.size;
}
