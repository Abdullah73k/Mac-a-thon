/**
 * Live metrics panel showing real-time test statistics.
 * LLM Decisions is driven by chat message count (each message = one "decision" / thought).
 */

import { MetricCard } from "@/components/shared/MetricCard";
import type { LiveMetricsSummary } from "@/hooks/use-live-metrics";

function LiveMetricsPanel({
  metrics,
  llmDecisionsCount,
}: {
  metrics: LiveMetricsSummary;
  /** When set, overrides LLM Decisions with chat-based count (each agent message = +1). */
  llmDecisionsCount?: number;
}) {
  const decisionCount = llmDecisionsCount ?? metrics.decisionCount;
  return (
    <div data-slot="live-metrics-panel" className="grid grid-cols-2 gap-2">
      <MetricCard label="LLM Decisions" value={decisionCount} />
      <MetricCard
        label="Agent Actions"
        value={metrics.testingAgentActions}
      />
      <MetricCard
        label="Messages"
        value={metrics.targetMessages + metrics.testingAgentMessages}
      />
      <MetricCard
        label="Errors"
        value={metrics.errorCount}
        trend={metrics.errorCount > 0 ? "down" : "neutral"}
      />
    </div>
  );
}

export { LiveMetricsPanel };
