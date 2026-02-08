/**
 * Test history page — sortable, filterable list of all test runs.
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiAddLine,
  RiPlayLine,
  RiEyeLine,
  RiDeleteBinLine,
  RiFilterLine,
} from "@remixicon/react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AgentProfileBadge } from "@/components/shared/AgentProfileBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  formatDate,
  formatTime,
  formatDuration,
} from "@/lib/utils/format";
import { LLM_MODELS } from "@/lib/utils/constants";
import { listTests, deleteTest } from "@/lib/api/endpoints/tests";
import type { TestRun, TestRunStatus } from "@/types/test";

type SortField = "createdAt" | "status" | "scenarioType";
type SortDir = "asc" | "desc";

export default function TestHistoryPage() {
  const navigate = useNavigate();

  const [tests, setTests] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TestRunStatus | "">("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  async function loadTests() {
    try {
      const filters: Record<string, string> = {};
      if (statusFilter) filters.status = statusFilter;
      const result = await listTests(filters);
      setTests(result.tests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTests();
  }, [statusFilter]);

  async function handleDelete(testId: string) {
    try {
      await deleteTest(testId);
      toast.success("Test deleted");
      setTests((prev) => prev.filter((t) => t.testId !== testId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const filteredTests = useMemo(() => {
    let result = [...tests];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.testId.toLowerCase().includes(q) ||
          t.scenarioType.toLowerCase().includes(q) ||
          t.targetLlmModel.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "createdAt") {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === "status") {
        cmp = a.status.localeCompare(b.status);
      } else if (sortField === "scenarioType") {
        cmp = a.scenarioType.localeCompare(b.scenarioType);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [tests, search, sortField, sortDir]);

  const allStatuses: TestRunStatus[] = [
    "created",
    "initializing",
    "coordination",
    "executing",
    "completing",
    "completed",
    "failed",
    "cancelled",
  ];

  return (
    <>
      <PageHeader
        title="Test History"
        description={`${tests.length} test runs`}
        action={
          <Button onClick={() => navigate("/tests/new")}>
            <RiAddLine data-icon="inline-start" className="size-4" />
            New Test
          </Button>
        }
      />

      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex items-center gap-1">
            <RiFilterLine className="size-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as TestRunStatus | "")
              }
              className="border-input dark:bg-input/30 h-8 rounded-none border bg-transparent px-2 text-xs"
            >
              <option value="">All statuses</option>
              {allStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState lines={6} />
        ) : error ? (
          <div className="text-destructive text-sm">{error}</div>
        ) : filteredTests.length === 0 ? (
          <EmptyState
            title="No tests found"
            description={
              search || statusFilter
                ? "Try adjusting your filters"
                : "Create your first test to get started"
            }
            action={
              !search && !statusFilter ? (
                <Button onClick={() => navigate("/tests/new")}>
                  <RiAddLine data-icon="inline-start" className="size-4" />
                  Create Test
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left text-[10px]">
                      <th
                        className="cursor-pointer px-4 py-2 font-medium hover:text-foreground"
                        onClick={() => toggleSort("createdAt")}
                      >
                        Created{" "}
                        {sortField === "createdAt" &&
                          (sortDir === "asc" ? "\u2191" : "\u2193")}
                      </th>
                      <th
                        className="cursor-pointer px-4 py-2 font-medium hover:text-foreground"
                        onClick={() => toggleSort("status")}
                      >
                        Status{" "}
                        {sortField === "status" &&
                          (sortDir === "asc" ? "\u2191" : "\u2193")}
                      </th>
                      <th
                        className="cursor-pointer px-4 py-2 font-medium hover:text-foreground"
                        onClick={() => toggleSort("scenarioType")}
                      >
                        Scenario{" "}
                        {sortField === "scenarioType" &&
                          (sortDir === "asc" ? "\u2191" : "\u2193")}
                      </th>
                      <th className="px-4 py-2 font-medium">Model</th>
                      <th className="px-4 py-2 font-medium">Agents</th>
                      <th className="px-4 py-2 font-medium">Duration</th>
                      <th className="px-4 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTests.map((test) => {
                      const model = LLM_MODELS.find(
                        (m) => m.id === test.targetLlmModel
                      );
                      const dur =
                        test.startedAt && test.endedAt
                          ? Math.round(
                              (new Date(test.endedAt).getTime() -
                                new Date(test.startedAt).getTime()) /
                                1000
                            )
                          : null;

                      return (
                        <tr
                          key={test.testId}
                          className="border-t border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 tabular-nums">
                            <div>{formatDate(test.createdAt)}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {formatTime(test.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusBadge domain="test" status={test.status} />
                          </td>
                          <td className="px-4 py-2.5">{test.scenarioType}</td>
                          <td className="px-4 py-2.5">
                            {model?.name ?? test.targetLlmModel}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {test.testingAgentProfiles.map((p) => (
                                <AgentProfileBadge key={p} profile={p} />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 tabular-nums">
                            {dur !== null
                              ? formatDuration(dur)
                              : formatDuration(test.durationSeconds)}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1">
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                onClick={() =>
                                  navigate(`/tests/${test.testId}`)
                                }
                                title="View dashboard"
                              >
                                <RiEyeLine className="size-3" />
                              </Button>
                              {(test.status === "completed" ||
                                test.status === "failed") && (
                                <Button
                                  size="icon-xs"
                                  variant="ghost"
                                  onClick={() =>
                                    navigate(
                                      `/tests/${test.testId}/results`
                                    )
                                  }
                                  title="View results"
                                >
                                  <RiPlayLine className="size-3" />
                                </Button>
                              )}
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                onClick={() => handleDelete(test.testId)}
                                title="Delete test"
                              >
                                <RiDeleteBinLine className="size-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
