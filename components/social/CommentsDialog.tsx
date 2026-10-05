"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  MessageCircle,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useActivityComments } from "@/hooks/useActivityComments";
import { useAuth } from "@/contexts/AuthContext";
import { timeAgo } from "@/lib/timeAgo";
import Avatar from "@/components/Avatar";

/** Mirrors the backend limit so users are told before they submit. */
const COMMENT_MAX_LENGTH = 500;

interface CommentsDialogProps {
  activityId: string;
  onClose: () => void;
}

/**
 * Modal listing an activity's support comments (newest first) plus a composer.
 * The author is always the authenticated viewer server-side, and only the
 * viewer's own comments expose a delete control — ownership is enforced in the
 * backend regardless of what the client renders.
 */
export default function CommentsDialog({
  activityId,
  onClose,
}: CommentsDialogProps) {
  const { user: currentUser } = useAuth();
  const viewerUid = currentUser?.uid ?? null;

  const {
    comments,
    isLoading,
    isError,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
    addComment,
    isPosting,
    postError,
    deleteComment,
    deletingCommentId,
    deleteError,
  } = useActivityComments(activityId);

  const [draft, setDraft] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trimmed = draft.trim();
  // `maxLength` on the textarea keeps the count in range; the backend still
  // validates independently, so this is UX only.
  const canSubmit = trimmed.length > 0 && !isPosting;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await addComment(trimmed);
      setDraft("");
    } catch {
      // The message is already surfaced inline from the mutation state.
    }
  };

  const onDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch {
      // Surfaced inline from the mutation state.
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comments-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="comments-title" className="text-lg font-bold text-slate-900">
            Support
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <MessageCircle className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">
                No comments yet. Be the first to cheer them on.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {comments.map((comment) => {
                const isMine = comment.isOwn || comment.author.uid === viewerUid;
                return (
                  <li key={comment.id} className="flex items-start gap-3 px-5 py-3">
                    <Link
                      href={`/users/${comment.author.username}`}
                      onClick={onClose}
                      className="shrink-0"
                    >
                      <Avatar
                        name={comment.author.displayName || comment.author.username}
                        src={comment.author.photoUrl}
                        size={36}
                        className="h-9 w-9"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {isMine
                            ? "You"
                            : comment.author.displayName ||
                              comment.author.username}
                        </p>
                        <p className="shrink-0 text-xs text-slate-400">
                          {timeAgo(comment.createdAt)}
                        </p>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">
                        {comment.content}
                      </p>
                    </div>
                    {isMine && (
                      <button
                        onClick={() => void onDelete(comment.id)}
                        disabled={deletingCommentId === comment.id}
                        aria-label="Delete your comment"
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-60"
                      >
                        {deletingCommentId === comment.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {hasMore && (
          <div className="border-t border-slate-200 p-3">
            <button
              onClick={() => void loadMore()}
              disabled={isLoadingMore}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </>
              ) : (
                "Load more"
              )}
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => void onSubmit(e)}
          className="border-t border-slate-200 bg-slate-50/60 p-3"
        >
          <label htmlFor="comment-input" className="sr-only">
            Write a comment
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id="comment-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends; Shift+Enter inserts a newline.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSubmit(e);
                }
              }}
              rows={2}
              maxLength={COMMENT_MAX_LENGTH}
              placeholder="Say something supportive…"
              className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563EB]"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              aria-label="Post comment"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {isPosting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          {postError ? (
            <p className="mt-1.5 text-xs text-red-500">{postError}</p>
          ) : deleteError ? (
            <p className="mt-1.5 text-xs text-red-500">{deleteError}</p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">
              {trimmed.length}/{COMMENT_MAX_LENGTH}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
