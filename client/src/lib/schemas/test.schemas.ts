/**
 * Zod validation schemas for test-related API operations.
 * Used for form validation and API response parsing.
 */

import { z } from "zod";

const behavioralProfileSchema = z.enum([
  "cooperative",
  "non-cooperator",
  "confuser",
  "resource-hoarder",
  "task-abandoner",
  "over-communicator",
]);

const scenarioTypeSchema = z.enum([
  "cooperation",
  "resource-management",
]);

export const createTestRequestSchema = z.object({
  scenarioType: scenarioTypeSchema,
  targetLlmModel: z.string().min(1, "LLM model is required"),
  testingAgentProfiles: z
    .array(behavioralProfileSchema)
    .min(1, "Select at least one agent profile")
    .optional(),
  durationSeconds: z
    .number()
    .min(30, "Minimum duration is 30 seconds")
    .max(3600, "Maximum duration is 1 hour")
    .optional(),
  config: z
    .object({
      llmPollingIntervalMs: z.number().min(1000).max(30000).optional(),
      behaviorIntensity: z.number().min(0).max(1).optional(),
      enableVoice: z.boolean().optional(),
      enableText: z.boolean().optional(),
      targetLlmSystemPromptOverride: z.string().nullable().optional(),
      minecraftServer: z
        .object({
          host: z.string().min(1, "Host is required"),
          port: z
            .number()
            .min(1, "Port must be >= 1")
            .max(65535, "Port must be <= 65535"),
          version: z.string().min(1, "Version is required"),
        })
        .optional(),
    })
    .optional(),
});

export type CreateTestFormData = z.infer<typeof createTestRequestSchema>;
