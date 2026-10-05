/**
 * Presentation-time rules for the messaging surfaces.
 *
 * Deliberately pure and framework-free: the conversation list and the thread both
 * read these same functions, so a timestamp can never be formatted one way in
 * the list and a different way in the thread.
 */

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Consecutive messages from the same person closer together than this are drawn
 * as one visual group. A pause this long is a new thought, not a continuation.
 */
export const MESSAGE_GROUP_GAP_MS = 5 * MS_PER_MINUTE;

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Midnight-anchored day number in UTC space.
 *
 * Comparing `Date.UTC(y, m, d)` of two local dates gives an exact day count even
 * across a DST boundary, where subtracting two local midnights does not (the
 * day is 23 or 25 hours long, and rounding drifts a whole day in spring).
 */
function localDayNumber(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole days from `value` to `now`; 0 is today, 1 is yesterday. Null if unparsable. */
export function dayDifference(
  value: string | Date | null | undefined,
  now: Date = new Date()
): number | null {
  const date = toDate(value);
  if (!date) return null;
  return Math.round((localDayNumber(now) - localDayNumber(date)) / MS_PER_DAY);
}

/** `Today` / `Yesterday` / `Monday, August 10` / `Monday, August 10, 2024`. */
export function daySeparatorLabel(
  value: string | Date | null | undefined,
  now: Date = new Date()
): string {
  const date = toDate(value);
  if (!date) return "";

  const diff = dayDifference(date, now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

/** `2:05 PM` in the reader's locale. */
export function timeOfDayLabel(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Absolute timestamp for tooltips and screen readers. */
export function fullTimestampLabel(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Compact relative label for a dense list row: `2m`, `5h`, `3d`, `12 Aug`.
 *
 * The list has room for a couple of characters, not for "2 min ago" — and a
 * wider label is what pushes the message preview into truncation on a 340px
 * pane. Anything older than a week falls back to a date rather than counting
 * weeks, because "3w" stops being useful context in an inbox.
 */
export function relativeTimeShort(
  value: string | Date | null | undefined,
  now: number = Date.now()
): string {
  const date = toDate(value);
  if (!date) return "";

  const elapsed = now - date.getTime();
  if (elapsed < 0) return timeOfDayLabel(date);
  if (elapsed < MS_PER_MINUTE) return "now";
  if (elapsed < MS_PER_HOUR) return `${Math.floor(elapsed / MS_PER_MINUTE)}m`;
  if (elapsed < MS_PER_DAY) return `${Math.floor(elapsed / MS_PER_HOUR)}h`;
  if (elapsed < 7 * MS_PER_DAY) return `${Math.floor(elapsed / MS_PER_DAY)}d`;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === new Date(now).getFullYear() ? {} : { year: "numeric" }),
  });
}

/**
 * Whether a message should start a new visual group.
 *
 * A group boundary is what decides where the avatar and the timestamp appear,
 * so it must be decided from data rather than from layout.
 */
export function startsNewMessageGroup(input: {
  isNewDay: boolean;
  sameSenderAsPrevious: boolean;
  gapMs: number;
  gapThresholdMs?: number;
}): boolean {
  if (input.isNewDay) return true;
  if (!input.sameSenderAsPrevious) return true;
  return input.gapMs > (input.gapThresholdMs ?? MESSAGE_GROUP_GAP_MS);
}

/** Whether two messages fall on different calendar days. */
export function isDifferentDay(
  previous: string | Date | null | undefined,
  next: string | Date | null | undefined
): boolean {
  const a = toDate(previous);
  const b = toDate(next);
  if (!a || !b) return false;
  return localDayNumber(a) !== localDayNumber(b);
}
