/**
 * Derived hook for live metrics from test WebSocket.
 *
 * Provides computed values like average LLM response time,
 * actions per minute, etc.
 */

import { useMemo } from "react";
import type { TestMetrics } from "@/types/test";

export interface LiveMetricsSummary {
  /** Total LLM decisions made. */
  decisionCount: number;
  /** Average LLM response time in ms. */
  avgResponseTimeMs: number;
  /** Total actions by the target LLM agent. */
  targetActions: number;
  /** Total actions by testing agents. */
  testingAgentActions: number;
  /** Total chat messages from the target. */
  targetMessages: number;
  /** Total chat messages from testing agents. */
  testingAgentMessages: number;
  /** Number of LLM errors encountered. */
  errorCount: number;
}

export function useLiveMetrics(metrics: TestMetrics | null): LiveMetricsSummary {
  return useMemo(() => {
    if (!metrics) {
      return {
        decisionCount: 0,
        avgResponseTimeMs: 0,
        targetActions: 0,
        testingAgentActions: 0,
        targetMessages: 0,
        testingAgentMessages: 0,
        errorCount: 0,
      };
    }

    const avgResponseTimeMs =
      metrics.llmDecisionCount > 0
        ? Math.round(metrics.totalLlmResponseTimeMs / metrics.llmDecisionCount)
        : 0;

    return {
      decisionCount: metrics.llmDecisionCount,
      avgResponseTimeMs,
      targetActions: metrics.targetActionCount,
      testingAgentActions: metrics.testingAgentActionCount,
      targetMessages: metrics.targetMessageCount,
      testingAgentMessages: metrics.testingAgentMessageCount,
      errorCount: metrics.llmErrorCount,
    };
  }, [metrics]);
}
