/**
 * Test Scenario interface.
 *
 * Each scenario defines the rules, agent composition, success criteria,
 * and initial conditions for a specific type of adversarial test.
 */

import type { BehavioralProfile } from "../../agents/model";
import type { ScenarioType } from "../types";

// ---------------------------------------------------------------------------
// Scenario Definition
// ---------------------------------------------------------------------------

/** Complete definition of a test scenario. */
export interface TestScenario {
  /** Unique scenario type identifier. */
  type: ScenarioType;
  /** Human-readable name. */
  name: string;
  /** Description of what this scenario tests. */
  description: string;
  /** Which testing agent profiles this scenario uses by default. */
  defaultProfiles: BehavioralProfile[];
  /** Success criteria for completion detection. */
  successCriteria: SuccessCriteria;
  /** Default duration in seconds. */
  defaultDurationSeconds: number;
  /** Objective description fed to the target LLM as context. */
  objectivePrompt: string;
  /** Initial conditions for the Minecraft environment. */
  initialConditions: InitialConditions;
  /** Metrics that are specifically relevant to this scenario. */
  relevantMetrics: string[];
}

// ---------------------------------------------------------------------------
// Success Criteria
// ---------------------------------------------------------------------------

/** Defines when a test scenario is considered successfully completed. */
export interface SuccessCriteria {
  /** Description of what constitutes success. */
  description: string;
  /** Minimum number of cooperative actions by the target (if applicable). */
  minCooperativeActions: number | null;
  /** Minimum number of tasks completed (if applicable). */
  minTasksCompleted: number | null;
  /** Maximum allowed LLM error rate (0-1, null = no limit). */
  maxLlmErrorRate: number | null;
  /** Whether the target must communicate in Discord at least once. */
  requiresDiscordCommunication: boolean;
}

// ---------------------------------------------------------------------------
// Initial Conditions
// ---------------------------------------------------------------------------

/** Optional spawn position and facing for all bots (applied via /tp after join). */
export interface SpawnPosition {
  x: number;
  y: number;
  z: number;
  /** Yaw in degrees (e.g. -178.7 for north). */
  yaw?: number;
  /** Pitch in degrees (e.g. 51.3). */
  pitch?: number;
}

/** Starting state for the Minecraft environment. */
export interface InitialConditions {
  /** Radius around spawn for agent placement. */
  spawnRadius: number;
  /** If set, bots are teleported here and facing this direction after they spawn. */
  spawnPosition?: SpawnPosition;
  /** Items given to the target bot at start. */
  targetStartingInventory: InventoryItem[];
  /** Items given to each testing agent at start. */
  testerStartingInventory: InventoryItem[];
  /** Time of day in Minecraft ticks (0 = dawn, 6000 = noon). */
  timeOfDay: number;
  /** Weather condition. */
  weather: "clear" | "rain" | "thunder";
}

/** An item in a starting inventory. */
export interface InventoryItem {
  name: string;
  count: number;
}
