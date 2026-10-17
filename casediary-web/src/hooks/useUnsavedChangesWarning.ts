"use client";

import { useEffect } from "react";

/**
 * Hardware-Level Refresh & Navigation Lock Hook
 * Intercepts accidental F5, Ctrl+R, back-swipe, browser tab close, or window reload
 * when uncommitted advocate changes exist.
 *
 * @param isDirty boolean - When true, the hardware-level browser confirmation dialog is activated.
 * @param message string - Optional custom message (supported in older browsers; modern browsers show standard secure dialog)
 */
export function useUnsavedChangesWarning(
  isDirty: boolean,
  message = "You have unsaved chamber changes. Are you sure you want to leave without saving?"
) {
  useEffect(() => {
    if (!isDirty || typeof window === "undefined") return;

    // 1. Hardware-level reload, F5, Ctrl+R, tab close, and external navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    // 2. Client-side SPA link clicks (e.g. Next.js Link transitions, sidebar, back button)
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;

      const confirmLeave = window.confirm(message);
      if (!confirmLeave) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, [isDirty, message]);
}
