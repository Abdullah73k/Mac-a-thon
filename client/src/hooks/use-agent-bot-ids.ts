/**
 * Hook to resolve testing agent IDs to their Minecraft bot IDs.
 *
 * Fetches agent details from the API and extracts the minecraftBotId
 * for each agent. Results are cached for the lifetime of the component.
 */

import { useState, useEffect, useRef } from "react";
import { fetchAgentsByIds } from "@/lib/api/endpoints/agents";

/**
 * Given an array of agent IDs, resolves them to their Minecraft bot IDs
 * by fetching agent details from the API.
 *
 * @param agentIds - Array of agent IDs (e.g., "agent-xxx")
 * @returns Array of Minecraft bot IDs (e.g., "bot-xxx")
 */
export function useAgentBotIds(agentIds: string[]): string[] {
  const [botIds, setBotIds] = useState<string[]>([]);
  const fetchedRef = useRef<string>("");

  useEffect(() => {
    if (agentIds.length === 0) {
      setBotIds([]);
      return;
    }

    // Stable key to avoid re-fetching for the same set of agent IDs
    const key = agentIds.slice().sort().join(",");
    if (key === fetchedRef.current) return;

    let cancelled = false;

    fetchAgentsByIds(agentIds)
      .then((agentMap) => {
        if (cancelled) return;
        fetchedRef.current = key;

        const resolved: string[] = [];
        for (const agentId of agentIds) {
          const agent = agentMap.get(agentId);
          if (agent) {
            resolved.push(agent.minecraftBotId);
          }
        }
        setBotIds(resolved);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[useAgentBotIds] Failed to resolve agent bot IDs:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [agentIds]);

  return botIds;
}
