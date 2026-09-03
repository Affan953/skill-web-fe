"use client";

import { useState, useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  BookOpen,
  Code,
  Dumbbell,
  BookText,
  Heart,
  Wallet,
  Briefcase,
  Brain,
  Smile,
  Lightbulb,
  Loader2,
  ChevronRight,
  Target,
  CookingPot,
  Palette,
  Music,
  PenLine,
  Gamepad2,
  Sprout,
  Scissors,
  PawPrint,
  Music2,
  Brush,
  Mic,
  Wrench,
  CircleDashed,
} from "lucide-react";
import type { HabitCategory, HabitDifficulty, CustomCategory } from "@/types";
import {
  CATEGORY_ORDER,
  HABIT_CATEGORIES,
  GOAL_UNIT_SUGGESTIONS,
  getCategory,
  suggestGoalLabelForUnit,
} from "@/lib/habitCatalog";
import { formatGoalValue } from "@/lib/habitGoal";
import { cn } from "@/lib/cn";
import SuggestionChips, {
  type SuggestionChipItem,
} from "@/components/habits/SuggestionChips";
import IconSelector from "@/components/ui/IconSelector";
import { useCustomCategories } from "@/hooks/useCustomCategories";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Learning: BookOpen,
  Coding: Code,
  Fitness: Dumbbell,
  Reading: BookText,
  Health: Heart,
  Finance: Wallet,
  Productivity: Briefcase,
  Meditation: Brain,
  Custom: Smile,
  Uncategorized: CircleDashed,
};

const CUSTOM_ICONS: { icon: LucideIcon; label: string }[] = [
  { icon: CookingPot, label: "Cooking" },
  { icon: Palette, label: "Art" },
  { icon: Music, label: "Music" },
  { icon: PenLine, label: "Writing" },
  { icon: Gamepad2, label: "Gaming" },
  { icon: Sprout, label: "Gardening" },
  { icon: Scissors, label: "Crafts" },
  { icon: PawPrint, label: "Pets" },
  { icon: Music2, label: "Dance" },
  { icon: Brush, label: "Cleaning" },
  { icon: Mic, label: "Speaking" },
  { icon: Wrench, label: "Skills" },
];

// Generic starting points used when no category catalog applies (custom or skipped).
const FALLBACK_ACTIVITIES = [
  "Practice",
  "Review Notes",
  "Deep Work",
  "Journaling",
  "Daily Planning",
];

const DIFFICULTIES: { value: HabitDifficulty; xp: number; hint: string }[] = [
  { value: "Easy", xp: 10, hint: "A light daily commitment" },
  { value: "Medium", xp: 20, hint: "A steady, consistent effort" },
  { value: "Hard", xp: 30, hint: "A serious daily challenge" },
];

const STEPS = ["Category", "Activity", "Session Goal", "Details"];

const HEADER_QUESTIONS = [
  "What do you want to improve?",
  "What would you like to work on?",
  "What is your target?",
  "Make it yours.",
];

const HEADER_HINTS = [
  "Pick a category — it only helps organize your habit.",
  "Describe your habit in your own words. Anything counts.",
  "Set a target that fits your day. You decide.",
  "Give it a title and fine-tune the details.",
];

const GOAL_VALUE_SUGGESTIONS: SuggestionChipItem[] = [
  { key: "15-Minutes", label: "15 min" },
  { key: "30-Minutes", label: "30 min" },
  { key: "45-Minutes", label: "45 min" },
  { key: "60-Minutes", label: "60 min" },
];

export interface CreateHabitPayload {
  title: string;
  description?: string;
  category: HabitCategory;
  activity?: string;
  goalLabel?: string;
  goalValue?: number;
  goalUnit?: string;
  difficulty: HabitDifficulty;
  reminderTime?: string;
}

interface CreateHabitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHabitPayload) => void;
  loading: boolean;
}

