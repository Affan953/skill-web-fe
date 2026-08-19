"use client";

import { useState, useMemo, useCallback } from "react";
import { useHabits } from "@/hooks/useHabits";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { progressApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import StartSessionModal from "@/components/session/StartSessionModal";
import FocusTimer from "@/components/session/FocusTimer";
import SessionComplete from "@/components/session/SessionComplete";
import ProofOfProgressModal from "@/components/progress/ProofOfProgressModal";
import CreateHabitModal, {
  type CreateHabitPayload,
} from "@/components/habits/CreateHabitModal";
import EditHabitModal, {
  type EditHabitPayload,
} from "@/components/habits/EditHabitModal";
import SystemVerification from "@/components/system/SystemVerification";
import GrowthSummary from "@/components/session/GrowthSummary";
import RewardAnimation from "@/components/session/RewardAnimation";
import useMissionVerification from "@/hooks/useMissionVerification";
import useSystemNotification from "@/hooks/useSystemNotification";
import HabitsHeader from "@/components/habits/HabitsHeader";
import HabitsOverview from "@/components/habits/HabitsOverview";
import HabitToolbar, {
  type SortOption,
} from "@/components/habits/HabitToolbar";
import HabitsList from "@/components/habits/HabitsList";
import DeleteHabitDialog from "@/components/habits/DeleteHabitDialog";

import type { Habit, HabitCategory, HabitDifficulty, Reflection } from "@/types";
import type { RankInfo } from "@/lib/verification/types";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { formatGoal } from "@/lib/habitGoal";

type FlowStep =
  | "idle"
  | "startSession"
  | "focus"
  | "sessionComplete"
  | "proof"
  | "verification"
  | "reflection"
  | "reward"
  | "summary";

function HabitsContent() {
  const {
    habits,
    isLoading,
    isError,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
  } = useHabits();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<HabitCategory | "All">(
    "All"
  );
  const [filterDifficulty, setFilterDifficulty] = useState<
    HabitDifficulty | "All"
  >("All");
  const [filterCompleted, setFilterCompleted] = useState<
    "All" | "completed" | "pending"
  >("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  // Session flow state
  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [activeHabit, setActiveHabit] = useState<Habit | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [proofData, setProofData] = useState<Record<string, any>>({});
  const [reflectionText, setReflectionText] = useState("");
  const [proudOf, setProudOf] = useState("");
  const [challenged, setChallenged] = useState("");
  const [improve, setImprove] = useState("");
  const [savedReflection, setSavedReflection] = useState<Reflection | null>(null);
  const [submittingReflection, setSubmittingReflection] = useState(false);
  const [verifiedGrade, setVerifiedGrade] = useState<RankInfo | null>(null);

  const { getToken } = useFirebaseToken();
  const queryClient = useQueryClient();
  const { enqueue, enqueueSequence } = useSystemNotification();

  const missionVerification = useMissionVerification({
    proofData,
    category: activeHabit?.category || "Learning",
    durationMinutes: sessionDuration,
    habit: activeHabit,
    reflection: reflectionText,
    onVerified: (grade) => {
      setVerifiedGrade(grade);
    },
  });

  // --- Session flow callbacks ---

  const handleStartSession = useCallback((habit: Habit) => {
    setActiveHabit(habit);
    setFlowStep("startSession");
  }, []);

  const handleSessionBegin = useCallback(() => {
    setFlowStep("focus");
  }, []);

  const handleSessionCancel = useCallback(() => {
    setFlowStep("idle");
    setActiveHabit(null);
    setSessionDuration(0);
    setProofData({});
    setReflectionText("");
    setProudOf("");
    setChallenged("");
    setImprove("");
    setSavedReflection(null);
    setVerifiedGrade(null);
    missionVerification.reset();
  }, []);

  const handleTimerFinish = useCallback((durationMinutes: number) => {
    setSessionDuration(durationMinutes);
    setFlowStep("sessionComplete");
  }, []);

  const handleContinueFromComplete = useCallback(() => {
    setFlowStep("proof");
  }, []);

  const handleProofNext = useCallback(() => {
    setFlowStep("verification");
  }, []);

  const handleProofBack = useCallback(() => {
    setFlowStep("sessionComplete");
  }, []);

  const handleVerificationContinue = useCallback(() => {
    setFlowStep("reflection");
  }, []);

  const handleReflectionBack = useCallback(() => {
    setFlowStep("verification");
  }, []);

  const handleSaveReflection = useCallback(async () => {
    if (!activeHabit || !reflectionText.trim()) return;
    setSubmittingReflection(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const result = await progressApi.saveReflection(token, {
        habitId: activeHabit.id,
        title: activeHabit.title,
        category: activeHabit.category,
        reflection: reflectionText.trim(),
        proofOfProgress: Object.keys(proofData).length > 0 ? proofData : undefined,
        sessionMetadata: {
          durationMinutes: sessionDuration,
          startedAt: new Date(
            Date.now() - sessionDuration * 60 * 1000
          ).toISOString(),
          completedAt: new Date().toISOString(),
        },
        proudOf: proudOf.trim() || undefined,
        challenged: challenged.trim() || undefined,
        improve: improve.trim() || undefined,
      });

      setSavedReflection(result);

      queryClient.setQueryData<Habit[]>(
        ["habits"],
        (old) =>
          old?.map((h) =>
            h.id === activeHabit.id
              ? { ...h, isCompleted: true, completedAt: new Date().toISOString() }
              : h
          ) ?? old
      );

      // Sequential system notifications
      const CATEGORY_NOTIF: Record<string, { title: string; meta: Record<string, string> }> = {
        Language: { title: "English Growth Confirmed", meta: { Vocabulary: `${proofData.vocabularyCount || 0} words`, Grammar: proofData.grammarTopic ? "Completed" : "—" } },
        Fitness: { title: "Fitness Progress Verified", meta: { Duration: `${proofData.duration || sessionDuration}m`, Calories: proofData.calories ? `${proofData.calories} kcal` : "—" } },
        Reading: { title: "Reading Session Recorded", meta: { Pages: String(proofData.pagesRead || 0), Book: proofData.bookTitle || "—" } },
        Meditation: { title: "Mindfulness Recorded", meta: { Duration: `${proofData.meditationDuration || sessionDuration}m`, Mood: proofData.moodAfter || "—" } },
        Coding: { title: "Coding Session Verified", meta: { Problems: String(proofData.problemsSolved || 0), Feature: proofData.featureBuilt || "—" } },
        Health: { title: "Health Data Recorded", meta: { Steps: proofData.steps ? proofData.steps.toLocaleString() : "—", Water: proofData.waterIntake ? `${proofData.waterIntake} glasses` : "—" } },
        Productivity: { title: "Deep Work Recorded", meta: { Tasks: String(proofData.tasksFinished || 0), Focus: proofData.focusScore ? `${proofData.focusScore}/10` : "—" } },
        Finance: { title: "Saving Progress Updated", meta: { Saved: proofData.moneySaved || "—", Lesson: proofData.lessonLearned ? "Saved" : "—" } },
        Learning: { title: "Learning Progress Verified", meta: { Duration: `${sessionDuration}m` } },
        Custom: { title: "Session Verified", meta: { Duration: `${sessionDuration}m` } },
      };

      const catNotif = CATEGORY_NOTIF[activeHabit.category] || CATEGORY_NOTIF.Custom;

      enqueueSequence([
        {
          type: "MISSION_VERIFIED",
          title: "Mission Verified",
          description: `${activeHabit.title} Completed`,
          category: activeHabit.category,
          meta: { grade: "S", performanceLabel: "Excellent Work" },
          duration: 3000,
        },
        {
          type: "REFLECTION_SAVED",
          title: "Reflection Saved",
          description: "Your thoughts have been recorded. Growth Journal Updated.",
          duration: 3000,
        },
        {
          type: "JOURNEY_RECORDED",
          title: catNotif.title,
          category: activeHabit.category,
          description: `Session: ${activeHabit.title} — ${sessionDuration} min`,
          meta: catNotif.meta,
          duration: 3200,
        },
        {
          type: "XP_GAINED",
          title: "Experience Acquired",
          description: `+${result.xpEarned} XP`,
          meta: {
            xpEarned: result.xpEarned,
          },
          duration: 3200,
        },
        {
          type: "CATEGORY_IMPROVED",
          title: `${activeHabit.category} Growth Confirmed`,
          category: activeHabit.category,
          description: "Skill matrix & level progress updated.",
          duration: 3000,
        },
        {
          type: "STREAK_UPDATED",
          title: "Streak Updated",
          description:
            activeHabit.streak > 0
              ? `${activeHabit.streak + 1} day streak!`
              : "Streak started!",
          meta: { Streak: `${activeHabit.streak + 1} days` },
          duration: 2800,
        },
        {
          type: "QUEST_COMPLETED",
          title: "Quest Progress",
          description: "Daily quest progress updated.",
          duration: 2800,
        },
        {
          type: "ACHIEVEMENT_UNLOCKED",
          title: "Achievement Progress",
          description: "Progress recorded towards badges.",
          duration: 2800,
        },
      ]);

      setFlowStep("summary");

      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["reflections"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["daily-quests"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    } catch (err) {
      console.error("Failed to save reflection:", err);
    } finally {
      setSubmittingReflection(false);
    }
  }, [activeHabit, reflectionText, proofData, sessionDuration, proudOf, challenged, improve, getToken, queryClient]);

  const handleRewardComplete = useCallback(() => {
    setFlowStep("summary");
  }, []);

  const handleSummaryClose = useCallback(() => {
    setFlowStep("idle");
    setActiveHabit(null);
    setSessionDuration(0);
    setProofData({});
    setReflectionText("");
    setProudOf("");
    setChallenged("");
    setImprove("");
    setSavedReflection(null);
    setVerifiedGrade(null);
    missionVerification.reset();
  }, []);

  // --- CRUD callbacks ---

  const handleCreate = (data: CreateHabitPayload) => {
    createHabit.mutate(
      {
        title: data.title,
        description: data.description || undefined,
        category: data.category,
        activity: data.activity,
        goalLabel: data.goalLabel,
        goalValue: data.goalValue,
        goalUnit: data.goalUnit,
        difficulty: data.difficulty,
        reminderTime: data.reminderTime || undefined,
      },
      {
        onSuccess: () => {
          setShowModal(false);
        },
      }
    );
  };

  const handleEdit = (data: EditHabitPayload) => {
    if (!editingHabit) return;
    updateHabit.mutate(
      {
        id: editingHabit.id,
        data: {
          title: data.title,
          description: data.description || undefined,
          category: data.category,
          activity: data.activity,
          goalLabel: data.goalLabel,
          goalValue: data.goalValue,
          goalUnit: data.goalUnit,
          difficulty: data.difficulty,
          reminderTime: data.reminderTime || undefined,
        },
      },
      {
        onSuccess: () => {
          setEditingHabit(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingHabit) return;
    deleteHabit.mutate(deletingHabit.id, {
      onSuccess: () => setDeletingHabit(null),
    });
  };

  const openCreate = () => {
    setEditingHabit(null);
    setShowModal(true);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowModal(false);
  };

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterCategory("All");
    setFilterDifficulty("All");
    setFilterCompleted("All");
  }, []);

  // --- Filtered list ---

  const filtered = useMemo(() => {
    let result = habits;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          (h.description && h.description.toLowerCase().includes(q))
      );
    }

    if (filterCategory !== "All") {
      result = result.filter((h) => h.category === filterCategory);
    }

    if (filterDifficulty !== "All") {
      result = result.filter((h) => h.difficulty === filterDifficulty);
    }

    if (filterCompleted === "completed") {
      result = result.filter((h) => h.isCompleted);
    } else if (filterCompleted === "pending") {
      result = result.filter((h) => !h.isCompleted);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "xp":
          return b.xpReward - a.xpReward;
        case "alpha":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [habits, search, filterCategory, filterDifficulty, filterCompleted, sortBy]);

  const totalHabits = habits.length;

  const hasActiveFilters =
    search.trim().length > 0 ||
    filterCategory !== "All" ||
    filterDifficulty !== "All" ||
    filterCompleted !== "All";

  return (
    <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <HabitsHeader onNewHabit={openCreate} />

      <HabitsOverview habits={habits} />

      <HabitToolbar
        search={search}
        onSearchChange={setSearch}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        filterDifficulty={filterDifficulty}
        onDifficultyChange={setFilterDifficulty}
        filterCompleted={filterCompleted}
        onCompletedChange={setFilterCompleted}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <section>
        <HabitsList
          isLoading={isLoading}
          isError={isError}
          error={error}
          habits={filtered}
          totalHabits={totalHabits}
          hasActiveFilters={hasActiveFilters}
          onNewHabit={openCreate}
          onClearFilters={clearFilters}
          onStart={handleStartSession}
          onEdit={openEdit}
          onDelete={setDeletingHabit}
        />
      </section>

      {/* === Session Flow Overlays === */}

      <StartSessionModal
        open={flowStep === "startSession"}
        habit={activeHabit}
        onStart={handleSessionBegin}
        onCancel={handleSessionCancel}
      />

      {flowStep === "focus" && activeHabit && (
        <FocusTimer
          habit={activeHabit}
          onFinish={handleTimerFinish}
          onCancel={handleSessionCancel}
        />
      )}

      {flowStep === "sessionComplete" && activeHabit && (
        <SessionComplete
          habit={activeHabit}
          durationMinutes={sessionDuration}
          onContinue={handleContinueFromComplete}
        />
      )}

      {flowStep === "proof" && activeHabit && (
        <ProofOfProgressModal
          open={true}
          habit={activeHabit}
          durationMinutes={sessionDuration}
          initialData={proofData}
          onComplete={(data) => {
            setProofData(data);
            setFlowStep("verification");
          }}
          onBack={handleProofBack}
        />
      )}

      {flowStep === "verification" && activeHabit && (
        <SystemVerification
          open={true}
          habit={activeHabit}
          durationMinutes={sessionDuration}
          proofData={proofData}
          phase={missionVerification.phase}
          progress={missionVerification.progress}
          message={missionVerification.message}
          grade={missionVerification.grade}
          result={missionVerification.result}
          phaseLabel={missionVerification.phaseLabel}
          onContinue={handleVerificationContinue}
          onStart={missionVerification.startVerification}
        />
      )}

      {flowStep === "reflection" && activeHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-[720px] my-auto">
            <div
              className="overflow-hidden rounded-3xl border border-white/20 bg-white/95"
              style={{ boxShadow: "0 0 0 1px rgba(37,99,235,0.08), 0 8px 40px rgba(37,99,235,0.12), 0 30px 80px rgba(0,0,0,0.25)" }}
            >
              {/* Header */}
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <button onClick={handleReflectionBack} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#64748B] transition-all duration-200 hover:bg-slate-100 hover:text-[#0F172A]">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-[#0F172A]">Growth Reflection</h2>
                      <p className="text-[11px] text-[#94A3B8]">Reflect on your journey</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-[#94A3B8]">Step 3 of 4</span>
                    <div className="flex gap-1">
                      <div className="h-1.5 w-6 rounded-full bg-[#2563EB]" />
                      <div className="h-1.5 w-6 rounded-full bg-[#2563EB]" />
                      <div className="h-1.5 w-6 rounded-full bg-[#2563EB]" />
                      <div className="h-1.5 w-6 rounded-full bg-slate-200" />
                    </div>
                  </div>
                </div>

                {/* Session info */}
                {(() => {
                  const { label: goalLabel, value: goalValue } = formatGoal(activeHabit);
                  return (
                    <div className="rounded-2xl border border-slate-100 bg-[#FAFBFC] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8] mb-1">Session</p>
                          <p className="text-sm font-semibold text-[#0F172A]">
                            {activeHabit.activity || activeHabit.title}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8] mb-1">Target</p>
                          <p className="text-sm font-bold text-[#2563EB] tabular-nums">{goalValue || "—"}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-[#94A3B8]">
                        <span>{activeHabit.category}</span>
                        <span>&middot;</span>
                        <span>{sessionDuration} min session</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="mx-8 h-px bg-slate-100" />

              {/* Form body */}
              <div className="px-8 py-6 space-y-5">
                {/* Main reflection */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#64748B]">How did this session go? *</label>
                  <textarea
                    required
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    rows={5}
                    placeholder="What did you learn? What was challenging? What will you do differently next time?"
                    className="w-full rounded-2xl border border-slate-200 bg-[#FAFBFC] px-5 py-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none transition-all duration-200 resize-none"
                  />
                </div>

                {/* Helper fields */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#64748B]">Proud of</label>
                    <input
                      type="text"
                      value={proudOf}
                      onChange={(e) => setProudOf(e.target.value)}
                      placeholder="What went well?"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#FAFBFC] px-5 py-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#64748B]">Challenged by</label>
                    <input
                      type="text"
                      value={challenged}
                      onChange={(e) => setChallenged(e.target.value)}
                      placeholder="What was hard?"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#FAFBFC] px-5 py-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#64748B]">Improve next</label>
                    <input
                      type="text"
                      value={improve}
                      onChange={(e) => setImprove(e.target.value)}
                      placeholder="What to change?"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#FAFBFC] px-5 py-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                {/* XP reward hint */}
                <div className="rounded-2xl border border-[#2563EB]/10 bg-[#2563EB]/5 p-4 text-center">
                  <p className="text-xs font-medium text-[#2563EB]">
                    Earn <span className="font-bold">{activeHabit.xpReward} XP</span> after saving your reflection
                  </p>
                </div>
              </div>

              <div className="mx-8 h-px bg-slate-100" />

              {/* Footer */}
              <div className="px-8 py-6 flex gap-4">
                <button
                  onClick={handleReflectionBack}
                  className="h-14 flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-[#64748B] transition-all duration-200 hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleSaveReflection}
                  disabled={submittingReflection || !reflectionText.trim()}
                  className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#2563EB]/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
                >
                  {submittingReflection ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Reflection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {flowStep === "reward" && savedReflection && (
        <RewardAnimation
          xpEarned={savedReflection.xpEarned}
          onComplete={handleRewardComplete}
        />
      )}

      {flowStep === "summary" && activeHabit && savedReflection && (
        <GrowthSummary
          habit={activeHabit}
          reflection={savedReflection}
          onClose={handleSummaryClose}
        />
      )}

      {/* === CRUD Modals === */}

      <CreateHabitModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        loading={createHabit.isPending}
      />

      {editingHabit && (
        <EditHabitModal
          key={editingHabit.id}
          open={!!editingHabit}
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSubmit={handleEdit}
          loading={updateHabit.isPending}
        />
      )}

      <DeleteHabitDialog
        open={!!deletingHabit}
        habitTitle={deletingHabit?.title || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeletingHabit(null)}
        loading={deleteHabit.isPending}
      />
    </div>
  );
}

export default function HabitsPage() {
  return <HabitsContent />;
}
