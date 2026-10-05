"use client";

import Link from "next/link";
import { Flame, Lock, Zap } from "lucide-react";
import UserIdentity from "@/components/social/UserIdentity";
import FollowButton from "@/components/follow/FollowButton";
import { MessageButton } from "@/components/messaging/MessageButton";
import { useAuth } from "@/contexts/AuthContext";
import type { SearchUserResult } from "@/types";

interface UserResultCardProps {
  user: SearchUserResult;
  /**
   * Which actions to offer. Omit a verb to hide it rather than rendering a
   * control that the backend would refuse.
   */
  showFollow?: boolean;
  showMessage?: boolean;
  /** Renders a "View profile" link. Off for surfaces that are already links. */
  showViewProfile?: boolean;
  /** Server-provided relationship, so no per-row status request is needed. */
  isFollowing?: boolean;
  /** Show the server-provided growth stats. Private profiles have none. */
  showStats?: boolean;
  className?: string;
}

/**
 * One person in a result list.
 *
 * The card introduces a user by display name and `@username` and never by uid.
 * Which verbs appear is decided here from three facts only — is this you, is
 * the profile private, and are you already following — so no surface invents its
 * own rules. Anything a block would forbid is already absent from the results
 * server-side, and `FollowButton`/`MessageButton` independently refuse if the
 * relationship changes underneath us.
 */
export default function UserResultCard({
  user,
  showFollow = true,
  showMessage = true,
  showViewProfile = false,
  isFollowing,
  showStats = false,
  className = "",
}: UserResultCardProps) {
  const { user: currentUser } = useAuth();
  const isSelf = currentUser?.uid === user.uid;

  // Your own row has no verbs: you cannot follow or message yourself, and a
  // "View profile" link would just point at the page you are standing on.
  const showActions = !isSelf;

  return (
    <article
      className={`flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <UserIdentity
          username={user.username}
          displayName={user.displayName}
          photoUrl={user.photoUrl}
          avatarSize={44}
          linkToProfile={false}
          className="min-w-0"
        />

        {/* Growth stats are deliberately absent for private profiles — the
            backend withholds them, and an empty badge would leak that fact. */}
        {showStats && !user.isPrivate ? (
          <span className="hidden shrink-0 items-center gap-1.5 text-xs sm:flex">
            {typeof user.level === "number" ? (
              <span className="rounded-full bg-[#2563EB]/10 px-2 py-0.5 font-semibold text-[#2563EB]">
                Lv {user.level}
              </span>
            ) : null}
            {typeof user.xp === "number" ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-600">
                <Zap className="h-3 w-3" aria-hidden="true" />
                {user.xp.toLocaleString()}
              </span>
            ) : null}
            {typeof user.currentStreak === "number" ? (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 font-semibold text-orange-600">
                <Flame className="h-3 w-3" aria-hidden="true" />
                {user.currentStreak}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {user.isPrivate ? (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Private
          </span>
        ) : null}

        {isSelf ? (
          <Link
            href="/profile"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            This is you
          </Link>
        ) : (
          <>
            {showActions && showMessage ? (
              <MessageButton
                userId={user.uid}
                displayName={user.displayName || user.username}
                className="shrink-0"
              />
            ) : null}
            {showActions && showFollow ? (
              <FollowButton
                userId={user.uid}
                displayName={user.displayName || user.username}
                initialIsFollowing={isFollowing}
                size="sm"
              />
            ) : null}
          </>
        )}

        {showViewProfile ? (
          <Link
            href={`/users/${user.username}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            View profile
          </Link>
        ) : null}
      </div>
    </article>
  );
}