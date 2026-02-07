/**
 * Discord bot HTTP controller.
 *
 * 1 Elysia instance = 1 controller (Elysia MVC pattern).
 * Models registered via .model() and referenced by name.
 * Handlers are thin -- delegate to DiscordService, then map
 * service results to HTTP responses using Elysia status().
 */

import { Elysia, status } from "elysia";
import { DiscordService } from "./service";
import {
  JoinVoiceBody,
  LeaveVoiceBody,
  SpeakBody,
  StopSpeakingBody,
  BotStatusResponse,
  VoiceConnectionResponse,
  SpeechResultResponse,
  DiscordSuccessResponse,
  DiscordErrorResponse,
} from "./model";

export const discordController = new Elysia({
  name: "Discord.Controller",
  prefix: "/api/discord",
})
  // Register models for OpenAPI documentation and reference by name
  .model({
    "discord.joinVoice": JoinVoiceBody,
    "discord.leaveVoice": LeaveVoiceBody,
    "discord.speak": SpeakBody,
    "discord.stopSpeaking": StopSpeakingBody,
    "discord.botStatus": BotStatusResponse,
    "discord.voiceConnection": VoiceConnectionResponse,
    "discord.speechResult": SpeechResultResponse,
    "discord.success": DiscordSuccessResponse,
    "discord.error": DiscordErrorResponse,
  })

  // -------------------------------------------------------------------------
  // POST /api/discord/start -- Start the Discord bot
  // -------------------------------------------------------------------------
  .post(
    "/start",
    async () => {
      const result = await DiscordService.startBot();

      if (!result.ok) {
        return status(result.httpStatus as 500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return { success: true, message: `Bot started (status: ${result.data.status}).` };
    },
    {
      response: {
        200: "discord.success",
        500: "discord.error",
      },
      detail: {
        summary: "Start Bot",
        description: "Start the Discord bot and connect to the gateway.",
        tags: ["Discord"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // POST /api/discord/stop -- Stop the Discord bot
  // -------------------------------------------------------------------------
  .post(
    "/stop",
    async () => {
      const result = await DiscordService.stopBot();

      if (!result.ok) {
        return status(result.httpStatus as 500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return { success: true, message: "Bot stopped." };
    },
    {
      response: {
        200: "discord.success",
        500: "discord.error",
      },
      detail: {
        summary: "Stop Bot",
        description: "Stop the Discord bot and disconnect from the gateway.",
        tags: ["Discord"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // GET /api/discord/status -- Get bot status
  // -------------------------------------------------------------------------
  .get(
    "/status",
    () => {
      const result = DiscordService.getBotStatus();

      if (!result.ok) {
        return status(500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      response: {
        200: "discord.botStatus",
        500: "discord.error",
      },
      detail: {
        summary: "Get Bot Status",
        description: "Get the current Discord bot status, guilds, and voice connections.",
        tags: ["Discord"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // POST /api/discord/voice/join -- Join a voice channel
  // -------------------------------------------------------------------------
  .post(
    "/voice/join",
    async ({ body }) => {
      const result = await DiscordService.joinVoice(body.guildId, body.channelId);

      if (!result.ok) {
        return status(result.httpStatus as 404 | 503 | 500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      body: "discord.joinVoice",
      response: {
        200: "discord.voiceConnection",
        404: "discord.error",
        503: "discord.error",
        500: "discord.error",
      },
      detail: {
        summary: "Join Voice Channel",
        description: "Join a voice channel in the specified guild.",
        tags: ["Discord"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // POST /api/discord/voice/leave -- Leave a voice channel
  // -------------------------------------------------------------------------
  .post(
    "/voice/leave",
    ({ body }) => {
      const result = DiscordService.leaveVoice(body.guildId);

      if (!result.ok) {
        return status(404, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      body: "discord.leaveVoice",
      response: {
        200: "discord.success",
        404: "discord.error",
      },
      detail: {
        summary: "Leave Voice Channel",
        description: "Leave the voice channel in the specified guild.",
        tags: ["Discord"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // POST /api/discord/speak -- Generate TTS and play in voice channel
  // -------------------------------------------------------------------------
  .post(
    "/speak",
    async ({ body }) => {
      const result = await DiscordService.speak(
        body.guildId,
        body.text,
        body.voiceId,
      );

      if (!result.ok) {
        return status(result.httpStatus as 404 | 503 | 500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      body: "discord.speak",
      response: {
        200: "discord.speechResult",
        404: "discord.error",
        503: "discord.error",
        500: "discord.error",
      },
      detail: {
        summary: "Speak (TTS)",
        description:
          "Generate speech from text using ElevenLabs and play it in the voice channel.",
        tags: ["Discord"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // POST /api/discord/stop-speaking -- Stop current playback
  // -------------------------------------------------------------------------
  .post(
    "/stop-speaking",
    ({ body }) => {
      const result = DiscordService.stopSpeaking(body.guildId);

      if (!result.ok) {
        return status(500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      body: "discord.stopSpeaking",
      response: {
        200: "discord.success",
        500: "discord.error",
      },
      detail: {
        summary: "Stop Speaking",
        description: "Stop any audio currently playing in the voice channel.",
        tags: ["Discord"],
      },
    },
  );
