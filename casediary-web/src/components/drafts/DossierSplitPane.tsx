"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Calendar,
  Building,
  Quote,
  Clock,
  Shield,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";

interface CaseItem {
  id: number;
  CaseTitle: string;
  ClientName?: string;
  OppositeParty?: string;
  court_name?: string;
  case_number?: string;
  crime_number?: string;
  Undersection?: string;
  AdvocateName?: string;
  NextDate?: string;
  Stage?: string;
}

interface TimelineItem {
  id: number;
  hearing_date: string;
  purpose_of_hearing?: string;
  action_summary?: string;
  judge_remarks?: string;
  court_name?: string;
}

interface DossierSplitPaneProps {
  activeCase?: CaseItem;
  onQuoteSnippet: (text: string, source: string) => void;
  onClose: () => void;
}

export default function DossierSplitPane({
  activeCase,
  onQuoteSnippet,
  onClose,
}: DossierSplitPaneProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState<"facts" | "orders" | "evidence">("facts");

  useEffect(() => {
    if (activeCase?.id) {
      setLoadingTimeline(true);
      fetch(`/api/cases/${activeCase.id}/timeline`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.timeline) {
            setTimeline(data.timeline);
          }
        })
        .catch((err) => console.error("Error loading case timeline:", err))
        .finally(() => setLoadingTimeline(false));
    }
  }, [activeCase?.id]);

  if (!activeCase) {
    return (
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 p-4 text-xs text-slate-500">
        <p>Select a case in the top dropdown to view its live dossier and evidence records.</p>
      </div>
    );
  }

  return (
    <div className="w-80 md:w-96 border-r border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 flex flex-col h-full shrink-0 shadow-lg z-10 select-text overflow-hidden">
      {/* Dossier Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
              {activeCase.CaseTitle}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {activeCase.case_number || "CNR Pending"}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-md text-xs font-semibold"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-xs">
        <button
          onClick={() => setActiveTab("facts")}
          className={`flex-1 py-2 font-semibold text-center border-b-2 transition-all ${
            activeTab === "facts"
              ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Case Facts
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex-1 py-2 font-semibold text-center border-b-2 transition-all ${
            activeTab === "orders"
              ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Court Orders ({timeline.length})
        </button>
        <button
          onClick={() => setActiveTab("evidence")}
          className={`flex-1 py-2 font-semibold text-center border-b-2 transition-all ${
            activeTab === "evidence"
              ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          FIR & Annexures
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {activeTab === "facts" && (
          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Court & Bench
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {activeCase.court_name || "District & Sessions Court, Delhi"}
              </div>
              <button
                onClick={() =>
                  onQuoteSnippet(
                    activeCase.court_name || "District & Sessions Court",
                    "Court Name"
                  )
                }
                className="mt-1 text-[11px] text-amber-600 hover:text-amber-700 flex items-center space-x-1 font-medium"
              >
                <Quote className="w-3 h-3" />
                <span>Quote into Draft</span>
              </button>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                FIR & Police Station
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {activeCase.crime_number || "FIR No. 182/2025"}, PS Karol Bagh
              </div>
              <div className="text-slate-500 text-[11px]">
                Under: {activeCase.Undersection || "Sec 420, 468, 471, 120-B IPC"}
              </div>
              <button
                onClick={() =>
                  onQuoteSnippet(
                    `${activeCase.crime_number || "FIR No. 182/2025"} registered at PS Karol Bagh under ${activeCase.Undersection || "Sections 420, 468 IPC"}`,
                    "FIR Particulars"
                  )
                }
                className="mt-1 text-[11px] text-amber-600 hover:text-amber-700 flex items-center space-x-1 font-medium"
              >
                <Quote className="w-3 h-3" />
                <span>Quote FIR into Draft</span>
              </button>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Parties & Litigants
              </div>
              <div className="text-slate-700 dark:text-slate-300">
                <b>Applicant:</b> {activeCase.ClientName || "Client"}<br/>
                <b>Respondent:</b> {activeCase.OppositeParty || "State of NCT of Delhi"}
              </div>
              <button
                onClick={() =>
                  onQuoteSnippet(
                    `${activeCase.ClientName || "The Applicant"} S/o Late Shri Ram Swaroop, R/o New Delhi`,
                    "Litigant Particulars"
                  )
                }
                className="mt-1 text-[11px] text-amber-600 hover:text-amber-700 flex items-center space-x-1 font-medium"
              >
                <Quote className="w-3 h-3" />
                <span>Quote Litigant Profile</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-2.5 text-xs">
            {timeline.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No prior court orders or hearing records recorded for this case.
              </div>
            ) : (
              timeline.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{item.hearing_date}</span>
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      {item.purpose_of_hearing || "Hearing"}
                    </span>
                  </div>

                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                    {item.action_summary || "Proceedings conducted. Notice issued to respondent."}
                  </div>

                  {item.judge_remarks && (
                    <div className="p-2 bg-amber-50/70 dark:bg-amber-950/30 rounded border border-amber-200/50 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 italic">
                      <b>Judge's Order:</b> "{item.judge_remarks}"
                    </div>
                  )}

                  <button
                    onClick={() =>
                      onQuoteSnippet(
                        `Vide order dated ${item.hearing_date}, this Hon'ble Court was pleased to observe: "${item.judge_remarks || item.action_summary || "Matter listed for hearing."}"`,
                        `Court Order dated ${item.hearing_date}`
                      )
                    }
                    className="mt-1 text-[11px] text-amber-600 hover:text-amber-700 flex items-center space-x-1 font-semibold"
                  >
                    <Quote className="w-3 h-3" />
                    <span>Quote Order in Petition</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "evidence" && (
          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Annexure A-1: First Information Report</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Registered on 12.01.2025 at PS Karol Bagh. Total alleged transaction amount Rs. 14,50,000/-.
              </p>
              <button
                onClick={() =>
                  onQuoteSnippet(
                    `A true copy of the First Information Report (FIR No. ${activeCase.crime_number || "182/2025"}) is annexed herewith and marked as ANNEXURE A-1.`,
                    "Annexure A-1 (FIR)"
                  )
                }
                className="mt-1 text-[11px] text-amber-600 hover:text-amber-700 flex items-center space-x-1 font-semibold"
              >
                <Quote className="w-3 h-3" />
                <span>Quote as Annexure A-1</span>
              </button>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                <span>Annexure A-2: Impugned Dismissal Order</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Order dated 04.02.2026 passed by the Ld. Metropolitan Magistrate dismissing the first bail application.
              </p>
              <button
                onClick={() =>
                  onQuoteSnippet(
                    `A true copy of the impugned order dated 04.02.2026 passed by the Ld. Metropolitan Magistrate is annexed herewith and marked as ANNEXURE A-2.`,
                    "Annexure A-2 (Impugned Order)"
                  )
                }
                className="mt-1 text-[11px] text-amber-600 hover:text-amber-700 flex items-center space-x-1 font-semibold"
              >
                <Quote className="w-3 h-3" />
                <span>Quote as Annexure A-2</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Chronology Generator Button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          onClick={() =>
            onQuoteSnippet(
              `<h2 style="text-align: center; font-weight: bold; text-decoration: underline;">LIST OF DATES AND EVENTS</h2>` +
                `<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">` +
                `<thead><tr><th style="border: 1px solid #94a3b8; padding: 6px; width: 25%;">DATE</th><th style="border: 1px solid #94a3b8; padding: 6px; width: 60%;">RELEVANT EVENT / COURT PROCEEDING</th><th style="border: 1px solid #94a3b8; padding: 6px; width: 15%;">PAGE</th></tr></thead>` +
                `<tbody>` +
                `<tr><td style="border: 1px solid #94a3b8; padding: 6px;">12.01.2025</td><td style="border: 1px solid #94a3b8; padding: 6px;">Registration of FIR No. ${activeCase.crime_number || "182/2025"} at PS Karol Bagh under Sec 420, 468 IPC.</td><td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">12–18</td></tr>` +
                `<tr><td style="border: 1px solid #94a3b8; padding: 6px;">12.01.2026</td><td style="border: 1px solid #94a3b8; padding: 6px;">Arrest of the Applicant and remand to judicial custody.</td><td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">19–22</td></tr>` +
                `<tr><td style="border: 1px solid #94a3b8; padding: 6px;">04.02.2026</td><td style="border: 1px solid #94a3b8; padding: 6px;">Rejection of bail application by Ld. Metropolitan Magistrate.</td><td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">23–26</td></tr>` +
                `<tr><td style="border: 1px solid #94a3b8; padding: 6px;"><b>${new Date().toLocaleDateString("en-IN")}</b></td><td style="border: 1px solid #94a3b8; padding: 6px;">Filing of the present petition before this Hon'ble Court.</td><td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">1–11</td></tr>` +
                `</tbody></table>`,
              "List of Dates & Events"
            )
          }
          className="w-full py-2 px-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs hover:bg-slate-800 flex items-center justify-center space-x-1.5 shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Insert List of Dates & Events</span>
        </button>
      </div>
    </div>
  );
}
