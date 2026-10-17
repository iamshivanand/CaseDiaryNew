"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Scale,
  Calendar,
  Clock,
  Building,
  FileText,
  ShieldCheck,
  Share2,
  Printer,
  ChevronRight,
  ExternalLink,
  Lock,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
  BookOpen,
  User,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import DOMPurify from "dompurify";

export default function SharedCaseBriefPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "documents" | "drafts">("overview");

  useEffect(() => {
    if (!token) return;

    const fetchSharedCase = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/cases/shared/${token}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || "Unable to access this matter brief.");
        }
      } catch (err: any) {
        setError("Network error fetching matter dossier.");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedCase();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!data?.matter) return;
    const m = data.matter;
    const text = `*LEGAL BRIEF DOSSIER | ADVOCASE COURT WORKSPACE*\n\n` +
      `*Matter:* ${m.CaseTitle}\n` +
      `*Court:* ${m.court_name || "Court unassigned"}\n` +
      `*CNR:* ${m.CNRNumber || "N/A"}\n` +
      `*Next Date:* ${m.NextDate ? formatDate(m.NextDate) : "Undated"}\n` +
      `*Stage:* ${m.CaseStage || "Pending"}\n\n` +
      `*Shared Dossier Link:* ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
          </div>
          <h2 className="text-xl font-serif font-bold text-white tracking-wide">
            Loading Isolated Matter Dossier...
          </h2>
          <p className="text-xs text-slate-400 max-w-sm">
            Authenticating external counsel access token and decrypting court record.
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
              Access Restricted or Expired
            </h2>
            <p className="text-sm text-slate-400">
              {error || "This shared matter brief is no longer active."}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Please ask the host advocate to generate a fresh external counsel brief link.
          </p>
        </div>
      </div>
    );
  }

  const { matter, timeline, documents, drafts, share } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar Branding */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-white text-base tracking-tight">
                Advocase
              </span>
              <span className="ml-2 text-[10px] uppercase font-semibold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                Shared Counsel Brief
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Brief</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share via WhatsApp</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6 flex-1">
        {/* Privacy Isolation Alert Banner */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Isolated Matter Access:</span>{" "}
              <span>
                Shared by <b>{share.sharedByUserName}</b> ({share.chamberName})
                {share.sharedWithCounselName ? ` for Counsel ${share.sharedWithCounselName}` : ""}.
              </span>
            </div>
          </div>
          <span className="text-[11px] text-emerald-400/80 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 shrink-0">
            Permission: {share.accessLevel === "co_counsel" ? "Co-Counsel View & Draft" : "View-Only Court Brief"}
          </span>
        </div>

        {/* Case Hero Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-md font-semibold ${
                  matter.CaseStatus === "Disposed"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}>
                  {matter.CaseStatus || "Active Litigation"}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {matter.case_type_name || "General Litigation"}
                </span>
                {matter.CNRNumber && (
                  <span className="text-xs font-mono font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                    CNR: {matter.CNRNumber}
                  </span>
                )}
                {matter.case_number && (
                  <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
                    Case No: {matter.case_number}/{matter.case_year || "2026"}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                {matter.CaseTitle || "Untitled Court Matter"}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <Building className="w-4 h-4 text-amber-500" />
                  <span>{matter.court_name || "Court Not Specified"}</span>
                </div>
                {matter.JudgeName && (
                  <div className="flex items-center space-x-1.5">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Bench: {matter.JudgeName}</span>
                  </div>
                )}
                {matter.CaseStage && (
                  <div className="flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span>Stage: <b className="text-slate-200">{matter.CaseStage}</b></span>
                  </div>
                )}
              </div>
            </div>

            {/* Next Hearing Date Highlight Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right min-w-[200px]">
              <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold block">
                Next Hearing Date
              </span>
              <span className="text-xl sm:text-2xl font-serif font-bold text-white block mt-1">
                {matter.NextDate ? formatDate(matter.NextDate) : "Order Reserved"}
              </span>
              {matter.PreviousDate && (
                <span className="text-[11px] text-slate-400 block mt-1">
                  Previous: {formatDate(matter.PreviousDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Overview & Parties
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "timeline"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <span>Hearing Timeline</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800">
              {timeline?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "documents"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <span>Attached Documents</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800">
              {documents?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("drafts")}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "drafts"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <span>Pleadings & Drafts</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800">
              {drafts?.length || 0}
            </span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parties Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Litigant Parties</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Petitioner / First Party:</span>
                  <span className="text-white font-semibold text-sm">
                    {matter.FirstParty || matter.ClientName || "N/A"}
                  </span>
                  {matter.OnBehalfOf && (
                    <span className="text-[11px] text-amber-400 block">
                      (Represented On Behalf of: {matter.OnBehalfOf})
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Respondent / Opposite Party:</span>
                  <span className="text-white font-semibold text-sm">
                    {matter.OppositeParty || matter.Accussed || "State / Opposite Party"}
                  </span>
                  {matter.OppositeAdvocate && (
                    <span className="text-[11px] text-slate-400 block">
                      Opposite Counsel: {matter.OppositeAdvocate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Crime / Police / Jurisdiction Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Building className="w-4 h-4 text-amber-500" />
                <span>Jurisdiction & Statutory Details</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                {matter.Undersection && (
                  <div>
                    <span className="text-slate-400 block font-medium">Under Sections:</span>
                    <span className="text-amber-300 font-mono font-medium">
                      {matter.Undersection}
                    </span>
                  </div>
                )}
                {matter.crime_number && (
                  <div>
                    <span className="text-slate-400 block font-medium">FIR / Crime Number:</span>
                    <span className="text-white font-mono">
                      FIR No. {matter.crime_number}/{matter.crime_year || "2026"}
                    </span>
                  </div>
                )}
                {matter.police_station_name && (
                  <div>
                    <span className="text-slate-400 block font-medium">Police Station:</span>
                    <span className="text-white">
                      {matter.police_station_name} ({matter.district_name || "District"})
                    </span>
                  </div>
                )}
                {matter.dateFiled && (
                  <div>
                    <span className="text-slate-400 block font-medium">Date Filed / Instituted:</span>
                    <span className="text-white">{formatDate(matter.dateFiled)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Case Notes Card */}
            {matter.CaseNotes && (
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Counsel Brief Notes</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {matter.CaseNotes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Timeline */}
        {activeTab === "timeline" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Court Proceedings & Recorded Business</span>
            </h3>

            {timeline?.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No past courtroom proceedings recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {timeline.map((entry: any, idx: number) => (
                  <div
                    key={entry.id || idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">
                        {formatDate(entry.hearing_date)}
                      </span>
                      {entry.event_type && (
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] uppercase font-semibold">
                          {entry.event_type}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-slate-300 leading-relaxed">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Documents */}
        {activeTab === "documents" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Attached Documents & Pleadings</span>
            </h3>

            {documents?.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No documents uploaded for this matter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1 truncate pr-3">
                      <span className="font-bold text-white block truncate">
                        {doc.original_display_name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Category: {doc.category || "General"}
                      </span>
                    </div>
                    {doc.file_url ? (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors shrink-0"
                        title="Download / View"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-500">Archived</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Drafts */}
        {activeTab === "drafts" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Document Drafts & Legal Pleadings</span>
            </h3>

            {drafts?.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No draft petitions or pleadings created for this matter yet.
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map((d: any) => (
                  <div
                    key={d.id}
                    className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white">{d.title}</h4>
                      <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {d.template_type}
                      </span>
                    </div>
                    {d.html_content && (
                      <div
                        className="prose prose-invert prose-xs max-w-none bg-slate-900 p-4 rounded-lg border border-slate-800/80 max-h-60 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(d.html_content) }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Branded Bar */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 text-center text-xs text-slate-500">
        Advocase Court Diary & Litigation Workspace • Strict End-to-End Chamber Security
      </footer>
    </div>
  );
}
