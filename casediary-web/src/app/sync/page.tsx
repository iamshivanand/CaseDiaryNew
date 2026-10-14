"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Smartphone,
  ShieldCheck,
  ChevronLeft,
  FileUp,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";
import { useLanguage } from "@/context/LanguageContext";

export default function SyncHubPage() {
  const { t, language } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [syncStats, setSyncStats] = useState<{
    importedCount?: number;
    updatedCount?: number;
    totalCases?: number;
    syncedAt?: string;
  } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sync");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Export failed");

      const blob = new Blob([JSON.stringify(json.backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CaseDiary_Cloud_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setMessage({
        type: "success",
        text: language === "en"
          ? "Database exported successfully! This file can be imported into your Advocase Mobile App."
          : "डेटाबेस सफलतापूर्वक निर्यात किया गया! यह फ़ाइल आपके एडवोकेस मोबाइल ऐप में आयात की जा सकती है।"
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || (language === "en" ? "Failed to export data" : "डेटा निर्यात करने में विफल") });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      setMessage({
        type: "success",
        text: language === "en"
          ? `File "${file.name}" loaded (${(file.size / 1024).toFixed(1)} KB). Click "Start Zero-Loss Sync" below.`
          : `फ़ाइल "${file.name}" लोड हो गई। नीचे "जीरो-लॉस सिंक शुरू करें" पर क्लिक करें।`,
      });
    };
    reader.onerror = () => {
      setMessage({
        type: "error",
        text: language === "en" ? "Failed to read backup file" : "बैकअप फ़ाइल पढ़ने में विफल",
      });
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      alert(language === "en" ? "Please select a backup file or paste the JSON payload." : "कृपया बैकअप फ़ाइल चुनें या JSON पेस्ट करें।");
      return;
    }

    setImporting(true);
    setMessage(null);
    try {
      const parsed = JSON.parse(importText);
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Import failed");

      setSyncStats({
        importedCount: data.importedCount,
        updatedCount: data.updatedCount,
        totalCases: data.totalCases,
        syncedAt: data.syncedAt,
      });

      setMessage({
        type: "success",
        text: language === "en"
          ? `Sync Complete! ${data.importedCount || 0} new matters imported, ${data.updatedCount || 0} existing updated. Total active matters: ${data.totalCases || 0}.`
          : `सिंक संपन्न! ${data.importedCount || 0} नए मामले जोड़े गए, ${data.updatedCount || 0} अद्यतित किए गए। कुल मामले: ${data.totalCases || 0}।`,
      });
      setImportText("");
    } catch (err: any) {
      setMessage({ type: "error", text: `${language === "en" ? "Invalid JSON or Schema" : "अमान्य प्रारूप"}: ${err.message}` });
    } finally {
      setImporting(false);
    }
  };

  const loadSampleMobileDataset = () => {
    const sample = {
      app: "Advocase CaseDiary Mobile",
      exportVersion: "2.0",
      cases: [
        {
          uniqueId: "CASE-DL-2026-MOB-101",
          CaseTitle: "Satish Chand vs. Delhi Development Authority",
          ClientName: "Satish Chand",
          ClientContactNumber: "+91 98112 34567",
          CNRNumber: "DLHC010044552026",
          case_number: "W.P.(C) 4412/2026",
          case_year: 2026,
          court_name: "Delhi High Court - Single Bench",
          case_type_name: "Writ Petition (Civil)",
          NextDate: "2026-10-15",
          PreviousDate: "2026-09-01",
          Undersection: "Article 226 Constitution of India",
          CaseStatus: "In Progress",
          Priority: "High",
          case_stage: "Arguments on Stay Application",
          total_fee: 75000,
          fee_paid: 40000,
          CaseNotes: "Challenging arbitrary demolition notice issued by DDA for residential plot.",
        },
        {
          uniqueId: "CASE-DL-2026-MOB-102",
          CaseTitle: "State vs. Gurpreet Singh & Ors.",
          ClientName: "Gurpreet Singh",
          ClientContactNumber: "+91 98765 43210",
          CNRNumber: "DLCT020088112025",
          case_number: "FIR 310/2025",
          case_year: 2025,
          court_name: "Tis Hazari Courts - Sessions Court",
          case_type_name: "Criminal Bail Application",
          NextDate: "2026-10-10",
          PreviousDate: "2026-08-20",
          Undersection: "Sec 304A, 279 IPC (Sec 106 BNS)",
          CaseStatus: "Open",
          Priority: "High",
          case_stage: "Anticipatory Bail Arguments",
          total_fee: 50000,
          fee_paid: 50000,
          CaseNotes: "Medical records and insurance policy documents verified.",
        },
      ],
    };
    setImportText(JSON.stringify(sample, null, 2));
  };

  return (
    <ChamberAuthGuard featureName={t("syncTitle")}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2">
              <RefreshCw className="w-6 h-6 text-amber-500" />
              <span>{t("syncTitle")}</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {language === "en"
                ? "Bidirectional Cloud Sync for Pro Chambers with Zero Data Loss Guarantee"
                : "प्रो चैंबर हेतु क्लाउड सिंक — शून्य डेटा हानि गारंटी के साथ"}
            </p>
          </div>
        </div>

        {/* Zero Data Loss Guarantee Banner */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-start space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-emerald-950 dark:text-emerald-200">
                {language === "en"
                  ? "Zero Data Loss Transition Guarantee"
                  : "शून्य डेटा हानि संक्रमण गारंटी"}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                PRO SYNC
              </span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {language === "en"
                ? "Connecting your mobile app to this web portal will NEVER delete or wipe your device records. Existing cases are matched by unique ID or CNR, updating hearing outcomes while keeping every note, date, and fee entry intact."
                : "अपने मोबाइल ऐप को वेब पोर्टल से जोड़ने पर आपके फोन का डेटा कभी नहीं मिटेगा। मामलों का मिलान सीएनआर अथवा यूनिक आईडी से होता है, जिससे सभी तारीखें, नोट्स और फीस सुरक्षित रहते हैं।"}
            </p>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-start space-x-3 text-sm animate-in fade-in ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/20"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            )}
            <div className="flex-1 text-xs sm:text-sm font-medium">{message.text}</div>
          </div>
        )}

        {/* Sync Stats Strip (if synced) */}
        {syncStats && (
          <div className="grid grid-cols-3 gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <div className="text-center">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">
                {language === "en" ? "New Matters" : "नए मामले"}
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                +{syncStats.importedCount}
              </span>
            </div>
            <div className="text-center border-x border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">
                {language === "en" ? "Updated Matters" : "अद्यतन"}
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {syncStats.updatedCount}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">
                {language === "en" ? "Total Chamber Cases" : "कुल मामले"}
              </span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {syncStats.totalCases}
              </span>
            </div>
          </div>
        )}

        {/* Core Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cloud to Mobile Export Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {language === "en" ? "Export to Mobile App" : "मोबाइल ऐप हेतु बैकअप"}
                </h3>
                <p className="text-xs text-zinc-500">
                  {language === "en" ? "Generate complete JSON Chamber backup" : "सम्पूर्ण चैंबर बैकअप फ़ाइल डाउनलोड करें"}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {language === "en"
                ? "Download your cloud chamber dossier as a universal JSON backup file. You can import this file inside your Advocase Mobile App Settings -> Restore Database."
                : "अपने क्लाउड चैंबर का बैकअप डाउनलोड करें। इसे एडवोकेस मोबाइल ऐप के सेटिंग्स -> डेटाबेस रिस्टोर में सीधे आयात कर सकते हैं।"}
            </p>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? (language === "en" ? "Generating..." : "तैयार हो रहा है...") : (language === "en" ? "Download Chamber Backup JSON" : "चैंबर बैकअप डाउनलोड करें")}</span>
            </button>
          </div>

          {/* Mobile to Cloud Sync / Import Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {language === "en" ? "Import From Mobile App" : "मोबाइल ऐप से सिंक करें"}
                </h3>
                <p className="text-xs text-zinc-500">
                  {language === "en" ? "Upload phone backup without data loss" : "फ़ोन का बैकअप अपलोड करें"}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {language === "en"
                ? "Pick the backup file generated from your Advocase Mobile App (CaseDiary_Backup_*.json / .db export) or paste the JSON text below."
                : "एडवोकेस मोबाइल ऐप से एक्सपोर्ट की गई बैकअप फ़ाइल चुनें अथवा JSON टेक्स्ट पेस्ट करें।"}
            </p>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json,.txt"
              className="hidden"
            />

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <FileUp className="w-4 h-4" />
                <span>{language === "en" ? "Select Mobile Backup File" : "मोबाइल बैकअप फ़ाइल चुनें"}</span>
              </button>
              <button
                type="button"
                onClick={loadSampleMobileDataset}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium cursor-pointer"
                title="Load sample mobile dataset"
              >
                {language === "en" ? "Load Sample" : "सैंपल लोड"}
              </button>
            </div>
          </div>
        </div>

        {/* JSON Import & Payload Editor */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <FileJson className="w-4 h-4 text-amber-500" />
              <span>{language === "en" ? "Mobile Backup Payload Data" : "मोबाइल बैकअप डेटा"}</span>
            </h3>
            {importText && (
              <button
                onClick={() => setImportText("")}
                className="text-xs text-rose-500 hover:underline cursor-pointer"
              >
                {language === "en" ? "Clear" : "साफ़ करें"}
              </button>
            )}
          </div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={
              language === "en"
                ? "Paste exported JSON from mobile app here or select a backup file above..."
                : "मोबाइल ऐप से एक्सपोर्ट किया गया JSON यहाँ पेस्ट करें या ऊपर फ़ाइल चुनें..."
            }
            className="w-full h-44 p-3.5 text-xs font-mono rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 resize-y"
          />

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-zinc-400">
              {language === "en"
                ? "Supports both CaseDiary 2.0 full backups & simple eCourts arrays"
                : "केसडायरी 2.0 सम्पूर्ण बैकअप एवं ई-कोर्ट्स प्रारूप दोनों समर्थित"}
            </span>
            <button
              onClick={handleImport}
              disabled={importing || !importText.trim()}
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${importing ? "animate-spin" : ""}`} />
              <span>{importing ? (language === "en" ? "Syncing..." : "सिंक हो रहा है...") : (language === "en" ? "Start Zero-Loss Sync" : "जीरो-लॉस सिंक शुरू करें")}</span>
            </button>
          </div>
        </div>
      </div>
    </ChamberAuthGuard>
  );
}