export default function CreateHabitModal({
  open,
  onClose,
  onSubmit,
  loading,
}: CreateHabitModalProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<HabitCategory | null>(null);
  const [activityText, setActivityText] = useState("");
  const [goalValue, setGoalValue] = useState<number | null>(null);
  const [goalUnit, setGoalUnit] = useState("");
  const [goalLabel, setGoalLabel] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<HabitDifficulty>("Easy");
  const [reminderTime, setReminderTime] = useState("");
  const [attemptedStep, setAttemptedStep] = useState(0);

  const { customCategories, createCategory } = useCustomCategories();

  const [customSectionOpen, setCustomSectionOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customIcon, setCustomIcon] = useState("Cooking");
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setMounted(true);
          setVisible(true);
        })
      );
      return () => cancelAnimationFrame(raf);
    }
    const fadeTimer = setTimeout(() => setVisible(false), 0);
    const unmountTimer = setTimeout(() => setMounted(false), 300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const categories = useMemo(() => {
    const order = CATEGORY_ORDER.filter((c) => c !== "Custom");
    return order.map((c) => HABIT_CATEGORIES.find((x) => x.category === c)!);
  }, []);

  const categoryDef = category ? getCategory(category) : undefined;

  const renderCustomIcon = (iconName: string) => {
    const found = CUSTOM_ICONS.find((o) => o.label === iconName);
    return found ? found.icon : Smile;
  };

  // Activity suggestions are OPTIONAL conveniences derived from the catalog,
  // or from a generic pool when the category is custom or was skipped. They
  // never block the user from typing any activity they want.
  const activitySuggestions = useMemo(() => {
    const all =
      categoryDef && categoryDef.activities.length > 0
        ? categoryDef.activities.map((a) => a.name)
        : FALLBACK_ACTIVITIES;
    const q = activityText.trim().toLowerCase();
    const filtered = q
      ? all.filter((name) => name.toLowerCase().includes(q))
      : all;
    return (filtered.length > 0 ? filtered : all).slice(0, 6);
  }, [categoryDef, activityText]);

  const resolvedGoalLabel =
    goalLabel.trim() || suggestGoalLabelForUnit(goalUnit) || "Session Goal";

  const stepError = (() => {
    if (attemptedStep !== step) return null;
    switch (step) {
      case 1:
        if (category === "Custom" && customSectionOpen) {
          return customName.trim()
            ? null
            : "Name your custom category to continue.";
        }
        return category
          ? null
          : "Choose a category, or skip to continue.";
      case 2:
        return activityText.trim() ? null : "Tell us what you'd like to work on.";
      case 3:
        return goalValue != null && !Number.isNaN(goalValue) && goalValue >= 0
          ? null
          : "Enter a valid target value (0 or more).";
      case 4:
        return title.trim() ? null : "Give your habit a title.";
      default:
        return null;
    }
  })();

  const reset = () => {
    setStep(1);
    setAttemptedStep(0);
    setCategory(null);
    setActivityText("");
    setGoalValue(null);
    setGoalUnit("");
    setGoalLabel("");
    setTitle("");
    setDescription("");
    setDifficulty("Easy");
    setReminderTime("");
    setCustomSectionOpen(false);
    setCustomName("");
    setCustomIcon("Cooking");
    setSelectedCustomId(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const selectCategory = (c: HabitCategory) => {
    // Changing category never destroys already-entered activity/goal input.
    setCategory(c);
    setCustomSectionOpen(false);
    setSelectedCustomId(null);
    setAttemptedStep(0);
    setStep(2);
  };

  const toggleCustom = () => {
    if (customSectionOpen) {
      // Closing the custom panel deselects the Custom card.
      setCustomSectionOpen(false);
      setCategory((c) => (c === "Custom" ? null : c));
    } else {
      setCustomSectionOpen(true);
      setCategory("Custom");
    }
    setSelectedCustomId(null);
    setAttemptedStep(0);
  };

  const selectSavedCustom = (cc: CustomCategory) => {
    setCategory("Custom");
    setCustomSectionOpen(false);
    setSelectedCustomId(cc.id);
    if (!activityText.trim()) setActivityText(cc.name);
    setAttemptedStep(0);
    setStep(2);
  };

  const skipCategory = () => {
    setCategory("Uncategorized");
    setCustomSectionOpen(false);
    setSelectedCustomId(null);
    setAttemptedStep(0);
    setStep(2);
  };

  const confirmCustomCategory = async () => {
    const name = customName.trim();
    if (!name) {
      setAttemptedStep(step);
      return;
    }
    setAttemptedStep(0);
    try {
      await createCategory.mutateAsync({
        name,
        icon: customIcon || "Cooking",
      });
    } catch {
      // Keep going — the habit can still be created with category "Custom".
    }
    setCategory("Custom");
    setCustomSectionOpen(false);
    setSelectedCustomId(null);
    if (!activityText.trim()) setActivityText(name);
    setStep(2);
  };

  const pickActivity = (item: SuggestionChipItem) => {
    setActivityText(item.label);
    setAttemptedStep(0);
  };

  const pickGoalValue = (item: SuggestionChipItem) => {
    const [rawValue, unit] = item.key.split("-");
    const value = parseFloat(rawValue);
    if (!Number.isNaN(value)) setGoalValue(value);
    if (unit) setGoalUnit(unit);
    setAttemptedStep(0);
  };

  const pickGoalUnit = (item: SuggestionChipItem) => {
    setGoalUnit(item.label);
    setAttemptedStep(0);
  };

  const handleGoalValueChange = (v: string) => {
    setGoalValue(v === "" ? null : parseFloat(v));
    setAttemptedStep(0);
  };

  const goNext = () => {
    setAttemptedStep(step);
    if (step === 1) {
      if (category === "Custom" && customSectionOpen) {
        void confirmCustomCategory();
      } else if (category) {
        setStep(2);
        setAttemptedStep(0);
      }
      // Fall through keeps attemptedStep set so the validation error shows.
    } else if (step === 2 && activityText.trim()) {
      // Echo the user's own activity into the title as a starting point.
      if (!title.trim()) setTitle(activityText.trim());
      setStep(3);
      setAttemptedStep(0);
    } else if (
      step === 3 &&
      goalValue != null &&
      !Number.isNaN(goalValue) &&
      goalValue >= 0
    ) {
      setStep(4);
      setAttemptedStep(0);
    } else if (step === 4 && title.trim()) {
      onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category ?? "Uncategorized",
        activity: activityText.trim() || undefined,
        goalLabel: resolvedGoalLabel,
        goalValue: goalValue ?? undefined,
        goalUnit: goalUnit.trim() || undefined,
        difficulty,
        reminderTime: reminderTime || undefined,
      });
    }
  };

  const goBack = () => {
    setAttemptedStep(0);
    if (step > 1) setStep(step - 1);
    else handleClose();
  };

  if (!mounted) return null;

  const goalValueString = goalValue != null ? goalValue : null;
  const goalPreview =
    goalValueString != null
      ? formatGoalValue(goalValueString, goalUnit.trim())
      : "—";

  const stepTouched = attemptedStep === step;
  const showError = stepTouched && stepError != null;

  const customPending = category === "Custom" && customSectionOpen;
  const continueDisabled =
    loading ||
    (step === 1 && customPending && !customName.trim());

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Create Habit"
    >
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={handleClose} />

      <div
        className={cn(
          "relative flex max-h-[92vh] w-full max-w-[680px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300",
          visible ? "scale-100 opacity-100 translate-y-0" : "scale-[0.97] opacity-0 translate-y-3"
        )}
        style={{ boxShadow: "0 0 0 1px rgba(37,99,235,0.04), 0 8px 40px rgba(37,99,235,0.06), 0 20px 60px rgba(0,0,0,0.06)" }}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]">
                Create New Habit
              </p>
              <h2 className="text-2xl font-bold text-[#0F172A]">
                {HEADER_QUESTIONS[step - 1]}
              </h2>
              <p className="mt-1 text-xs text-[#64748B]">{HEADER_HINTS[step - 1]}</p>
            </div>

            {step === 1 && (
              <button
                type="button"
                onClick={skipCategory}
                className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64748B] transition-all duration-200 hover:border-[#2563EB]/40 hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
              >
                Skip
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Steps indicator */}
          <ol className="mt-4 flex flex-wrap items-center gap-2" aria-label="Create habit progress">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              return (
                <li key={label} className="flex items-center gap-2">
                  <span
                    aria-current={active ? "step" : undefined}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200",
                        done
                          ? "bg-[#10B981] text-white"
                          : active
                            ? "bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/30"
                            : "bg-slate-100 text-slate-400"
                      )}
                    >
                      {done ? <Check className="h-3 w-3" /> : n}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-medium transition-colors",
                        active ? "text-[#0F172A]" : "text-slate-400"
                      )}
                    >
                      {label}
                    </span>
                  </span>
                  {n < STEPS.length && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-px w-8",
                        done || step > n ? "bg-[#10B981]" : "bg-slate-200"
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mx-8 h-px bg-slate-100" />

        {/* Body */}
        <div className="min-h-[300px] flex-1 overflow-y-auto px-8 py-6">
          {step === 1 && (
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
                Step 1 — Category
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categories.map((c) => {
                  const Icon = CATEGORY_ICONS[c.category] ?? Sparkles;
                  const active =
                    category === c.category && !customSectionOpen && !selectedCustomId;
                  return (
                    <button
                      key={c.category}
                      onClick={() => selectCategory(c.category)}
                      aria-pressed={active}
                      className={cn(
                        "group flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
                        active
                          ? "border-[#2563EB] bg-[#2563EB]/5 shadow-md shadow-[#2563EB]/10"
                          : "border-slate-100 bg-white hover:border-[#2563EB]/40 hover:shadow-md hover:shadow-[#2563EB]/5 active:scale-[0.98]"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200",
                          active
                            ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30"
                            : "bg-[#2563EB]/8 text-[#2563EB] group-hover:bg-[#2563EB]/10"
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold text-[#0F172A]">
                        {c.label}
                      </span>
                    </button>
                  );
                })}

                {/* Saved custom categories — appended after built-ins */}
                {customCategories.map((cc) => {
                  const active = selectedCustomId === cc.id;
                  return (
                    <button
                      key={`custom-${cc.id}`}
                      onClick={() => selectSavedCustom(cc)}
                      aria-pressed={active}
                      className={cn(
                        "group flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
                        active
                          ? "border-[#2563EB] bg-[#2563EB]/5 shadow-md shadow-[#2563EB]/10"
                          : "border-slate-100 bg-white hover:border-[#2563EB]/40 hover:shadow-md hover:shadow-[#2563EB]/5 active:scale-[0.98]"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200",
                          active
                            ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30"
                            : "bg-[#2563EB]/8 group-hover:bg-[#2563EB]/10"
                        )}
                      >
                        {(() => {
                          const SavedIcon = renderCustomIcon(cc.icon);
                          return <SavedIcon className="h-6 w-6" />;
                        })()}
                      </div>
                      <span className="text-sm font-semibold text-[#0F172A]">
                        {cc.name}
                      </span>
                    </button>
                  );
                })}

                {/* Create a new custom category */}
                <button
                  type="button"
                  onClick={toggleCustom}
                  aria-pressed={category === "Custom" && customSectionOpen}
                  className={cn(
                    "group flex flex-col items-center gap-2 rounded-2xl border border-dashed p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
                    category === "Custom" && customSectionOpen
                      ? "border-[#2563EB] bg-[#2563EB]/5 shadow-md shadow-[#2563EB]/10"
                      : "border-slate-200 bg-white hover:border-[#2563EB]/50 hover:shadow-md hover:shadow-[#2563EB]/5 active:scale-[0.98]"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200",
                      category === "Custom" && customSectionOpen
                        ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30"
                        : "bg-[#2563EB]/8 text-[#2563EB] group-hover:bg-[#2563EB]/10"
                    )}
                  >
                    <Smile className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-[#0F172A]">
                    Custom
                  </span>
                </button>
              </div>

              {/* Custom category builder — expands inline below the grid */}
              {customSectionOpen && (
                <div className="mt-5 rounded-2xl border border-[#2563EB]/20 bg-[#2563EB]/[0.03] p-5 transition-all duration-200">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    Create your own category
                  </p>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Saved to your account so it appears next time you create a
                    habit.
                  </p>

                  <IconSelector
                    value={customIcon}
                    onChange={(v) => {
                      setCustomIcon(v);
                      setAttemptedStep(0);
                    }}
                    options={CUSTOM_ICONS}
                    columns={4}
                    label="Pick an icon"
                    className="mt-4"
                  />

                  <div className="mt-4">
                    <label
                      htmlFor="habit-custom-name"
                      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
                    >
                      Category Name *
                    </label>
                    <input
                      id="habit-custom-name"
                      type="text"
                      value={customName}
                      onChange={(e) => {
                        setCustomName(e.target.value);
                        setAttemptedStep(0);
                      }}
                      maxLength={60}
                      placeholder="e.g. Cooking, Journaling"
                      autoComplete="off"
                      aria-invalid={
                        (attemptedStep === step && !customName.trim()) || undefined
                      }
                      className={cn(
                        "w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200 focus:outline-none focus:ring-2",
                        attemptedStep === step && customName.trim() === ""
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-[#2563EB] focus:ring-[#2563EB]/10"
                      )}
                    />
                    {attemptedStep === step && customName.trim() === "" ? (
                      <p
                        role="alert"
                        className="mt-2 text-xs font-medium text-red-500"
                      >
                        Name your custom category to continue.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-[#64748B]">
                        Continue is disabled until you give it a name.
                      </p>
                    )}
                  </div>

                  {createCategory.isPending && (
                    <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[#2563EB]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving your category…
                    </p>
                  )}
                </div>
              )}

              {showError && (
                <p
                  role="alert"
                  className="mt-3 text-xs font-medium text-red-500"
                >
                  {stepError}
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
                Step 2 — Activity
              </p>

              <input
                id="habit-activity"
                type="text"
                value={activityText}
                onChange={(e) => {
                  setActivityText(e.target.value);
                  setAttemptedStep(0);
                }}
                placeholder="e.g. Learn English grammar"
                maxLength={100}
                autoComplete="off"
                aria-invalid={showError || undefined}
                aria-describedby={showError ? "activity-error" : "activity-helper"}
                className={cn(
                  "w-full rounded-2xl border bg-white px-5 py-4 text-base text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200 focus:outline-none focus:ring-2",
                  showError
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-slate-200 focus:border-[#2563EB] focus:ring-[#2563EB]/10"
                )}
              />
              <p id="activity-helper" className="mt-2 text-xs text-[#64748B]">
                Describe your habit in your own words. Anything you want to
                practice counts.
              </p>
              {showError && (
                <p id="activity-error" role="alert" className="mt-2 text-xs font-medium text-red-500">
                  {stepError}
                </p>
              )}

              {activitySuggestions.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-[#64748B]">
                    <Lightbulb className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
                    Optional shortcuts — tap to autofill, or ignore and type
                    your own.
                  </p>
                  <SuggestionChips
                    items={activitySuggestions.map((name) => ({
                      key: name.toLowerCase(),
                      label: name,
                    }))}
                    onPick={pickActivity}
                    selectedKey={activityText.trim().toLowerCase()}
                  />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
                Step 3 — Session Goal
              </p>

              {category && (
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#2563EB]/8 px-3 py-1 text-xs font-medium text-[#2563EB]">
                    {category}
                  </span>
                  {activityText.trim() && (
                    <span className="max-w-full truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {activityText.trim()}
                    </span>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="habit-goal-value"
                      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
                    >
                      Target Value *
                    </label>
                    <input
                      id="habit-goal-value"
                      type="number"
                      inputMode="decimal"
                      value={goalValueString ?? ""}
                      onChange={(e) => handleGoalValueChange(e.target.value)}
                      min={0}
                      placeholder="0"
                      aria-invalid={showError || undefined}
                      aria-describedby={showError ? "goal-error" : undefined}
                      className={cn(
                        "w-full rounded-xl border bg-white px-4 py-3 text-base tabular-nums text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200 focus:outline-none focus:ring-2",
                        showError
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-[#2563EB] focus:ring-[#2563EB]/10"
                      )}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="habit-goal-unit"
                      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
                    >
                      Unit
                    </label>
                    <input
                      id="habit-goal-unit"
                      type="text"
                      value={goalUnit}
                      onChange={(e) => {
                        setGoalUnit(e.target.value);
                        setAttemptedStep(0);
                      }}
                      maxLength={30}
                      placeholder="e.g. Minutes, Pages, KM"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="habit-goal-label"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
                  >
                    Goal Label{" "}
                    <span className="font-normal normal-case text-[#94A3B8]">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="habit-goal-label"
                    type="text"
                    value={goalLabel}
                    onChange={(e) => {
                      setGoalLabel(e.target.value);
                      setAttemptedStep(0);
                    }}
                    maxLength={100}
                    placeholder="e.g. Pages to Read"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none"
                  />
                </div>

                {showError && (
                  <p id="goal-error" role="alert" className="mt-3 text-xs font-medium text-red-500">
                    {stepError}
                  </p>
                )}

                {/* Live preview */}
                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#2563EB]/10 bg-white px-5 py-4 transition-all duration-200">
                  <span className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
                    <Target className="h-3.5 w-3.5 text-[#2563EB]" />
                    {resolvedGoalLabel}
                  </span>
                  <span className="text-lg font-bold text-[#2563EB] tabular-nums">
                    {goalPreview}
                  </span>
                </div>
              </div>

              {/* Optional quick picks — always just suggestions */}
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Quick picks — optional
                </p>
                <SuggestionChips
                  items={GOAL_VALUE_SUGGESTIONS}
                  onPick={pickGoalValue}
                  selectedKey={
                    goalValue != null
                      ? `${goalValue}-${goalUnit.trim() || "Minutes"}`
                      : undefined
                  }
                />
              </div>
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Common units — optional
                </p>
                <SuggestionChips
                  items={GOAL_UNIT_SUGGESTIONS.map((u) => ({
                    key: u.toLowerCase(),
                    label: u,
                  }))}
                  onPick={pickGoalUnit}
                  selectedKey={goalUnit.trim().toLowerCase()}
                />
              </div>
              <p className="mt-3 text-[11px] text-[#94A3B8]">
                Quick picks and units are only suggestions. Type any value or
                unit that fits your goal.
              </p>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
                Step 4 — Details
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="habit-title"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
                  >
                    Habit Title *
                  </label>
                  <input
                    id="habit-title"
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setAttemptedStep(0);
                    }}
                    maxLength={100}
                    placeholder="e.g. Morning Run"
                    aria-invalid={showError || undefined}
                    aria-describedby={showError ? "title-error" : undefined}
                    className={cn(
                      "w-full rounded-xl border bg-[#FAFBFC] px-5 py-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200 focus:outline-none focus:ring-2",
                      showError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-[#2563EB] focus:ring-[#2563EB]/10"
                    )}
                  />
                  {showError && (
                    <p id="title-error" role="alert" className="mt-2 text-xs font-medium text-red-500">
                      {stepError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                      Difficulty
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setDifficulty(d.value)}
                          aria-pressed={difficulty === d.value}
                          className={cn(
                            "rounded-xl border px-3 py-3 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
                            difficulty === d.value
                              ? "border-[#2563EB] bg-[#2563EB]/5 shadow-md shadow-[#2563EB]/10"
                              : "border-slate-200 bg-white hover:border-[#2563EB]/40 active:scale-95"
                          )}
                        >
                          <p
                            className={cn(
                              "text-xs font-bold",
                              difficulty === d.value
                                ? "text-[#2563EB]"
                                : "text-[#0F172A]"
                            )}
                          >
                            {d.value}
                          </p>
                          <p className="mt-0.5 text-[10px] font-medium text-[#10B981] tabular-nums">
                            +{d.xp} XP
                          </p>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-[#94A3B8]">
                      {DIFFICULTIES.find((d) => d.value === difficulty)?.hint}
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="habit-reminder"
                      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
                    >
                      Reminder Time
                    </label>
                    <input
                      id="habit-reminder"
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-[#0F172A] transition-all duration-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="habit-description"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
                  >
                    Description
                  </label>
                  <textarea
                    id="habit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Optional — why this habit matters to you"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-[#FAFBFC] px-5 py-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none"
                  />
                </div>

                {/* Your Habit preview — shows the user's actual choices */}
                <div className="rounded-2xl border border-[#2563EB]/10 bg-[#2563EB]/[0.03] p-5">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]">
                    Your Habit
                  </p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                        Category
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-[#0F172A]">
                        {category ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                        Activity
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-[#0F172A]">
                        {activityText.trim() || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                        Goal
                      </dt>
                      <dd className="mt-0.5 text-sm font-bold text-[#2563EB] tabular-nums">
                        {goalPreview}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                        Schedule
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-[#0F172A]">
                        {reminderTime || "No reminder"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <span className="rounded-full bg-[#2563EB]/8 px-3 py-1 text-xs font-medium text-[#2563EB]">
                      {title.trim() || "Untitled habit"}
                    </span>
                    <span className="rounded-full bg-[#10B981]/8 px-3 py-1 text-xs font-medium text-[#10B981]">
                      {DIFFICULTIES.find((d) => d.value === difficulty)?.xp} XP
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {difficulty}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mx-8 h-px bg-slate-100" />

        {/* Footer */}
        <div className="px-8 py-6 flex items-center gap-3">
          <button
            onClick={goBack}
            className="h-14 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-[#64748B] transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={goNext}
            disabled={continueDisabled}
            className="group h-14 flex-1 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#2563EB]/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 flex items-center justify-center gap-2.5"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step === 4 ? (
              <>
                <Sparkles className="h-4 w-4" />
                Create Habit
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
