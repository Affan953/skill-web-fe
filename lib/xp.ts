// Shared XP / level math for the SkillUp UI.
// Mirrors skill-be/src/gamification/utils/level.util.ts (the single source
// of truth). "xp" everywhere is the user's TOTAL CUMULATIVE XP.

/** Base XP multiplier — XP needed to advance from level 1 to 2. */
export const XP_BASE = 100;

/** Cumulative XP required to REACH the start of a level (1-based). */
export function levelStartXP(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return ((l - 1) * l) / 2 * XP_BASE;
}

/** Cumulative XP required to reach the NEXT level after the given one. */
export function nextLevelXP(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return levelStartXP(l + 1);
}

/** How much XP the current level span is worth (level * XP_BASE). */
export function levelSpan(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return nextLevelXP(l) - levelStartXP(l);
}

/**
 * XP earned WITHIN the current level (0..span).
 * Input `xp` is total cumulative XP.
 */
export function xpIntoLevel(level: number, xp: number): number {
  const start = levelStartXP(level);
  const span = levelSpan(level);
  const into = xp - start;
  return Math.min(Math.max(into, 0), span);
}

/** Progress (0-1) through the current level. */
export function levelProgress(level: number, xp: number): number {
  const span = levelSpan(level);
  if (span <= 0) return 0;
  return Math.min(Math.max(xpIntoLevel(level, xp) / span, 0), 1);
}

/** Progress as a rounded whole percent (0-100). */
export function levelPercent(level: number, xp: number): number {
  return Math.min(Math.max(Math.round(levelProgress(level, xp) * 100), 0), 100);
}

/** Remaining XP to the next level. */
export function xpRemaining(level: number, xp: number): number {
  const span = levelSpan(level);
  return Math.max(span - xpIntoLevel(level, xp), 0);
}