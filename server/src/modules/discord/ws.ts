/**
 * WebSocket controller for real-time Discord event streaming.
 *
 * Clients connect to /ws/discord, subscribe to guild-scoped events,
 * and receive server-pushed updates about voice state changes,
 * speaking activity, and bot status.
 *
 * Follows the same connection-tracking pattern as the Minecraft WS
 * controller (server/src/modules/minecraft/ws.ts).
 */

import { Elysia, t } from "elysia";
import { DiscordWsClientMessageModel } from "./model";
import {
  discordEvents,
  DiscordEventBroadcaster,
  type DiscordEventMap,
} from "./events/event-broadcaster";

// ---------------------------------------------------------------------------
// Connection tracking
// ---------------------------------------------------------------------------

interface WsConnection {
  /** Guild IDs this client is subscribed to. */
  subscribedGuildIds: Set<string>;
  /** The ws object reference for sending messages. */
  ws: unknown;
}

/** All active WebSocket connections. */
const connections = new Map<string, WsConnection>();

/** Generate a unique connection ID. */
let connectionCounter = 0;
function nextConnectionId(): string {
  connectionCounter += 1;
  return `ws-discord-${connectionCounter}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Broadcast helpers
// ---------------------------------------------------------------------------

/**
 * Send a message to all connections subscribed to a specific guild.
 */
function broadcastToGuildSubscribers(
  guildId: string,
  message: Record<string, unknown>,
): void {
  for (const [, conn] of connections) {
    if (conn.subscribedGuildIds.has(guildId)) {
      try {
        (conn.ws as { send: (data: unknown) => void }).send(message);
      } catch {
        // Connection may have closed; cleaned up on close event
      }
    }
  }
}

/**
 * Send a message to all connected clients (guild-independent events).
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
// Event forwarding from DiscordEventBroadcaster → WebSocket clients
// ---------------------------------------------------------------------------

/** Helper to set up forwarding for guild-scoped events. */
function forwardGuildEvent<K extends keyof DiscordEventMap>(event: K): void {
  discordEvents.onEvent(event, (data) => {
    const guildId = (data as Record<string, unknown>).guildId as string | undefined;
    const wsMessage = DiscordEventBroadcaster.toWsMessage(event, data);

    if (guildId) {
      broadcastToGuildSubscribers(guildId, wsMessage as unknown as Record<string, unknown>);
    } else {
      broadcastToAll(wsMessage as unknown as Record<string, unknown>);
    }
  });
}

// Forward all guild-scoped events
forwardGuildEvent("voice-joined");
forwardGuildEvent("voice-left");
forwardGuildEvent("speaking-started");
forwardGuildEvent("speaking-ended");
forwardGuildEvent("error");

// Bot status is broadcast to all clients regardless of guild subscription
discordEvents.onEvent("bot-status-changed", (data) => {
  const wsMessage = DiscordEventBroadcaster.toWsMessage("bot-status-changed", data);
  broadcastToAll(wsMessage as unknown as Record<string, unknown>);
});

// ---------------------------------------------------------------------------
// WebSocket Elysia Plugin
// ---------------------------------------------------------------------------

export const discordWs = new Elysia({
  name: "Discord.WebSocket",
}).ws("/ws/discord", {
  body: DiscordWsClientMessageModel,
  response: t.Unknown(),

  open(ws) {
    const connId = nextConnectionId();
    (ws.data as Record<string, unknown>).__connId = connId;

    connections.set(connId, {
      subscribedGuildIds: new Set(),
      ws,
    });

    console.log(
      `[Discord WS] Client connected (${connId}). Total: ${connections.size}`,
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
        conn.subscribedGuildIds.add(body.guildId);
        ws.send({
          type: "pong",
        });
        console.log(
          `[Discord WS] ${connId} subscribed to guild ${body.guildId}`,
        );
        break;
      }

      case "unsubscribe": {
        conn.subscribedGuildIds.delete(body.guildId);
        console.log(
          `[Discord WS] ${connId} unsubscribed from guild ${body.guildId}`,
        );
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
      `[Discord WS] Client disconnected (${connId}). Total: ${connections.size}`,
    );
  },
});

/** Expose connection count for health checks. */
export function getDiscordWsConnectionCount(): number {
  return connections.size;
}
