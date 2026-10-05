"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Flag, Loader2, ShieldAlert, X } from "lucide-react";
import {
  REPORT_DESCRIPTION_MAX_LENGTH,
  REPORT_OTHER_MIN_DESCRIPTION,
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  type ReportReason,
} from "@/types";
import { getUserFacingError } from "@/lib/api";

interface ReportUserDialogProps {
  /**
   * The reported user. Both a uid (from a profile) and the username are passed
   * so the caller can hand over whichever it holds; the uid is what the API
   * needs and the username is what the user reads.
   */
  userId: string;
  username: string;
  displayName?: string;
  onClose: () => void;
  onSubmit: (input: {
    reportedUserId: string;
    reason: ReportReason;
    description: string;
  }) => Promise<void>;
  /** Set by the parent when the submission succeeded, to render the success state. */
  submitted?: boolean;
}

const REASON_HINTS: Record<ReportReason, string> = {
  HARASSMENT: "Threats, bullying, targeting or repeated unwanted contact.",
  SPAM: "Unsolicited links, advertising or scam messages.",
  INAPPROPRIATE_CONTENT: "Content that is harmful, sexual or explicit where it isn’t expected.",
  FAKE_ACCOUNT: "Impersonation, bot behaviour or someone else’s identity.",
  OTHER: "Tell us what happened in your own words.",
};

/**
 * Report a user for moderation review.
 *
 * Accessibility is done properly here rather than copied from
 * `ReflectionModal`, which has none of it: this is a control whose whole job is
 * to make a user state something they did not want to state aloud, so a focus
 * trap that leaks to the page behind it, or an Escape key that silently
 * discards a half-written explanation, is a real cost here.
 *
 *   - `role="dialog"` + `aria-modal` + `aria-labelledby` / `aria-describedby`
 *   - focus moves to the dialog on open and returns to the trigger on close
 *   - focus is trapped inside; Tab and Shift+Tab wrap
 *   - Escape closes, but ONLY after an inline "are you sure" when text has been
 *     typed — discarding a paragraph of context because of a stray keypress is
 *     the kind of data loss this feature exists to prevent
 *   - the reason list is a real `radiogroup` with arrow-key movement
 *   - errors are announced through `role="alert"`, and the live character
 *     counter is `aria-live="polite"` so it does not interrupt typing
 */
