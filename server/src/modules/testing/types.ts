/**
 * Core TypeScript types for the Testing module.
 *
 * These types represent domain concepts used across test orchestration,
 * scenario management, and the coordinator engine.
 * Elysia route/WS validation models live in model.ts (TypeBox).
 */

import type { BehavioralProfile } from "../agents/model";

// ---------------------------------------------------------------------------
// Test Run Lifecycle
// ---------------------------------------------------------------------------

/** Possible states of a test run. */
export type TestRunStatus =
  | "created"
  | "initializing"
  | "coordination"
  | "executing"
  | "completing"
  | "completed"
  | "failed"
  | "cancelled";

/** Available scenario types for testing. */
export type ScenarioType =
  | "cooperation"
  | "resource-management";

// ---------------------------------------------------------------------------
// Test Run
// ---------------------------------------------------------------------------

/** Full state of a test run. */
export interface TestRun {
  /** Unique identifier for this test run. */
  testId: string;
  /** Which scenario type is being executed. */
  scenarioType: ScenarioType;
  /** Current lifecycle status. */
  status: TestRunStatus;
  /** LLM model ID used for the target agent (OpenRouter format). */
  targetLlmModel: string;
  /** Behavioral profiles assigned to testing agents. */
  testingAgentProfiles: BehavioralProfile[];
  /** IDs of spawned testing agents. */
  testingAgentIds: string[];
  /** ID of the target LLM agent (the one being tested). */
  targetAgentId: string | null;
  /** Minecraft bot ID for the target LLM agent. */
  targetBotId: string | null;
  /** Discord text channel ID for this test. */
  discordTextChannelId: string | null;
  /** Discord voice channel ID for this test. */
  discordVoiceChannelId: string | null;
  /** Test duration limit in seconds. */
  durationSeconds: number;
  /** ISO-8601 timestamp when the test was created. */
  createdAt: string;
  /** ISO-8601 timestamp when execution started. */
  startedAt: string | null;
  /** ISO-8601 timestamp when execution ended. */
  endedAt: string | null;
  /** Completion reason if test has ended. */
  completionReason: CompletionReason | null;
  /** Configuration overrides for this test run. */
  config: TestRunConfig;
  /** Accumulated metrics during the test. */
  metrics: TestMetrics;
}

// ---------------------------------------------------------------------------
// Test Run Configuration
// ---------------------------------------------------------------------------

/** User-provided configuration for a test run. */
export interface TestRunConfig {
  /** LLM polling interval in milliseconds (default 7000). */
  llmPollingIntervalMs: number;
  /** Behavior intensity for testing agents (0-1, default 0.5). */
  behaviorIntensity: number;
  /** Whether to enable Discord voice coordination. */
  enableVoice: boolean;
  /** Whether to enable Discord text coordination. */
  enableText: boolean;
  /** Custom system prompt additions for the target LLM. */
  targetLlmSystemPromptOverride: string | null;
  /** Minecraft server connection details. */
  minecraftServer: {
    host: string;
    port: number;
    version: string;
  };
}

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------

/** Why a test run ended. */
export type CompletionReason =
  | "success"
  | "timeout"
  | "manual-stop"
  | "error"
  | "all-agents-failed";

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

/** Accumulated metrics tracked during a test run. */
export interface TestMetrics {
  /** Total number of LLM decision cycles completed. */
  llmDecisionCount: number;
  /** Total number of Minecraft actions executed by target. */
  targetActionCount: number;
  /** Total number of Minecraft actions executed by testing agents. */
  testingAgentActionCount: number;
  /** Number of Discord messages sent by target. */
  targetMessageCount: number;
  /** Number of Discord messages sent by testing agents. */
  testingAgentMessageCount: number;
  /** Number of LLM errors encountered. */
  llmErrorCount: number;
  /** Total LLM response time in milliseconds (for averaging). */
  totalLlmResponseTimeMs: number;
  /** Last LLM decision timestamp. */
  lastLlmDecisionAt: string | null;
}

/**
 * Keys of TestMetrics that hold numeric values (safe for incrementing).
 * Excludes non-numeric fields like `lastLlmDecisionAt`.
 */
export type NumericMetricKey = {
  [K in keyof TestMetrics]: TestMetrics[K] extends number ? K : never;
}[keyof TestMetrics];

// ---------------------------------------------------------------------------
// Test Action Log
// ---------------------------------------------------------------------------

/** A logged action from the test run. */
export interface TestActionLog {
  /** Unique log entry ID. */
  logId: string;
  /** Test run this action belongs to. */
  testId: string;
  /** Which agent performed the action ("target" or testing agent ID). */
  sourceAgentId: string;
  /** Whether this was from the target LLM or a testing agent. */
  sourceType: "target" | "testing-agent";
  /** Category of action. */
  actionCategory: "minecraft" | "discord" | "llm-decision";
  /** Specific action type or description. */
  actionDetail: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Optional metadata about the action. */
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Create Test Request (domain type, not TypeBox)
// ---------------------------------------------------------------------------

/** Domain-level request to create a new test run. */
export interface CreateTestRequest {
  scenarioType: ScenarioType;
  targetLlmModel?: string | null;
  testingAgentProfiles?: BehavioralProfile[];
  durationSeconds?: number;
  config?: Partial<TestRunConfig>;
}

// ---------------------------------------------------------------------------
// Service Result (reuse pattern from discord/types.ts)
// ---------------------------------------------------------------------------

export interface ServiceSuccess<T> {
  ok: true;
  data: T;
}

export interface ServiceError {
  ok: false;
  message: string;
  code: string;
  /** Suggested HTTP status code. */
  httpStatus: number;
}

export type ServiceResult<T> = ServiceSuccess<T> | ServiceError;
