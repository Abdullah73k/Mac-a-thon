/**
 * Test status card showing current test state, duration, and controls.
 */

import { RiPlayLine, RiStopLine, RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { DurationDisplay } from "@/components/shared/DurationDisplay";
import { AgentProfileBadge } from "@/components/shared/AgentProfileBadge";
import { LLM_MODELS } from "@/lib/utils/constants";
import { startTest, stopTest, deleteTest } from "@/lib/api/endpoints/tests";
import type { TestRun, TestRunStatus } from "@/types/test";

const ACTIVE_STATUSES: TestRunStatus[] = [
  "initializing",
  "coordination",
  "executing",
  "completing",
];

function TestStatusCard({
  test,
  wsStatus,
  onRefresh,
}: {
  test: TestRun;
  wsStatus: TestRunStatus | null;
  onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const currentStatus = wsStatus ?? test.status;
  const isActive = ACTIVE_STATUSES.includes(currentStatus);
  const canStart = currentStatus === "created";
  const canStop = isActive;
  const model = LLM_MODELS.find((m) => m.id === test.targetLlmModel);

  async function handleStart() {
    try {
      await startTest(test.testId);
      toast.success("Test started");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start test");
    }
  }

  async function handleStop() {
    try {
      await stopTest(test.testId);
      toast.success("Test stopped");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to stop test");
    }
  }

  async function handleDelete() {
    try {
      await deleteTest(test.testId);
      toast.success("Test deleted");
      navigate("/history");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete test");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isActive && <LiveIndicator />}
          Test Run
        </CardTitle>
        <CardDescription>
          {test.scenarioType} &middot;{" "}
          {model?.name ?? test.targetLlmModel}
        </CardDescription>
        <CardAction>
          <div className="flex gap-1">
            {canStart && (
              <Button size="sm" onClick={handleStart}>
                <RiPlayLine data-icon="inline-start" className="size-3.5" />
                Start
              </Button>
            )}
            {canStop && (
              <Button size="sm" variant="destructive" onClick={handleStop}>
                <RiStopLine data-icon="inline-start" className="size-3.5" />
                Stop
              </Button>
            )}
            {!isActive && currentStatus !== "created" && (
              <Button size="sm" variant="ghost" onClick={handleDelete}>
                <RiDeleteBinLine className="size-3.5" />
              </Button>
            )}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge domain="test" status={currentStatus} />
          <DurationDisplay
            startedAt={test.startedAt}
            fixedSeconds={
              !isActive && test.startedAt && test.endedAt
                ? Math.round(
                    (new Date(test.endedAt).getTime() -
                      new Date(test.startedAt).getTime()) /
                      1000
                  )
                : undefined
            }
          />
          <div className="flex flex-wrap gap-1">
            {test.testingAgentProfiles.map((p) => (
              <AgentProfileBadge key={p} profile={p} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { TestStatusCard };
