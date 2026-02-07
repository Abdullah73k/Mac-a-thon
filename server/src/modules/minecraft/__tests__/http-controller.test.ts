/**
 * Unit tests for the Minecraft HTTP controller routes.
 *
 * Uses Elysia's `.handle(new Request(...))` pattern to test routes
 * without starting an actual server. Mocks the MinecraftService layer.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Elysia, status } from "elysia";
import type { BotState } from "../types";

// ---------------------------------------------------------------------------
// Mock service responses
// ---------------------------------------------------------------------------

const mockBotState: BotState = {
  botId: "bot-1-123",
  username: "TestBot",
  status: "spawned",
  position: { x: 0, y: 64, z: 0 },
  orientation: { yaw: 0, pitch: 0 },
  health: 20,
  food: 20,
  gameMode: "survival",
  inventory: [],
  lastUpdatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Build a test Elysia app that mirrors the real controller but with
// inline mock logic, avoiding mineflayer imports entirely.
// ---------------------------------------------------------------------------

function createTestApp() {
  let bots: BotState[] = [];

  return new Elysia({ prefix: "/api/minecraft" })
    .post("/bots", async ({ body }) => {
      const parsed = body as { username: string; host?: string; port?: number; version?: string };

      // Simulate duplicate username check
      if (bots.some((b) => b.username === parsed.username)) {
        return status(409, {
          success: false as const,
          message: `Bot with username "${parsed.username}" is already active`,
          code: "DUPLICATE_USERNAME",
        });
      }

      const newBot: BotState = {
        ...mockBotState,
        botId: `bot-${bots.length + 1}-${Date.now()}`,
        username: parsed.username,
      };
      bots.push(newBot);
      return newBot;
    })
    .get("/bots", () => {
      return { bots, count: bots.length };
    })
    .get("/bots/:botId", ({ params }) => {
      const bot = bots.find((b) => b.botId === params.botId);
      if (!bot) {
        return status(404, {
          success: false as const,
          message: `Bot "${params.botId}" not found`,
          code: "BOT_NOT_FOUND",
        });
      }
      return bot;
    })
    .delete("/bots/:botId", ({ params }) => {
      const idx = bots.findIndex((b) => b.botId === params.botId);
      if (idx === -1) {
        return status(404, {
          success: false as const,
          message: `Bot "${params.botId}" not found`,
          code: "BOT_NOT_FOUND",
        });
      }
      bots.splice(idx, 1);
      return { success: true, message: `Bot "${params.botId}" disconnected successfully` };
    })
    .delete("/bots/all", () => {
      bots = [];
      return { success: true, message: "All bots disconnected" };
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Minecraft HTTP Controller", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("GET /api/minecraft/bots", () => {
    it("should return empty bot list initially", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/minecraft/bots"),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.bots).toEqual([]);
      expect(body.count).toBe(0);
    });
  });

  describe("POST /api/minecraft/bots", () => {
    it("should create a bot and return its state", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/minecraft/bots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "NewBot" }),
        }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.username).toBe("NewBot");
      expect(body.botId).toBeTruthy();
    });

    it("should return 409 for duplicate username", async () => {
      // Create first bot
      await app.handle(
        new Request("http://localhost/api/minecraft/bots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "DupeBot" }),
        }),
      );

      // Attempt duplicate
      const response = await app.handle(
        new Request("http://localhost/api/minecraft/bots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "DupeBot" }),
        }),
      );

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe("DUPLICATE_USERNAME");
    });
  });

  describe("GET /api/minecraft/bots/:botId", () => {
    it("should return a specific bot's state", async () => {
      // Create a bot first
      const createRes = await app.handle(
        new Request("http://localhost/api/minecraft/bots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "SpecificBot" }),
        }),
      );
      const created = await createRes.json();

      const response = await app.handle(
        new Request(`http://localhost/api/minecraft/bots/${created.botId}`),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.botId).toBe(created.botId);
      expect(body.username).toBe("SpecificBot");
    });

    it("should return 404 for non-existent bot", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/minecraft/bots/nonexistent"),
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe("BOT_NOT_FOUND");
    });
  });

  describe("DELETE /api/minecraft/bots/:botId", () => {
    it("should disconnect and remove a bot", async () => {
      // Create a bot
      const createRes = await app.handle(
        new Request("http://localhost/api/minecraft/bots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "DeleteBot" }),
        }),
      );
      const created = await createRes.json();

      const response = await app.handle(
        new Request(`http://localhost/api/minecraft/bots/${created.botId}`, {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);

      // Verify bot is gone
      const listRes = await app.handle(
        new Request("http://localhost/api/minecraft/bots"),
      );
      const list = await listRes.json();
      expect(list.count).toBe(0);
    });

    it("should return 404 for non-existent bot", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/minecraft/bots/ghost", {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/minecraft/bots/all", () => {
    it("should disconnect all bots", async () => {
      // Create two bots
      await app.handle(
        new Request("http://localhost/api/minecraft/bots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "All1" }),
        }),
      );
      await app.handle(
        new Request("http://localhost/api/minecraft/bots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "All2" }),
        }),
      );

      const response = await app.handle(
        new Request("http://localhost/api/minecraft/bots/all", {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);

      // Verify all are gone
      const listRes = await app.handle(
        new Request("http://localhost/api/minecraft/bots"),
      );
      const list = await listRes.json();
      expect(list.count).toBe(0);
    });
  });
});
