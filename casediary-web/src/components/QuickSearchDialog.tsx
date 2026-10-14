"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Briefcase, ChevronRight, Calendar, User } from "lucide-react";
import { StatusBadge } from "./Badges";
import { useLanguage } from "@/context/LanguageContext";

interface QuickSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearchDialog({ isOpen, onClose }: QuickSearchDialogProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cases?search=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.cases.slice(0, 6));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectCase = (id: number) => {
    onClose();
    router.push(`/cases/${id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-zinc-950/40 backdrop-blur-xs">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center space-x-3 bg-zinc-50/70 dark:bg-zinc-900/60">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === "en"
                ? "Type CNR, case number, client, or judge..."
                : "सीएनआर, वाद संख्या, पक्षकार या न्यायाधीश का नाम दर्ज करें..."
            }
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              {language === "en" ? "Searching chamber records..." : "चेंबर अभिलेखों में खोज जारी है..."}
            </div>
          ) : query.trim() && results.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              {language === "en" ? `No matching matters found for "${query}"` : `"${query}" के लिए कोई मुकदमा नहीं मिला`}
            </div>
          ) : !query.trim() ? (
            <div className="p-6 text-center text-xs text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                {language === "en" ? "Quick Global Lookup" : "त्वरित वैश्विक खोज"}
              </p>
              <p>
                {language === "en"
                  ? "Type any litigant name, CNR number, police station, or case number."
                  : "मुवक्किल का नाम, सीएनआर नंबर, थाना अथवा वाद संख्या टाइप करें।"}
              </p>
            </div>
          ) : (
            results.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectCase(c.id)}
                className="p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer flex items-center justify-between transition-colors group"
              >
                <div className="space-y-0.5 flex-1 min-w-0 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                      {c.CaseTitle}
                    </span>
                    <StatusBadge status={c.CaseStatus} />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {c.case_number
                      ? `${language === "en" ? "Case No:" : "वाद सं:"} ${c.case_number}`
                      : (language === "en" ? "No Case No." : "वाद सं. अनिर्धारित")} • {c.court_name || (language === "en" ? "Court unassigned" : "अदालत अनिर्धारित")}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                    {language === "en" ? "Client:" : "मुवक्किल:"} {c.ClientName || (language === "en" ? "Client" : "मुवक्किल")} {c.CNRNumber && `• CNR: ${c.CNRNumber}`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
