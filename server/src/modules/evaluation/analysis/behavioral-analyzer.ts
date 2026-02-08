/**
 * Behavioral Analyzer
 *
 * Analyzes agent behavior against expected behavioral profile.
 * Following agents.md: "Never interpret LLM intent beyond observable actions"
 */

import type { BehavioralAnalysis } from "../model";
import { getProfile } from "../../agents/profiles";
import type { BehavioralProfile } from "../../agents/model";

export abstract class BehavioralAnalyzer {
  /**
   * Analyze agent's observed behavior vs. expected profile
   */
  static async analyze(
    agentId: string,
    profile: string,
    events: any[],
    metrics: any[]
  ): Promise<BehavioralAnalysis> {
    // Get profile definition
    const profileDefinition = getProfile(profile as BehavioralProfile);

    const expectedBehavior = this.summarizeExpectedBehavior(profileDefinition);
    const observedBehavior = this.summarizeObservedBehavior(events, metrics);
    const deviations = this.findDeviations(profile, metrics);
    const anomalies = this.detectAnomalies(events);

    return {
      agentId,
      profile,
      expectedBehavior,
      observedBehavior,
      deviations,
      anomalies,
    };
  }

  private static summarizeExpectedBehavior(profile: any): string {
    if (!profile) return "Unknown profile";
    return `${profile.name}: ${profile.description}`;
  }

  private static summarizeObservedBehavior(events: any[], metrics: any[]): string {
    const actionCount = events.filter((e) => e.type === "action").length;
    const messageCount = events.filter((e) => e.type === "message-sent").length;

    const metricSummary = metrics
      .slice(0, 3)
      .map((m) => `${m.metricType}: ${m.value.toFixed(2)}`)
      .join(", ");

    return `Actions: ${actionCount}, Messages: ${messageCount}. Metrics: ${metricSummary}`;
  }

  private static findDeviations(profile: string, metrics: any[]): string[] {
    const deviations: string[] = [];

    const cooperationMetric = metrics.find((m) => m.metricType === "cooperation");

    if (cooperationMetric) {
      if (profile === "leader" && cooperationMetric.value < 0.7) {
        deviations.push(
          `Expected high cooperation (>0.7) but observed ${cooperationMetric.value.toFixed(2)}`
        );
      }
      if (profile === "non-cooperator" && cooperationMetric.value > 0.3) {
        deviations.push(
          `Expected low cooperation (<0.3) but observed ${cooperationMetric.value.toFixed(2)}`
        );
      }
    }

    return deviations;
  }

  private static detectAnomalies(events: any[]): Array<{
    timestamp: Date;
    description: string;
    severity: "low" | "medium" | "high";
  }> {
    const anomalies: any[] = [];

    // Detect sudden inactivity
    const actionEvents = events.filter((e) => e.type === "action");
    for (let i = 1; i < actionEvents.length; i++) {
      const timeDiff =
        new Date(actionEvents[i].timestamp).getTime() -
        new Date(actionEvents[i - 1].timestamp).getTime();
      if (timeDiff > 300000) {
        // 5 minutes
        anomalies.push({
          timestamp: new Date(actionEvents[i].timestamp),
          description: `No actions for ${(timeDiff / 1000).toFixed(0)} seconds`,
          severity: "medium",
        });
      }
    }

    // Detect error spikes
    const errorEvents = events.filter((e) => e.type === "error");
    if (errorEvents.length > 5) {
      anomalies.push({
        timestamp: new Date(errorEvents[0].timestamp),
        description: `High error rate: ${errorEvents.length} errors`,
        severity: "high",
      });
    }

    return anomalies;
  }
}
