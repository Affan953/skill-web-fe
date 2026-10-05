"use client";

import { useEffect, type RefObject } from "react";

/**
 * Keeps keyboard focus inside a modal dialog while it is open.
 *
 * A dialog marked `aria-modal="true"` promises the rest of the page is
 * unavailable, but without this the promise is false: Tab walks straight out of
 * the dialog into the page behind it, and a keyboard user ends up editing an
 * invisible form. This is the one place that logic lives, so every modal in the
 * app can opt in instead of reimplementing it.
 *
 * It also does the two things a modal owes the user around focus:
 *
 * - On open, focus moves into the dialog (the first focusable element, or the
 *   container itself when there is nothing to focus).
 * - On close, focus returns to whatever was focused before, so a keyboard user
 *   is not dropped at the top of the document.
 *
 * The background is scroll-locked for the same reason: without it the page
 * behind scrolls under a "modal" and the content shifts while you are typing.
 *
 * The container should be the element carrying `role="dialog"`, and it must
 * render a `<div>` (or `<section>`) with `tabIndex={-1}` so it can receive
 * focus when it holds no focusable children.
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // Captured before anything moves focus, so it can be restored on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // A dialog with no focusable child still needs to hold focus itself.
    if (!container.contains(document.activeElement)) {
      const first = getFocusable(container)[0];
      (first ?? container).focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = getFocusable(container);
      // Nothing to cycle through — keep focus on the container.
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      // Only wrap at the two ends; let Shift+Tab and Tab work normally inside.
      if (event.shiftKey && (current === first || current === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Returning focus can throw if the element was unmounted with the dialog
      // (a list row that no longer exists, for instance).
      previouslyFocused?.focus?.();
    };
  }, [active, containerRef]);
}

/**
 * Everything a user can actually Tab to, in document order.
 *
 * `offsetParent === null` filters out `display: none` subtrees, which is how
 * closed conditional sections inside a dialog are excluded without tracking
 * their state here.
 */
function getFocusable(container: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => el.offsetParent !== null,
  );
}