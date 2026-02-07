/**
 * Event broadcaster for Discord module.
 *
 * Centralises all WebSocket event emission so that the service layer,
 * voice manager, and connection manager can broadcast events without
 * importing the WebSocket controller directly.
 *
 * Uses Node EventEmitter internally. The WS controller subscribes to
 * these events and fans them out to connected clients by guild.
 */

import { EventEmitter } from "node:events";
import type {
  DiscordBotStatus,
  DiscordWsServerMessage,
} from "../types";

// ---------------------------------------------------------------------------
// Typed event map
// ---------------------------------------------------------------------------

export interface DiscordEventMap {
  /** Bot connected to a voice channel. */
  "voice-joined": { guildId: string; channelId: string };
  /** Bot left a voice channel. */
  "voice-left": { guildId: string };
  /** An agent (or the bot) started speaking. */
  "speaking-started": { guildId: string; agentId: string; text: string };
  /** An agent (or the bot) finished speaking. */
  "speaking-ended": { guildId: string; agentId: string; durationMs: number };
  /** The bot's top-level status changed. */
  "bot-status-changed": { status: DiscordBotStatus };
  /** A non-fatal error that clients should know about. */
  "error": { guildId?: string; message: string; code?: string };
}

// ---------------------------------------------------------------------------
// Broadcaster singleton
// ---------------------------------------------------------------------------

export class DiscordEventBroadcaster extends EventEmitter {
  /** Emit a typed Discord event. */
  emitEvent<K extends keyof DiscordEventMap>(
    event: K,
    data: DiscordEventMap[K],
  ): void {
    this.emit(event, data);
  }

  /** Subscribe to a typed Discord event. */
  onEvent<K extends keyof DiscordEventMap>(
    event: K,
    listener: (data: DiscordEventMap[K]) => void,
  ): this {
    this.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /** Unsubscribe from a typed Discord event. */
  offEvent<K extends keyof DiscordEventMap>(
    event: K,
    listener: (data: DiscordEventMap[K]) => void,
  ): this {
    this.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Convert an internal event payload to the wire-format DiscordWsServerMessage.
   */
  static toWsMessage<K extends keyof DiscordEventMap>(
    event: K,
    data: DiscordEventMap[K],
  ): DiscordWsServerMessage {
    switch (event) {
      case "voice-joined": {
        const d = data as DiscordEventMap["voice-joined"];
        return { type: "voice-joined", guildId: d.guildId, channelId: d.channelId };
      }
      case "voice-left": {
        const d = data as DiscordEventMap["voice-left"];
        return { type: "voice-left", guildId: d.guildId };
      }
      case "speaking-started": {
        const d = data as DiscordEventMap["speaking-started"];
        return { type: "speaking-started", guildId: d.guildId, agentId: d.agentId, text: d.text };
      }
      case "speaking-ended": {
        const d = data as DiscordEventMap["speaking-ended"];
        return { type: "speaking-ended", guildId: d.guildId, agentId: d.agentId, durationMs: d.durationMs };
      }
      case "bot-status-changed": {
        const d = data as DiscordEventMap["bot-status-changed"];
        return { type: "bot-status-changed", status: d.status };
      }
      case "error": {
        const d = data as DiscordEventMap["error"];
        return { type: "error", message: d.message, code: d.code };
      }
      default:
        return { type: "error", message: `Unknown event: ${event as string}` };
    }
  }
}

/** Singleton broadcaster for the Discord module. */
export const discordEvents = new DiscordEventBroadcaster();
