"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, RotateCcw, Search, UserRound, X } from "lucide-react";
import { MIN_USER_SEARCH_LENGTH, useUserSearch } from "@/hooks/useProfile";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import UserIdentity from "@/components/social/UserIdentity";
import { cn } from "@/lib/cn";
import type { SearchUserResult } from "@/types";

export type UserSearchStatus =
  | "idle"
  | "loading"
  | "results"
  | "empty"
  | "error";

interface UserSearchInputProps {
  /** Controlled query text. */
  value: string;
  onValueChange: (value: string) => void;
  /** Fired when the user commits a result, by click or Enter. */
  onSelect: (user: SearchUserResult) => void;
  /** Accessible name. Rendered visually unless `hideLabel` is set. */
  label: string;
  hideLabel?: boolean;
  placeholder?: string;
  helperText?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  /**
   * Usernames already present in the target list (e.g. current circle members).
   * Those rows still appear — hiding them would make a search look broken when
   * someone looks for a colleague they can already see — but are marked and not
   * selectable.
   */
  existingUsernames?: readonly string[];
  /** Rendered on an existing row instead of the default "Already added". */
  existingLabel?: string;
  /** Hide the selected user from the next set of results. */
  excludeUsernames?: readonly string[];
  /**
   * Dropdown mode (default) shows the results in a listbox anchored to the
   * field, for "pick one" flows like adding a Circle member.
   *
   * `inline` renders only the field and lets the caller own the result list, for
   * "browse many" flows like Discover where the results need their own cards and
   * actions. The debounce, the length gate, and the screen-reader status
   * announcements are identical in both modes — only the presentation moves.
   */
  inline?: boolean;
}

/**
 * Reusable username / display-name search.
 *
 * One implementation for every surface that needs to find a person, so the
 * Discover page and Circle member management cannot drift apart in debounce
 * timing, keyboard handling, or which fields they expose.
 *
 * Design decisions worth knowing:
 *
 * - **Server-side only.** The browser never receives the user collection; the
 *   component holds a `useUserSearch` query whose key is the debounced term.
 * - **The uid is resolved, never typed.** `onSelect` hands back the whole
 *   `SearchUserResult`, and the caller sends `user.uid` to the API. The uid is
 *   never displayed and never an input.
 * - **Debounced, then gated.** Typing updates local state immediately (so the
 *   field stays responsive) while the request waits for the debounce and for
 *   `MIN_USER_SEARCH_LENGTH` characters.
 * - **Keyboard-complete.** Arrow keys move the active option, Enter commits,
 *   Escape clears the query and closes the list.
 */
