"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { customCategoriesApi } from "@/lib/api";
import type { CustomCategory } from "@/types";

export const CUSTOM_CATEGORIES_KEY = ["custom-categories"];

export function useCustomCategories() {
  const { getToken } = useFirebaseToken();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery<CustomCategory[], Error>({
    queryKey: CUSTOM_CATEGORIES_KEY,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return customCategoriesApi.getAll(token);
    },
    enabled: !!getToken,
  });

  const createCategory = useMutation({
    mutationFn: async (data: { name: string; icon: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return customCategoriesApi.create(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_CATEGORIES_KEY });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return customCategoriesApi.remove(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_CATEGORIES_KEY });
    },
  });

  return {
    customCategories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    error: categoriesQuery.error,
    createCategory,
    deleteCategory,
  };
}