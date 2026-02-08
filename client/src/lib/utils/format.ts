/**
 * Formatting utilities for dates, durations, and display values.
 */

/**
 * Format seconds into a human-readable duration string.
 * Example: 125 -> "2m 5s", 3661 -> "1h 1m 1s"
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}

/**
 * Format an ISO-8601 timestamp into a short local time string.
 * Example: "2026-02-07T20:08:01Z" -> "8:08 PM"
 */
export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format an ISO-8601 timestamp into a short date string.
 * Example: "2026-02-07T20:08:01Z" -> "Feb 7, 2026"
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a number with commas for readability.
 * Example: 1234567 -> "1,234,567"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Calculate elapsed seconds between a start time and now.
 */
export function getElapsedSeconds(startIso: string): number {
  const start = new Date(startIso).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 1000);
}
