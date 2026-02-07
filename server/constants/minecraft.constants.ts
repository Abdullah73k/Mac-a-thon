export const MINECRAFT_HOST =
  process.env.MINECRAFT_HOST ?? "localhost";

export const MINECRAFT_PORT =
  Number(process.env.MINECRAFT_PORT) || 25565;

export const MINECRAFT_VERSION =
  process.env.MINECRAFT_VERSION ?? "1.21.1";

/** Pre-configured bot usernames from environment variables. */
export const BOT_USERNAMES: string[] = [
  process.env.BOT_USERNAME_1,
  process.env.BOT_USERNAME_2,
  process.env.BOT_USERNAME_3,
].filter((u): u is string => typeof u === "string" && u.length > 0);

/** Maximum number of concurrent bots allowed. */
export const MAX_CONCURRENT_BOTS = 10;

/** Rate-limit: max actions per second per bot. */
export const MAX_ACTIONS_PER_SECOND = 5;

/** Bot reconnect delay in milliseconds. */
export const RECONNECT_DELAY_MS = 3000;

/** Bot state polling interval in milliseconds. */
export const STATE_POLL_INTERVAL_MS = 250;
