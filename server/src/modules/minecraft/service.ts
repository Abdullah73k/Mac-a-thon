/**
 * MinecraftService is the business logic layer between Elysia controllers
 * and the BotManager.
 *
 * Following Elysia MVC: abstract class with static methods.
 * Returns discriminated result objects — the controller maps these
 * to HTTP status codes using Elysia's `status()`.
 */

import { botManager, BotManagerError } from "./bot/bot-manager";
import type { BotState } from "./types";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

interface ServiceSuccess<T> {
  ok: true;
  data: T;
}

interface ServiceError {
  ok: false;
  message: string;
  code: string;
  /** Suggested HTTP status code. */
  httpStatus: number;
}

type ServiceResult<T> = ServiceSuccess<T> | ServiceError;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export abstract class MinecraftService {
  /**
   * Create a new bot and connect it to the Minecraft server.
   */
  static async createBot(
    username: string,
    host?: string,
    port?: number,
    version?: string,
  ): Promise<ServiceResult<BotState>> {
    try {
      const state = await botManager.createBot(username, host, port, version);
      return { ok: true, data: state };
    } catch (err) {
      if (err instanceof BotManagerError) {
        const statusMap: Record<string, number> = {
          MAX_BOTS_REACHED: 429,
          DUPLICATE_USERNAME: 409,
          CONNECTION_FAILED: 502,
        };
        return {
          ok: false,
          message: err.message,
          code: err.code,
          httpStatus: statusMap[err.code] ?? 500,
        };
      }

      return {
        ok: false,
        message: err instanceof Error ? err.message : "Unknown error",
        code: "INTERNAL_ERROR",
        httpStatus: 500,
      };
    }
  }

  /**
   * Get the current state of a specific bot.
   */
  static getBotState(botId: string): ServiceResult<BotState> {
    const state = botManager.getBotState(botId);
    if (!state) {
      return {
        ok: false,
        message: `Bot "${botId}" not found`,
        code: "BOT_NOT_FOUND",
        httpStatus: 404,
      };
    }
    return { ok: true, data: state };
  }

  /**
   * List all registered bots and their states.
   */
  static listBots(): { bots: BotState[]; count: number } {
    const bots = botManager.getAllBotStates();
    return { bots, count: bots.length };
  }

  /**
   * Disconnect a bot and remove it from the registry.
   */
  static disconnectBot(
    botId: string,
  ): ServiceResult<{ success: true; message: string }> {
    const removed = botManager.disconnectBot(botId);
    if (!removed) {
      return {
        ok: false,
        message: `Bot "${botId}" not found`,
        code: "BOT_NOT_FOUND",
        httpStatus: 404,
      };
    }
    return {
      ok: true,
      data: {
        success: true,
        message: `Bot "${botId}" disconnected successfully`,
      },
    };
  }

  /**
   * Disconnect all bots. Used for cleanup / shutdown.
   */
  static disconnectAll(): { success: boolean; message: string } {
    botManager.disconnectAll();
    return { success: true, message: "All bots disconnected" };
  }
}
