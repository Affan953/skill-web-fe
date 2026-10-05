import type { GrowthActivityType, GrowthFeedItem } from "@/types";

/** Render-only, type-specific headline copy derived from the metadata snapshot. */
export interface ActivityHeadline {
  verb: string;
  entity: string;
  quote: boolean;
}

/**
 * Derives the "completed X" sentence from an activity's type + metadata
 * snapshot. Missing metadata degrades to generic copy rather than rendering
 * blanks, because the snapshot is write-once and can outlive the entity.
 */
export function activityHeadline(
  type: GrowthActivityType,
  metadata: GrowthFeedItem["metadata"]
): ActivityHeadline {
  switch (type) {
    case "HABIT_COMPLETED": {
      const habitName = String(metadata.habitName ?? "").trim();
      return habitName
        ? { verb: "completed", entity: habitName, quote: true }
        : { verb: "completed", entity: "a habit", quote: false };
    }
    case "STREAK_MILESTONE": {
      const streak = typeof metadata.streak === "number" ? metadata.streak : null;
      return streak && streak > 0
        ? { verb: "reached", entity: `a ${streak}-day streak`, quote: false }
        : { verb: "reached", entity: "a new streak milestone", quote: false };
    }
    case "ACHIEVEMENT_UNLOCKED": {
      const achievementName = String(metadata.achievementName ?? "").trim();
      return achievementName
        ? { verb: "unlocked", entity: achievementName, quote: true }
        : { verb: "unlocked", entity: "an achievement", quote: false };
    }
    case "DAILY_QUEST_COMPLETED": {
      const questName = String(metadata.questName ?? "").trim();
      return questName
        ? { verb: "completed", entity: questName, quote: true }
        : { verb: "completed", entity: "a daily quest", quote: false };
    }
  }
}

/** Flat sentence form, e.g. `completed “Read 20 minutes”`. */
export function formatActivityHeadline(
  type: GrowthActivityType,
  metadata: GrowthFeedItem["metadata"]
): string {
  const { verb, entity, quote } = activityHeadline(type, metadata);
  return `${verb} ${quote ? `“${entity}”` : entity}`;
}
