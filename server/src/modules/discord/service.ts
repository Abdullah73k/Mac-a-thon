/**
 * DiscordService is the business logic layer between Elysia controllers
 * and the Discord client/voice infrastructure.
 *
 * Following Elysia MVC: abstract class with static methods.
 * Returns discriminated result objects -- the controller maps these
 * to HTTP status codes using Elysia's `status()`.
 */

import { discordClient } from "./client/discord-client";
import {
  joinVoice as joinVoiceChannel,
  leaveVoice as leaveVoiceChannel,
  getAllConnectionStates,
  getConnectionState,
} from "./voice/connection-manager";
import {
  playAudio,
  stopAudio,
  isPlaying,
} from "./voice/audio-player";
import {
  generateSpeech,
  isTTSConfigured,
} from "./voice/tts-handler";
import { resample24kMonoTo48kStereo } from "./voice/audio-player";
import type { DiscordBotStatus, ServiceResult, VoiceConnectionState } from "./types";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface BotStatusData {
  status: DiscordBotStatus;
  guilds: string[];
  voiceConnections: VoiceConnectionState[];
}

interface SpeechData {
  success: boolean;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export abstract class DiscordService {
  /**
   * Start the Discord bot client.
   */
  static async startBot(): Promise<ServiceResult<{ status: string }>> {
    try {
      await discordClient.start();
      return {
        ok: true,
        data: { status: discordClient.getStatus() },
      };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Failed to start Discord bot",
        code: "BOT_START_FAILED",
        httpStatus: 500,
      };
    }
  }

  /**
   * Stop the Discord bot client.
   */
  static async stopBot(): Promise<ServiceResult<{ status: string }>> {
    try {
      await discordClient.stop();
      return {
        ok: true,
        data: { status: "offline" },
      };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Failed to stop Discord bot",
        code: "BOT_STOP_FAILED",
        httpStatus: 500,
      };
    }
  }

  /**
   * Get the current bot status, guilds, and voice connections.
   */
  static getBotStatus(): ServiceResult<BotStatusData> {
    return {
      ok: true,
      data: {
        status: discordClient.getStatus(),
        guilds: discordClient.getGuildIds(),
        voiceConnections: getAllConnectionStates(),
      },
    };
  }

  /**
   * Join a voice channel in a guild.
   */
  static async joinVoice(
    guildId: string,
    channelId: string,
  ): Promise<ServiceResult<VoiceConnectionState>> {
    if (!discordClient.isReady()) {
      return {
        ok: false,
        message: "Discord bot is not connected. Start the bot first.",
        code: "BOT_NOT_READY",
        httpStatus: 503,
      };
    }

    try {
      const state = await joinVoiceChannel(guildId, channelId);
      return { ok: true, data: state };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Failed to join voice channel",
        code: "VOICE_JOIN_FAILED",
        httpStatus: 500,
      };
    }
  }

  /**
   * Leave the voice channel in a guild.
   */
  static leaveVoice(guildId: string): ServiceResult<{ success: boolean; message: string }> {
    const left = leaveVoiceChannel(guildId);

    if (!left) {
      return {
        ok: false,
        message: `No voice connection found for guild "${guildId}".`,
        code: "NO_VOICE_CONNECTION",
        httpStatus: 404,
      };
    }

    return {
      ok: true,
      data: { success: true, message: `Left voice channel in guild "${guildId}".` },
    };
  }

  /**
   * Generate TTS audio and play it in the guild's voice channel.
   */
  static async speak(
    guildId: string,
    text: string,
    voiceId?: string,
  ): Promise<ServiceResult<SpeechData>> {
    if (!discordClient.isReady()) {
      return {
        ok: false,
        message: "Discord bot is not connected. Start the bot first.",
        code: "BOT_NOT_READY",
        httpStatus: 503,
      };
    }

    const connectionState = getConnectionState(guildId);
    if (!connectionState) {
      return {
        ok: false,
        message: `No voice connection for guild "${guildId}". Join a voice channel first.`,
        code: "NO_VOICE_CONNECTION",
        httpStatus: 404,
      };
    }

    if (!isTTSConfigured()) {
      return {
        ok: false,
        message: "ElevenLabs API key is not configured.",
        code: "TTS_NOT_CONFIGURED",
        httpStatus: 503,
      };
    }

    try {
      // Generate 24kHz mono PCM from ElevenLabs
      const pcm24k = await generateSpeech(text, { voiceId });

      // Resample to 48kHz stereo for Discord
      const pcm48k = resample24kMonoTo48kStereo(pcm24k);

      // Play the audio
      const durationMs = await playAudio(guildId, pcm48k);

      return {
        ok: true,
        data: { success: true, durationMs },
      };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Speech generation failed",
        code: "SPEECH_FAILED",
        httpStatus: 500,
      };
    }
  }

  /**
   * Stop audio playback in a guild.
   */
  static stopSpeaking(guildId: string): ServiceResult<{ success: boolean; message: string }> {
    const stopped = stopAudio(guildId);

    return {
      ok: true,
      data: {
        success: stopped,
        message: stopped ? "Playback stopped." : "Nothing was playing.",
      },
    };
  }

  /**
   * Check if audio is currently playing in a guild.
   */
  static isSpeaking(guildId: string): boolean {
    return isPlaying(guildId);
  }
}
