/**
 * Human-friendly relative time for feed timestamps.
 * Safe for any input — never throws and never returns "Invalid Date";
 * falls back to a locale date when the timestamp is absent/malformed
 * or too old to summarize.
 */
export function timeAgo(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return hours === 1 ? "1 hr ago" : `${hours} hrs ago`;
  }
  const days = Math.floor(seconds / 86400);
  if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;
  if (days < 31) return `${Math.floor(days / 7)} wks ago`;

  const fallback = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return Number.isNaN(Date.parse(fallback)) ? null : fallback;
}