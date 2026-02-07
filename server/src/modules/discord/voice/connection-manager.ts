/**
 * Voice connection manager.
 *
 * Handles joining and leaving voice channels, tracking active connections,
 * and auto-reconnecting on unexpected disconnects.
 *
 * Uses @discordjs/voice for voice channel lifecycle management.
 * Follows the disconnect handling pattern from the Discord.js guide:
 * https://discordjs.guide/voice/voice-connections.html#handling-disconnects
 */

import {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
  type VoiceConnection,
} from "@discordjs/voice";
import { discordClient } from "../client/discord-client";
import type { VoiceConnectionState } from "../types";

/** Tracks metadata about active voice connections. */
const connectionStates = new Map<string, VoiceConnectionState>();

/**
 * Join a voice channel in the specified guild.
 *
 * If the bot is already in a voice channel in this guild,
 * the connection moves to the new channel automatically.
 *
 * @param guildId - The guild (server) ID
 * @param channelId - The voice channel ID to join
 * @returns The voice connection state
 * @throws If the client is not ready or the guild is inaccessible
 */
export async function joinVoice(
  guildId: string,
  channelId: string,
): Promise<VoiceConnectionState> {
  const client = discordClient.getClient();
  const guild = client.guilds.cache.get(guildId);

  if (!guild) {
    throw new Error(`Guild "${guildId}" not found in bot's guild cache.`);
  }

  const channel = guild.channels.cache.get(channelId);

  if (!channel) {
    throw new Error(`Channel "${channelId}" not found in guild "${guildId}".`);
  }

  if (!channel.isVoiceBased()) {
    throw new Error(`Channel "${channelId}" is not a voice channel.`);
  }

  const connection = joinVoiceChannel({
    channelId,
    guildId,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false,
  });

  registerConnectionHandlers(connection, guildId, channelId);

  // Wait for the connection to become ready
  await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

  const state: VoiceConnectionState = {
    guildId,
    channelId,
    isSpeaking: false,
  };

  connectionStates.set(guildId, state);
  console.log(`[Voice] Joined channel ${channelId} in guild ${guildId}.`);

  return state;
}

/**
 * Leave the voice channel in the specified guild.
 *
 * @param guildId - The guild to disconnect from
 * @returns true if a connection was destroyed, false if none existed
 */
export function leaveVoice(guildId: string): boolean {
  const connection = getVoiceConnection(guildId);

  if (!connection) {
    connectionStates.delete(guildId);
    return false;
  }

  connection.destroy();
  connectionStates.delete(guildId);
  console.log(`[Voice] Left voice channel in guild ${guildId}.`);

  return true;
}

/**
 * Get the voice connection for a guild if one exists.
 *
 * @param guildId - The guild ID
 * @returns The VoiceConnection or null
 */
export function getConnection(guildId: string): VoiceConnection | null {
  return getVoiceConnection(guildId) ?? null;
}

/**
 * Get the tracked state of a voice connection.
 *
 * @param guildId - The guild ID
 * @returns Connection state metadata or null
 */
export function getConnectionState(guildId: string): VoiceConnectionState | null {
  return connectionStates.get(guildId) ?? null;
}

/**
 * Get all active voice connection states.
 */
export function getAllConnectionStates(): VoiceConnectionState[] {
  return Array.from(connectionStates.values());
}

/**
 * Update the speaking state for a guild's connection.
 */
export function setSpeakingState(guildId: string, isSpeaking: boolean): void {
  const state = connectionStates.get(guildId);
  if (state) {
    state.isSpeaking = isSpeaking;
  }
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

/**
 * Register disconnect and error handlers for a voice connection.
 *
 * Follows the Discord.js guide pattern for handling disconnects:
 * - On disconnect, wait 5s to see if the connection is resuming or reconnecting
 * - If it enters Signalling or Connecting, it's moving channels — let it proceed
 * - Otherwise, treat it as a real disconnect and destroy the connection
 */
function registerConnectionHandlers(
  connection: VoiceConnection,
  guildId: string,
  channelId: string,
): void {
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      // Wait to see if the connection is recovering (channel move)
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
      // Reconnecting to a new channel — nothing to do
      console.log(`[Voice] Connection in guild ${guildId} is reconnecting.`);
    } catch {
      // Real disconnect — destroy and clean up
      console.warn(`[Voice] Connection in guild ${guildId} disconnected permanently.`);
      connection.destroy();
      connectionStates.delete(guildId);
    }
  });

  connection.on("error", (error: Error) => {
    console.error(`[Voice] Connection error in guild ${guildId}:`, error.message);
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    connectionStates.delete(guildId);
    console.log(`[Voice] Connection in guild ${guildId} destroyed.`);
  });
}
