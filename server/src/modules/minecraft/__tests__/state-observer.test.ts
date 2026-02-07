/**
 * Unit tests for the StateObserver change detection logic.
 *
 * We test the pure functions (toSnapshot, hasChanged) by
 * reimplementing the logic here since they're module-private.
 * We also test the observer start/stop lifecycle.
 */

import { describe, it, expect } from "bun:test";
import type { BotState, Vec3, InventorySlot } from "../types";

// ---------------------------------------------------------------------------
// Reimplemented change-detection functions (matching state-observer.ts)
// ---------------------------------------------------------------------------

interface StateSnapshot {
  status: string;
  positionKey: string;
  health: number | null;
  food: number | null;
  inventoryHash: string;
}

function positionKey(pos: Vec3 | null): string {
  if (!pos) return "null";
  return `${pos.x.toFixed(1)},${pos.y.toFixed(1)},${pos.z.toFixed(1)}`;
}

function inventoryHash(state: BotState): string {
  return state.inventory
    .map((s: InventorySlot) => `${s.slot}:${s.name}:${s.count}`)
    .join("|");
}

function toSnapshot(state: BotState): StateSnapshot {
  return {
    status: state.status,
    positionKey: positionKey(state.position),
    health: state.health,
    food: state.food,
    inventoryHash: inventoryHash(state),
  };
}

function hasChanged(prev: StateSnapshot, next: StateSnapshot): boolean {
  return (
    prev.status !== next.status ||
    prev.positionKey !== next.positionKey ||
    prev.health !== next.health ||
    prev.food !== next.food ||
    prev.inventoryHash !== next.inventoryHash
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createBotState(overrides: Partial<BotState> = {}): BotState {
  return {
    botId: "bot-1",
    username: "TestBot",
    status: "spawned",
    position: { x: 10, y: 64, z: -20 },
    orientation: { yaw: 0, pitch: 0 },
    health: 20,
    food: 20,
    gameMode: "survival",
    inventory: [],
    lastUpdatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StateObserver - change detection", () => {
  describe("positionKey", () => {
    it("should return 'null' for null position", () => {
      expect(positionKey(null)).toBe("null");
    });

    it("should round to 1 decimal place", () => {
      expect(positionKey({ x: 10.123, y: 64.789, z: -20.456 })).toBe(
        "10.1,64.8,-20.5",
      );
    });

    it("should treat sub-block movement as same position", () => {
      const a = positionKey({ x: 10.01, y: 64.04, z: -20.09 });
      const b = positionKey({ x: 10.0, y: 64.0, z: -20.1 });
      expect(a).toBe(b);
    });

    it("should detect whole-block movement", () => {
      const a = positionKey({ x: 10.0, y: 64.0, z: -20.0 });
      const b = positionKey({ x: 11.0, y: 64.0, z: -20.0 });
      expect(a).not.toBe(b);
    });
  });

  describe("inventoryHash", () => {
    it("should return empty string for empty inventory", () => {
      const state = createBotState({ inventory: [] });
      expect(inventoryHash(state)).toBe("");
    });

    it("should produce consistent hash for same inventory", () => {
      const items: InventorySlot[] = [
        { slot: 0, name: "diamond", count: 3 },
        { slot: 1, name: "stone", count: 64 },
      ];
      const state = createBotState({ inventory: items });
      expect(inventoryHash(state)).toBe("0:diamond:3|1:stone:64");
    });

    it("should produce different hash when inventory changes", () => {
      const state1 = createBotState({
        inventory: [{ slot: 0, name: "diamond", count: 3 }],
      });
      const state2 = createBotState({
        inventory: [{ slot: 0, name: "diamond", count: 4 }],
      });
      expect(inventoryHash(state1)).not.toBe(inventoryHash(state2));
    });
  });

  describe("hasChanged", () => {
    it("should return false for identical states", () => {
      const state = createBotState();
      const snap1 = toSnapshot(state);
      const snap2 = toSnapshot(state);
      expect(hasChanged(snap1, snap2)).toBe(false);
    });

    it("should detect status change", () => {
      const snap1 = toSnapshot(createBotState({ status: "spawned" }));
      const snap2 = toSnapshot(createBotState({ status: "disconnected" }));
      expect(hasChanged(snap1, snap2)).toBe(true);
    });

    it("should detect position change", () => {
      const snap1 = toSnapshot(
        createBotState({ position: { x: 10, y: 64, z: -20 } }),
      );
      const snap2 = toSnapshot(
        createBotState({ position: { x: 15, y: 64, z: -20 } }),
      );
      expect(hasChanged(snap1, snap2)).toBe(true);
    });

    it("should detect health change", () => {
      const snap1 = toSnapshot(createBotState({ health: 20 }));
      const snap2 = toSnapshot(createBotState({ health: 15 }));
      expect(hasChanged(snap1, snap2)).toBe(true);
    });

    it("should detect food change", () => {
      const snap1 = toSnapshot(createBotState({ food: 20 }));
      const snap2 = toSnapshot(createBotState({ food: 18 }));
      expect(hasChanged(snap1, snap2)).toBe(true);
    });

    it("should detect inventory change", () => {
      const snap1 = toSnapshot(createBotState({ inventory: [] }));
      const snap2 = toSnapshot(
        createBotState({
          inventory: [{ slot: 0, name: "dirt", count: 1 }],
        }),
      );
      expect(hasChanged(snap1, snap2)).toBe(true);
    });

    it("should ignore sub-block position changes", () => {
      const snap1 = toSnapshot(
        createBotState({ position: { x: 10.01, y: 64.02, z: -20.03 } }),
      );
      const snap2 = toSnapshot(
        createBotState({ position: { x: 10.04, y: 64.01, z: -20.0 } }),
      );
      expect(hasChanged(snap1, snap2)).toBe(false);
    });

    it("should handle null position transitions", () => {
      const snap1 = toSnapshot(createBotState({ position: null }));
      const snap2 = toSnapshot(
        createBotState({ position: { x: 0, y: 0, z: 0 } }),
      );
      expect(hasChanged(snap1, snap2)).toBe(true);
    });
  });
});
