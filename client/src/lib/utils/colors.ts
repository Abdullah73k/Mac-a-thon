/**
 * Status-to-color mapping for consistent UI styling.
 */

import type { TestRunStatus } from "@/types/test";
import type { AgentStatus } from "@/types/agent";
import type { BotStatus } from "@/types/bot";

/** Color variants for status badges. */
export type StatusColor =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

const TEST_STATUS_COLORS: Record<TestRunStatus, StatusColor> = {
  created: "outline",
  initializing: "secondary",
  coordination: "secondary",
  executing: "default",
  completing: "default",
  completed: "default",
  failed: "destructive",
  cancelled: "outline",
};

const AGENT_STATUS_COLORS: Record<AgentStatus, StatusColor> = {
  idle: "outline",
  spawning: "secondary",
  active: "default",
  paused: "secondary",
  terminated: "outline",
  error: "destructive",
};

const BOT_STATUS_COLORS: Record<BotStatus, StatusColor> = {
  connecting: "secondary",
  connected: "default",
  spawned: "default",
  disconnected: "outline",
  error: "destructive",
};

export function getTestStatusColor(status: TestRunStatus): StatusColor {
  return TEST_STATUS_COLORS[status];
}

export function getAgentStatusColor(status: AgentStatus): StatusColor {
  return AGENT_STATUS_COLORS[status];
}

export function getBotStatusColor(status: BotStatus): StatusColor {
  return BOT_STATUS_COLORS[status];
}

/** Profile display names and descriptions. */
export const PROFILE_INFO: Record<
  string,
  { label: string; description: string }
> = {
  cooperative: {
    label: "Cooperative",
    description: "Helpful and collaborative team player",
  },
  "non-cooperator": {
    label: "Non-Cooperator",
    description: "Self-interested, refuses help and resources",
  },
  confuser: {
    label: "Confuser",
    description: "Provides contradictory information, changes plans",
  },
  "resource-hoarder": {
    label: "Resource Hoarder",
    description: "Monopolizes materials and blocks access",
  },
  "task-abandoner": {
    label: "Task Abandoner",
    description: "Starts tasks but leaves mid-execution",
  },
  "over-communicator": {
    label: "Over-Communicator",
    description: "Floods channels with excessive messages",
  },
};
