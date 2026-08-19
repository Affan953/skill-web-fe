"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { habitsApi, achievementsApi } from "@/lib/api";
import type { Habit, Achievement } from "@/types";

export const DASHBOARD_HABITS_KEY = ["dashboard", "habits", "today"];
export const DASHBOARD_ACHIEVEMENTS_KEY = ["dashboard", "achievements"];

export function useDashboard() {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const queryClient = useQueryClient();

  const todayHabitsQuery = useQuery<Habit[], Error>({
    queryKey: DASHBOARD_HABITS_KEY,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return habitsApi.getToday(token);
    },
    enabled: isAuthenticated,
  });

  const achievementsQuery = useQuery<Achievement[], Error>({
    queryKey: DASHBOARD_ACHIEVEMENTS_KEY,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return achievementsApi.getUnlocked(token);
    },
    enabled: isAuthenticated,
  });

  const todayHabits = todayHabitsQuery.data ?? [];
  const allAchievements = achievementsQuery.data ?? [];

  const completedToday = todayHabits.filter((h) => h.isCompleted).length;
  const totalToday = todayHabits.length;
  const completionPercent =
    totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const remainingToday = totalToday - completedToday;

  const isLoading = todayHabitsQuery.isLoading || achievementsQuery.isLoading;
  const isError = todayHabitsQuery.isError || achievementsQuery.isError;
  const error = todayHabitsQuery.error || achievementsQuery.error;

  const refreshDashboard = () => {
    queryClient.invalidateQueries({ queryKey: DASHBOARD_HABITS_KEY });
    queryClient.invalidateQueries({ queryKey: DASHBOARD_ACHIEVEMENTS_KEY });
  };

  return {
    todayHabits,
    achievements: allAchievements,
    completedToday,
    totalToday,
    completionPercent,
    remainingToday,
    achievementCount: allAchievements.length,
    isLoading,
    isError,
    error,
    refreshDashboard,
  };
}
