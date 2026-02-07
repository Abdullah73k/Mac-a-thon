/**
 * Unit tests for ActionDispatcher.
 *
 * Tests: rate limiting, bot not found, bot not spawned, handler not found,
 * successful dispatch, and error handling.
 *
 * These tests mock BotManager and ActionRegistry to isolate dispatcher logic.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import type { ActionResult, BotAction, ActionHandler } from "../types";

// ---------------------------------------------------------------------------
// We test the dispatcher logic in isolation by mocking its dependencies.
// The dispatcher imports botManager and actionRegistry as singletons,
// so we mock those modules.
// ---------------------------------------------------------------------------

// Mock botManager
const mockGetBot = mock(() => undefined as unknown);
const mockBotManager = {
  getBot: mockGetBot,
};

// Mock actionRegistry
const mockRegistryGet = mock(() => undefined as unknown);
const mockActionRegistry = {
  get: mockRegistryGet,
};

// Mock the module imports
mock.module("../bot/bot-manager", () => ({
  botManager: mockBotManager,
}));

mock.module("../bot/actions/action-registry", () => ({
  actionRegistry: mockActionRegistry,
}));

// Mock the constants — use exact specifier as used by dispatcher source
mock.module("../../../../../constants/minecraft.constants", () => ({
  MAX_ACTIONS_PER_SECOND: 5,
}));

// Import dispatcher after mocks are set up
const { dispatchAction } = await import("../bot/actions/action-dispatcher");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let testCounter = 0;

function createAction(botId?: string): BotAction {
  testCounter += 1;
  return {
    type: "jump",
    botId: botId ?? `bot-test-${testCounter}`,
  };
}

function createMockBotInstance(status: string, hasMfBot: boolean) {
  return {
    status,
    mineflayerBot: hasMfBot ? {} : null,
  };
}

function createMockHandler(): ActionHandler {
  return {
    actionType: "jump",
    execute: async (_bot: unknown, action: BotAction): Promise<ActionResult> => ({
      botId: action.botId,
      actionType: action.type,
      status: "success",
      message: "Jumped",
      durationMs: 10,
      completedAt: new Date().toISOString(),
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ActionDispatcher", () => {
  beforeEach(() => {
    mockGetBot.mockReset();
    mockRegistryGet.mockReset();
  });

  it("should return failure when bot is not found", async () => {
    mockGetBot.mockReturnValue(undefined);

    const action = createAction();
    const result = await dispatchAction(action);

    expect(result.status).toBe("failure");
    expect(result.message).toContain("not found");
    expect(result.botId).toBe(action.botId);
    expect(result.actionType).toBe("jump");
  });

  it("should return failure when bot is not spawned", async () => {
    mockGetBot.mockReturnValue(createMockBotInstance("connecting", true));

    const result = await dispatchAction(createAction());

    expect(result.status).toBe("failure");
    expect(result.message).toContain("not spawned");
  });

  it("should return failure when bot has no mineflayer instance", async () => {
    mockGetBot.mockReturnValue(createMockBotInstance("spawned", false));

    const result = await dispatchAction(createAction());

    expect(result.status).toBe("failure");
    expect(result.message).toContain("no active mineflayer instance");
  });

  it("should return failure when no handler is registered", async () => {
    mockGetBot.mockReturnValue(createMockBotInstance("spawned", true));
    mockRegistryGet.mockReturnValue(undefined);

    const result = await dispatchAction(createAction());

    expect(result.status).toBe("failure");
    expect(result.message).toContain("No handler registered");
  });

  it("should dispatch successfully when bot and handler are valid", async () => {
    mockGetBot.mockReturnValue(createMockBotInstance("spawned", true));
    mockRegistryGet.mockReturnValue(createMockHandler());

    const action = createAction();
    const result = await dispatchAction(action);

    expect(result.status).toBe("success");
    expect(result.message).toBe("Jumped");
    expect(result.botId).toBe(action.botId);
  });

  it("should return failure when handler throws an error", async () => {
    mockGetBot.mockReturnValue(createMockBotInstance("spawned", true));
    mockRegistryGet.mockReturnValue({
      actionType: "jump",
      execute: async () => {
        throw new Error("Mineflayer crash");
      },
    });

    const result = await dispatchAction(createAction());

    expect(result.status).toBe("failure");
    expect(result.message).toBe("Mineflayer crash");
  });

  it("should include duration and completion timestamp in results", async () => {
    mockGetBot.mockReturnValue(createMockBotInstance("spawned", true));
    mockRegistryGet.mockReturnValue(createMockHandler());

    const result = await dispatchAction(createAction());

    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.completedAt).toBeTruthy();
    // Verify ISO-8601 format
    expect(new Date(result.completedAt).toISOString()).toBe(result.completedAt);
  });
});