export default function UserSearchInput({
  value,
  onValueChange,
  onSelect,
  label,
  hideLabel = false,
  placeholder = "Search by username or display name…",
  helperText,
  autoFocus = false,
  disabled = false,
  className = "",
  existingUsernames = [],
  existingLabel = "Already added",
  excludeUsernames = [],
  inline = false,
}: UserSearchInputProps) {
  const debouncedQuery = useDebouncedValue(value, 300);
  const trimmed = debouncedQuery.trim();
  const hasQuery = trimmed.length >= MIN_USER_SEARCH_LENGTH;

  const { data, isLoading, isError, error, refetch, isFetching } = useUserSearch(
    debouncedQuery,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const statusId = `${inputId}-status`;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const existing = useMemo(
    () => new Set(existingUsernames.map((u) => u.toLowerCase())),
    [existingUsernames],
  );
  const excluded = useMemo(
    () => new Set(excludeUsernames.map((u) => u.toLowerCase())),
    [excludeUsernames],
  );

  const results = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter((row) => !excluded.has(row.username.toLowerCase()));
  }, [data, excluded]);

  // An emptied box needs no effect to close the list: `status` is "idle"
  // without a query, and the list is already gated on a non-idle status.

  // Clicking outside dismisses the list without discarding what was typed.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  let status: UserSearchStatus = "idle";
  if (hasQuery) {
    if (isLoading) status = "loading";
    else if (isError) status = "error";
    else if (results.length > 0) status = "results";
    else status = "empty";
  }

  // In inline mode the caller renders the results, so this component must not
  // claim to own a listbox that it does not render.
  const listVisible = !inline && isOpen && status !== "idle";

  const commit = (user: SearchUserResult) => {
    onSelect(user);
    setIsOpen(false);
  };

  /**
   * The highlighted row, clamped to the current result set.
   *
   * Derived during render rather than reset in an effect: a new result set can
   * be shorter than the old one, and this guarantees the highlight can never
   * point past the end (which would silently highlight nothing and make Enter
   * do nothing).
   */
  const activeRow = Math.min(activeIndex, Math.max(results.length - 1, 0));

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (isOpen) {
        // Escape closes the list first and only clears on a second press, so a
        // stray keypress cannot destroy a query the user still wants.
        setIsOpen(false);
      } else if (value) {
        onValueChange("");
      }
      return;
    }

    if (status !== "results" || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((i) => (i + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
      return;
    }
    if (event.key === "Enter") {
      const picked = results[activeRow];
      if (!picked) return;
      event.preventDefault();
      if (!existing.has(picked.username.toLowerCase())) commit(picked);
    }
  };

  const statusMessage =
    status === "loading"
      ? "Searching…"
      : status === "error"
        ? "Search failed."
        : status === "empty"
          ? `No people match “${trimmed}”.`
          : status === "results"
            ? `${results.length} ${results.length === 1 ? "person" : "people"} found.`
            : `Type at least ${MIN_USER_SEARCH_LENGTH} characters to search.`;

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "mb-1.5 block text-sm font-medium text-slate-700",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          role={inline ? undefined : "combobox"}
          value={value}
          autoFocus={autoFocus}
          disabled={disabled}
          autoComplete="off"
          aria-expanded={inline ? undefined : listVisible}
          aria-controls={inline ? undefined : listboxId}
          aria-autocomplete={inline ? undefined : "list"}
          aria-describedby={statusId}
          aria-activedescendant={
            listVisible && status === "results"
              ? `${listboxId}-option-${activeRow}`
              : undefined
          }
          placeholder={placeholder}
          onChange={(event) => {
            onValueChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-slate-50 disabled:text-slate-400"
        />

        {value ? (
          <button
            type="button"
            onClick={() => {
              onValueChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Announced without moving focus, so a screen reader hears result counts
          while the caret stays in the field. */}
      <p id={statusId} role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      {helperText ? (
        <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
      ) : null}

      {listVisible ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {status === "loading" ? (
            <p className="flex items-center gap-2 px-4 py-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Searching…
            </p>
          ) : null}

          {status === "error" ? (
            <div className="px-4 py-5 text-center">
              <p className="flex items-center justify-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {error?.message ?? "Search failed."}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Try again
              </button>
            </div>
          ) : null}

          {status === "empty" ? (
            <div className="px-4 py-6 text-center">
              <UserRound
                className="mx-auto h-6 w-6 text-slate-300"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm text-slate-500">
                No people match “{trimmed}”.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Try another name or username.
              </p>
            </div>
          ) : null}

          {status === "results"
            ? results.map((user, index) => {
                const alreadyThere = existing.has(user.username.toLowerCase());
                return (
                  <div
                    key={user.uid}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={index === activeRow}
                    aria-disabled={alreadyThere || undefined}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (!alreadyThere) commit(user);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2",
                      alreadyThere
                        ? "cursor-default opacity-60"
                        : "cursor-pointer",
                      index === activeRow && "bg-[#2563EB]/5",
                    )}
                  >
                    <UserIdentity
                      username={user.username}
                      displayName={user.displayName}
                      photoUrl={user.photoUrl}
                      avatarSize={36}
                      linkToProfile={false}
                      showHandle={false}
                      className="min-w-0"
                    />
                    {alreadyThere ? (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {existingLabel}
                      </span>
                    ) : null}
                  </div>
                );
              })
            : null}
        </div>
      ) : null}

      {isFetching && status === "results" ? (
        <span className="sr-only">Refreshing results</span>
      ) : null}
    </div>
  );
}