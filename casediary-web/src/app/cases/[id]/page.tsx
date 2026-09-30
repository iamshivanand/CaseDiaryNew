"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  Phone,
  MessageCircle,
  FileText,
  Clock,
  Trash2,
  Edit3,
  Scale,
  Shield,
  Users,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Share2,
  FilePlus,
  Send,
  UserCheck,
  UserPlus,
  Clock3,
  ExternalLink,
  Briefcase,
  CheckCircle,
} from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { HearingUpdateModal } from "@/components/HearingUpdateModal";
import { formatDate, formatINR } from "@/lib/utils";
import { generateWhatsAppHearingUpdate } from "@/lib/whatsapp";
import { generateSingleMatterJuniorBriefing } from "@/lib/teamWhatsapp";
import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";
import { useLanguage } from "@/context/LanguageContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CaseDetailsPage({ params }: PageProps) {
  const { t, language } = useLanguage();
  const resolvedParams = use(params);
  const router = useRouter();
  const caseId = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "finance" | "drafts" | "documents">("overview");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("pleading");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [updatingMember, setUpdatingMember] = useState(false);
  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);
  const [newDuty, setNewDuty] = useState({
    member_id: "",
    duty_type: "Pass-Over",
    assigned_date: "",
    notes: "",
    pass_over_time: "02:00 PM",
  });
  const [savingDuty, setSavingDuty] = useState(false);

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team");
      const json = await res.json();
      if (json.success) {
        setTeamMembers(json.members || []);
      }
    } catch (err) {
      console.error("Failed to load team:", err);
    }
  };

  const fetchCaseDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        alert(json.error || "Case not found");
      }
    } catch (err) {
      console.error("Failed to load case:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
    fetchTeam();
  }, [caseId]);

  const handleAssignMember = async (memberId: number | null) => {
    setUpdatingMember(true);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_member_id: memberId }),
      });
      const json = await res.json();
      if (json.success) {
        fetchCaseDetails();
      } else {
        alert(json.error || "Failed to assign team member");
      }
    } catch (err) {
      console.error("Failed to assign:", err);
    } finally {
      setUpdatingMember(false);
    }
  };

  const handleUpdateDutyStatus = async (dutyId: number, status: string) => {
    try {
      const res = await fetch("/api/team/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dutyId, status }),
      });
      const json = await res.json();
      if (json.success) {
        fetchCaseDetails();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleCreateDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDuty.member_id) {
      alert("Please select a team member");
      return;
    }
    setSavingDuty(true);
    try {
      const res = await fetch("/api/team/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: Number(caseId),
          member_id: Number(newDuty.member_id),
          duty_type: newDuty.duty_type,
          duty_date: newDuty.assigned_date || data?.case?.NextDate || new Date().toISOString().split("T")[0],
          notes: newDuty.notes + (newDuty.duty_type === "Pass-Over" && newDuty.pass_over_time ? ` (Pass-over till: ${newDuty.pass_over_time})` : ""),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsDutyModalOpen(false);
        setNewDuty({
          member_id: "",
          duty_type: "Pass-Over",
          assigned_date: "",
          notes: "",
          pass_over_time: "02:00 PM",
        });
        fetchCaseDetails();
      } else {
        alert(json.error || "Failed to create assignment");
      }
    } catch (err) {
      alert("Failed to assign court duty");
    } finally {
      setSavingDuty(false);
    }
  };

  const shareJuniorBriefingWhatsApp = (assignment: any) => {
    const memberName = assignment.memberName || assignment.member?.name || data.assignedMember?.name;
    const memberPhone = assignment.memberPhone || assignment.member?.phone || data.assignedMember?.phone;
    if (!memberName) return;
    const text = generateSingleMatterJuniorBriefing({
      memberName: memberName,
      caseTitle: data.case.CaseTitle,
      caseNumber: data.case.case_number,
      courtName: data.case.court_name,
      judgeName: data.case.JudgeName,
      nextDate: assignment.duty_date || assignment.assigned_date || data.case.NextDate,
      stage: data.case.case_stage,
      dutyType: assignment.duty_type,
      instructions: assignment.notes,
    });
    const phone = (memberPhone || "").replace(/[^0-9]/g, "");
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this case and its entire timeline? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cases/${caseId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        router.push("/cases");
      }
    } catch (err) {
      alert("Failed to delete case");
      setDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("case_id", caseId);
      formData.append("category", uploadCategory);
      formData.append("file", file);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Upload failed");
      await fetchCaseDetails();
    } catch (err: any) {
      alert(err.message || "Failed to upload file");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Loading case dossier...
      </div>
    );
  }

  if (!data?.case) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-base font-bold text-slate-800 dark:text-slate-200">Case Dossier Not Found</p>
        <Link href="/cases" className="text-xs text-blue-600 dark:text-blue-400 font-semibold underline">
          Back to Directory
        </Link>
      </div>
    );
  }

  const c = data.case;
  const timeline = data.timeline || [];
  const outstanding = (c.total_fee || 0) - (c.fee_paid || 0);

  const shareWhatsApp = () => {
    const text = generateWhatsAppHearingUpdate({
      clientName: c.ClientName,
      caseTitle: c.CaseTitle,
      caseNumber: c.case_number,
      cnrNumber: c.CNRNumber,
      courtName: c.court_name,
      judgeName: c.JudgeName,
      nextDate: c.NextDate ? formatDate(c.NextDate) : "Order Reserved / Undated",
      stage: c.case_stage,
      notes: c.CaseNotes,
      phone: c.ClientContactNumber,
    });
    const phone = (c.ClientContactNumber || "").replace(/[^0-9]/g, "");
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <ChamberAuthGuard featureName={t("tabOverview")}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/cases"
          className="flex items-center space-x-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t("casesDirectory")}</span>
        </Link>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title={language === "en" ? "Delete Matter" : "केस हटाएं"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Case Header Hero Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={c.CaseStatus} />
              <PriorityBadge priority={c.Priority} />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-700/60">
                {c.case_type_name || (language === "en" ? "Litigation" : "मुकदमा")}
              </span>
              {c.CNRNumber && (
                <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  CNR: {c.CNRNumber}
                </span>
              )}
              {data.assignedMember ? (
                <div className="flex items-center space-x-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs px-2.5 py-0.5 rounded-md font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{language === "en" ? "Counsel:" : "वकील:"} <b>{data.assignedMember.name}</b> ({data.assignedMember.role})</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs px-2.5 py-0.5 rounded-md font-medium">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{language === "en" ? "Unassigned Counsel" : "असाइन नहीं किया गया"}</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {c.CaseTitle}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              {c.case_number ? `${t("fieldCaseNumber")}: ${c.case_number}` : (language === "en" ? "No Case Number" : "केस नंबर नहीं")} • {c.court_name || (language === "en" ? "Court unassigned" : "अदालत निर्धारित नहीं")}
              {c.JudgeName && ` • ${t("fieldJudgeName")}: ${c.JudgeName}`}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t("recordOutcome")}</span>
            </button>

            <button
              onClick={() => {
                setNewDuty((prev) => ({
                  ...prev,
                  member_id: data.case?.assigned_member_id ? String(data.case.assigned_member_id) : "",
                  assigned_date: data.case?.NextDate || new Date().toISOString().split("T")[0],
                }));
                setIsDutyModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Clock3 className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Delegate Duty" : "ड्यूटी सौंपें"}</span>
            </button>

            <button
              onClick={shareWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {c.ClientContactNumber && (
              <a
                href={`tel:${c.ClientContactNumber}`}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                title={language === "en" ? "Call Client" : "मुवक्किल को कॉल करें"}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Date Progression Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div>
            <span className="text-zinc-400 block">{t("fieldHearingDate")}</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
              {c.NextDate ? formatDate(c.NextDate) : (language === "en" ? "Order Reserved / Undated" : "आदेश सुरक्षित / तारीख रहित")}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block">{language === "en" ? "Current Stage" : "वर्तमान चरण"}</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">
              {c.case_stage || (language === "en" ? "Hearing" : "सुनवाई")}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block">{language === "en" ? "Previous Hearing" : "पिछली पेशी"}</span>
            <span className="font-normal text-zinc-700 dark:text-zinc-300 text-sm">
              {formatDate(c.PreviousDate)}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block">{t("fieldFiledDate")}</span>
            <span className="font-normal text-zinc-700 dark:text-zinc-300 text-sm">
              {formatDate(c.dateFiled)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-4 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          {t("tabOverview")}
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "timeline"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          <span>{t("tabHearingsTimeline")}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800">
            {timeline.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("finance")}
          className={`pb-3 px-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "finance"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          {t("tabFinancials")}
        </button>
        <button
          onClick={() => setActiveTab("drafts")}
          className={`pb-3 px-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "drafts"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          {t("legalDrafting")}
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "documents"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          <span>{t("tabDocuments")}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800">
            {data.documents?.length || 0}
          </span>
        </button>
      </div>

      {/* Tab 1: Case Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parties & Counsel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Parties & Representation</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Primary Client</span>
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  {c.ClientName || "Unspecified"}
                </span>
                {c.OnBehalfOf && (
                  <span className="text-slate-500 block">Represented as: {c.OnBehalfOf}</span>
                )}
                {c.ClientContactNumber && (
                  <span className="text-slate-600 dark:text-slate-400 block font-mono">
                    Phone: {c.ClientContactNumber}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block">Opposing Party</span>
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  {c.OppositeParty || "—"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Opposing Counsel</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {c.OpposingCounsel ? `Adv. ${c.OpposingCounsel}` : "—"}
                </span>
                {c.OppAdvocateContactNumber && (
                  <span className="text-slate-500 block font-mono">
                    Phone: {c.OppAdvocateContactNumber}
                  </span>
                )}
              </div>

              {c.Accussed && (
                <div>
                  <span className="text-slate-400 block">Accused Persons</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{c.Accussed}</span>
                </div>
              )}
            </div>
          </div>

          {/* Criminal & FIR Details */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Shield className="w-4 h-4 text-rose-500" />
              <span>FIR & Legal Provisions</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Crime / FIR Number</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {c.crime_number ? `${c.crime_number} (Year: ${c.crime_year || "—"})` : "Not applicable"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Under Section(s)</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {c.Undersection || "None recorded"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Limitation Date</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatDate(c.StatuteOfLimitations) || "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Strategy Notes */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Legal Strategy & Chamber Notes</span>
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {c.CaseNotes || "No notes recorded yet. Use this space for legal strategy, citations, and trial notes."}
            </p>
          </div>

          {/* Chamber Team Delegation & Courtroom Duty Board */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Chamber Team Delegation & Courtroom Duty Board
                </h3>
              </div>

              {/* Matter In-Charge Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-medium">Matter In-Charge:</span>
                <select
                  value={c.assigned_member_id || ""}
                  onChange={(e) => handleAssignMember(e.target.value ? Number(e.target.value) : null)}
                  disabled={updatingMember}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">— Unassigned (Lead / Self) —</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(!data.assignments || data.assignments.length === 0) ? (
              <div className="py-8 text-center space-y-2 text-slate-500 text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No courtroom delegations assigned for this case yet.
                </p>
                <p>
                  Assign a junior advocate for pass-over, cross-examination, or order copy collection.
                </p>
                <button
                  onClick={() => {
                    setNewDuty((prev) => ({
                      ...prev,
                      member_id: data.case?.assigned_member_id ? String(data.case.assigned_member_id) : "",
                      assigned_date: data.case?.NextDate || new Date().toISOString().split("T")[0],
                    }));
                    setIsDutyModalOpen(true);
                  }}
                  className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                >
                  <Clock3 className="w-3.5 h-3.5" />
                  <span>Assign Court Duty Now</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold pb-2">
                      <th className="py-2">Date</th>
                      <th className="py-2">Assigned Junior / Clerk</th>
                      <th className="py-2">Duty Type</th>
                      <th className="py-2">Instructions & Pass-Over</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data.assignments.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {formatDate(a.duty_date || a.assigned_date)}
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {a.memberName || a.member?.name || "Team Member"}
                          </div>
                          <div className="text-[10px] text-slate-400">{a.memberRole || a.member?.role}</div>
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {a.duty_type}
                          </span>
                        </td>
                        <td className="py-3 max-w-xs text-slate-600 dark:text-slate-300">
                          {a.pass_over_time && (
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 block text-[11px]">
                              Pass-Over Time: {a.pass_over_time}
                            </span>
                          )}
                          <span>{a.notes || "No special instructions"}</span>
                        </td>
                        <td className="py-3">
                          <select
                            value={a.status || "Pending"}
                            onChange={(e) => handleUpdateDutyStatus(a.id, e.target.value)}
                            className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="Pending">⏳ Pending</option>
                            <option value="Pass-Over Granted">🕒 Pass-Over Granted</option>
                            <option value="Attended">✅ Attended</option>
                            <option value="Completed">🎉 Completed</option>
                            <option value="Adjourned">📅 Adjourned</option>
                          </select>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => shareJuniorBriefingWhatsApp(a)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800"
                            title="Send Instructions via WhatsApp"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Chronological Hearing Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chronological Case Progression
              </h3>
              <p className="text-xs text-slate-500">
                Audit trail of past dates, court orders, and hearing outcomes.
              </p>
            </div>
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Record New Date</span>
            </button>
          </div>

          {timeline.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-slate-500 text-xs">
              <p className="font-semibold">No past hearings recorded yet.</p>
              <p>Click "Record Outcome" above to add your first court hearing event.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-8 my-4">
              {timeline.map((event: any, idx: number) => (
                <div key={event.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-amber-500" />

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Hearing on {formatDate(event.hearing_date)}</span>
                      </span>
                      {event.amount && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          Fee Collected: {formatINR(event.amount)} ({event.payment_mode || "Cash"})
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {event.notes || "Hearing conducted."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Financial Accounting */}
      {activeTab === "finance" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Fee Accounting & Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Professional billing, advance fees, and court appearance fee collections.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400 block font-medium">Total Agreed Fee</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatINR(c.total_fee)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">Total Collected</span>
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {formatINR(c.fee_paid)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
              <span className="text-xs text-rose-600 dark:text-rose-400 block font-medium">Outstanding Balance</span>
              <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">
                {formatINR(outstanding)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Legal Drafts */}
      {activeTab === "drafts" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Case Legal Drafts
              </h3>
              <p className="text-xs text-slate-500">
                Generate court applications and notices pre-filled with this case's data.
              </p>
            </div>
            <Link
              href={`/drafts?case_id=${c.id}`}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Open in Drafting Studio</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href={`/drafts?template=bail&case_id=${c.id}`}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all block group"
            >
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500">
                Regular Bail Application (Sec 439 CrPC / 483 BNSS)
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Autofill FIR {c.crime_number || "—"}, Police Station, and Court details into bail draft.
              </p>
            </Link>

            <Link
              href={`/drafts?template=vakalatnama&case_id=${c.id}`}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all block group"
            >
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500">
                Standard Advocate Vakalatnama
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Standard authority memo with client {c.ClientName || "Client"} and court format.
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* Tab 5: Case Documents & File Attachments */}
      {activeTab === "documents" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Briefs, Orders & Pleadings Vault
              </h3>
              <p className="text-xs text-slate-500">
                Upload case briefs, scanned chargesheets, certified court orders, and payment vouchers.
              </p>
            </div>

            {/* Upload form */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="pleading">Pleading / Plaint / WS</option>
                <option value="order">Certified Court Order</option>
                <option value="evidence">Evidence / Document</option>
                <option value="receipt">Fee Receipt / Voucher</option>
                <option value="general">General Attachment</option>
              </select>

              <label className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm transition-all">
                <FilePlus className="w-3.5 h-3.5" />
                <span>{uploadingDoc ? "Uploading..." : "Upload File"}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingDoc}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {(!data.documents || data.documents.length === 0) ? (
            <div className="py-12 text-center space-y-2 text-slate-500 text-xs">
              <p className="font-semibold">No documents attached to this case yet.</p>
              <p>Upload trial briefs, bail orders, or police reports using the button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate block max-w-xs">
                        {doc.original_display_name}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                        {doc.category || "File"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Uploaded on {formatDate(doc.created_at)} • {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "File"}
                    </p>
                  </div>

                  <a
                    href={`/api/documents/${doc.stored_filename}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold shrink-0 transition-colors"
                  >
                    View / Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hearing Outcome Modal */}
      <HearingUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        caseItem={c}
        onSuccess={fetchCaseDetails}
      />

      {/* Delegate Duty Modal */}
      {isDutyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Clock3 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delegate Court Duty
                </h3>
              </div>
              <button
                onClick={() => setIsDutyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateDuty} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Team Member *
                </label>
                <select
                  value={newDuty.member_id}
                  onChange={(e) => setNewDuty({ ...newDuty, member_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Junior / Associate / Clerk</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duty Type
                  </label>
                  <select
                    value={newDuty.duty_type}
                    onChange={(e) => setNewDuty({ ...newDuty, duty_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pass-Over">Pass-Over Request</option>
                    <option value="Attend Hearing">Main Attendance</option>
                    <option value="Adjournment">Seek Adjournment</option>
                    <option value="Certified Copy">Collect Certified Copy</option>
                    <option value="File Inspection">File Inspection</option>
                    <option value="Bail Bond">Bail Bond Submission</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duty Date
                  </label>
                  <input
                    type="date"
                    value={newDuty.assigned_date}
                    onChange={(e) => setNewDuty({ ...newDuty, assigned_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {newDuty.duty_type === "Pass-Over" && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pass-Over Requested Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 02:00 PM / After lunch"
                    value={newDuty.pass_over_time}
                    onChange={(e) => setNewDuty({ ...newDuty, pass_over_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Specific Instructions / Notes for Junior
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Senior counsel is tied up in HC Court 14. Request pass-over till 2 PM. Do not concede on dates."
                  value={newDuty.notes}
                  onChange={(e) => setNewDuty({ ...newDuty, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDutyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDuty}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition-all"
                >
                  {savingDuty ? "Delegating..." : "Assign Duty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </ChamberAuthGuard>
  );
}
