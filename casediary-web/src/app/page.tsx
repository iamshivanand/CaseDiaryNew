"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  AlertTriangle,
  Clock,
  Briefcase,
  ChevronRight,
  Plus,
  Printer,
  Phone,
  MessageCircle,
  FileText,
  Scale,
  DollarSign,
  Search,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { HearingUpdateModal } from "@/components/HearingUpdateModal";
import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";
import { formatDate, formatINR } from "@/lib/utils";

import { useLanguage } from "@/context/LanguageContext";

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow" | "yesterday" | "undated">("today");
  const [stats, setStats] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseForModal, setSelectedCaseForModal] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Parallelize requests to prevent sequential network lag
      const [statsRes, casesRes] = await Promise.all([
        fetch("/api/stats"),
        fetch(`/api/cases?filter=${activeTab}&limit=20`),
      ]);

      const [statsData, casesData] = await Promise.all([
        statsRes.json(),
        casesRes.json(),
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
      }
      if (casesData.success) {
        setCases(casesData.cases);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  return (
    <ChamberAuthGuard featureName="Daily Court Diary & Cause List">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner / Chamber Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-slate-50 to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 text-slate-900 dark:text-white p-6 sm:p-7 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Scale className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>{language === "en" ? "Advocate Digital Court Munshi" : "अधिवक्ता डिजिटल कोर्ट मुंशी"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t("dailyDiary")} & {t("dailyCauseList")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            {language === "en"
              ? "Streamlined cause list management, instant hearing progression, and 1-tap client WhatsApp updates."
              : "दैनिक कॉज लिस्ट प्रबंधन, सुनवाई परिणाम एवं मुवक्किलों को त्वरित व्हाट्सएप सूचनाएं।"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/cause-list"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-medium flex items-center space-x-2 transition-all shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span>{language === "en" ? "Cause List PDF" : "कॉज लिस्ट पीडीएफ"}</span>
          </Link>
          <Link
            href="/cases/new"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-800 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{t("addNewCase")}</span>
          </Link>
        </div>
      </div>

      {/* KPI Triage Strips with British Racing Emerald + Midnight Navy Psychology */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Hearings: Midnight Navy / Oxford Blue */}
        <button
          onClick={() => setActiveTab("today")}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeTab === "today"
              ? "bg-gradient-to-br from-blue-50/90 to-slate-100 dark:from-slate-900 dark:to-blue-950/40 border-blue-600 dark:border-blue-500 shadow-md shadow-blue-950/10 ring-1 ring-blue-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === "today" ? "text-blue-900 dark:text-blue-300" : "text-slate-600 dark:text-slate-400"}`}>
              {t("todaysHearings")}
            </span>
            <div className={`p-2 rounded-xl ${activeTab === "today" ? "bg-gradient-to-br from-slate-900 to-blue-900 text-white shadow-sm shadow-slate-950/30" : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"}`}>
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-bold ${activeTab === "today" ? "text-blue-950 dark:text-blue-200" : "text-slate-950 dark:text-white"}`}>
              {stats?.todayCount ?? "—"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {language === "en" ? "Matters listed" : "मुकदमे सूचीबद्ध"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {language === "en" ? "Priority courtroom cause list" : "प्राथमिकता कॉज लिस्ट"}
          </p>
        </button>

        {/* Tomorrow's Preview: British Racing Emerald */}
        <button
          onClick={() => setActiveTab("tomorrow")}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeTab === "tomorrow"
              ? "bg-gradient-to-br from-emerald-50/90 to-teal-50/40 dark:from-emerald-950/40 dark:to-slate-900 border-emerald-600 dark:border-emerald-500 shadow-md shadow-emerald-950/10 ring-1 ring-emerald-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === "tomorrow" ? "text-emerald-800 dark:text-emerald-300" : "text-slate-600 dark:text-slate-400"}`}>
              {t("tomorrowPrep")}
            </span>
            <div className={`p-2 rounded-xl ${activeTab === "tomorrow" ? "bg-gradient-to-br from-emerald-700 to-teal-800 text-white shadow-sm shadow-emerald-950/30" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-bold ${activeTab === "tomorrow" ? "text-emerald-900 dark:text-emerald-200" : "text-slate-950 dark:text-white"}`}>
              {stats?.tomorrowCount ?? "—"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {language === "en" ? "Briefs to prepare" : "तैयारी हेतु फाइलें"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {language === "en" ? "Peshi preparation & juniors briefing" : "पेशी तैयारी एवं निर्देश"}
          </p>
        </button>

        {/* Yesterday's Un-updated: Muted Ochre Alert */}
        <button
          onClick={() => setActiveTab("yesterday")}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeTab === "yesterday"
              ? "bg-gradient-to-br from-amber-50/90 to-slate-100 dark:from-amber-950/30 dark:to-slate-900 border-amber-500 dark:border-amber-600 shadow-md shadow-amber-950/10 ring-1 ring-amber-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1 ${activeTab === "yesterday" ? "text-amber-800 dark:text-amber-300" : "text-slate-600 dark:text-slate-400"}`}>
              <span>{t("needsAction")}</span>
            </span>
            <div className={`p-2 rounded-xl ${activeTab === "yesterday" ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-sm shadow-amber-950/30" : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-bold ${activeTab === "yesterday" ? "text-amber-900 dark:text-amber-200" : "text-slate-950 dark:text-white"}`}>
              {stats?.yesterdayPendingCount ?? "—"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {language === "en" ? "Un-updated" : "लंबित परिणाम"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {language === "en" ? "Matters missing new next date" : "अगली तारीख दर्ज करें"}
          </p>
        </button>

        {/* Undated Cases: Nordic Ice Slate & Midnight Navy */}
        <button
          onClick={() => setActiveTab("undated")}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeTab === "undated"
              ? "bg-gradient-to-br from-slate-100 to-slate-200/60 dark:from-slate-800 dark:to-slate-900 border-slate-500 dark:border-slate-400 shadow-md shadow-slate-950/10 ring-1 ring-slate-400/30"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === "undated" ? "text-slate-900 dark:text-slate-200" : "text-slate-600 dark:text-slate-400"}`}>
              {t("undatedMatters")}
            </span>
            <div className={`p-2 rounded-xl ${activeTab === "undated" ? "bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-sm shadow-slate-950/30" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-bold ${activeTab === "undated" ? "text-slate-900 dark:text-white" : "text-slate-950 dark:text-white"}`}>
              {stats?.undatedCount ?? "—"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {language === "en" ? "Reserved / Sine-die" : "सुरक्षित / विचारणीय"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {language === "en" ? "Vault for reserved judgment audits" : "सुरक्षित फैसलों की सूची"}
          </p>
        </button>
      </div>

      {/* Main Section Header & Queue Filter */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
              <span>
                {activeTab === "today" && (language === "en" ? "Today's Court Hearing Queue" : "आज की अदालती सुनवाई सूची")}
                {activeTab === "tomorrow" && (language === "en" ? "Tomorrow's Preparation Queue" : "कल की तैयारी सूची")}
                {activeTab === "yesterday" && (language === "en" ? "Action Required: Yesterday's Un-Updated Cases" : "कार्रवाई आवश्यक: कल के लंबित मामले")}
                {activeTab === "undated" && (language === "en" ? "Undated & Reserved Orders Vault" : "तारीख रहित व सुरक्षित आदेश")}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                {cases.length}
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {activeTab === "today" && (language === "en" ? "Courts arranged for instant morning appearances and order logging." : "प्रातःकालीन पेशी व आदेश प्रविष्टि हेतु सुव्यवस्थित सूची।")}
              {activeTab === "tomorrow" && (language === "en" ? "Brief juniors and prepare trial dossiers for tomorrow's hearings." : "कल की सुनवाई हेतु फाइल तैयारी एवं जूनियर वकीलों को निर्देश।")}
              {activeTab === "yesterday" && (language === "en" ? "Log hearing outcomes right away before client calls." : "मुवक्किलों से बात करने से पहले सुनवाई परिणाम तुरंत दर्ज करें।")}
              {activeTab === "undated" && (language === "en" ? "Matters pending order pronouncement or fresh notices." : "फैसला सुनाए जाने या नए नोटिस हेतु लंबित मुकदमे।")}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/cases"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 hover:underline flex items-center"
            >
              <span>{t("casesDirectory")}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Case Cards Queue List with Priority Stripe Accents */}
        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-sm">
              {t("loading")}
            </div>
          ) : cases.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {language === "en" ? "No matters in this queue right now" : "इस सूची में अभी कोई मुकदमा नहीं है"}
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {activeTab === "yesterday"
                  ? (language === "en" ? "All recent hearings are fully recorded and up to date!" : "हाल की सभी सुनवाइयां अद्यतन दर्ज हैं!")
                  : (language === "en" ? "Add new cases or import from mobile to populate your court calendar." : "न्यायालय कैलेंडर में शामिल करने के लिए नए केस जोड़ें या मोबाइल से सिंक करें।")}
              </p>
            </div>
          ) : (
            cases.map((c, index) => {
              const priorityClass =
                c.Priority === "High"
                  ? "border-l-4 border-l-rose-500"
                  : c.Priority === "Medium"
                  ? "border-l-4 border-l-amber-500"
                  : "border-l-4 border-l-blue-400";

              return (
                <div
                  key={c.id}
                  className={`p-5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${priorityClass}`}
                >
                  {/* Left: Case Metadata */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                        {language === "en" ? `Item #${index + 1}` : `क्रम #${index + 1}`}
                      </span>
                      <StatusBadge status={c.CaseStatus} />
                      <PriorityBadge priority={c.Priority} />
                      <span className="text-xs text-zinc-500 font-medium">
                        {c.case_type_name || (language === "en" ? "General" : "सामान्य")}
                      </span>
                    </div>

                    <div>
                      <Link
                        href={`/cases/${c.id}`}
                        className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                      >
                        {c.CaseTitle || (language === "en" ? "Untitled Case" : "अनाम मुकदमा")}
                      </Link>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">
                        {c.case_number ? `${t("fieldCaseNumber")}: ${c.case_number}` : (language === "en" ? "No Case Number" : "केस नंबर नहीं")} • {c.court_name || (language === "en" ? "Court unassigned" : "न्यायालय अनिर्दिष्ट")}
                      </p>
                    </div>

                    {/* Parties & Stage */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500">{t("fieldClientName")}:</span>{" "}
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{c.ClientName || (language === "en" ? "Client Unspecified" : "मुवक्किल अनिर्दिष्ट")}</span>
                        {c.OnBehalfOf && ` (${c.OnBehalfOf})`}
                      </div>
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500">{language === "en" ? "Opposing Party:" : "विपक्षी पक्षकार:"}</span>{" "}
                        <span className="font-medium">{c.OppositeParty || "—"}</span>
                        {c.OpposingCounsel && ` (Adv. ${c.OpposingCounsel})`}
                      </div>
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500">{t("fieldStageOfHearing")}:</span>{" "}
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{c.case_stage || (language === "en" ? "Hearing" : "पेशी / सुनवाई")}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500">{t("fieldHearingDate")}:</span>{" "}
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatDate(c.NextDate)}</span>
                      </div>
                    </div>

                    {/* Notes snippet if present */}
                    {c.CaseNotes && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        "{c.CaseNotes}"
                      </div>
                    )}
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                    <button
                      onClick={() => setSelectedCaseForModal(c)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 hover:from-slate-800 hover:to-blue-900 text-white font-medium text-xs flex items-center space-x-1.5 transition-all shadow-sm shadow-slate-950/20 active:scale-[0.98] cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t("recordOutcome")}</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {c.ClientContactNumber && (
                        <a
                          href={`https://api.whatsapp.com/send?phone=${c.ClientContactNumber.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-xs flex items-center space-x-1 shadow-sm shadow-emerald-950/20"
                          title={language === "en" ? "Direct Client WhatsApp" : "मुवक्किल को व्हाट्सएप भेजें"}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        href={`/cases/${c.id}`}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all flex items-center space-x-1 border border-slate-200 dark:border-slate-700"
                      >
                        <span>{t("fullDossier")}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Financial & Chamber Summary Widget with Institutional Emerald & Navy Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Fees Collected (British Racing Emerald) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-white dark:from-emerald-950/25 dark:via-slate-900 dark:to-slate-900 border border-emerald-300/80 dark:border-emerald-800/60 shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white shadow-md shadow-emerald-950/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-emerald-800 dark:text-emerald-400 font-bold block">
              {language === "en" ? "Total Fees Collected" : "कुल प्राप्त फीस"}
            </span>
            <span className="text-xl font-bold text-slate-950 dark:text-white">
              {formatINR(stats?.totalFeeCollected)}
            </span>
          </div>
        </div>

        {/* Card 2: Outstanding Balance (Muted Ochre / Attention) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border border-amber-300/80 dark:border-amber-800/60 shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md shadow-amber-950/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-amber-800 dark:text-amber-400 font-bold block">
              {language === "en" ? "Outstanding Balance" : "बकाया फीस राशि"}
            </span>
            <span className="text-xl font-bold text-slate-950 dark:text-white">
              {formatINR(stats?.totalOutstanding)}
            </span>
          </div>
        </div>

        {/* Card 3: Active Matters (Midnight Navy) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/60 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 border border-blue-300/80 dark:border-blue-900/60 shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-blue-900 text-white shadow-md shadow-slate-950/30">
            <Briefcase className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <span className="text-xs text-blue-900 dark:text-blue-300 font-bold block">
              {language === "en" ? "Active Chamber Matters" : "सक्रिय चेंबर मुकदमे"}
            </span>
            <span className="text-xl font-bold text-slate-950 dark:text-white">
              {stats?.totalActiveCount ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Hearing Outcome & WhatsApp Modal */}
      {selectedCaseForModal && (
        <HearingUpdateModal
          isOpen={!!selectedCaseForModal}
          onClose={() => setSelectedCaseForModal(null)}
          caseItem={selectedCaseForModal}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  </ChamberAuthGuard>
);
}
