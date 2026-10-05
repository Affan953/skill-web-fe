"use client";

import { useMemo, useState } from "react";
import { UserMinus, UserPlus, X } from "lucide-react";
import UserIdentity from "@/components/social/UserIdentity";
import UserSearchInput from "@/components/social/UserSearchInput";
import type { CircleMember, CircleRole, SearchUserResult } from "@/types";

const ROLE_LABEL: Record<CircleRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

const ROLE_BADGE: Record<CircleRole, string> = {
  OWNER: "bg-purple-50 text-purple-600",
  ADMIN: "bg-[#2563EB]/10 text-[#2563EB]",
  MEMBER: "bg-slate-100 text-slate-600",
};

interface CircleMembersPanelProps {
  members: CircleMember[];
  viewerUid: string | null;
  /** The viewer's role in this circle, or null when not a member. */
  viewerRole: CircleRole | null;
  onAddMember: (userId: string) => Promise<unknown>;
  onRemoveMember: (userId: string) => Promise<unknown>;
  onSetRole: (userId: string, role: "ADMIN" | "MEMBER") => Promise<unknown>;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isMutating?: boolean;
  error?: string | null;
}

/**
 * Member roster plus the management controls the viewer's role permits.
 *
 * Every affordance here mirrors a rule the backend enforces independently — the
 * UI hides actions the server would reject anyway, but hiding is only
 * ergonomics: the checks live in the service, not here.
 */
export default function CircleMembersPanel({
  members,
  viewerUid,
  viewerRole,
  onAddMember,
  onRemoveMember,
  onSetRole,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  isMutating = false,
  error,
}: CircleMembersPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [pendingUser, setPendingUser] = useState<SearchUserResult | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const canManage = viewerRole === "OWNER" || viewerRole === "ADMIN";
  const isOwner = viewerRole === "OWNER";

  // Usernames already in the roster, so a search can mark those rows instead of
  // pretending they do not exist. Matching on username (not uid) is what the
  // search results actually carry in the browser.
  const memberUsernames = useMemo(
    () => members.map((m) => m.user.username),
    [members],
  );

  const closeAdd = () => {
    setAddOpen(false);
    setAddQuery("");
    setPendingUser(null);
    setAddError(null);
  };

  // Phase 36: a member is picked by username / display name, never by typing a
  // Firebase uid. The uid is resolved by the search and passed straight to the
  // API, so it never reaches the screen.
  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingUser) {
      setAddError("Choose someone from the results to add.");
      return;
    }
    setAddError(null);
    setPendingUser(null);
    try {
      await onAddMember(pendingUser.uid);
      closeAdd();
    } catch {
      // The mutation's error is surfaced by the panel-level `error` prop.
      closeAdd();
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Members ({members.length}
          {hasMore ? "+" : ""})
        </h2>
        {canManage ? (
          <button
            type="button"
            onClick={() => (addOpen ? closeAdd() : setAddOpen(true))}
            aria-expanded={addOpen}
            aria-controls="circle-add-member-form"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            Add member
          </button>
        ) : null}
      </div>

      {addOpen && canManage ? (
        <form
          id="circle-add-member-form"
          onSubmit={handleAdd}
          className="mb-4 rounded-xl bg-slate-50 p-3"
        >
          <UserSearchInput
            value={addQuery}
            onValueChange={(next) => {
              setAddQuery(next);
              // Changing the query invalidates any previous pick, so the Add
              // button can never submit someone who is no longer shown.
              setPendingUser(null);
              setAddError(null);
            }}
            onSelect={(user) => {
              setPendingUser(user);
              setAddError(null);
            }}
            label="Add a member"
            placeholder="Search by username or display name…"
            helperText="Search for the person you want to invite. You can type @affan or affan."
            existingUsernames={memberUsernames}
            existingLabel="Already a member"
            autoFocus
          />

          {pendingUser ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
              <UserIdentity
                username={pendingUser.username}
                displayName={pendingUser.displayName}
                photoUrl={pendingUser.photoUrl}
                avatarSize={32}
                className="min-w-0"
              />
              <button
                type="button"
                onClick={() => setPendingUser(null)}
                aria-label={`Change selected member ${pendingUser.displayName || pendingUser.username}`}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {addError ? (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {addError}
            </p>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={isMutating || !pendingUser}
              className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
            >
              {isMutating ? "Adding…" : "Add member"}
            </button>
            <button
              type="button"
              onClick={closeAdd}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Private circles are joined by an owner or admin adding a member
            directly — there is no request to approve in this phase.
          </p>
        </form>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-slate-100">
        {members.map((member) => {
          const isSelf = member.userId === viewerUid;
          // The owner is never removable and never demotable.
          const canRemove =
            canManage &&
            member.role !== "OWNER" &&
            !isSelf &&
            (isOwner || member.role === "MEMBER");
          // Only the owner changes roles, and never the owner's own row.
          const canChangeRole = isOwner && member.role !== "OWNER" && !isSelf;

          return (
            <li
              key={member.userId}
              className="flex items-center gap-3 py-2.5"
            >
              <UserIdentity
                username={member.user.username}
                displayName={member.user.displayName}
                photoUrl={member.user.photoUrl}
                avatarSize={32}
                className="min-w-0 flex-1"
                nameClassName="text-sm text-slate-900"
                handleClassName="text-xs text-slate-400"
              />

              {isSelf ? (
                <span className="shrink-0 text-xs text-slate-400">(you)</span>
              ) : null}

              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[member.role]}`}
              >
                {ROLE_LABEL[member.role]}
              </span>

              {canChangeRole ? (
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() =>
                    onSetRole(
                      member.userId,
                      member.role === "ADMIN" ? "MEMBER" : "ADMIN"
                    )
                  }
                  className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  {member.role === "ADMIN" ? "Demote" : "Promote"}
                </button>
              ) : null}

              {canRemove ? (
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => onRemoveMember(member.userId)}
                  aria-label={`Remove ${member.user.displayName || member.user.username}`}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                >
                  <UserMinus className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {members.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          No members yet.
        </p>
      ) : null}

      {hasMore && onLoadMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {isLoadingMore ? "Loading…" : "Load more members"}
        </button>
      ) : null}
    </section>
  );
}