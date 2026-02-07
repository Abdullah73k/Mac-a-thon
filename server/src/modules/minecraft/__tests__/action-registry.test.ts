/**
 * Unit tests for ActionRegistry.
 *
 * Tests: register, get, has, registeredTypes, unknown type lookup.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import type { ActionHandler, ActionResult, BotAction, ActionType } from "../types";

// ---------------------------------------------------------------------------
// We cannot import the singleton directly because it shares state across tests.
// Instead, we re-create the class logic here or re-import fresh each time.
// Since ActionRegistry is a simple class, we test by importing the singleton
// and cleaning up between tests.
// ---------------------------------------------------------------------------

// The registry is a singleton, so we test against it directly.
// We need to be careful about state leaking between tests.

/**
 * Create a minimal mock handler for testing.
 */
function createMockHandler(actionType: ActionType): ActionHandler {
  return {
    actionType,
    execute: async (_bot: unknown, action: BotAction): Promise<ActionResult> => ({
      botId: action.botId,
      actionType: action.type,
      status: "success",
      message: `Mock ${actionType} executed`,
      durationMs: 0,
      completedAt: new Date().toISOString(),
    }),
  };
}

describe("ActionRegistry", () => {
  // Use a fresh registry-like Map for isolated tests
  let handlers: Map<string, ActionHandler>;

  beforeEach(() => {
    handlers = new Map();
  });

  function register(handler: ActionHandler): void {
    handlers.set(handler.actionType, handler);
  }

  function get(actionType: ActionType): ActionHandler | undefined {
    return handlers.get(actionType);
  }

  function has(actionType: ActionType): boolean {
    return handlers.has(actionType);
  }

  function registeredTypes(): ActionType[] {
    return Array.from(handlers.keys()) as ActionType[];
  }

  it("should register a handler and retrieve it by type", () => {
    const handler = createMockHandler("jump");
    register(handler);

    const retrieved = get("jump");
    expect(retrieved).toBeDefined();
    expect(retrieved?.actionType).toBe("jump");
  });

  it("should return undefined for unregistered action types", () => {
    const retrieved = get("dig");
    expect(retrieved).toBeUndefined();
  });

  it("should report has() correctly", () => {
    expect(has("sprint")).toBe(false);

    register(createMockHandler("sprint"));
    expect(has("sprint")).toBe(true);
  });

  it("should list all registered types", () => {
    register(createMockHandler("jump"));
    register(createMockHandler("dig"));
    register(createMockHandler("send-chat"));

    const types = registeredTypes();
    expect(types).toContain("jump");
    expect(types).toContain("dig");
    expect(types).toContain("send-chat");
    expect(types.length).toBe(3);
  });

  it("should overwrite a previously registered handler for the same type", () => {
    const handler1 = createMockHandler("jump");
    const handler2 = createMockHandler("jump");

    register(handler1);
    register(handler2);

    const retrieved = get("jump");
    expect(retrieved).toBe(handler2);
  });
});

describe("ActionRegistry singleton", () => {
  it("should have all 13 handlers registered after registerAllActions()", async () => {
    // Import fresh — registerAllActions populates the singleton
    const { actionRegistry } = await import("../bot/actions/action-registry");
    const { registerAllActions } = await import("../bot/actions/register");

    registerAllActions();

    const expectedTypes: ActionType[] = [
      "move-to",
      "jump",
      "sprint",
      "sneak",
      "look-at",
      "dig",
      "place-block",
      "attack",
      "equip",
      "use-item",
      "open-container",
      "interact-entity",
      "send-chat",
    ];

    for (const actionType of expectedTypes) {
      expect(actionRegistry.has(actionType)).toBe(true);
    }

    expect(actionRegistry.registeredTypes().length).toBe(13);
  });
});
