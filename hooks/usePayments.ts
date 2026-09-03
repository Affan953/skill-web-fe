"use client";

import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { paymentsApi, premiumApi } from "@/lib/api";
import type { GrowthOverview, PaymentRecord } from "@/types";

export const PAYMENT_HISTORY_KEY = ["payment-history"];

export function usePaymentHistory() {
  const { getToken } = useFirebaseToken();

  return useQuery<PaymentRecord[], Error>({
    queryKey: PAYMENT_HISTORY_KEY,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return paymentsApi.getHistory(token);
    },
    enabled: !!getToken,
  });
}

export function useGrowthOverview() {
  const { getToken } = useFirebaseToken();

  return useQuery<GrowthOverview, Error>({
    queryKey: ["premium", "growth-overview"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return premiumApi.getGrowthOverview(token);
    },
    enabled: !!getToken,
    retry: (failureCount, error) => {
      const status = (error as { status?: number })?.status;
      if (status === 403) return false;
      return failureCount < 2;
    },
  });
}