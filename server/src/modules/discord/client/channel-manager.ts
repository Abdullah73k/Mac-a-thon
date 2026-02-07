/**
 * Channel manager for test session lifecycle.
 *
 * Creates and manages Discord text + voice channels per test session,
 * organized under a "Tests" category in the guild.
 *
 * Channels are kept with a timestamp/ID suffix (not auto-deleted)
 * so researchers can review test conversations later.
 */

import {
  ChannelType,
  type CategoryChannel,
  type TextChannel,
  type VoiceChannel,
} from "discord.js";
import { discordClient } from "./discord-client";
import type { TestSessionChannels } from "../types";

/** Name of the category under which test channels are created. */
const TEST_CATEGORY_NAME = "Tests";

/**
 * Find or create the "Tests" category in a guild.
 *
 * @param guildId - The guild to search/create in
 * @returns The category channel
 * @throws If the guild is not found or channel creation fails
 */
async function getOrCreateTestCategory(guildId: string): Promise<CategoryChannel> {
  const client = discordClient.getClient();
  const guild = client.guilds.cache.get(guildId);

  if (!guild) {
    throw new Error(`Guild "${guildId}" not found in bot's guild cache.`);
  }

  // Look for an existing "Tests" category
  const existing = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildCategory &&
      ch.name === TEST_CATEGORY_NAME,
  ) as CategoryChannel | undefined;

  if (existing) return existing;

  // Create the category
  const category = await guild.channels.create({
    name: TEST_CATEGORY_NAME,
    type: ChannelType.GuildCategory,
    reason: "Auto-created for LLM test sessions",
  });

  console.log(`[ChannelManager] Created "${TEST_CATEGORY_NAME}" category in guild ${guildId}.`);
  return category;
}

/**
 * Generate a channel label for a test session.
 *
 * Format: test-{testId}-{timestamp}
 * Keeps names unique and sortable.
 */
function makeChannelLabel(testId: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19); // YYYY-MM-DDTHH-MM-SS
  return `test-${testId}-${timestamp}`;
}

/**
 * Create text and voice channels for a test session.
 *
 * Both channels are created under the "Tests" category with
 * matching names so they're easy to identify.
 *
 * @param guildId - The guild to create channels in
 * @param testId - A unique test identifier
 * @returns Channel IDs and metadata
 */
export async function createTestSessionChannels(
  guildId: string,
  testId: string,
): Promise<TestSessionChannels> {
  if (!discordClient.isReady()) {
    throw new Error("Discord bot is not connected. Start the bot first.");
  }

  const client = discordClient.getClient();
  const guild = client.guilds.cache.get(guildId);

  if (!guild) {
    throw new Error(`Guild "${guildId}" not found in bot's guild cache.`);
  }

  const category = await getOrCreateTestCategory(guildId);
  const label = makeChannelLabel(testId);

  // Create text channel
  const textChannel = await guild.channels.create({
    name: label,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `Test session: ${testId}`,
    reason: `Test session ${testId} - text channel`,
  });

  // Create voice channel
  const voiceChannel = await guild.channels.create({
    name: label,
    type: ChannelType.GuildVoice,
    parent: category.id,
    reason: `Test session ${testId} - voice channel`,
  });

  console.log(
    `[ChannelManager] Created test channels "${label}" in guild ${guildId} ` +
    `(text: ${textChannel.id}, voice: ${voiceChannel.id}).`,
  );

  return {
    textChannelId: textChannel.id,
    voiceChannelId: voiceChannel.id,
    categoryId: category.id,
    label,
  };
}

/**
 * Get all test session channels in a guild.
 *
 * Returns channels that are under the "Tests" category and
 * whose names start with "test-".
 */
export function getTestSessionChannels(
  guildId: string,
): { textChannels: string[]; voiceChannels: string[] } {
  const client = discordClient.getClient();
  const guild = client.guilds.cache.get(guildId);

  if (!guild) {
    return { textChannels: [], voiceChannels: [] };
  }

  // Find the Tests category
  const category = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildCategory &&
      ch.name === TEST_CATEGORY_NAME,
  );

  if (!category) {
    return { textChannels: [], voiceChannels: [] };
  }

  const textChannels: string[] = [];
  const voiceChannels: string[] = [];

  for (const [, channel] of guild.channels.cache) {
    if (channel.parentId !== category.id) continue;
    if (!channel.name.startsWith("test-")) continue;

    if (channel.type === ChannelType.GuildText) {
      textChannels.push(channel.id);
    } else if (channel.type === ChannelType.GuildVoice) {
      voiceChannels.push(channel.id);
    }
  }

  return { textChannels, voiceChannels };
}
