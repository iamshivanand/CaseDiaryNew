"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Briefcase,
  AlertTriangle,
  Scale,
  MessageCircle,
} from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { HearingUpdateModal } from "@/components/HearingUpdateModal";
import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";
import { formatDate, getTodayDateString } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function CourtCalendarPage() {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayDateString());
  const [selectedCaseForModal, setSelectedCaseForModal] = useState<any | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cases?limit=all");
      const json = await res.json();
      if (json.success) {
        setCases(json.cases);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getTodayDateString());
  };

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthNamesHi = [
    "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
  ];
  const monthName = language === "en" ? monthNamesEn[month] : monthNamesHi[month];

  const weekdays = language === "en"
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

  // Group cases by NextDate (YYYY-MM-DD)
  const casesByDate: Record<string, any[]> = {};
  for (const c of cases) {
    if (c.NextDate) {
      if (!casesByDate[c.NextDate]) casesByDate[c.NextDate] = [];
      casesByDate[c.NextDate].push(c);
    }
  }

  const selectedDateCases = casesByDate[selectedDateStr] || [];

  return (
    <ChamberAuthGuard featureName={language === "en" ? "Court Hearing Calendar" : "कोर्ट सुनवाई कैलेंडर"}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Calendar UI contents */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight flex items-center space-x-3">
            <CalendarIcon className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            <span>{language === "en" ? "Interactive Court Calendar" : "इंटरैक्टिव कोर्ट कैलेंडर"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {language === "en"
              ? "Visual court schedule and hearing density mapping across trial dates."
              : "मुकदमों की सुनवाई तिथियों व कोर्ट अनुसूची का कैलेंडर दृश्य।"}
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {language === "en" ? "Today" : "आज"}
          </button>
          <div className="flex items-center space-x-1 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-1 rounded-xl shadow-xs">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-zinc-900 dark:text-white min-w-[120px] text-center">
              {monthName} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Monthly Calendar Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="grid grid-cols-7 text-center text-xs font-bold text-zinc-400 uppercase py-2 border-b border-zinc-100 dark:border-zinc-800">
            {weekdays.map((w, idx) => (
              <div key={idx}>{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty offset padding cells */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[75px] sm:min-h-[90px] rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20" />
            ))}

            {/* Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayCases = casesByDate[dStr] || [];
              const isSelected = selectedDateStr === dStr;
              const isToday = getTodayDateString() === dStr;

              return (
                <button
                  key={dStr}
                  onClick={() => setSelectedDateStr(dStr)}
                  className={`min-h-[75px] sm:min-h-[90px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10 shadow-xs"
                      : isToday
                      ? "border-zinc-900 dark:border-white bg-zinc-100/60 dark:bg-zinc-800/40"
                      : "border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/20 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? "w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-extrabold text-[11px]"
                          : isSelected
                          ? "text-amber-600 dark:text-amber-400 font-extrabold"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {day}
                    </span>
                    {dayCases.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950 shadow-xs">
                        {dayCases.length}
                      </span>
                    )}
                  </div>

                  {/* Hearing indicators */}
                  <div className="space-y-1 w-full mt-1">
                    {dayCases.slice(0, 2).map((c) => (
                      <div
                        key={c.id}
                        className="text-[10px] font-medium truncate px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                      >
                        {c.CaseTitle}
                      </div>
                    ))}
                    {dayCases.length > 2 && (
                      <span className="text-[9px] text-zinc-400 font-semibold block px-1">
                        +{dayCases.length - 2} {language === "en" ? "more" : "अन्य"}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Selected Date Hearings Drawer */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                {language === "en" ? "Court Schedule For" : "कोर्ट अनुसूची तिथि"}
              </span>
              <h3 className="text-base font-extrabold text-zinc-950 dark:text-white">
                {formatDate(selectedDateStr)}
              </h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300">
              {selectedDateCases.length} {language === "en" ? "listed" : "सूचीबद्ध"}
            </span>
          </div>

          {selectedDateCases.length === 0 ? (
            <div className="py-16 text-center space-y-2 text-zinc-500 text-xs">
              <Clock className="w-8 h-8 mx-auto text-zinc-400 opacity-60" />
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                {language === "en" ? "No hearings listed on this date" : "इस तिथि को कोई सुनवाई सूचीबद्ध नहीं है"}
              </p>
              <p>
                {language === "en"
                  ? "Select another day on the calendar to inspect courtroom matters."
                  : "मुकदमों की जांच हेतु कैलेंडर में अन्य तिथि चुनें।"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {selectedDateCases.map((c, idx) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      {language === "en" ? `Item #${idx + 1}` : `क्रम #${idx + 1}`}
                    </span>
                    <PriorityBadge priority={c.Priority} />
                  </div>

                  <div>
                    <Link
                      href={`/cases/${c.id}`}
                      className="font-bold text-sm text-zinc-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors block"
                    >
                      {c.CaseTitle}
                    </Link>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {c.court_name || (language === "en" ? "Court unassigned" : "अदालत अनिर्धारित")}
                    </p>
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5 pt-1">
                    <div>
                      <span className="text-zinc-400">{language === "en" ? "Stage:" : "चरण:"}</span>{" "}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{c.case_stage || (language === "en" ? "Hearing" : "सुनवाई")}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">{language === "en" ? "Client:" : "मुवक्किल:"}</span>{" "}
                      <span className="font-medium">{c.ClientName || (language === "en" ? "Client" : "मुवक्किल")}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setSelectedCaseForModal(c)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs flex items-center space-x-1"
                    >
                      <span>{language === "en" ? "Update" : "अपडेट"}</span>
                    </button>
                    <Link
                      href={`/cases/${c.id}`}
                      className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold"
                    >
                      {language === "en" ? "Dossier" : "फ़ाइल"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
