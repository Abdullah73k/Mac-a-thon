/**
 * Agent-related API endpoints.
 */

import { apiClient } from "../client";
import type { AgentInstance } from "@/types/agent";

/** Fetch a single agent by ID. */
export async function fetchAgent(agentId: string): Promise<AgentInstance> {
  return apiClient.get(`/api/agents/${agentId}`);
}

/** List all agents with optional filters. */
export async function listAgents(filters?: {
  status?: string;
  profile?: string;
}): Promise<{ agents: AgentInstance[]; count: number }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.profile) params.set("profile", filters.profile);
  const query = params.toString();
  return apiClient.get(`/api/agents${query ? `?${query}` : ""}`);
}

/**
 * Fetch multiple agents by their IDs (parallel requests).
 * Returns a Map of agentId -> AgentInstance for found agents.
 */
export async function fetchAgentsByIds(
  agentIds: string[],
): Promise<Map<string, AgentInstance>> {
  const results = await Promise.allSettled(
    agentIds.map((id) => fetchAgent(id)),
  );

  const map = new Map<string, AgentInstance>();
  for (const result of results) {
    if (result.status === "fulfilled") {
      map.set(result.value.agentId, result.value);
    }
  }
  return map;
}
