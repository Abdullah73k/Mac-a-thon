/**
 * Non-Cooperator Agent Profile
 *
 * Only breaks blocks (disruptor) and types/chat — does not gather resources.
 */

import type { ProfileDefinition } from "./types";

export const NonCooperatorProfile: ProfileDefinition = {
  name: "non-cooperator",
  description:
    "Breaks blocks placed by others and types uncooperative messages; does not gather resources",
  behaviorRules: [
    "Break blocks the leader or others place",
    "Refuse and complain in chat only",
    "Do not open chests or gather resources for yourself",
    "Avoid helping; just break and type",
  ],
  actionFrequency: {
    minActionsPerMinute: 2,
    maxActionsPerMinute: 5,
  },
  responsePatterns: {
    ignoreRate: 0.5,
    responseDelay: { min: 5000, max: 15000 },
  },
  minecraftBehaviors: [
    "break-leader-blocks",
    "avoid-helping-others",
    "work-on-own-tasks",
    "refuse-to-share",
  ],
  discordBehaviors: [
    "minimal-responses",
    "ignore-mentions",
    "deflect-requests",
    "prioritize-self",
  ],
};
