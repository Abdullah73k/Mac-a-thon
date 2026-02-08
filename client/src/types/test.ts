/**
 * Test domain types mirroring the backend TestRun model.
 *
 * These types are used across the frontend for type safety.
 * They mirror the backend Elysia TypeBox schemas exactly.
 */

import type { BehavioralProfile } from "./agent";

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
export type ScenarioType = "cooperation" | "resource-management";

/** Why a test run ended. */
export type CompletionReason =
  | "success"
  | "timeout"
  | "manual-stop"
  | "error"
  | "all-agents-failed";

/** Accumulated metrics tracked during a test run. */
export interface TestMetrics {
  llmDecisionCount: number;
  targetActionCount: number;
  testingAgentActionCount: number;
  targetMessageCount: number;
  testingAgentMessageCount: number;
  llmErrorCount: number;
  totalLlmResponseTimeMs: number;
  lastLlmDecisionAt: string | null;
}

/** User-provided configuration for a test run. */
export interface TestRunConfig {
  llmPollingIntervalMs: number;
  behaviorIntensity: number;
  enableVoice: boolean;
  enableText: boolean;
  targetLlmSystemPromptOverride: string | null;
  minecraftServer: {
    host: string;
    port: number;
    version: string;
  };
}

/** Full state of a test run. */
export interface TestRun {
  testId: string;
  scenarioType: ScenarioType;
  status: TestRunStatus;
  targetLlmModel: string;
  testingAgentProfiles: BehavioralProfile[];
  testingAgentIds: string[];
  targetAgentId: string | null;
  targetBotId: string | null;
  discordTextChannelId: string | null;
  discordVoiceChannelId: string | null;
  durationSeconds: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  completionReason: CompletionReason | null;
  config: TestRunConfig;
  metrics: TestMetrics;
}

/** A logged action from the test run. */
export interface TestActionLog {
  logId: string;
  testId: string;
  sourceAgentId: string;
  sourceType: "target" | "testing-agent";
  actionCategory: "minecraft" | "discord" | "llm-decision";
  actionDetail: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

/** Domain-level request to create a new test run. */
export interface CreateTestRequest {
  scenarioType: ScenarioType;
  targetLlmModel: string;
  testingAgentProfiles?: BehavioralProfile[];
  durationSeconds?: number;
  config?: Partial<TestRunConfig>;
}

/** Scenario definition from the backend. */
export interface ScenarioInfo {
  type: ScenarioType;
  name: string;
  description: string;
  defaultProfiles: BehavioralProfile[];
  defaultDurationSeconds: number;
  relevantMetrics: string[];
}

/** API error response. */
export interface ApiError {
  success: false;
  message: string;
  code: string;
}

/** Re-export for convenience. */
export type { BehavioralProfile };
