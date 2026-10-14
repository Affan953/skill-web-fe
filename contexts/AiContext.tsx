"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface AiContextValue {
  /** Human sentence describing the current page, sent with the next message. */
  context: string;
  /** Let a page override the auto-derived context (e.g. the exact circle name). */
  setContext: (context: string) => void;
}

const AiContextCtx = createContext<AiContextValue | null>(null);

/** Route prefix → short phrase used to build the auto context. */
const ROUTE_CONTEXT: Array<[string, string]> = [
  ["feed/activity", "an activity detail page"],
  ["circles", "a Growth Circle detail page"],
  ["daily-quests", "the Daily Quests page"],
  ["leaderboard", "the Leaderboard page"],
  ["statistics", "your Statistics page"],
  ["notifications", "your Notifications page"],
  ["achievements", "the Achievements page"],
  ["growth-journal", "the Growth Journal page"],
  ["messages", "a message conversation"],
  ["discover", "the Discover page"],
  ["dashboard", "your dashboard"],
  ["upgrade", "the Premium upgrade page"],
  ["settings", "your Settings page"],
  ["profile", "your Profile page"],
  ["reviews", "the Reviews page"],
  ["habits", "your Habits page"],
  ["users", "another member's profile"],
];

function describePath(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "Current page: your dashboard.";
  }
  const segments = pathname.split("/").filter(Boolean);
  const key = segments.slice(0, 2).join("/");
  for (const [prefix, phrase] of ROUTE_CONTEXT) {
    if (key === prefix || segments[0] === prefix) {
      return `Current page: ${phrase}.`;
    }
  }
  return "";
}

export function AiContextProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const autoContext = useMemo(() => describePath(pathname), [pathname]);

  // A page-level override is tagged with the pathname that set it, so it
  // silently expires on navigation without an effect.
  const [override, setOverride] = useState<{ pathname: string; context: string } | null>(
    null
  );

  const setContext = useCallback(
    (next: string) => setOverride({ pathname, context: next }),
    [pathname]
  );

  const value = useMemo<AiContextValue>(() => {
    const active =
      override && override.pathname === pathname ? override.context : "";
    return { context: active || autoContext, setContext };
  }, [override, pathname, autoContext, setContext]);

  return <AiContextCtx.Provider value={value}>{children}</AiContextCtx.Provider>;
}

export function useAiContext(): AiContextValue {
  const value = useContext(AiContextCtx);
  if (!value) {
    throw new Error("useAiContext must be used within an AiContextProvider");
  }
  return value;
}