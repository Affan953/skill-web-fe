"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { CircleVisibility, CreateCircleInput } from "@/types";

const NAME_MIN = 3;
const NAME_MAX = 80;
const TOPIC_MIN = 2;
const TOPIC_MAX = 50;
const DESCRIPTION_MAX = 500;

/**
 * Topic suggestions only. The topic itself is free text the creator types —
 * these are hints, not a closed list, and typing anything else is allowed.
 */
const TOPIC_SUGGESTIONS = [
  "Reading",
  "Fitness",
  "Writing",
  "Learning",
  "Mindfulness",
  "Career",
  "Languages",
  "Side project",
];

interface CreateCircleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCircleInput) => Promise<unknown>;
  isSubmitting?: boolean;
  error?: string | null;
}

export default function CreateCircleDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
}: CreateCircleDialogProps) {
  const nameId = useId();
  const topicId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<CircleVisibility>("PUBLIC");
  const [localError, setLocalError] = useState<string | null>(null);

  // No reset-on-open effect: the parent mounts this dialog only while it is
  // open, so every open starts from fresh state and the previous draft can
  // never leak into a new circle.

  // Escape closes, matching the other dialogs in the app.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Focus stays inside the dialog while it is open and returns to the trigger
  // when it closes.
  useFocusTrap(open, dialogRef);

  if (!open) return null;

  const trimmedName = name.trim();
  const trimmedTopic = topic.trim();
  const trimmedDescription = description.trim();

  const canSubmit =
    trimmedName.length >= NAME_MIN &&
    trimmedName.length <= NAME_MAX &&
    trimmedTopic.length >= TOPIC_MIN &&
    trimmedTopic.length <= TOPIC_MAX &&
    trimmedDescription.length <= DESCRIPTION_MAX &&
    !isSubmitting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    // Mirrors the backend bounds so the user gets an answer without a round
    // trip. The server still validates independently.
    if (trimmedName.length < NAME_MIN) {
      setLocalError(`Circle name needs at least ${NAME_MIN} characters.`);
      return;
    }
    if (trimmedTopic.length < TOPIC_MIN) {
      setLocalError(`Topic needs at least ${TOPIC_MIN} characters.`);
      return;
    }
    if (trimmedDescription.length > DESCRIPTION_MAX) {
      setLocalError(
        `Description must be ${DESCRIPTION_MAX} characters or fewer.`
      );
      return;
    }

    await onSubmit({
      name: trimmedName,
      topic: trimmedTopic,
      description: trimmedDescription || undefined,
      visibility,
    });
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563EB]";

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${nameId}-heading`}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id={`${nameId}-heading`}
            className="text-lg font-semibold text-slate-900"
          >
            Create a Growth Circle
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor={nameId}
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Name
            </label>
            <input
              id={nameId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="30 Day Reading Challenge"
              maxLength={NAME_MAX}
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-slate-400">
              {trimmedName.length}/{NAME_MAX}
            </p>
          </div>

          <div>
            <label
              htmlFor={topicId}
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Topic
            </label>
            <input
              id={topicId}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Reading"
              maxLength={TOPIC_MAX}
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-slate-400">
              Any text works — this is what people will browse and filter by.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TOPIC_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setTopic(suggestion)}
                  // Announced as a shortcut that writes into the field, so the
                  // chip is not mistaken for a submission or a constraint.
                  aria-label={`Use “${suggestion}” as the topic`}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor={descriptionId}
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Description{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id={descriptionId}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={DESCRIPTION_MAX}
              placeholder="What is this circle for?"
              className={`${fieldClass} resize-none`}
            />
            <p className="mt-1 text-xs text-slate-400">
              {trimmedDescription.length}/{DESCRIPTION_MAX}
            </p>
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-slate-700">
              Visibility
            </legend>
            <div className="flex gap-2">
              {(["PUBLIC", "PRIVATE"] as const).map((value) => (
                <label
                  key={value}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    visibility === value
                      ? "border-[#2563EB] bg-[#2563EB]/5 font-medium text-[#2563EB]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={value}
                    checked={visibility === value}
                    onChange={() => setVisibility(value)}
                    className="sr-only"
                  />
                  {value === "PUBLIC" ? "Public" : "Private"}
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              {visibility === "PUBLIC"
                ? "Anyone can find and join this circle."
                : "Only members can see this circle. You add them yourself."}
            </p>
          </fieldset>

          {localError || error ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {localError ?? error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating…" : "Create circle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}