export default function ReportUserDialog({
  userId,
  username,
  displayName,
  onClose,
  onSubmit,
  submitted = false,
}: ReportUserDialogProps) {
  // Every field starts fresh because the parent mounts this component only
  // while the dialog is open. There is deliberately no "reset on open" effect:
  // remounting is the reset, and an effect that cleared state would be an extra
  // render pass on every open.
  const [reason, setReason] = useState<ReportReason>("HARASSMENT");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();

  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const trimmed = description.trim();
  // Mirrors the backend exactly: a note is required for every reason, and OTHER
  // additionally needs real explanation because the reason itself says nothing.
  const needsMoreDetail = reason === "OTHER" && trimmed.length < REPORT_OTHER_MIN_DESCRIPTION;
  const canSubmit = trimmed.length > 0 && !needsMoreDetail && !submitting;
  const hasTypedSomething = trimmed.length > 0;

  // Move focus in on mount, and hand it back to whatever opened us on unmount.
  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Focus the heading, not the first control: a screen reader should announce
    // what this dialog IS before it starts reading a reason at the user.
    const id = window.requestAnimationFrame(() => headingRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(id);
      returnFocusRef.current?.focus?.();
    };
  }, []);

  // Focus trap + Escape, registered on the document so it works regardless of
  // where focus currently sits inside the dialog.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (hasTypedSomething && !confirmDiscard) {
          setConfirmDiscard(true);
        } else {
          onClose();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirmDiscard, hasTypedSomething, onClose]);

  // Arrow-key movement within the reason radiogroup, per the WAI-ARIA pattern.
  const onReasonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowRight" && event.key !== "ArrowUp" && event.key !== "ArrowLeft") {
      return;
    }
    event.preventDefault();
    const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const next = REPORT_REASONS[(index + delta + REPORT_REASONS.length) % REPORT_REASONS.length];
    setReason(next);
    const group = panelRef.current?.querySelector<HTMLElement>(
      `[data-reason="${next}"]`
    );
    group?.focus();
  };

  const requestClose = () => {
    if (hasTypedSomething && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        reportedUserId: userId,
        reason,
        description: trimmed,
      });
    } catch (err) {
      // Mapped through the shared translator so the user sees prose, not a
      // backend error code like REPORT_SELF_NOT_ALLOWED.
      setError(getUserFacingError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      // The backdrop itself is presentational; the panel below carries the
      // dialog semantics.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/20 bg-white/95"
        style={{
          boxShadow:
            "0 0 0 1px rgba(37,99,235,0.08), 0 8px 40px rgba(37,99,235,0.12), 0 30px 80px rgba(0,0,0,0.25)",
        }}
      >
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <Flag className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3
                  ref={headingRef}
                  id={titleId}
                  tabIndex={-1}
                  className="text-base font-semibold text-slate-900 outline-none"
                >
                  Report @{username}
                </h3>
                <p className="text-xs text-slate-500">
                  {displayName ? `${displayName} · ` : ""}Reviewed by moderators
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close report dialog"
              className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <ShieldAlert className="mx-auto h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                Report submitted
              </p>
              <p className="text-sm text-slate-500">
                Thanks for letting us know. Our moderators will review it. You
                won’t be told the outcome, and the person you reported is not
                notified.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p id={descriptionId} className="text-sm text-slate-500">
                Reports are private. The person you report won’t be told who
                reported them.
              </p>

              <fieldset>
                <legend className="mb-2 text-xs font-medium text-slate-500">
                  What are you reporting? (required)
                </legend>
                <div
                  role="radiogroup"
                  aria-label="Reason for reporting"
                  className="space-y-1.5"
                >
                  {REPORT_REASONS.map((value, index) => {
                    const selected = reason === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        data-reason={value}
                        aria-checked={selected}
                        // Roving tabindex: the group is one tab stop, arrows move
                        // within it. Without this a keyboard user tabs past all
                        // five options.
                        tabIndex={selected ? 0 : -1}
                        onClick={() => setReason(value)}
                        onKeyDown={(e) => onReasonKeyDown(e, index)}
                        className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          selected
                            ? "border-[#2563EB] bg-[#2563EB]/5"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                            selected ? "border-[#2563EB]" : "border-slate-300"
                          }`}
                        >
                          {selected && (
                            <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-slate-900">
                            {REPORT_REASON_LABELS[value]}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {REASON_HINTS[value]}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="report-description"
                  className="mb-1 block text-xs font-medium text-slate-500"
                >
                  What happened? (required)
                </label>
                <textarea
                  id="report-description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (confirmDiscard) setConfirmDiscard(false);
                  }}
                  rows={4}
                  maxLength={REPORT_DESCRIPTION_MAX_LENGTH}
                  required
                  aria-describedby={`${descriptionId}-hint`}
                  aria-invalid={needsMoreDetail || undefined}
                  placeholder={
                    reason === "OTHER"
                      ? "Describe what this person did, in your own words."
                      : "Add any context that would help a moderator."
                  }
                  className={`w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                    needsMoreDetail
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-200 focus:border-[#2563EB]"
                  }`}
                />
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p
                    id={`${descriptionId}-hint`}
                    className={`text-[11px] ${
                      needsMoreDetail ? "text-red-500" : "text-slate-400"
                    }`}
                  >
                    {needsMoreDetail
                      ? `Please write at least ${REPORT_OTHER_MIN_DESCRIPTION} characters for “Something else”.`
                      : "Our moderators only see what you write here."}
                  </p>
                  <p
                    aria-live="polite"
                    className="shrink-0 text-[11px] tabular-nums text-slate-400"
                  >
                    {trimmed.length}/{REPORT_DESCRIPTION_MAX_LENGTH}
                  </p>
                </div>
              </div>

              {confirmDiscard && (
                <div
                  role="alertdialog"
                  aria-label="Discard this report?"
                  className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <p className="flex-1 text-xs text-amber-900">
                    Your description will be lost. Close anyway?
                  </p>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDiscard(false)}
                      className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
                    >
                      Keep editing
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-700"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p role="alert" id={errorId} className="text-sm text-red-500">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={requestClose}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit report
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
