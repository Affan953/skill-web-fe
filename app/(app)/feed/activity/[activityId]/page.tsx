"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Flame,
  RotateCcw,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useActivityDetail } from "@/hooks/useActivityDetail";
import { useAuth } from "@/contexts/AuthContext";
import { timeAgo } from "@/lib/timeAgo";
import { activityHeadline, formatActivityHeadline } from "@/lib/activityCopy";
import { AchievementGlyph } from "@/lib/iconMapper";
import Avatar from "@/components/Avatar";
import ReactionBar from "@/components/social/ReactionBar";
import CommentsDialog from "@/components/social/CommentsDialog";
import type { GrowthActivityType } from "@/types";

const TYPE_STYLE: Record<
  GrowthActivityType,
  { label: string; badgeClass: string; Icon: LucideIcon }
> = {
  HABIT_COMPLETED: {
    label: "Habit completed",
    badgeClass: "bg-[#10B981]/10 text-[#10B981]",
    Icon: CheckCircle2,
  },
  STREAK_MILESTONE: {
    label: "Streak milestone",
    badgeClass: "bg-orange-100 text-orange-600",
    Icon: Flame,
  },
  ACHIEVEMENT_UNLOCKED: {
    label: "Achievement unlocked",
    badgeClass: "bg-[#2563EB]/10 text-[#2563EB]",
    Icon: Trophy,
  },
  DAILY_QUEST_COMPLETED: {
    label: "Daily quest completed",
    badgeClass: "bg-purple-100 text-purple-500",
    Icon: Target,
  },
};

function ActivitySkeleton() {
  return (
    <div className="mx-auto max-w-2xl flex-1 px-6 py-8">
      <div className="mb-6 h-5 w-40 animate-pulse rounded bg-slate-100" />
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <span className="h-12 w-12 shrink-0 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2.5">
            <span className="block h-4 w-3/4 rounded bg-slate-100" />
            <span className="block h-3 w-1/3 rounded bg-slate-100" />
          </div>
        </div>
        <div className="mt-6 flex gap-2 border-t border-slate-100 pt-4">
          <span className="h-7 w-14 rounded-full bg-slate-100" />
          <span className="h-7 w-14 rounded-full bg-slate-100" />
          <span className="h-7 w-14 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

/**
 * Shareable single-activity view. A link copied from the growth feed lands here;
 * the backend resolves the activity by document ID and applies the same privacy
 * gate as the feed, so a private or missing activity is an indistinguishable
 * 404 — a shared link can never leak a private user's activity.
 */
export default function ActivityPage() {
  const params = useParams<{ activityId: string }>();
  const activityId =
    typeof params?.activityId === "string" ? params.activityId : null;

  const { user } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);

  const { data: activity, isLoading, isError, refetch } =
    useActivityDetail(activityId);

  if (isLoading) return <ActivitySkeleton />;

  if (isError || !activity) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-white p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm text-red-400">
            This activity could not be found. It may have been removed, or it
            isn&apos;t shared publicly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/feed"
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
            >
              Go to your feed
            </Link>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSelf = user?.uid === activity.user.uid;
  const name = isSelf
    ? "You"
    : activity.user.displayName || activity.user.username || "A learner";
  const { label, badgeClass, Icon } = TYPE_STYLE[activity.type];
  const { verb, entity, quote } = activityHeadline(
    activity.type,
    activity.metadata
  );

  return (
    <div className="mx-auto max-w-2xl flex-1 px-6 py-8">
      <Link
        href="/feed"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      <article className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <Link href={`/users/${activity.user.username}`} className="shrink-0">
            <Avatar
              name={activity.user.displayName || activity.user.username}
              src={activity.user.photoUrl}
              size={48}
              className="h-12 w-12"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${badgeClass}`}
              >
                {activity.type === "ACHIEVEMENT_UNLOCKED" ? (
                  <AchievementGlyph
                    icon={String(activity.metadata.achievementIcon ?? "")}
                    className="h-3.5 w-3.5"
                  />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="sr-only">{label}</span>
            </p>
            <p className="mt-2 text-base leading-snug text-slate-700">
              <Link
                href={`/users/${activity.user.username}`}
                className="font-semibold text-slate-900 transition-colors hover:text-[#2563EB]"
              >
                {name}
              </Link>{" "}
              {verb}{" "}
              <span className="font-semibold text-slate-900">
                {quote ? `“${entity}”` : entity}
              </span>
            </p>
            <p className="mt-1.5 text-xs text-slate-400">
              {timeAgo(activity.createdAt)}
              <span aria-hidden="true"> · </span>
              <Link
                href={`/users/${activity.user.username}`}
                className="transition-colors hover:text-[#2563EB]"
              >
                @{activity.user.username}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <ReactionBar
            activityId={activity.id}
            seed={activity.interaction}
            actorName={name}
            headline={formatActivityHeadline(activity.type, activity.metadata)}
            commentCount={activity.interaction.commentCount}
            onOpenComments={() => setCommentsOpen(true)}
          />
        </div>
      </article>

      {commentsOpen && (
        <CommentsDialog
          activityId={activity.id}
          onClose={() => setCommentsOpen(false)}
        />
      )}
    </div>
  );
}
