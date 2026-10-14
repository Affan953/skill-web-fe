"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Lock,
  LogOut,
  RotateCcw,
  Settings2,
  Users,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import { CircleDiscussion } from "@/components/circles/CircleDiscussion";
import CircleMembersPanel from "@/components/circles/CircleMembersPanel";
import {
  flattenMemberPages,
  useCircle,
  useCircleActions,
  useCircleMembers,
} from "@/hooks/useCircles";
import { useAuth } from "@/contexts/AuthContext";
import { useAiContext } from "@/contexts/AiContext";
import { timeAgo } from "@/lib/timeAgo";
import type { UpdateCircleInput } from "@/types";

function CircleSkeleton() {
  return (
    <div className="mx-auto max-w-3xl flex-1 px-6 py-8">
      <div className="mb-6 h-5 w-40 animate-pulse rounded bg-slate-100" />
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
        <div className="h-6 w-1/2 rounded bg-slate-100" />
        <div className="mt-3 h-3 w-1/4 rounded bg-slate-100" />
        <div className="mt-4 h-3 w-3/4 rounded bg-slate-100" />
      </div>
    </div>
  );
}

/**
 * Single Growth Circle.
 *
 * A private circle the viewer is not a member of answers 404 from the backend,
 * identical to a circle that does not exist — so this page shows one
 * "could not be found" state for both and cannot be used to probe which
 * private circles exist.
 */
export default function CircleDetailPage() {
  const params = useParams<{ circleId: string }>();
  const circleId =
    typeof params?.circleId === "string" ? params.circleId : null;
  const router = useRouter();
  const { user } = useAuth();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UpdateCircleInput>({});
  const [localError, setLocalError] = useState<string | null>(null);

  const circleQuery = useCircle(circleId);
  const membersQuery = useCircleMembers(circleId);
  const actions = useCircleActions();
  const { setContext } = useAiContext();

  useEffect(() => {
    if (circleQuery.data?.name) {
      const circle = circleQuery.data;
      setContext(
        `You are on a page for a growth circle named "${circle.name}".` +
          (circle.topic ? ` Its topic is ${circle.topic}.` : "") +
          (circle.description
            ? ` Description: ${circle.description}`
            : ""),
      );
    } else {
      setContext("");
    }
  }, [circleQuery.data, setContext]);

  const circle = circleQuery.data ?? null;
  const members = flattenMemberPages(membersQuery.data);
  const viewerRole = circle?.viewerRole ?? null;
  const canManage = viewerRole === "OWNER" || viewerRole === "ADMIN";

  if (circleQuery.isLoading) return <CircleSkeleton />;

  if (circleQuery.isError || !circle) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-white p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" aria-hidden="true" />
          <p className="max-w-sm text-sm text-red-400">
            This circle could not be found. It may have been removed, or if it is
            private you may not be a member of it.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/circles")}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
            >
              Go to circles
            </button>
            <button
              type="button"
              onClick={() => circleQuery.refetch()}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPrivate = circle.visibility === "PRIVATE";
  const isMember = viewerRole !== null;
  // The owner cannot leave — there is no ownership transfer in this phase.
  const canLeave = isMember && viewerRole !== "OWNER";

  const startEditing = () => {
    setDraft({
      name: circle.name,
      description: circle.description,
      topic: circle.topic,
      visibility: circle.visibility,
    });
    setLocalError(null);
    setEditing(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = draft.name?.trim() ?? "";
    const topic = draft.topic?.trim() ?? "";
    if (name.length < 3) {
      setLocalError("Circle name needs at least 3 characters.");
      return;
    }
    if (topic.length < 2) {
      setLocalError("Topic needs at least 2 characters.");
      return;
    }
    try {
      await actions.update.mutateAsync({ circleId: circle.id, input: draft });
      setEditing(false);
    } catch {
      setLocalError(actions.error ?? "The circle could not be updated.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <button
        type="button"
        onClick={() => router.push("/circles")}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to circles
      </button>

      <article className="rounded-2xl border border-slate-200 bg-white p-6">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="circle-edit-name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Name
              </label>
              <input
                id="circle-edit-name"
                value={draft.name ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, name: event.target.value }))
                }
                maxLength={80}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label
                htmlFor="circle-edit-topic"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Topic
              </label>
              <input
                id="circle-edit-topic"
                value={draft.topic ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, topic: event.target.value }))
                }
                maxLength={50}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label
                htmlFor="circle-edit-description"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Description
              </label>
              <textarea
                id="circle-edit-description"
                value={draft.description ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label
                htmlFor="circle-edit-visibility"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Visibility
              </label>
              <select
                id="circle-edit-visibility"
                value={draft.visibility ?? circle.visibility}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    visibility: event.target
                      .value as "PUBLIC" | "PRIVATE",
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>

            {localError || actions.error ? (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
              >
                {localError ?? actions.error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actions.update.isPending}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
              >
                {actions.update.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-slate-900">
                  {circle.name}
                </h1>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
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
                  <span aria-hidden="true">·</span>
                  <span>created {timeAgo(circle.createdAt)}</span>
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                {canSelfJoin(isPrivate, isMember) ? (
                  <button
                    type="button"
                    disabled={actions.join.isPending}
                    onClick={() => actions.join.mutate(circle.id)}
                    className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
                  >
                    {actions.join.isPending ? "Joining…" : "Join"}
                  </button>
                ) : null}
                {canManage ? (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit
                  </button>
                ) : null}
                {canLeave ? (
                  <button
                    type="button"
                    disabled={actions.leave.isPending}
                    onClick={() => actions.leave.mutate(circle.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    Leave
                  </button>
                ) : null}
              </div>
            </div>

            {circle.description ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {circle.description}
              </p>
            ) : null}

            <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
              <Avatar
                name={circle.owner.displayName || circle.owner.username}
                src={circle.owner.photoUrl}
                size={28}
                className="h-7 w-7"
              />
              <p className="text-xs text-slate-500">
                Created by{" "}
                <span className="font-medium text-slate-700">
                  {circle.owner.displayName || circle.owner.username}
                </span>
              </p>
            </div>
          </>
        )}
      </article>

      <div className="mt-4">
        <CircleMembersPanel
          members={members}
          viewerUid={user?.uid ?? null}
          viewerRole={viewerRole}
          onAddMember={(userId) =>
            actions.addMember.mutateAsync({ circleId: circle.id, userId })
          }
          onRemoveMember={(userId) =>
            actions.removeMember.mutateAsync({ circleId: circle.id, userId })
          }
          onSetRole={(userId, role) =>
            actions.setRole.mutateAsync({ circleId: circle.id, userId, role })
          }
          onLoadMore={() => membersQuery.fetchNextPage()}
          hasMore={membersQuery.hasNextPage}
          isLoadingMore={membersQuery.isFetchingNextPage}
          isMutating={actions.isMutating}
          error={actions.error}
        />
      </div>

      {isMember ? (
        <div className="mt-4">
          <CircleDiscussion
            circleId={circle.id}
            circleName={circle.name}
            canModerate={viewerRole === "OWNER" || viewerRole === "ADMIN"}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Join is offered only for a public circle the viewer is not already in.
 * Private circles are never self-joinable, so no Join button is drawn there.
 */
function canSelfJoin(isPrivate: boolean, isMember: boolean): boolean {
  return !isPrivate && !isMember;
}