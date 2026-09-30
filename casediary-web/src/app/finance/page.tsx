"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";
import { useLanguage } from "@/context/LanguageContext";

export default function FinanceLedgerPage() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/cases?limit=all").then((r) => r.json()),
    ]).then(([statsData, casesData]) => {
      if (statsData.success) setStats(statsData.stats);
      if (casesData.success) setCases(casesData.cases);
      setLoading(false);
    });
  }, []);

  const filteredCases = cases.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.CaseTitle?.toLowerCase().includes(s) ||
      c.ClientName?.toLowerCase().includes(s) ||
      c.case_number?.toLowerCase().includes(s)
    );
  });

  return (
    <ChamberAuthGuard featureName={t("financeTitle")}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center space-x-3">
          <IndianRupee className="w-7 h-7 text-emerald-500" />
          <span>{t("financeTitle")}</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t("financeSub")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
              {t("totalBilledFees")}
            </span>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatINR(stats?.totalFeeAgreed)}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">{t("acrossAllMatters")}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              {t("feesCollected")}
            </span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatINR(stats?.totalFeeCollected)}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">{t("realizedRevenue")}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              {t("outstandingReceivables")}
            </span>
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatINR(stats?.totalOutstanding)}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">{t("pendingClientPayments")}</span>
          </div>
        </div>
      </div>

      {/* Case-by-Case Fee Ledger */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden space-y-4">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {t("matterWiseBreakdown")}
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === "en" ? "Search case or client..." : "केस या मुवक्किल खोजें..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-zinc-500 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">{t("fieldCaseTitle")} & {t("fieldCaseNumber")}</th>
                <th className="py-3 px-4">{t("fieldClientName")}</th>
                <th className="py-3 px-4">{t("fieldTotalFee")}</th>
                <th className="py-3 px-4">{t("fieldReceivedFee")}</th>
                <th className="py-3 px-4">{t("fieldPendingFee")}</th>
                <th className="py-3 px-4 w-32">{t("recoveryRate")}</th>
                <th className="py-3 px-4 text-right">{language === "en" ? "Action" : "कार्रवाई"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
              {filteredCases.map((c) => {
                const total = c.total_fee || 0;
                const paid = c.fee_paid || 0;
                const balance = total - paid;
                const percent = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;

                return (
                  <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{c.CaseTitle}</div>
                      <div className="text-[11px] text-zinc-500">{c.case_number || (language === "en" ? "No Case No." : "केस नंबर नहीं")}</div>
                    </td>
                    <td className="py-3 px-4 font-normal text-zinc-700 dark:text-zinc-300">
                      {c.ClientName || (language === "en" ? "Client" : "मुवक्किल")}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {formatINR(total)}
                    </td>
                    <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">
                      {formatINR(paid)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-rose-600 dark:text-rose-400">
                      {formatINR(balance)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent === 100 ? "bg-emerald-500" : percent > 50 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-zinc-500 shrink-0">{percent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/cases/${c.id}`}
                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        {language === "en" ? "Manage" : "प्रबंधन"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </ChamberAuthGuard>
  );
}
