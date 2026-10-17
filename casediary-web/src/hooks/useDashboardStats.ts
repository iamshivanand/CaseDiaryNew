"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export interface ChamberStats {
  todayCount: number;
  tomorrowCount: number;
  yesterdayPendingCount: number;
  undatedCount: number;
  totalActiveCount: number;
  totalDisposedCount: number;
  totalFeeAgreed: number;
  totalFeeCollected: number;
  totalOutstanding: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async (): Promise<ChamberStats | null> => {
      const res = await apiFetch("/api/stats");
      if (!res.ok) throw new Error("Failed to load chamber statistics");
      const data = await res.json();
      return data.success ? data.stats : null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes: instant navigation without re-fetching
  });
}
