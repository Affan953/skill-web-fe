"use client";

import Link from "next/link";
import { Lock, Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import { timeAgo } from "@/lib/timeAgo";
import type { CircleRole, GrowthCircle } from "@/types";

const ROLE_BADGE: Record<CircleRole, { label: string; className: string }> = {
  OWNER: { label: "Owner", className: "bg-purple-50 text-purple-600" },
  ADMIN: { label: "Admin", className: "bg-[#2563EB]/10 text-[#2563EB]" },
  MEMBER: { label: "Member", className: "bg-slate-100 text-slate-600" },
};

interface CircleCardProps {
  circle: GrowthCircle;
  /** Renders the "Join" button for a public circle the viewer has not joined. */
  onJoin?: (circleId: string) => void;
  isJoining?: boolean;
}

/**
 * One circle in a list. Every card is a link to the detail view, so the whole
 * surface is navigable by keyboard and by screen reader; the only child control
 * is the join button, which stops propagation so it never navigates.
 */
export default function CircleCard({
  circle,
  onJoin,
  isJoining = false,
}: CircleCardProps) {
  const isPrivate = circle.visibility === "PRIVATE";
  const badge = circle.viewerRole ? ROLE_BADGE[circle.viewerRole] : null;
  const canJoin = !isPrivate && !circle.viewerRole && !!onJoin;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/circles/${circle.id}`}
            className="text-base font-semibold text-slate-900 transition-colors hover:text-[#2563EB]"
          >
            {circle.name}
          </Link>

          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              {circle.topic}
            </span>
            <span className="inline-flex items-center gap-1">
              {isPrivate ? (
                <Lock className="h-3 w-3" aria-hidden="true" />
              ) : null}
              {isPrivate ? "Private" : "Public"}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              {circle.memberCount}{" "}
              {circle.memberCount === 1 ? "member" : "members"}
            </span>
          </p>
        </div>

        {badge ? (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        ) : null}
      </div>

      {circle.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
          {circle.description}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          href={`/users/${circle.owner.username}`}
          className="flex min-w-0 items-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-900"
        >
          <Avatar
            name={circle.owner.displayName || circle.owner.username}
            src={circle.owner.photoUrl}
            size={24}
            className="h-6 w-6 shrink-0"
          />
          <span className="truncate">
            {circle.owner.displayName || circle.owner.username}
          </span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{timeAgo(circle.createdAt)}</span>
        </Link>

        {canJoin ? (
          <button
            type="button"
            onClick={(event) => {
              // The card wraps a link; without this the click navigates.
              event.preventDefault();
              event.stopPropagation();
              onJoin(circle.id);
            }}
            disabled={isJoining}
            className="shrink-0 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isJoining ? "Joining…" : "Join"}
          </button>
        ) : null}
      </div>
    </article>
  );
}