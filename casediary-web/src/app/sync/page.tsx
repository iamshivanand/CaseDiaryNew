"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";
import { useLanguage } from "@/context/LanguageContext";

export default function SyncHubPage() {
  const { t, language } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      a.download = `CaseDiary_Web_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setMessage({
        type: "success",
        text: language === "en"
          ? "Database exported successfully! You can transfer this JSON to mobile."
          : "डेटाबेस सफलतापूर्वक निर्यात किया गया! आप इस JSON को मोबाइल में ट्रांसफर कर सकते हैं।"
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || (language === "en" ? "Failed to export data" : "डेटा निर्यात करने में विफल") });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      alert(language === "en" ? "Please paste the JSON payload or drag a backup file." : "कृपया JSON पेलोड पेस्ट करें या बैकअप फ़ाइल चुनें।");
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

      setMessage({
        type: "success",
        text: language === "en"
          ? `Sync complete! ${data.importedCount} matters imported into your online diary.`
          : `सिंक पूर्ण! आपकी ऑनलाइन डायरी में ${data.importedCount} मुकदमे आयात किए गए।`,
      });
      setImportText("");
    } catch (err: any) {
      setMessage({ type: "error", text: `${language === "en" ? "Invalid format" : "अमान्य प्रारूप"}: ${err.message}` });
    } finally {
      setImporting(false);
    }
  };

  const loadSampleMobileDataset = () => {
    const sample = [
      {
        case_title: "Satish Chand vs. Delhi Development Authority",
        client: "Satish Chand",
        phone: "+91 98112 34567",
        cnr_no: "DLHC010044552026",
        case_number: "W.P.(C) 4412/2026",
        year: 2026,
        court: "Delhi High Court - Single Bench",
        type: "Writ Petition (Civil)",
        next_date: "2026-03-25",
        section: "Article 226 Constitution of India",
        police_station: "",
        notes: "Challenging demolition notice issued by DDA for residential plot.",
      },
      {
        case_title: "State vs. Gurpreet Singh & Ors.",
        client: "Gurpreet Singh",
        phone: "+91 98765 43210",
        cnr_no: "DLCT020088112025",
        case_number: "FIR 310/2025",
        year: 2025,
        court: "Tis Hazari Courts - Sessions Court",
        type: "Criminal Bail Application",
        next_date: "2026-03-18",
        section: "Sec 304A, 279 IPC",
        police_station: "PS Kotwali",
        notes: "Anticipatory bail listed before Sessions Judge.",
      },
    ];
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
            {t("syncSub")}
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center space-x-3 text-xs font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Two Pillars: Export Web to Mobile vs Import Mobile to Web */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export to Mobile */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl w-fit border border-blue-500/20">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {language === "en" ? "Export Web Diary to Mobile" : "वेब डायरी को मोबाइल हेतु निर्यात करें"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {language === "en"
                ? "Download your entire online case registry, hearing timeline progressions, and legal drafts as a structured JSON backup. Can be opened or restored directly on the Android/iOS app."
                : "अपने संपूर्ण मुकदमों की सूची, पेशी समयरेखा और ड्राफ्ट्स को सुव्यवस्थित JSON बैकअप के रूप में डाउनलोड करें। इसे सीधे मोबाइल ऐप में खोला या पुनर्स्थापित किया जा सकता है।"}
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-xs font-medium flex items-center justify-center space-x-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-400" />
            <span>{exporting ? (language === "en" ? "Generating Backup..." : "तैयार किया जा रहा है...") : t("exportBackup")}</span>
          </button>
        </div>

        {/* Import from Mobile / eCourts */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {language === "en" ? "Import Mobile / eCourts Data" : "मोबाइल / ई-कोर्ट्स डेटा आयात करें"}
                </h3>
                <span className="text-[10px] text-zinc-500">JSON / eCourts</span>
              </div>
            </div>
            <button
              onClick={loadSampleMobileDataset}
              className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              {language === "en" ? "Load Sample" : "नमूना लोड करें"}
            </button>
          </div>

          <textarea
            rows={7}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={language === "en" ? "Paste JSON array from mobile export or eCourts backup here..." : "मोबाइल या ई-कोर्ट्स बैकअप का JSON यहाँ पेस्ट करें..."}
            className="w-full p-3 font-mono text-xs bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40 resize-none"
          />

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{importing ? (language === "en" ? "Syncing Matters..." : "सिंक किया जा रहा है...") : t("importBackup")}</span>
          </button>
        </div>
      </div>
    </div>
    </ChamberAuthGuard>
  );
}
