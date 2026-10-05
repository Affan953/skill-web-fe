"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { useFollow } from "@/hooks/useFollow";
import FollowListDialog from "@/components/follow/FollowListDialog";

interface FollowCountsStatsProps {
  userId: string;
}

/**
 * Renders the target's real follower/following counts as clickable stats
 * (opens a paginated FollowListDialog). Counts are pure Firestore
 * aggregations, so they stay exact after every follow/unfollow mutation.
 */
export default function FollowCountsStats({ userId }: FollowCountsStatsProps) {
  const { counts, isCountsLoading, error } = useFollow(userId, {
    includeCounts: true,
  });
  const [dialog, setDialog] = useState<"followers" | "following" | null>(null);

  return (
    <>
      <div className="flex items-center justify-center gap-4 sm:justify-start">
        {isCountsLoading && !counts ? (
          <>
            <span className="h-5 w-16 animate-pulse rounded bg-slate-100" />
            <span className="h-5 w-16 animate-pulse rounded bg-slate-100" />
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={!counts}
              onClick={() => setDialog("followers")}
              className="group flex items-center gap-1.5 rounded-full bg-[#2563EB]/10 px-3 py-1 transition-colors hover:bg-[#2563EB]/20 disabled:cursor-default"
              aria-label={`View ${(counts?.followersCount ?? 0).toLocaleString()} followers`}
            >
              <Users className="h-3.5 w-3.5 text-[#2563EB]" />
              <span className="text-xs font-semibold text-[#2563EB]">
                {(counts?.followersCount ?? 0).toLocaleString()} Followers
              </span>
            </button>
            <button
              type="button"
              disabled={!counts}
              onClick={() => setDialog("following")}
              className="group flex items-center gap-1.5 rounded-full bg-[#2563EB]/10 px-3 py-1 transition-colors hover:bg-[#2563EB]/20 disabled:cursor-default"
              aria-label={`View ${(counts?.followingCount ?? 0).toLocaleString()} following`}
            >
              <Users className="h-3.5 w-3.5 text-[#2563EB]" />
              <span className="text-xs font-semibold text-[#2563EB]">
                {(counts?.followingCount ?? 0).toLocaleString()} Following
              </span>
            </button>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}

      {dialog && (
        <FollowListDialog
          kind={dialog}
          targetUserId={userId}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}