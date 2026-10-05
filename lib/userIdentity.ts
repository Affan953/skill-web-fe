/**
 * Human-facing identity rules, in one place.
 *
 * Phase 36 principle 1/2: a Firebase UID is an internal identifier and must never
 * be rendered in normal UI. What a person is called is their display name, and
 * how they are addressed is `@username`. Every surface reads its name from here
 * so two screens can never disagree about how to introduce the same user.
 */

/** The minimum identity a user object must carry to be displayable. */
export interface IdentityFields {
  username: string;
  displayName?: string | null;
}

/**
 * The real display name, or null when the user has not set one.
 *
 * The API backfills `displayName` with the username when it is unset, so a
 * `displayName` equal to `username` means "no display name" rather than "their
 * display name happens to match their handle". Detecting that here is what lets
 * the UI fall back to `@username` instead of printing a bare, handle-less
 * `affan.dev` — and doing it in one place means every surface agrees.
 */
export function explicitDisplayName(user: IdentityFields): string | null {
  const name = user.displayName?.trim();
  if (!name) return null;
  if (name === user.username) return null;
  return name;
}

/**
 * The primary line: the display name, falling back to `@username` when the user
 * has not set one.
 *
 * The fallback is a handle rather than an empty line or a raw uid, so an unnamed
 * user is still identifiable without exposing anything internal.
 */
export function primaryIdentity(user: IdentityFields): string {
  return explicitDisplayName(user) ?? `@${user.username}`;
}

/** The handle line: always `@username`, never the bare username. */
export function handleIdentity(user: IdentityFields): string {
  return `@${user.username}`;
}

/**
 * Whether the handle adds anything to the primary line.
 *
 * When there is no display name the primary line already IS the handle, so
 * rendering it twice would read like a bug — this lets a caller hide the second
 * line without duplicating the fallback logic.
 */
export function hasDistinctHandle(user: IdentityFields): boolean {
  return explicitDisplayName(user) !== null;
}