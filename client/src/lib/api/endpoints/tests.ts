/**
 * Test-related API endpoints.
 */

import { apiClient } from "../client";
import type { TestRun, TestActionLog, ScenarioInfo } from "@/types/test";
import type { CreateTestFormData } from "@/lib/schemas/test.schemas";

/** Fetch all available scenarios. */
export async function fetchScenarios(): Promise<{
  scenarios: ScenarioInfo[];
  count: number;
}> {
  return apiClient.get("/api/tests/scenarios");
}

/** Create a new test run. Accepts the validated form data from the wizard. */
export async function createTest(data: CreateTestFormData): Promise<TestRun> {
  return apiClient.post("/api/tests", data);
}

/** List all test runs with optional filters. */
export async function listTests(filters?: {
  status?: string;
  scenarioType?: string;
}): Promise<{ tests: TestRun[]; count: number }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.scenarioType) params.set("scenarioType", filters.scenarioType);
  const query = params.toString();
  return apiClient.get(`/api/tests${query ? `?${query}` : ""}`);
}

/** Fetch a single test run by ID. */
export async function fetchTest(testId: string): Promise<TestRun> {
  return apiClient.get(`/api/tests/${testId}`);
}

/** Start a test run. */
export async function startTest(testId: string): Promise<TestRun> {
  return apiClient.post(`/api/tests/${testId}/start`, {});
}

/** Stop a test run. */
export async function stopTest(testId: string): Promise<TestRun> {
  return apiClient.post(`/api/tests/${testId}/stop`, {});
}

/** Delete a test run. */
export async function deleteTest(testId: string): Promise<{
  success: boolean;
  message: string;
}> {
  return apiClient.delete(`/api/tests/${testId}`);
}

/** Fetch action logs for a test run. */
export async function fetchTestLogs(
  testId: string,
  limit = 200,
): Promise<{ testId: string; logs: TestActionLog[]; count: number }> {
  return apiClient.get(`/api/tests/${testId}/logs?limit=${limit}`);
}
