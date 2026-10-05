"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Flame,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import { activityHeadline, formatActivityHeadline } from "@/lib/activityCopy";
import Avatar from "@/components/Avatar";
import { AchievementGlyph } from "@/lib/iconMapper";
import ReactionBar from "@/components/social/ReactionBar";
import CommentsDialog from "@/components/social/CommentsDialog";
import type { GrowthFeedItem, GrowthActivityType } from "@/types";

interface GrowthFeedCardProps {
  item: GrowthFeedItem;
  /** True when the activity belongs to the authenticated viewer. */
  isSelf: boolean;
}

const TYPE_STYLE: Record<
  GrowthActivityType,
  { badgeClass: string; Icon: LucideIcon }
> = {
  HABIT_COMPLETED: {
    badgeClass: "bg-[#10B981]/10 text-[#10B981]",
    Icon: CheckCircle2,
  },
  STREAK_MILESTONE: {
    badgeClass: "bg-orange-100 text-orange-600",
    Icon: Flame,
  },
  ACHIEVEMENT_UNLOCKED: {
    badgeClass: "bg-[#2563EB]/10 text-[#2563EB]",
    Icon: Trophy,
  },
  DAILY_QUEST_COMPLETED: {
    badgeClass: "bg-purple-100 text-purple-500",
    Icon: Target,
  },
};

export default function GrowthFeedCard({ item, isSelf }: GrowthFeedCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  const { badgeClass, Icon } = TYPE_STYLE[item.type];
  const name = isSelf
    ? "You"
    : item.user.displayName || item.user.username || "A learner";
  const relative = timeAgo(item.createdAt);
  const actorUsername = item.user.username;
  const { verb, entity, quote } = activityHeadline(item.type, item.metadata);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#2563EB]/40 hover:shadow-sm">
      <Link
        href={`/users/${actorUsername}`}
        className="flex items-start gap-3"
      >
        <Avatar
          name={item.user.displayName || actorUsername}
          src={item.user.photoUrl}
          size={40}
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className={`relative top-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${badgeClass}`}
            >
              {item.type === "ACHIEVEMENT_UNLOCKED" ? (
                <AchievementGlyph
                  icon={String(item.metadata.achievementIcon ?? "")}
                  className="h-3.5 w-3.5"
                />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
            </span>
            <p className="text-sm leading-snug text-slate-700">
              <span className="font-semibold text-slate-900">{name}</span> {verb}{" "}
              <span className="font-semibold text-slate-900">
                {quote ? `“${entity}”` : entity}
              </span>
            </p>
          </div>

          <p className="mt-1.5 flex items-center gap-1 pl-8 text-xs text-slate-400">
            {relative && (
              <>
                <span>{relative}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>@{actorUsername}</span>
          </p>
        </div>
      </Link>

      <div className="mt-3 border-t border-slate-100 pl-8 pt-3">
        <ReactionBar
          activityId={item.id}
          seed={item.interaction}
          actorName={name}
          headline={formatActivityHeadline(item.type, item.metadata)}
          commentCount={item.interaction.commentCount}
          onOpenComments={() => setCommentsOpen(true)}
        />
      </div>

      {commentsOpen && (
        <CommentsDialog
          activityId={item.id}
          onClose={() => setCommentsOpen(false)}
        />
      )}
    </div>
  );
}
