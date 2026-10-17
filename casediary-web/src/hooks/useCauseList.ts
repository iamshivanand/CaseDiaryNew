"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export function useCauseList(date: string) {
  return useQuery({
    queryKey: ["causeList", date],
    queryFn: async () => {
      const res = await apiFetch(`/api/cause-list?date=${date}`);
      if (!res.ok) throw new Error("Failed to load cause list");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch cause list");
      return json;
    },
    enabled: Boolean(date),
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });
}
