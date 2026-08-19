"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { progressApi } from "@/lib/api";
import type { Reflection, ReflectionSummary, WeeklyReview, MonthlyReview } from "@/types";

export function useReflections() {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const queryClient = useQueryClient();

  const reflectionsQuery = useQuery<Reflection[]>({
    queryKey: ["reflections"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return progressApi.getReflections(token);
    },
    enabled: isAuthenticated,
  });

  const summaryQuery = useQuery<ReflectionSummary>({
    queryKey: ["reflection-summary"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return progressApi.getReflectionSummary(token);
    },
    enabled: isAuthenticated,
  });

  const weeklyReviewQuery = useQuery<WeeklyReview>({
    queryKey: ["weekly-review"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return progressApi.getWeeklyReview(token);
    },
    enabled: isAuthenticated,
  });

  const monthlyReviewQuery = useQuery<MonthlyReview>({
    queryKey: ["monthly-review"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return progressApi.getMonthlyReview(token);
    },
    enabled: isAuthenticated,
  });

  const saveReflection = useMutation({
    mutationFn: async (data: {
      habitId: string;
      title: string;
      category: string;
      reflection: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      proofOfProgress?: Record<string, any>;
      sessionMetadata?: { durationMinutes?: number; startedAt?: string; completedAt?: string };
      proudOf?: string;
      challenged?: string;
      improve?: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return progressApi.saveReflection(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflections"] });
      queryClient.invalidateQueries({ queryKey: ["reflection-summary"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-review"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-review"] });
    },
  });

  return {
    reflections: reflectionsQuery.data ?? [],
    summary: summaryQuery.data,
    weeklyReview: weeklyReviewQuery.data,
    monthlyReview: monthlyReviewQuery.data,
    isLoading: reflectionsQuery.isLoading || summaryQuery.isLoading,
    isError: reflectionsQuery.isError || summaryQuery.isError,
    error: reflectionsQuery.error || summaryQuery.error,
    saveReflection,
  };
}
