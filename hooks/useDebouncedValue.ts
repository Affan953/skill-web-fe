"use client";

import { useEffect, useState } from "react";

/**
 * Debounces a rapidly-changing value.
 *
 * Search inputs update on every keystroke; the request must not. This is the one
 * place that delay is defined, so every search surface debounces identically
 * instead of each rolling its own `setTimeout` (which is what produced three
 * different delays before).
 *
 * `delayMs` of 0 returns the value immediately, which keeps the hook safe to
 * call unconditionally in tests and in server-rendered passes.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // With no delay the debounced value is just the value, so there is nothing
    // to schedule. Assigning it here instead of calling setState in the effect
    // body keeps this off the synchronous-render-update path.
    if (delayMs <= 0) return;
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    // Clearing on every change is what makes this a debounce rather than a
    // throttle: a fast typist only ever fires the final value.
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return delayMs <= 0 ? value : debounced;
}