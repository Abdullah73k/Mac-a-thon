/**
 * Records testing-agent activity and broadcasts to WebSocket clients.
 *
 * Called from the behavior executor when agents perform actions or send chat,
 * so the dashboard can show live updates (metrics, action timeline, chat feed).
 */

import { testEvents } from "./events/event-emitter";
import { testingRepository } from "./repository";

export interface RecordActivityOptions {
  /** Emit agent-action event and increment testingAgentActionCount. */
  action?: { actionType: string; actionDetail: string; success: boolean };
  /** Emit test-chat-message and increment testingAgentMessageCount. */
  chat?: { message: string; channel: "text" | "voice" };
}

/**
 * Record one or both: agent action and/or chat message.
 * Updates test metrics and emits events so the dashboard receives live updates.
 */
export async function recordTestingAgentActivity(
  testId: string,
  agentId: string,
  opts: RecordActivityOptions,
): Promise<void> {
  const timestamp = new Date().toISOString();

  if (opts.action) {
    testEvents.emitEvent("agent-action", {
      testId,
      agentId,
      sourceType: "testing-agent",
      actionType: opts.action.actionType,
      actionDetail: opts.action.actionDetail,
      success: opts.action.success,
      timestamp,
    });
    await testingRepository.incrementMetric(testId, "testingAgentActionCount");
  }

  if (opts.chat) {
    testEvents.emitEvent("test-chat-message", {
      testId,
      agentId,
      sourceType: "testing-agent",
      message: opts.chat.message,
      channel: opts.chat.channel,
      timestamp,
    });
    await testingRepository.incrementMetric(testId, "testingAgentMessageCount");
  }

  if (opts.action || opts.chat) {
    const testRun = await testingRepository.findById(testId);
    if (testRun) {
      testEvents.emitEvent("test-metrics-updated", {
        testId,
        metrics: testRun.metrics,
        timestamp,
      });
    }
  }
}
