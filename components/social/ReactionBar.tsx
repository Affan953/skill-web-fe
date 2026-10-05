"use client";

import { MessageCircle, Share2 } from "lucide-react";
import { useActivityReactions } from "@/hooks/useActivityReactions";
import useSystemNotification from "@/hooks/useSystemNotification";
import { REACTIONS, totalReactions } from "@/lib/reactions";
import { shareActivity } from "@/lib/shareActivity";
import type { GrowthInteraction } from "@/types";

interface ReactionBarProps {
  activityId: string;
  /** Interaction summary delivered with the feed item / activity detail. */
  seed: GrowthInteraction;
  /** Actor display name, used for the share text. */
  actorName: string;
  /** Render-only headline, e.g. `completed “Read 20 minutes”`. */
  headline: string;
  commentCount: number;
  onOpenComments: () => void;
  className?: string;
}

/**
 * Cheer reactions + comment + share controls for a growth activity.
 *
 * Reactions are optimistic (see useActivityReactions) and each pill exposes
 * `aria-pressed` so the viewer's own reaction is announced, not just coloured.
 * The comment count is owned by the feed/detail cache and updated in place when
 * a comment is posted or deleted.
 */
export default function ReactionBar({
  activityId,
  seed,
  actorName,
  headline,
  commentCount,
  onOpenComments,
  className = "",
}: ReactionBarProps) {
  const { show } = useSystemNotification();
  const { counts, currentUserReaction, isMutating, toggle } =
    useActivityReactions(activityId, { seed });

  const total = totalReactions(counts);

  const onShare = async () => {
    const outcome = await shareActivity({ activityId, actorName, headline });
    if (!outcome.ok) {
      // A cancelled share sheet is a deliberate choice, not a failure.
      if (outcome.error !== "Share cancelled.") {
        show({
          type: "LINK_COPIED",
          title: "Couldn’t share",
          description: outcome.error,
        });
      }
      return;
    }
    show({
      type: "LINK_COPIED",
      title:
        outcome.result.method === "share" ? "Shared" : "Link copied",
      description:
        outcome.result.method === "share"
          ? "Your share sheet is open."
          : "The link to this activity is on your clipboard.",
      duration: 2500,
      silent: true,
    });
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
      role="group"
      aria-label="React to this activity"
    >
      {REACTIONS.map((reaction) => {
        const isMine = currentUserReaction === reaction.type;
        const count = counts[reaction.type];
        const { Icon } = reaction;
        return (
          <button
            key={reaction.type}
            type="button"
            onClick={() => toggle(reaction.type)}
            disabled={isMutating}
            aria-pressed={isMine}
            aria-label={`${reaction.description}. ${count} ${
              count === 1 ? "reaction" : "reactions"
            }.`}
            title={reaction.label}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isMine
                ? reaction.activeClass
                : "border-slate-200 bg-white text-slate-500 hover:border-[#2563EB]/40 hover:bg-[#2563EB]/5"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">{count}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onOpenComments}
        aria-label={
          commentCount === 1 ? "1 comment" : `${commentCount} comments`
        }
        className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-[#2563EB]/40 hover:bg-[#2563EB]/5"
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="tabular-nums">{commentCount}</span>
      </button>

      <button
        type="button"
        onClick={() => void onShare()}
        aria-label="Share this activity"
        title="Share"
        className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-[#2563EB]/40 hover:bg-[#2563EB]/5"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        {total > 0 && (
          <span className="sr-only">{total} reactions on this activity</span>
        )}
      </button>
    </div>
  );
}
