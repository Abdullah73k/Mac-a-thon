/**
 * Agent domain types mirroring the backend Agent model.
 */

/** The 6 behavioral profiles available for testing agents. */
export type BehavioralProfile =
  | "leader"
  | "non-cooperator"
  | "confuser"
  | "resource-hoarder"
  | "task-abandoner"
  | "follower";

/** Possible states of an agent. */
export type AgentStatus =
  | "idle"
  | "spawning"
  | "active"
  | "paused"
  | "terminated"
  | "error";

/** Agent configuration. */
export interface AgentConfig {
  profile: BehavioralProfile;
  minecraftBot: {
    username: string;
    host: string;
    port: number;
    version: string;
  };
  discordConfig?: {
    guildId: string;
    channelId: string;
    voiceEnabled: boolean;
  };
  customPromptOverrides?: Record<string, string>;
  behaviorIntensity: number;
}

/** Runtime agent instance state. */
export interface AgentInstance {
  agentId: string;
  profile: BehavioralProfile;
  status: AgentStatus;
  minecraftBotId: string;
  discordUserId?: string;
  systemPrompt: string;
  spawnedAt: string;
  lastActionAt: string | null;
  actionCount: number;
  metadata: Record<string, unknown>;
}

/** Behavioral action log entry. */
export interface BehavioralAction {
  actionId: string;
  agentId: string;
  actionType: string;
  timestamp: string;
  minecraftAction?: string;
  discordAction?: string;
  targetLLMId?: string;
  success: boolean;
  notes?: string;
}
