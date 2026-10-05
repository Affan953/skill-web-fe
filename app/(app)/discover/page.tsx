"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { MIN_USER_SEARCH_LENGTH, useUserSearch } from "@/hooks/useProfile";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import UserResultCard from "@/components/social/UserResultCard";
import UserSearchInput from "@/components/social/UserSearchInput";

/** Debounce delay for a search that only fires a single query per pause. */
const SEARCH_DEBOUNCE_MS = 300;

export default function DiscoverPage() {
  const [input, setInput] = useState("");
  const debounced = useDebouncedValue(input, SEARCH_DEBOUNCE_MS);
  const { data, isLoading, isError, error, refetch } = useUserSearch(debounced);

  // Mirror the hook's normalisation so the empty-state copy shows the term that
  // was actually sent, not the raw text (a lone "@" is not a search).
  const trimmed = debounced.trim().replace(/^@+/, "").trim();
  const hasQuery = trimmed.length >= MIN_USER_SEARCH_LENGTH;
  const results = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Exactly one of these is true, so the empty / loading / error / list states
  // can never render at the same time.
  const showIdle = !hasQuery;
  const showLoading = hasQuery && isLoading;
  const showError = hasQuery && isError;
  const showEmpty = hasQuery && !isLoading && !isError && results.length === 0;
  const showResults = hasQuery && !isLoading && !isError && results.length > 0;

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Discover</h1>
        <p className="mt-1 text-sm text-slate-500">
          Find other learners by username or display name and browse their
          public growth profiles.
        </p>
      </div>

      <div className="mb-6 max-w-xl">
        <UserSearchInput
          value={input}
          onValueChange={setInput}
          onSelect={() => {
            // Discover browses rather than picks: the card below carries the
            // actions, so choosing a dropdown row would be a dead end.
          }}
          label="Search people"
          inline
          placeholder="Search by username or display name…"
          helperText="Matches the start of a username or display name (min 2 characters). You can type @affan or affan."
        />
      </div>

      {/* No aria-live wrapper here: the search field already announces result
          counts through its own status region, and duplicating it would make
          the page chatter on every keystroke. */}
      <div className="space-y-3">
        {showIdle ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/60 py-12 text-center">
            <Users className="h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm text-slate-500">
              Start typing a name to find people.
            </p>
          </div>
        ) : null}

        {showLoading ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"
          >
            <Search className="h-4 w-4 animate-pulse" aria-hidden="true" />
            Searching…
          </div>
        ) : null}

        {showError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-10 text-center"
          >
            <p className="text-sm text-red-600">
              {error?.message ?? "Something went wrong while searching."}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        ) : null}

        {showEmpty ? (
          <div
            role="status"
            className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-12 text-center"
          >
            <p className="text-sm text-slate-500">
              No users match “{trimmed}”.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Search matches the start of a username or display name.
            </p>
          </div>
        ) : null}

        {showResults
          ? results.map((user) => (
              <UserResultCard
                key={user.uid}
                user={user}
                showStats
                showViewProfile
              />
            ))
          : null}
      </div>
    </div>
  );
}