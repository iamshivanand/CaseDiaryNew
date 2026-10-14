"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Scale,
  Sparkles,
  Shield,
  Briefcase,
  UserCheck,
} from "lucide-react";

export type ToastType = "success" | "error" | "info" | "welcome";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  role?: string;
  isNewUser?: boolean;
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
    welcome: (params: {
      name: string;
      role?: string;
      isNewUser?: boolean;
      chamberName?: string;
    }) => void;
  };
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const duration = item.duration ?? (item.type === "welcome" ? 6000 : 4500);

      setToasts((prev) => [...prev, { ...item, id, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const toast = {
    success: (title: string, message?: string, duration?: number) => {
      addToast({ type: "success", title, message, duration });
    },
    error: (title: string, message?: string, duration?: number) => {
      addToast({ type: "error", title, message, duration });
    },
    info: (title: string, message?: string, duration?: number) => {
      addToast({ type: "info", title, message, duration });
    },
    welcome: ({
      name,
      role = "Senior Advocate",
      isNewUser = false,
      chamberName,
    }: {
      name: string;
      role?: string;
      isNewUser?: boolean;
      chamberName?: string;
    }) => {
      const cleanName = name || "Advocate";
      const welcomeTitle = isNewUser
        ? `Welcome to Advocase, ${cleanName}!`
        : `Welcome back, ${cleanName}!`;

      let roleSubtitle = "";
      if (role.toLowerCase().includes("junior") || role.toLowerCase().includes("associate")) {
        roleSubtitle = chamberName
          ? `Associate Advocate • ${chamberName}`
          : "Associate Advocate • Daily Hearings & Cause List Active";
      } else {
        roleSubtitle = chamberName
          ? `Senior Advocate • ${chamberName}`
          : "Senior Litigator • Full Chamber Management & Dossiers";
      }

      addToast({
        type: "welcome",
        title: welcomeTitle,
        message: roleSubtitle,
        role,
        isNewUser,
        duration: 6500,
      });
    },
  };

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      {/* Top-Right Executive Floating Toast Container */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] pointer-events-none flex flex-col gap-3 max-w-sm sm:max-w-md w-full px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
              t.type === "welcome"
                ? "bg-slate-900/95 dark:bg-zinc-900/95 border-amber-500/40 text-white shadow-amber-500/10"
                : t.type === "success"
                ? "bg-slate-900/95 dark:bg-zinc-900/95 border-emerald-500/40 text-white shadow-emerald-500/10"
                : t.type === "error"
                ? "bg-slate-900/95 dark:bg-zinc-900/95 border-rose-500/40 text-white shadow-rose-500/10"
                : "bg-slate-900/95 dark:bg-zinc-900/95 border-slate-700/80 text-white shadow-slate-900/20"
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {t.type === "welcome" ? (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md">
                  {t.role?.toLowerCase().includes("junior") || t.role?.toLowerCase().includes("associate") ? (
                    <UserCheck className="w-5 h-5" />
                  ) : (
                    <Scale className="w-5 h-5" />
                  )}
                </div>
              ) : t.type === "success" ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : t.type === "error" ? (
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Info className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold tracking-tight text-white line-clamp-1">
                  {t.title}
                </h4>
                {t.type === "welcome" && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{t.isNewUser ? "New Chamber" : "Verified"}</span>
                  </span>
                )}
              </div>
              {t.message && (
                <p className="text-xs text-slate-300 dark:text-zinc-300 mt-1 leading-relaxed">
                  {t.message}
                </p>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss toast notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}
