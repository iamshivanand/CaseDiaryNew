import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const { language } = useLanguage();
  const rawStatus = status || "Open";
  const sLower = rawStatus.toLowerCase();
  let color = "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
  let label = rawStatus;

  switch (sLower) {
    case "open":
      color = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60";
      label = language === "en" ? "Open" : "सक्रिय (Open)";
      break;
    case "in progress":
      color = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60";
      label = language === "en" ? "In Progress" : "प्रगति पर";
      break;
    case "reserved":
      color = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60";
      label = language === "en" ? "Reserved" : "निर्णय सुरक्षित";
      break;
    case "disposed":
      color = "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700";
      label = language === "en" ? "Disposed" : "निस्तारित";
      break;
    case "appealed":
      color = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60";
      label = language === "en" ? "Appealed" : "अपील में";
      break;
    default:
      label = rawStatus;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${color}`}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string | null | undefined }) {
  const { language } = useLanguage();
  const rawPriority = priority || "Medium";
  const pLower = rawPriority.toLowerCase();
  let color = "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
  let label = `${rawPriority} Priority`;

  switch (pLower) {
    case "high":
      color = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60";
      label = language === "en" ? "High Priority" : "उच्च प्राथमिकता";
      break;
    case "medium":
      color = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60";
      label = language === "en" ? "Medium Priority" : "मध्यम प्राथमिकता";
      break;
    case "low":
      color = "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-700";
      label = language === "en" ? "Low Priority" : "सामान्य प्राथमिकता";
      break;
    default:
      label = `${rawPriority} Priority`;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${color}`}
    >
      {label}
    </span>
  );
}
