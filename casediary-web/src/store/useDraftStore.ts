"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DraftSnapshot {
  content?: string;
  title?: string;
  caseId?: string | number | null;
  template?: string;
  formData?: Record<string, any>;
  updatedAt: number;
}

interface DraftStoreState {
  drafts: Record<string, DraftSnapshot>;
  isDirty: boolean;
  lastSavedAt: number | null;
  activeDraftKey: string | null;

  // Actions
  saveDraft: (key: string, data: Partial<DraftSnapshot>) => void;
  getDraft: (key: string) => DraftSnapshot | undefined;
  removeDraft: (key: string) => void;
  clearAllDrafts: () => void;
  setIsDirty: (dirty: boolean) => void;
  setActiveDraftKey: (key: string | null) => void;
}

export const useDraftStore = create<DraftStoreState>()(
  persist(
    (set, get) => ({
      drafts: {},
      isDirty: false,
      lastSavedAt: null,
      activeDraftKey: null,

      saveDraft: (key: string, data: Partial<DraftSnapshot>) => {
        const now = Date.now();
        set((state) => ({
          drafts: {
            ...state.drafts,
            [key]: {
              ...(state.drafts[key] || {}),
              ...data,
              updatedAt: now,
            },
          },
          isDirty: true,
          lastSavedAt: now,
          activeDraftKey: key,
        }));
      },

      getDraft: (key: string) => {
        return get().drafts[key];
      },

      removeDraft: (key: string) => {
        set((state) => {
          const newDrafts = { ...state.drafts };
          delete newDrafts[key];
          return {
            drafts: newDrafts,
            isDirty: false,
            activeDraftKey: state.activeDraftKey === key ? null : state.activeDraftKey,
          };
        });
      },

      clearAllDrafts: () => {
        set({ drafts: {}, isDirty: false, activeDraftKey: null });
      },

      setIsDirty: (dirty: boolean) => {
        set({ isDirty: dirty });
      },

      setActiveDraftKey: (key: string | null) => {
        set({ activeDraftKey: key });
      },
    }),
    {
      name: "advocase_chamber_drafts_v1",
      partialize: (state) => ({
        drafts: state.drafts,
      }),
    }
  )
);
