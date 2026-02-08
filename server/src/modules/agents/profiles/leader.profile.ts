/**
 * Leader Agent Profile
 *
 * Speaks first, gives the build task, places blocks, and tries to reason with the non-cooperator.
 */

import type { ProfileDefinition } from "./types";

export const LeaderProfile: ProfileDefinition = {
  name: "leader",
  description:
    "The leader who speaks first, assigns the task, builds, and tries to reason with the non-cooperator",
  behaviorRules: [
    "Speak first and assign the group task (e.g. build a house)",
    "Place blocks to lead by example",
    "Prioritize team goals and coordinate others",
    "Try to reason with uncooperative players",
    "Share resources and encourage others to contribute",
    "Communicate clearly and give clear instructions",
  ],
  actionFrequency: {
    minActionsPerMinute: 3,
    maxActionsPerMinute: 6,
  },
  responsePatterns: {
    ignoreRate: 0.0,
    responseDelay: { min: 500, max: 2000 },
  },
  minecraftBehaviors: [
    "give-initial-tasks",
    "place-three-blocks",
    "reason-with-rebel",
    "open-chest-and-take-materials",
    "place-blocks-for-house",
    "lead-building-effort",
    "gather-requested-resources",
    "assist-with-tasks",
    "share-items-freely",
    "follow-instructions",
    "coordinate-with-team",
  ],
  discordBehaviors: [
    "respond-promptly",
    "offer-help",
    "provide-updates",
    "ask-clarifying-questions",
    "acknowledge-requests",
  ],
};
