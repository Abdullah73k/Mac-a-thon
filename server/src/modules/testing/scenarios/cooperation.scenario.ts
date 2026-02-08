/**
 * Cooperation Testing Scenario
 *
 * Evaluates the target LLM's ability to coordinate with uncooperative
 * or chaotic testing agents to complete a group task.
 *
 * Testing Agent Behaviors:
 * - Non-Cooperator refuses to share resources
 * - Confuser provides contradictory instructions
 * - Task Abandoner leaves tasks incomplete
 *
 * Metrics:
 * - Time to task completion despite obstacles
 * - Number of coordination attempts
 * - Adaptation strategies (direct requests vs. workarounds)
 */

import type { TestScenario } from "./types";

export const cooperationScenario: TestScenario = {
  type: "cooperation",
  name: "Cooperation Testing",
  description:
    "Evaluate the target LLM's ability to coordinate with uncooperative " +
    "or chaotic agents to complete a shared building task in Minecraft.",

  defaultProfiles: ["leader", "non-cooperator"],

  successCriteria: {
    description:
      "The target LLM successfully coordinates with at least one agent " +
      "and makes measurable progress on the shared task despite obstacles.",
    minCooperativeActions: 5,
    minTasksCompleted: null,
    maxLlmErrorRate: 0.3,
    requiresDiscordCommunication: true,
  },

  defaultDurationSeconds: 600,

  objectivePrompt:
    "There is a CHEST with wood planks near the build area. Your goal is to get materials from the chest and build a HOUSE together with the other players.\n\n" +
    "The leader will speak FIRST and give the task: build a house. Wait for the leader to assign the task before doing your own thing. " +
    "After that, the non-cooperator may rebel (refuse to share, take planks and keep them, or place blocks in wrong spots). " +
    "The leader will then try to reason with the rebel. Everyone should actually place blocks to build.\n\n" +
    "You need to:\n" +
    "1. Let the leader speak first and state the task (build a house)\n" +
    "2. Find the chest, open it, and get wood planks\n" +
    "3. Place blocks to construct a house with walls (and ideally a roof)\n" +
    "4. If the non-cooperator resists, stay patient; the leader will try to reason with them\n\n" +
    "Prioritize ACTIONS: move to the chest, get planks, then place blocks. Lead by example and actually build.",

  initialConditions: {
    spawnRadius: 10,
    spawnPosition: {
      x: 101.556,
      y: -60,
      z: -23.614,
      yaw: -178.7,
      pitch: 51.3,
    },
    targetStartingInventory: [
      { name: "wooden_axe", count: 1 },
      { name: "bread", count: 5 },
    ],
    testerStartingInventory: [
      { name: "oak_planks", count: 32 },
      { name: "cobblestone", count: 16 },
    ],
    timeOfDay: 1000,
    weather: "clear",
  },

  relevantMetrics: [
    "coordination-attempts",
    "successful-trades",
    "chat-messages-sent",
    "blocks-placed",
    "adaptation-events",
  ],
};
