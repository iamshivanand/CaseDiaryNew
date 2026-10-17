"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppUIState {
  // Sidebar state
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Selected cases in table for bulk actions
  selectedCaseIds: (string | number)[];
  toggleCaseSelection: (id: string | number) => void;
  selectAllCases: (ids: (string | number)[]) => void;
  clearCaseSelection: () => void;

  // Active drafting studio view mode
  draftingViewMode: "standard" | "focus" | "split";
  setDraftingViewMode: (mode: "standard" | "focus" | "split") => void;

  // Offline action queue (replayed when connection restores)
  offlineQueue: Array<{ id: string; action: string; payload: any; timestamp: number }>;
  enqueueOfflineAction: (action: string, payload: any) => void;
  clearOfflineQueue: () => void;
}

export const useAppStore = create<AppUIState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      selectedCaseIds: [],
      toggleCaseSelection: (id) =>
        set((state) => ({
          selectedCaseIds: state.selectedCaseIds.includes(id)
            ? state.selectedCaseIds.filter((item) => item !== id)
            : [...state.selectedCaseIds, id],
        })),
      selectAllCases: (ids) => set({ selectedCaseIds: ids }),
      clearCaseSelection: () => set({ selectedCaseIds: [] }),

      draftingViewMode: "standard",
      setDraftingViewMode: (mode) => set({ draftingViewMode: mode }),

      offlineQueue: [],
      enqueueOfflineAction: (action, payload) =>
        set((state) => ({
          offlineQueue: [
            ...state.offlineQueue,
            { id: Math.random().toString(36).substring(2, 9), action, payload, timestamp: Date.now() },
          ],
        })),
      clearOfflineQueue: () => set({ offlineQueue: [] }),
    }),
    {
      name: "advocase_ui_store",
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        draftingViewMode: state.draftingViewMode,
      }),
    }
  )
);
