/** Share helpers for growth activities. */

export interface ShareActivityInput {
  activityId: string;
  actorName: string;
  /** Render-only headline, e.g. `completed “Read 20 minutes”`. */
  headline: string;
}

export interface ShareActivityResult {
  /** Which transport actually delivered the link. */
  method: "share" | "clipboard";
  url: string;
}

export type ShareOutcome =
  | { ok: true; result: ShareActivityResult }
  | { ok: false; error: string };

/** In-app path for a single activity (must match app/(app)/feed/activity/[id]). */
export function activityPathname(activityId: string): string {
  return `/feed/activity/${encodeURIComponent(activityId)}`;
}

/** Absolute share URL for a single activity. */
export function activityShareUrl(activityId: string): string {
  const path = activityPathname(activityId);
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function activityShareText(input: ShareActivityInput): string {
  return `${input.actorName} ${input.headline} on SkillUp`;
}

function writeToClipboard(text: string): Promise<boolean> {
  // Prefer the async clipboard API; the textarea path keeps older browsers
  // and insecure origins working.
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => false
    );
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return Promise.resolve(ok);
  } catch {
    return Promise.resolve(false);
  }
}

/**
 * Shares an activity via the native share sheet when available (so the target
 * app can do something meaningful with it), otherwise falls back to copying the
 * link. Resolves to the transport used, or an error string when both failed.
 */
export async function shareActivity(
  input: ShareActivityInput
): Promise<ShareOutcome> {
  const url = activityShareUrl(input.activityId);
  const title = "SkillUp";
  const text = activityShareText(input);

  const canUseNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  if (canUseNativeShare) {
    try {
      await navigator.share({ title, text, url });
      return { ok: true, result: { method: "share", url } };
    } catch (error) {
      // A user-cancelled share must not surface as a failure or fall back to
      // copying — they simply chose not to share.
      if (
        error instanceof DOMException &&
        (error.name === "AbortError" || error.name === "NotAllowedError")
      ) {
        return { ok: false, error: "Share cancelled." };
      }
    }
  }

  const copied = await writeToClipboard(url);
  if (copied) {
    return { ok: true, result: { method: "clipboard", url } };
  }
  return {
    ok: false,
    error: "Couldn’t share or copy the link. You can copy it from the address bar.",
  };
}
