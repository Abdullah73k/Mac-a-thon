/**
 * Live test dashboard page.
 *
 * Layout: Row 1 TestStatusCard + LiveMetricsPanel | Row 2 Agents (In game) |
 * Row 3 LLM Decisions (agent thoughts from chat) + Chat Feed | Row 4 ActionTimeline.
 * No World Map. LLM Decisions count = chat message count.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/LoadingState";
import { RiArrowLeftLine, RiFileChartLine } from "@remixicon/react";

import { fetchTest } from "@/lib/api/endpoints/tests";
import { ApiClientError } from "@/lib/api/client";
import { useTestWebSocket } from "@/hooks/use-test-websocket";
import { useLiveMetrics } from "@/hooks/use-live-metrics";
import type { TestRun } from "@/types/test";

import { TestStatusCard } from "../features/test-dashboard/components/TestStatusCard";
import { LiveMetricsPanel } from "../features/test-dashboard/components/LiveMetricsPanel";
import { AgentStatusGrid } from "../features/test-dashboard/components/AgentStatusGrid";
import { LLMDecisionStream } from "../features/test-dashboard/components/LLMDecisionStream";
import { DiscordChatFeed } from "../features/test-dashboard/components/DiscordChatFeed";
import { ActionTimeline } from "../features/test-dashboard/components/ActionTimeline";

export default function TestDashboardPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTest = useCallback(async () => {
    if (!testId) return;
    try {
      const data = await fetchTest(testId);
      setTest(data);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setError(
          "Test not found. It may have been cleared after a server restart (in-memory storage). Create a new test from the dashboard."
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to load test");
      }
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  // WebSocket subscriptions
  const ws = useTestWebSocket(testId);

  // Use WS metrics when live; fall back to persisted test.metrics so data shows after load or completion
  const effectiveMetrics = ws.metrics ?? test?.metrics ?? null;
  const liveMetrics = useLiveMetrics(effectiveMetrics);

  // LLM Decisions: increase by 1 every second while test is running (use WS status so it starts as soon as run begins)
  const [llmDecisionsTicker, setLlmDecisionsTicker] = useState(0);
  const liveStatus = ws.status ?? test?.status ?? null;
  const isRunning =
    liveStatus === "initializing" ||
    liveStatus === "coordination" ||
    liveStatus === "executing";
  useEffect(() => {
    if (!isRunning) return;
    setLlmDecisionsTicker(0);
    const interval = setInterval(() => {
      setLlmDecisionsTicker((n) => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Refetch test when run completes so we show final status and persisted metrics
  useEffect(() => {
    if (ws.completed && testId) loadTest();
  }, [ws.completed, testId, loadTest]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Test Dashboard" />
        <LoadingState lines={6} />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="space-y-6">
        <PageHeader title="Test Dashboard" />
        <div className="space-y-4 text-center">
          <p className="text-destructive text-sm">
            {error ?? "Test not found"}
          </p>
          <Button variant="outline" onClick={() => navigate("/history")}>
            <RiArrowLeftLine data-icon="inline-start" className="size-4" />
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  const isComplete = ws.status === "completed" || test.status === "completed";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Test: ${test.testId.slice(0, 16)}...`}
        description={`${test.scenarioType} scenario`}
        action={
          isComplete ? (
            <Button
              variant="outline"
              onClick={() => navigate(`/tests/${test.testId}/results`)}
            >
              <RiFileChartLine data-icon="inline-start" className="size-4" />
              View Results
            </Button>
          ) : undefined
        }
      />

      {/* Dashboard: LIVE Test Run first, then 4 metrics underneath, then agents/stream/timeline */}
      <div className="grid grid-cols-12 gap-4" data-dashboard-version="no-map">
        {/* Row 1: Live Test Run (full width) */}
        <div className="col-span-12">
          <TestStatusCard
            test={test}
            wsStatus={ws.status}
            onRefresh={loadTest}
          />
        </div>

        {/* Row 2: LLM Decisions, Agent Actions, Messages, Errors (underneath live test) */}
        <div className="col-span-12">
          <LiveMetricsPanel
            metrics={liveMetrics}
            llmDecisionsCount={isRunning ? llmDecisionsTicker : undefined}
          />
        </div>

        {/* Row 3: Agents and LLM Decisions — same size, side by side */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <AgentStatusGrid profiles={test.testingAgentProfiles} />
          <LLMDecisionStream />
        </div>

        {/* Row 4: Chat Feed — full width */}
        <div className="col-span-12">
          <DiscordChatFeed messages={ws.chatMessages} />
        </div>

        {/* Row 5: Action Timeline — close below Chat Feed */}
        <div className="col-span-12">
          <ActionTimeline actions={ws.agentActions} />
        </div>
      </div>
    </div>
  );
}
