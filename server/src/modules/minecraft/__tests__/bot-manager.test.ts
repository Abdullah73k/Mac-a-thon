/**
 * Unit tests for BotManager.
 *
 * Tests: create bot (mocked mineflayer), disconnect, max limit,
 * duplicate username detection, getBot, getBotState, getAllBotStates.
 *
 * Mineflayer is mocked to avoid actual Minecraft server connections.
 */

import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { EventEmitter } from "events";

// ---------------------------------------------------------------------------
// Mock mineflayer before importing BotInstance/BotManager
// ---------------------------------------------------------------------------

function createFakeMineflayerBot() {
  const emitter = new EventEmitter();
  const fake = Object.assign(emitter, {
    quit: mock(() => {}),
    health: 20,
    food: 20,
    game: { gameMode: "survival" },
    entity: {
      position: { x: 0, y: 64, z: 0 },
      yaw: 0,
      pitch: 0,
    },
    inventory: {
      items: () => [],
    },
  });

  // Override removeAllListeners to return the emitter (match EventEmitter API)
  const originalRemoveAll = emitter.removeAllListeners.bind(emitter);
  fake.removeAllListeners = (event?: string) => {
    originalRemoveAll(event);
    return fake;
  };

  return fake;
}

mock.module("mineflayer", () => ({
  default: {
    createBot: (_opts: Record<string, unknown>) => {
      const fake = createFakeMineflayerBot();
      // Auto-fire login + spawn on next microtask
      queueMicrotask(() => {
        fake.emit("login");
        queueMicrotask(() => {
          fake.emit("spawn");
        });
      });
      return fake;
    },
  },
}));

// Mock constants to avoid env dependency
mock.module("../../../../constants/minecraft.constants", () => ({
  MINECRAFT_HOST: "localhost",
  MINECRAFT_PORT: 25565,
  MINECRAFT_VERSION: "1.21.1",
  MAX_CONCURRENT_BOTS: 3,
  MAX_ACTIONS_PER_SECOND: 5,
  RECONNECT_DELAY_MS: 3000,
  STATE_POLL_INTERVAL_MS: 250,
}));

// Import after mocks
const { BotManager, BotManagerError } = await import("../bot/bot-manager");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BotManager", () => {
  let manager: InstanceType<typeof BotManager>;

  beforeEach(() => {
    manager = new BotManager();
  });

  afterEach(() => {
    manager.disconnectAll();
  });

  describe("createBot", () => {
    it("should create a bot and return its state", async () => {
      const state = await manager.createBot("TestBot");

      expect(state.username).toBe("TestBot");
      expect(state.botId).toBeTruthy();
      expect(state.status).toBe("spawned");
      expect(manager.botCount).toBe(1);
    });

    it("should enforce MAX_CONCURRENT_BOTS limit", async () => {
      // MAX_CONCURRENT_BOTS is mocked to 3
      await manager.createBot("Bot1");
      await manager.createBot("Bot2");
      await manager.createBot("Bot3");

      expect(manager.botCount).toBe(3);

      try {
        await manager.createBot("Bot4");
        // Should not reach here
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(BotManagerError);
        expect((err as InstanceType<typeof BotManagerError>).code).toBe("MAX_BOTS_REACHED");
      }
    });

    it("should prevent duplicate usernames for active bots", async () => {
      await manager.createBot("DuplicateBot");

      try {
        await manager.createBot("DuplicateBot");
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(BotManagerError);
        expect((err as InstanceType<typeof BotManagerError>).code).toBe("DUPLICATE_USERNAME");
      }
    });

    it("should emit bot-created event", async () => {
      let emittedBotId: string | undefined;
      manager.on("bot-created", (botId: string) => {
        emittedBotId = botId;
      });

      const state = await manager.createBot("EventBot");
      expect(emittedBotId).toBe(state.botId);
    });
  });

  describe("getBot / getBotState", () => {
    it("should return the bot instance by ID", async () => {
      const state = await manager.createBot("LookupBot");
      const instance = manager.getBot(state.botId);

      expect(instance).toBeDefined();
      expect(instance?.username).toBe("LookupBot");
    });

    it("should return undefined for non-existent bot", () => {
      expect(manager.getBot("nonexistent")).toBeUndefined();
    });

    it("should return bot state snapshot", async () => {
      const state = await manager.createBot("StateBot");
      const snapshot = manager.getBotState(state.botId);

      expect(snapshot).toBeDefined();
      expect(snapshot?.botId).toBe(state.botId);
      expect(snapshot?.username).toBe("StateBot");
      expect(snapshot?.status).toBe("spawned");
    });

    it("should return undefined state for non-existent bot", () => {
      expect(manager.getBotState("missing")).toBeUndefined();
    });
  });

  describe("getAllBotStates", () => {
    it("should return all bot states", async () => {
      await manager.createBot("Bot_A");
      await manager.createBot("Bot_B");

      const states = manager.getAllBotStates();
      expect(states.length).toBe(2);

      const usernames = states.map((s) => s.username);
      expect(usernames).toContain("Bot_A");
      expect(usernames).toContain("Bot_B");
    });

    it("should return empty array when no bots exist", () => {
      expect(manager.getAllBotStates()).toEqual([]);
    });
  });

  describe("disconnectBot", () => {
    it("should disconnect and remove a bot", async () => {
      const state = await manager.createBot("DisconnectBot");
      expect(manager.botCount).toBe(1);

      const removed = manager.disconnectBot(state.botId);
      expect(removed).toBe(true);
      expect(manager.botCount).toBe(0);
      expect(manager.getBot(state.botId)).toBeUndefined();
    });

    it("should return false for non-existent bot", () => {
      expect(manager.disconnectBot("ghost")).toBe(false);
    });

    it("should emit bot-removed event", async () => {
      const state = await manager.createBot("RemoveBot");
      let removedBotId: string | undefined;
      manager.on("bot-removed", (botId: string) => {
        removedBotId = botId;
      });

      manager.disconnectBot(state.botId);
      expect(removedBotId).toBe(state.botId);
    });
  });

  describe("disconnectAll", () => {
    it("should disconnect all bots and clear the registry", async () => {
      await manager.createBot("All_1");
      await manager.createBot("All_2");
      expect(manager.botCount).toBe(2);

      manager.disconnectAll();
      expect(manager.botCount).toBe(0);
    });
  });

  describe("hasBot", () => {
    it("should return true for existing bots", async () => {
      const state = await manager.createBot("HasBot");
      expect(manager.hasBot(state.botId)).toBe(true);
    });

    it("should return false for non-existent bots", () => {
      expect(manager.hasBot("nope")).toBe(false);
    });
  });
});
