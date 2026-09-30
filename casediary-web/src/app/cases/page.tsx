"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Plus,
  Calendar,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  X,
  SlidersHorizontal,
  FileSpreadsheet,
} from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { HearingUpdateModal } from "@/components/HearingUpdateModal";
import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";
import { formatDate } from "@/lib/utils";

import { useLanguage } from "@/context/LanguageContext";

export default function CasesDirectoryPage() {
  const { t, language } = useLanguage();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedCaseForModal, setSelectedCaseForModal] = useState<any | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCases = async () => {
    // Abort in-flight request if user is typing fast
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);

      const res = await fetch(`/api/cases?${params.toString()}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      if (json.success) {
        setCases(json.cases);
        setTotalCount(json.count || 0);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error loading cases:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCases();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter, page, limit]);

  return (
    <ChamberAuthGuard featureName="Chamber Cases Directory">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center space-x-3">
              <Briefcase className="w-7 h-7 text-amber-500" />
              <span>{t("casesListTitle")}</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {t("casesListSub")}
            </p>
          </div>
          <Link
            href="/cases/new"
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-sm flex items-center space-x-2 shadow-xs self-start sm:self-auto transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t("addNewMatterBtn")}</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchCasesInput")}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-zinc-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-zinc-500 shrink-0">{t("fieldCaseStatus")}:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-medium border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">{language === "en" ? "All Statuses" : "सभी स्थितियां"}</option>
                <option value="Open">{t("statusOpen")}</option>
                <option value="In Progress">{t("statusInProgress")}</option>
                <option value="Reserved">{t("statusReserved")}</option>
                <option value="Disposed">{t("statusDisposed")}</option>
                <option value="Appealed">{t("statusAppealed")}</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-zinc-500 shrink-0">{t("fieldPriorityLevel")}:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-medium border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">{language === "en" ? "All Priorities" : "सभी प्राथमिकताएं"}</option>
                <option value="High">{t("priorityHigh")}</option>
                <option value="Medium">{t("priorityMedium")}</option>
                <option value="Low">{t("priorityLow")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
          {/* Header Summary */}
          <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {language === "en" ? `Total Matches: ${totalCount} ${totalCount === 1 ? "matter" : "matters"}` : `कुल परिणाम: ${totalCount} मुकदमा`}
            </span>
            <div className="flex items-center space-x-2 text-xs text-zinc-500">
              <span>{language === "en" ? "Per page:" : "प्रति पृष्ठ:"}</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <div className="p-12 text-center text-sm text-zinc-500 space-y-2">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>{t("loading")}</p>
              </div>
            ) : cases.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{t("noMatchingCases")}</p>
                <p className="text-xs text-zinc-500">
                  {language === "en"
                    ? "Try clearing the search box or resetting status filters."
                    : "कृपया खोज बॉक्स साफ़ करें अथवा फ़िल्टर रीसेट करें।"}
                </p>
              </div>
            ) : (
              cases.map((c) => (
                <div
                  key={c.id}
                  className="p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={c.CaseStatus} />
                      <PriorityBadge priority={c.Priority} />
                      <span className="text-xs text-zinc-500 font-medium">
                        {c.case_type_name || (language === "en" ? "General Litigation" : "सामान्य मुकदमा")}
                      </span>
                      {c.CNRNumber && (
                        <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          CNR: {c.CNRNumber}
                        </span>
                      )}
                    </div>

                    <div>
                      <Link
                        href={`/cases/${c.id}`}
                        className="text-base font-bold text-zinc-900 dark:text-white hover:text-amber-500 transition-colors"
                      >
                        {c.CaseTitle}
                      </Link>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {c.case_number ? `${t("fieldCaseNumber")}: ${c.case_number}` : (language === "en" ? "No Number" : "नंबर नहीं")} • {c.court_name || (language === "en" ? "Court unassigned" : "न्यायालय अनिर्दिष्ट")}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                      <div>
                        <span className="text-zinc-400">{t("fieldClientName")}:</span>{" "}
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{c.ClientName || "—"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">{t("fieldHearingDate")}:</span>{" "}
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {formatDate(c.NextDate) || (language === "en" ? "Undated" : "तारीख नहीं")}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400">{t("fieldStageOfHearing")}:</span>{" "}
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{c.case_stage || (language === "en" ? "Hearing" : "पेशी / सुनवाई")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setSelectedCaseForModal(c)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold flex items-center space-x-1 shadow-xs transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t("recordOutcome")}</span>
                    </button>

                    {c.ClientContactNumber && (
                      <a
                        href={`https://api.whatsapp.com/send?phone=${c.ClientContactNumber.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all text-xs"
                        title={language === "en" ? "WhatsApp Client" : "मुवक्किल को व्हाट्सएप भेजें"}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}

                    <Link
                      href={`/cases/${c.id}`}
                      className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all"
                      title={t("fullDossier")}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-zinc-500">
                {language === "en" ? (
                  <>
                    Showing <span className="font-bold text-zinc-800 dark:text-zinc-200">{(page - 1) * limit + 1}</span> to{" "}
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {Math.min(page * limit, totalCount)}
                    </span>{" "}
                    of <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalCount}</span> matters
                  </>
                ) : (
                  <>
                    प्रदर्शित <span className="font-bold text-zinc-800 dark:text-zinc-200">{(page - 1) * limit + 1}</span> से{" "}
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {Math.min(page * limit, totalCount)}
                    </span>{" "}
                    (कुल <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalCount}</span> मुकदमे)
                  </>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title={language === "en" ? "First Page" : "प्रथम पृष्ठ"}
                >
                  <ChevronsLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title={language === "en" ? "Previous Page" : "पिछला पृष्ठ"}
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>

                <div className="px-3 py-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {language === "en" ? `Page ${page} of ${totalPages}` : `पृष्ठ ${page} / ${totalPages}`}
                </div>

                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title={language === "en" ? "Next Page" : "अगला पृष्ठ"}
                >
                  <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title={language === "en" ? "Last Page" : "अंतिम पृष्ठ"}
                >
                  <ChevronsRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hearing Outcome Modal */}
        {selectedCaseForModal && (
          <HearingUpdateModal
            isOpen={!!selectedCaseForModal}
            onClose={() => setSelectedCaseForModal(null)}
            caseItem={selectedCaseForModal}
            onSuccess={fetchCases}
          />
        )}
      </div>
    </ChamberAuthGuard>
  );
}
