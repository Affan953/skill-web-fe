"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, UserPlus, X } from "lucide-react";
import { useFollow } from "@/hooks/useFollow";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/lib/cn";

interface FollowButtonProps {
  userId: string;
  displayName: string;
  initialIsFollowing?: boolean | null;
  includeCounts?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Follow / Unfollow toggle with a confirmation step before unfollowing.
 *
 * Two modes:
 *   - Profile: no `initialIsFollowing` → fetch status via GET /follows/:id/status.
 *   - List row: pass `initialIsFollowing` (the server-provided
 *     `isFollowingByViewer`) → skip the extra request entirely.
 *
 * Never rendered for the viewer's own account.
 */
export default function FollowButton({
  userId,
  displayName,
  initialIsFollowing,
  includeCounts,
  size = "md",
  className,
}: FollowButtonProps) {
  const { isAuthenticated } = useFirebaseToken();
  const { isFollowing, isStatusLoading, isMutating, isSelf, error, follow, unfollow } =
    useFollow(userId, { initialIsFollowing, includeCounts });

  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!isAuthenticated) return null;
  if (isSelf) return null;

  const sm = size === "sm";
  const busy = isStatusLoading || isMutating;

  const base = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    sm ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
    className
  );

  let button;
  if (busy) {
    button = (
      <button
        type="button"
        disabled
        aria-busy="true"
        aria-label="Updating follow status"
        className={cn(base, "bg-[#2563EB] text-white")}
      >
        <Loader2 className={cn("animate-spin", sm ? "h-3.5 w-3.5" : "h-4 w-4")} />
        {isMutating ? (isFollowing ? "Unfollowing…" : "Following…") : "Loading…"}
      </button>
    );
  } else if (isFollowing) {
    button = (
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-label={`Unfollow ${displayName}`}
        aria-pressed="true"
        className={cn(
          base,
          "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        <Check className={cn(sm ? "h-3.5 w-3.5" : "h-4 w-4")} />
        Following
      </button>
    );
  } else {
    button = (
      <button
        type="button"
        onClick={() => void follow()}
        aria-label={`Follow ${displayName}`}
        aria-pressed="false"
        className={cn(base, "bg-[#2563EB] text-white hover:bg-[#1D4ED8]")}
      >
        <UserPlus className={cn(sm ? "h-3.5 w-3.5" : "h-4 w-4")} />
        Follow
      </button>
    );
  }

  return (
    <>
      {button}

      {error && (
        <p
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {confirmOpen && (
        <UnfollowConfirm
          displayName={displayName}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            void unfollow();
          }}
        />
      )}
    </>
  );
}

function UnfollowConfirm({
  displayName,
  onCancel,
  onConfirm,
}: {
  displayName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Confining focus keeps a keyboard user from tabbing into the page behind a
  // confirmation they have not answered, and restores focus to the Follow
  // button that opened it.
  useFocusTrap(true, dialogRef);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unfollow-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2
            id="unfollow-confirm-title"
            className="text-lg font-bold text-slate-900"
          >
            Unfollow {displayName}?
          </h2>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-6 text-sm text-slate-500">
          You won&apos;t see each other&apos;s growth updates anymore. You can
          always follow again later.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            Unfollow
          </button>
        </div>
      </div>
    </div>
  );
}