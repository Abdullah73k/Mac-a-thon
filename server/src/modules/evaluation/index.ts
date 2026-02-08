/**
 * Evaluation Controller
 *
 * ElysiaJS controller for evaluation API routes.
 * Following ElysiaJS best practices: thin controllers, validation with Zod, OpenAPI documentation.
 */

import { Elysia, t } from "elysia";
import { EvaluationService } from "./service";

/**
 * Evaluation Controller
 *
 * API endpoints:
 * - POST   /api/evaluation/reports              Generate report for test run
 * - GET    /api/evaluation/reports              List all reports
 * - GET    /api/evaluation/reports/:reportId    Get report by ID
 * - GET    /api/evaluation/test-runs/:testRunId/report   Get report by test run
 * - DELETE /api/evaluation/reports/:reportId    Delete report
 * - GET    /api/evaluation/metrics              Get metrics for test run
 * - GET    /api/evaluation/stats                Get repository statistics
 * - GET    /api/evaluation/health               Health check
 */
export const evaluationController = new Elysia({ prefix: "/api/evaluation" })
  // Global error handler
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return { ok: false, error: "Validation error", details: error };
    }

    console.error("[EvaluationController] Error:", error);
    set.status = 500;
    return { ok: false, error: "Internal server error" };
  })

  /**
   * POST /api/evaluation/reports
   * Generate evaluation report for a completed test run
   */
  .post(
    "/reports",
    async ({ body, set }) => {
      const result = await EvaluationService.generateReport({
        testRunId: body.testRunId,
        includeRawData: body.includeRawData ?? false,
      });

      if (!result.ok) {
        set.status = result.code === "NOT_FOUND" ? 404 : 400;
        return { ok: false, error: result.error };
      }

      return result.data;
    },
    {
      body: t.Object({
        testRunId: t.String(),
        includeRawData: t.Optional(t.Boolean()),
      }),
      detail: {
        summary: "Generate evaluation report",
        description:
          "Generates a comprehensive evaluation report for a completed test run. Analyzes all metrics, behavioral patterns, and provides insights.",
        tags: ["Evaluation"],
      },
    }
  )

  /**
   * GET /api/evaluation/reports
   * List all evaluation reports
   */
  .get(
    "/reports",
    async ({ set }) => {
      const result = await EvaluationService.listReports();

      if (!result.ok) {
        set.status = 500;
        return { ok: false, error: result.error };
      }

      return result.data;
    },
    {
      detail: {
        summary: "List all reports",
        description: "Returns a list of all generated evaluation reports, sorted by date.",
        tags: ["Evaluation"],
      },
    }
  )

  /**
   * GET /api/evaluation/reports/:reportId
   * Get a specific report by ID
   */
  .get(
    "/reports/:reportId",
    async ({ params, set }) => {
      const result = await EvaluationService.getReport(params.reportId);

      if (!result.ok) {
        set.status = 404;
        return { ok: false, error: result.error };
      }

      return result.data;
    },
    {
      params: t.Object({
        reportId: t.String(),
      }),
      detail: {
        summary: "Get report by ID",
        description: "Retrieves a specific evaluation report by its unique ID.",
        tags: ["Evaluation"],
      },
    }
  )

  /**
   * GET /api/evaluation/test-runs/:testRunId/report
   * Get report for a specific test run
   */
  .get(
    "/test-runs/:testRunId/report",
    async ({ params, set }) => {
      const result = await EvaluationService.getReportByTestRun(params.testRunId);

      if (!result.ok) {
        set.status = 404;
        return { ok: false, error: result.error };
      }

      return result.data;
    },
    {
      params: t.Object({
        testRunId: t.String(),
      }),
      detail: {
        summary: "Get report by test run",
        description:
          "Retrieves the evaluation report for a specific test run. Creates one if it doesn't exist.",
        tags: ["Evaluation"],
      },
    }
  )

  /**
   * DELETE /api/evaluation/reports/:reportId
   * Delete a report
   */
  .delete(
    "/reports/:reportId",
    async ({ params, set }) => {
      const result = await EvaluationService.deleteReport(params.reportId);

      if (!result.ok) {
        set.status = 404;
        return { ok: false, error: result.error };
      }

      return { ok: true, deleted: true };
    },
    {
      params: t.Object({
        reportId: t.String(),
      }),
      response: {
        200: t.Object({
          ok: t.Literal(true),
          deleted: t.Boolean(),
        }),
        404: t.Object({
          ok: t.Literal(false),
          error: t.String(),
        }),
      },
      detail: {
        summary: "Delete report",
        description: "Deletes an evaluation report by ID.",
        tags: ["Evaluation"],
      },
    }
  )

  /**
   * GET /api/evaluation/metrics
   * Get metrics for a test run with optional filters
   */
  .get(
    "/metrics",
    async ({ query, set }) => {
      const result = await EvaluationService.getMetrics(query as any);

      if (!result.ok) {
        set.status = 400;
        return { ok: false, error: result.error };
      }

      return result.data;
    },
    {
      query: t.Object({
        testRunId: t.String(),
        metricTypes: t.Optional(t.Array(t.String())),
        agentIds: t.Optional(t.Array(t.String())),
      }),
      detail: {
        summary: "Get metrics",
        description:
          "Retrieves metrics for a test run with optional filters by metric type and agent.",
        tags: ["Evaluation"],
      },
    }
  )

  /**
   * GET /api/evaluation/stats
   * Get repository statistics
   */
  .get(
    "/stats",
    async ({ set }) => {
      const result = await EvaluationService.getStats();

      if (!result.ok) {
        set.status = 500;
        return { ok: false, error: result.error };
      }

      return result.data;
    },
    {
      response: {
        200: t.Object({
          totalMetrics: t.Number(),
          totalReports: t.Number(),
          metricsByType: t.Record(t.String(), t.Number()),
        }),
      },
      detail: {
        summary: "Get statistics",
        description: "Returns statistics about stored metrics and reports.",
        tags: ["Evaluation"],
      },
    }
  )

  /**
   * GET /api/evaluation/health
   * Health check endpoint
   */
  .get(
    "/health",
    () => ({
      status: "ok",
      service: "evaluation",
      metricsRegistered: 5,
    }),
    {
      response: {
        200: t.Object({
          status: t.String(),
          service: t.String(),
          metricsRegistered: t.Number(),
        }),
      },
      detail: {
        summary: "Health check",
        description: "Check if evaluation service is running and healthy.",
        tags: ["Evaluation"],
      },
    }
  );

console.log("[Evaluation] Controller initialized with 8 API endpoints");
