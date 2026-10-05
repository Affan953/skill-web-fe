"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the document is currently visible to the user.
 *
 * `useSyncExternalStore` rather than an effect plus state: the browser already
 * owns this value and broadcasts changes, so subscribing to it directly avoids
 * a render that exists only to catch up with reality after the first paint.
 *
 * A background tab is not a state the UI should render differently for — it is
 * only a reason to stop asking the server questions — so the flag carries no
 * visual treatment of its own.
 */
function subscribe(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function getSnapshot() {
  return document.visibilityState === "visible";
}

/** Server rendering has no visibility to report; a returning client is visible. */
function getServerSnapshot() {
  return true;
}

export function useDocumentVisibility(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
