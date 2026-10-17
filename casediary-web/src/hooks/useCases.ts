"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export interface CasesFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  filter?: "today" | "tomorrow" | "yesterday" | "undated" | string;
}

export interface CasesResponse {
  cases: any[];
  count: number;
  totalPages: number;
  currentPage: number;
}

export function useCases(options: CasesFilterOptions = {}) {
  const { page = 1, limit = 15, search = "", status = "all", priority = "all", filter } = options;

  return useQuery({
    queryKey: ["cases", { page, limit, search, status, priority, filter }],
    queryFn: async (): Promise<CasesResponse> => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search.trim()) params.set("search", search.trim());
      if (status && status !== "all") params.set("status", status);
      if (priority && priority !== "all") params.set("priority", priority);
      if (filter) params.set("filter", filter);

      const res = await apiFetch(`/api/cases?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load cases");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load cases");

      return {
        cases: json.cases || [],
        count: json.count || 0,
        totalPages: json.totalPages || 1,
        currentPage: json.currentPage || page,
      };
    },
    staleTime: 1000 * 60 * 3, // 3 minutes fresh cache
  });
}

export function useCaseDetails(id: string | number | null) {
  return useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiFetch(`/api/cases/${id}`);
      if (!res.ok) throw new Error("Failed to fetch case details");
      const json = await res.json();
      return json.success ? json.case : null;
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateHearingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      hearingDate,
      purpose,
      businessRecorded,
    }: {
      caseId: string | number;
      hearingDate: string;
      purpose?: string;
      businessRecorded?: string;
    }) => {
      const res = await apiFetch(`/api/cases/${caseId}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hearingDate,
          purpose,
          businessRecorded,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update hearing");
      return data;
    },
    onSuccess: (_, variables) => {
      // Automatically invalidate cases, case details, stats, and cause list across the whole app
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case", variables.caseId] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["causeList"] });
    },
  });
}
