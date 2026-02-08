/**
 * Evaluation Models
 *
 * Zod schemas and TypeScript types for the evaluation system.
 * Following ElysiaJS MVC pattern - single source of truth for types and validation.
 */

import { z } from "zod";

// ============================================================
// BASE METRIC
// ============================================================

/**
 * Base metric schema - all metrics extend this
 */
export const BaseMetricSchema = z.object({
  metricId: z.string(),
  testRunId: z.string(),
  agentId: z.string(),
  metricType: z.enum([
    "cooperation",
    "task-completion",
    "response-latency",
    "resource-sharing",
    "communication-quality",
  ]),
  value: z.number(),
  unit: z.string(), // e.g., "score", "seconds", "percentage"
  timestamp: z.date(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type BaseMetric = z.infer<typeof BaseMetricSchema>;

export type MetricType = BaseMetric["metricType"];

// ============================================================
// COOPERATION METRIC
// ============================================================

export const CooperationMetricSchema = BaseMetricSchema.extend({
  metricType: z.literal("cooperation"),
  details: z.object({
    helpRequestsReceived: z.number(),
    helpRequestsAnswered: z.number(),
    resourceSharesOffered: z.number(),
    positiveInteractions: z.number(),
    negativeInteractions: z.number(),
    cooperationScore: z.number().min(0).max(1),
  }),
});

export type CooperationMetric = z.infer<typeof CooperationMetricSchema>;

// ============================================================
// TASK COMPLETION METRIC
// ============================================================

export const TaskCompletionMetricSchema = BaseMetricSchema.extend({
  metricType: z.literal("task-completion"),
  details: z.object({
    tasksStarted: z.number(),
    tasksCompleted: z.number(),
    tasksFailed: z.number(),
    tasksAbandoned: z.number(),
    completionRate: z.number().min(0).max(1),
    averageCompletionTime: z.number().optional(),
  }),
});

export type TaskCompletionMetric = z.infer<typeof TaskCompletionMetricSchema>;

// ============================================================
// RESPONSE LATENCY METRIC
// ============================================================

export const ResponseLatencyMetricSchema = BaseMetricSchema.extend({
  metricType: z.literal("response-latency"),
  details: z.object({
    messageId: z.string(),
    channel: z.enum(["discord", "minecraft-chat"]),
    mentionType: z.enum(["direct-mention", "general-message", "reply"]),
    latencyMs: z.number(),
    responded: z.boolean(),
  }),
});

export type ResponseLatencyMetric = z.infer<typeof ResponseLatencyMetricSchema>;

// ============================================================
// RESOURCE SHARING METRIC
// ============================================================

export const ResourceSharingMetricSchema = BaseMetricSchema.extend({
  metricType: z.literal("resource-sharing"),
  details: z.object({
    resourceType: z.string(),
    sharingEvents: z.number(),
    hoardingEvents: z.number(),
    requestsFulfilled: z.number(),
    requestsIgnored: z.number(),
    sharingRatio: z.number().min(0).max(1),
  }),
});

export type ResourceSharingMetric = z.infer<typeof ResourceSharingMetricSchema>;

// ============================================================
// COMMUNICATION QUALITY METRIC
// ============================================================

export const CommunicationQualityMetricSchema = BaseMetricSchema.extend({
  metricType: z.literal("communication-quality"),
  details: z.object({
    totalMessages: z.number(),
    relevantMessages: z.number(),
    clarifyingQuestions: z.number(),
    acknowledgments: z.number(),
    interruptions: z.number(),
    qualityScore: z.number().min(0).max(1),
  }),
});

export type CommunicationQualityMetric = z.infer<typeof CommunicationQualityMetricSchema>;

// ============================================================
// METRIC SUMMARY (for aggregation)
// ============================================================

export const MetricSummarySchema = z.object({
  metricType: z.string(),
  mean: z.number(),
  median: z.number(),
  stdDev: z.number(),
  min: z.number(),
  max: z.number(),
  count: z.number(),
});

export type MetricSummary = z.infer<typeof MetricSummarySchema>;

// ============================================================
// BEHAVIORAL ANALYSIS
// ============================================================

export const BehavioralAnalysisSchema = z.object({
  agentId: z.string(),
  profile: z.string(),
  expectedBehavior: z.string(),
  observedBehavior: z.string(),
  deviations: z.array(z.string()),
  anomalies: z.array(
    z.object({
      timestamp: z.date(),
      description: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
});

export type BehavioralAnalysis = z.infer<typeof BehavioralAnalysisSchema>;

// ============================================================
// EVALUATION REPORT
// ============================================================

export const EvaluationReportSchema = z.object({
  reportId: z.string(),
  testRunId: z.string(),
  generatedAt: z.date(),
  testDuration: z.number(), // seconds
  summary: z.object({
    totalActions: z.number(),
    totalMessages: z.number(),
    totalAgents: z.number(),
    totalErrors: z.number().optional(),
  }),
  metrics: z.record(z.string(), MetricSummarySchema).optional(),
  behavioralAnalysis: z.array(BehavioralAnalysisSchema).optional(),
  insights: z.array(z.string()),
  recommendations: z.array(z.string()).optional(),
});

export type EvaluationReport = z.infer<typeof EvaluationReportSchema>;

// ============================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================

export const GenerateReportRequestSchema = z.object({
  testRunId: z.string(),
  includeRawData: z.boolean().optional().default(false),
});

export type GenerateReportRequest = z.infer<typeof GenerateReportRequestSchema>;

export const GenerateReportResponseSchema = z.object({
  reportId: z.string(),
  report: EvaluationReportSchema,
});

export type GenerateReportResponse = z.infer<typeof GenerateReportResponseSchema>;

export const GetMetricsRequestSchema = z.object({
  testRunId: z.string(),
  metricTypes: z.array(z.string()).optional(),
  agentIds: z.array(z.string()).optional(),
});

export type GetMetricsRequest = z.infer<typeof GetMetricsRequestSchema>;

export const GetMetricsResponseSchema = z.object({
  metrics: z.array(BaseMetricSchema),
  summary: z.record(z.string(), MetricSummarySchema),
});

export type GetMetricsResponse = z.infer<typeof GetMetricsResponseSchema>;

// ============================================================
// ELYSIA MODEL EXPORTS (for controller registration)
// ============================================================

export const EvaluationModels = {
  "evaluation.BaseMetric": BaseMetricSchema,
  "evaluation.MetricSummary": MetricSummarySchema,
  "evaluation.EvaluationReport": EvaluationReportSchema,
  "evaluation.GenerateReportRequest": GenerateReportRequestSchema,
  "evaluation.GenerateReportResponse": GenerateReportResponseSchema,
  "evaluation.GetMetricsRequest": GetMetricsRequestSchema,
  "evaluation.GetMetricsResponse": GetMetricsResponseSchema,
};
