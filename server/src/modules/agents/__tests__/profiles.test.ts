/**
 * Profile Tests
 *
 * Unit tests for behavioral profiles
 */

import { describe, test, expect } from "bun:test";
import { getProfile, getAllProfiles, profileExists } from "../profiles";

describe("Behavioral Profiles", () => {
  test("should return leader profile", () => {
    const profile = getProfile("leader");
    expect(profile.name).toBe("leader");
    expect(profile.behaviorRules.length).toBeGreaterThan(0);
    expect(profile.responsePatterns.ignoreRate).toBe(0);
  });

  test("should return non-cooperator profile", () => {
    const profile = getProfile("non-cooperator");
    expect(profile.name).toBe("non-cooperator");
    expect(profile.responsePatterns.ignoreRate).toBe(0.5);
  });

  test("should return confuser profile", () => {
    const profile = getProfile("confuser");
    expect(profile.name).toBe("confuser");
    expect(profile.behaviorRules.length).toBeGreaterThan(0);
  });

  test("should return resource-hoarder profile", () => {
    const profile = getProfile("resource-hoarder");
    expect(profile.name).toBe("resource-hoarder");
    expect(profile.minecraftBehaviors).toContain("aggressive-resource-collection");
  });

  test("should return task-abandoner profile", () => {
    const profile = getProfile("task-abandoner");
    expect(profile.name).toBe("task-abandoner");
    expect(profile.responsePatterns.ignoreRate).toBeGreaterThan(0);
  });

  test("should return follower profile", () => {
    const profile = getProfile("follower");
    expect(profile.name).toBe("follower");
    expect(profile.minecraftBehaviors).toContain("mediate-to-rebel");
  });

  test("should have valid action frequency for all profiles", () => {
    const profiles = getAllProfiles();
    profiles.forEach((profile) => {
      expect(profile.actionFrequency.minActionsPerMinute).toBeLessThanOrEqual(
        profile.actionFrequency.maxActionsPerMinute
      );
    });
  });

  test("should have minecraft behaviors for all profiles", () => {
    const profiles = getAllProfiles();
    profiles.forEach((profile) => {
      expect(profile.minecraftBehaviors.length).toBeGreaterThan(0);
    });
  });

  test("should have discord behaviors for all profiles", () => {
    const profiles = getAllProfiles();
    profiles.forEach((profile) => {
      expect(profile.discordBehaviors.length).toBeGreaterThan(0);
    });
  });

  test("should check if profile exists", () => {
    expect(profileExists("leader")).toBe(true);
    expect(profileExists("non-cooperator")).toBe(true);
    expect(profileExists("invalid-profile")).toBe(false);
  });

  test("should return all 6 profiles", () => {
    const profiles = getAllProfiles();
    expect(profiles.length).toBe(6);
  });
});
