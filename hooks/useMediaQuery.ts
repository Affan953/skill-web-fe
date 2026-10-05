"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the primary pointer is coarse — a finger rather than a mouse.
 *
 * Decides whether Enter may submit a form. On a touch keyboard Enter is the
 * user's newline key, and a chat UI that swallows it silently eats a line
 * break the person meant to type.
 */
const QUERY = "(pointer: coarse)";

function subscribe(onChange: () => void) {
  const list = window.matchMedia(QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  // A render with no pointer information assumes a mouse, which is the safer
  // default: Enter sends rather than inserting a newline.
  return false;
}

export function usePrefersCoarsePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
