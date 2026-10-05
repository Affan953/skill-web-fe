"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Search, Users } from "lucide-react";
import CircleCard from "@/components/circles/CircleCard";
import CreateCircleDialog from "@/components/circles/CreateCircleDialog";
import {
  flattenCirclePages,
  useCircleActions,
  useDiscoverCircles,
  useMyCircles,
} from "@/hooks/useCircles";
import type { CreateCircleInput } from "@/types";

type Tab = "mine" | "discover";

function CirclesSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="h-4 w-1/3 rounded bg-slate-100" />
          <div className="mt-3 h-3 w-1/4 rounded bg-slate-100" />
          <div className="mt-4 h-3 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
      <Users className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-slate-700">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">{body}</p>
    </div>
  );
}

/**
 * Growth Circles hub: the circles you belong to, and public circles to explore.
 *
 * Discover filtering is server-side (topic prefix and name prefix), so
 * searching never pulls the whole collection into the browser.
 */
export default function CirclesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("mine");
  const [createOpen, setCreateOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [topicInput, setTopicInput] = useState("");
  // The applied filters are separate from the inputs so typing does not fire a
  // request on every keystroke; the form commits them explicitly.
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedTopic, setAppliedTopic] = useState("");

  const mine = useMyCircles();
  const discover = useDiscoverCircles({
    search: appliedSearch,
    topic: appliedTopic,
  });
  const actions = useCircleActions();

  const showDiscover = tab === "discover";
  const activeQuery = showDiscover ? discover : mine;
  const circles = useMemo(
    () => flattenCirclePages(activeQuery.data),
    [activeQuery.data]
  );

  const handleJoin = async (circleId: string) => {
    await actions.join.mutateAsync(circleId);
  };

  const handleCreate = async (input: CreateCircleInput) => {
    const created = await actions.create.mutateAsync(input);
    setCreateOpen(false);
    // Jump straight to the circle the user just made.
    router.push(`/circles/${created.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Growth Circles</h1>
          <p className="mt-1 text-sm text-slate-500">
            Small groups around a topic, to keep each other going.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New circle
        </button>
      </div>

      <div
        className="mb-5 flex gap-1 border-b border-slate-200"
        role="tablist"
        aria-label="Circle views"
      >
        {(
          [
            { id: "mine", label: "My Circles" },
            { id: "discover", label: "Discover" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === item.id
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showDiscover ? (
        <form
          className="mb-5 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedSearch(searchInput.trim());
            setAppliedTopic(topicInput.trim());
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search circle names"
              aria-label="Search circle names"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563EB]"
            />
          </div>
          <input
            value={topicInput}
            onChange={(event) => setTopicInput(event.target.value)}
            placeholder="Topic"
            aria-label="Filter by topic (matches the start of a topic)"
            className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563EB]"
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Apply
          </button>
          {/* Only offered when a filter is live, so an unfiltered view has no
              dead control on it. */}
          {appliedSearch || appliedTopic ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setTopicInput("");
                setAppliedSearch("");
                setAppliedTopic("");
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
            >
              Clear filters
            </button>
          ) : null}
        </form>
      ) : null}

      {activeQuery.isLoading ? <CirclesSkeleton /> : null}

      {activeQuery.isError ? (
        <div className="rounded-xl border border-red-500/20 bg-white p-8 text-center">
          <p className="text-sm text-red-600">
            Circles could not be loaded. Please try again.
          </p>
          <button
            type="button"
            onClick={() => activeQuery.refetch()}
            className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : null}

      {!activeQuery.isLoading && !activeQuery.isError && circles.length === 0 ? (
        showDiscover ? (
          <EmptyState
            title="No circles found"
            body="Try a different search or topic, or be the first to create one."
          />
        ) : (
          <EmptyState
            title="You are not in any circles yet"
            body="Create a circle for something you are working on, or join a public circle from Discover."
          />
        )
      ) : null}

      {circles.length > 0 ? (
        <div className="space-y-3">
          {circles.map((circle) => (
            <CircleCard
              key={circle.id}
              circle={circle}
              onJoin={showDiscover ? handleJoin : undefined}
              isJoining={actions.join.isPending}
            />
          ))}
        </div>
      ) : null}

      {activeQuery.hasNextPage ? (
        <button
          type="button"
          onClick={() => activeQuery.fetchNextPage()}
          disabled={activeQuery.isFetchingNextPage}
          className="mt-4 w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {activeQuery.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      ) : null}

      {!showDiscover && circles.length > 0 ? (
        <p className="mt-6 text-center text-xs text-slate-400">
          Looking for something new?{" "}
          <button
            type="button"
            onClick={() => setTab("discover")}
            className="text-[#2563EB] hover:underline"
          >
            Browse public circles
          </button>
          .
        </p>
      ) : null}

      {/* Mounted only while open so each draft starts clean. */}
      {createOpen ? (
        <CreateCircleDialog
          open
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={actions.create.isPending}
          error={actions.error}
        />
      ) : null}
    </div>
  );
}