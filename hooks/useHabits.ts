"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { habitsApi } from "@/lib/api";
import type { Habit, HabitCategory, HabitDifficulty } from "@/types";
import { USER_QUERY_KEY } from "@/hooks/useUserQuery";

export const HABITS_KEY = ["habits"];

export function useHabits() {
  const { getToken } = useFirebaseToken();
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const habitsQuery = useQuery<Habit[], Error>({
    queryKey: HABITS_KEY,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return habitsApi.getAll(token);
    },
    enabled: !!getToken,
  });

  const invalidateRelatedQueries = async () => {
    await refreshUser();
    queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["daily-quests"] });
    queryClient.invalidateQueries({ queryKey: ["achievements"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
  };

  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      category: HabitCategory;
      activity?: string;
      goalLabel?: string;
      goalValue?: number;
      goalUnit?: string;
      difficulty: HabitDifficulty;
      reminderTime?: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return habitsApi.create(token, data);
    },
    onSuccess: () => {
      invalidateRelatedQueries();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        description?: string;
        category?: HabitCategory;
        activity?: string;
        goalLabel?: string;
        goalValue?: number;
        goalUnit?: string;
        difficulty?: HabitDifficulty;
        reminderTime?: string;
      };
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return habitsApi.update(id, token, data);
    },
    onSuccess: () => {
      invalidateRelatedQueries();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return habitsApi.delete(id, token);
    },
    onSuccess: () => {
      invalidateRelatedQueries();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return habitsApi.complete(id, token);
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: HABITS_KEY });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(HABITS_KEY);

      // Optimistically mark the habit as completed
      queryClient.setQueryData<Habit[]>(HABITS_KEY, (old) =>
        old?.map((h) =>
          h.id === id ? { ...h, isCompleted: true, completedAt: new Date().toISOString() } : h
        ) ?? []
      );

      return { previousHabits };
    },
    onError: (_err, _id, context) => {
      // Roll back on error
      if (context?.previousHabits) {
        queryClient.setQueryData(HABITS_KEY, context.previousHabits);
      }
    },
    onSuccess: () => {
      invalidateRelatedQueries();
    },
  });

  return {
    habits: habitsQuery.data ?? [],
    isLoading: habitsQuery.isLoading,
    isError: habitsQuery.isError,
    error: habitsQuery.error,
    createHabit: createMutation,
    updateHabit: updateMutation,
    deleteHabit: deleteMutation,
    completeHabit: completeMutation,
  };
}
