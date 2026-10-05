"use client";

import Link from "next/link";
import Avatar from "@/components/Avatar";
import {
  handleIdentity,
  hasDistinctHandle,
  primaryIdentity,
  type IdentityFields,
} from "@/lib/userIdentity";

interface UserIdentityProps extends IdentityFields {
  photoUrl?: string | null;
  avatarSize?: number;
  /** Wraps the whole thing in a link to the public profile. */
  linkToProfile?: boolean;
  /** Show the `@username` line under the display name. */
  showHandle?: boolean;
  className?: string;
  nameClassName?: string;
  handleClassName?: string;
}

/**
 * Avatar + display name + `@username`, the one way a person appears in this app.
 *
 * The handle line is suppressed when the display name is missing, because the
 * primary line already falls back to the handle and printing it twice looks like
 * a rendering fault. A uid is never accepted here as a fallback.
 */
export default function UserIdentity({
  username,
  displayName,
  photoUrl,
  avatarSize = 40,
  linkToProfile = true,
  showHandle = true,
  className = "",
  nameClassName = "text-sm font-semibold text-slate-900",
  handleClassName = "text-xs text-slate-500",
}: UserIdentityProps) {
  const name = primaryIdentity({ username, displayName });
  const handle = handleIdentity({ username });
  const showHandleLine = showHandle && hasDistinctHandle({ username, displayName });

  const body = (
    <>
      <Avatar
        name={name}
        src={photoUrl ?? null}
        size={avatarSize}
        className="shrink-0"
      />
      <span className="min-w-0">
        <span className={`block truncate ${nameClassName}`}>{name}</span>
        {showHandleLine ? (
          <span className={`block truncate ${handleClassName}`}>{handle}</span>
        ) : null}
      </span>
    </>
  );

  if (!linkToProfile) {
    return (
      <span className={`flex min-w-0 items-center gap-3 ${className}`}>{body}</span>
    );
  }

  return (
    <Link
      href={`/users/${username}`}
      className={`flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${className}`}
    >
      {body}
    </Link>
  );
}