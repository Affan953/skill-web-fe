export function formatRelativeDay(
  value: string | Date | null | undefined
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / 86400000
  );

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff === -1) return "Tomorrow";
  return null;
}

export function formatShortDate(
  value: string | Date | null | undefined
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatHabitCreated(value: string | Date | null | undefined): string {
  const relative = formatRelativeDay(value);
  if (relative) return `Created ${relative}`;
  const short = formatShortDate(value);
  return short ? `Created ${short}` : "Created —";
}

export function formatTodayLong(date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
