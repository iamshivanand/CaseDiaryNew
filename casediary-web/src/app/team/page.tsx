"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronRight,
  Printer,
  Sparkles,
  Send,
  X,
  FileText,
} from "lucide-react";
import { formatDate, getTodayDateString, getTomorrowDateString } from "@/lib/utils";
import { generateJuniorDutyWhatsApp } from "@/lib/teamWhatsapp";
import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";
import { useLanguage } from "@/context/LanguageContext";

export default function ChamberTeamPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"duties" | "roster" | "junior-list">("duties");
  const [members, setMembers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dutyDate, setDutyDate] = useState(getTodayDateString());
  const [selectedMemberForList, setSelectedMemberForList] = useState<string>("");

  // Modals
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAssignDutyOpen, setIsAssignDutyOpen] = useState(false);

  // Add Member Form State
  const [memberForm, setMemberForm] = useState({
    name: "",
    role: "Junior Advocate",
    barCouncilNumber: "",
    phone: "",
    email: "",
    assigned_courts: "Tis Hazari Courts, Patiala House",
  });

  // Assign Duty Form State
  const [dutyForm, setDutyForm] = useState({
    case_id: "",
    member_id: "",
    duty_date: getTodayDateString(),
    duty_type: "Pass-Over Request",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, assignmentsRes, casesRes] = await Promise.all([
        fetch("/api/team").then((r) => r.json()),
        fetch(`/api/team/assignments?date=${dutyDate}`).then((r) => r.json()),
        fetch("/api/cases").then((r) => r.json()),
      ]);

      if (membersRes.success) {
        setMembers(membersRes.members);
        if (!selectedMemberForList && membersRes.members.length > 0) {
          setSelectedMemberForList(membersRes.members[0].id.toString());
        }
      }
      if (assignmentsRes.success) setAssignments(assignmentsRes.assignments);
      if (casesRes.success) {
        setCases(casesRes.cases);
        if (casesRes.cases.length > 0 && !dutyForm.case_id) {
          setDutyForm((prev) => ({ ...prev, case_id: casesRes.cases[0].id.toString() }));
        }
      }
    } catch (err) {
      console.error("Error loading team data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dutyDate]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) {
      alert("Name is required");
      return;
    }

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddMemberOpen(false);
        setMemberForm({
          name: "",
          role: "Junior Advocate",
          barCouncilNumber: "",
          phone: "",
          email: "",
          assigned_courts: "Tis Hazari Courts, Patiala House",
        });
        fetchData();
      } else {
        alert(data.error || "Failed to add member");
      }
    } catch (err) {
      alert("Network error adding member");
    }
  };

  const handleAssignDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyForm.case_id || !dutyForm.member_id) {
      alert("Please select both a Case and a Chamber Member");
      return;
    }

    try {
      const res = await fetch("/api/team/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dutyForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsAssignDutyOpen(false);
        setDutyForm({
          case_id: cases[0]?.id.toString() || "",
          member_id: members[0]?.id.toString() || "",
          duty_date: dutyDate,
          duty_type: "Pass-Over Request",
          notes: "",
        });
        fetchData();
      } else {
        alert(data.error || "Failed to assign duty");
      }
    } catch (err) {
      alert("Network error creating assignment");
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch("/api/team/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm("Remove this duty assignment?")) return;
    try {
      await fetch(`/api/team/assignments?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm("Are you sure you want to remove this chamber member?")) return;
    try {
      await fetch(`/api/team/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const sendJuniorWhatsApp = (member: any, memberAssignments: any[]) => {
    const text = generateJuniorDutyWhatsApp({
      memberName: member.name,
      memberRole: member.role,
      date: formatDate(dutyDate),
      assignments: memberAssignments.map((a) => ({
        courtName: a.courtName,
        judgeName: a.judgeName,
        caseTitle: a.caseTitle,
        caseNumber: a.caseNumber,
        duty_type: a.duty_type,
        notes: a.notes,
        stage: a.caseStage,
      })),
      chamberHead: "Adv. Rajesh Sharma (Chamber Head)",
    });

    const phone = (member.phone || "").replace(/[^0-9]/g, "");
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const selectedMemberData = members.find((m) => m.id.toString() === selectedMemberForList);
  const selectedMemberDuties = assignments.filter(
    (a) => a.member_id?.toString() === selectedMemberForList
  );

  return (
    <ChamberAuthGuard featureName={t("teamTitle")}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 text-white p-6 rounded-2xl shadow-xs border border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Users className="w-4 h-4" />
            <span>{language === "en" ? "Chamber Operations & Delegation" : "चेंबर संचालन एवं डेलीगेशन"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("teamTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            {t("teamSub")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (members.length === 0) {
                alert(language === "en" ? "Please add a chamber member first" : "कृपया पहले एक सदस्य जोड़ें");
                return;
              }
              setDutyForm((prev) => ({
                ...prev,
                member_id: members[0].id.toString(),
                case_id: cases[0]?.id.toString() || "",
              }));
              setIsAssignDutyOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("assignDutyBtn")}</span>
          </button>

          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-medium flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>{t("addMemberBtn")}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-4 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("duties")}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "duties"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          <span>{t("tabDuties")}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800">
            {assignments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("roster")}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "roster"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          <span>{t("tabRoster")}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800">
            {members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("junior-list")}
          className={`pb-3 px-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "junior-list"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          {t("tabJuniorList")}
        </button>
      </div>

      {/* TAB 1: Live Courtroom Duty & Pass-Over Board */}
      {activeTab === "duties" && (
        <div className="space-y-4">
          {/* Date Selector Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Date:</span>
              <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setDutyDate(getTodayDateString())}
                  className={`px-3 py-1 rounded-lg font-medium ${
                    dutyDate === getTodayDateString()
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDutyDate(getTomorrowDateString())}
                  className={`px-3 py-1 rounded-lg font-medium ${
                    dutyDate === getTomorrowDateString()
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Tomorrow
                </button>
                <input
                  type="date"
                  value={dutyDate}
                  onChange={(e) => setDutyDate(e.target.value)}
                  className="px-2 py-0.5 bg-transparent border-l border-slate-300 dark:border-slate-700 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Showing <b>{assignments.length}</b> courtroom duty assignments for {formatDate(dutyDate)}
            </div>
          </div>

          {/* Assignments Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading duty assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No courtroom duties delegated for this date
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "Assign Court Duty" above to delegate a pass-over or evidence matter to a junior advocate.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((a) => {
                let statusColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                if (a.status === "Pass-Over Granted") statusColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";
                if (a.status === "Completed") statusColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
                if (a.status === "Date Taken") statusColor = "bg-purple-500/10 text-purple-600 border-purple-500/20";

                return (
                  <div
                    key={a.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {a.duty_type}
                      </span>
                      <div className="flex items-center space-x-2">
                        <select
                          value={a.status}
                          onChange={(e) => handleUpdateStatus(a.id, e.target.value)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none ${statusColor}`}
                        >
                          <option value="Pending">⏳ Pending</option>
                          <option value="Attended">🏃 Attended / In Court</option>
                          <option value="Pass-Over Granted">⏸️ Pass-Over Granted</option>
                          <option value="Date Taken">📅 Date Taken</option>
                          <option value="Completed">✅ Completed</option>
                        </select>
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Case and Court Context */}
                    <div>
                      <Link
                        href={`/cases/${a.case_id}`}
                        className="font-bold text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1"
                      >
                        <span>{a.caseTitle}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {a.courtName || "Court unassigned"} {a.judgeName && `• ${a.judgeName}`}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {a.caseNumber ? `Case No: ${a.caseNumber}` : "No Number"} • Stage: <span className="font-semibold text-slate-700 dark:text-slate-300">{a.caseStage || "Hearing"}</span>
                      </p>
                    </div>

                    {/* Assigned Junior Advocate */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-extrabold flex items-center justify-center text-[10px]">
                          {a.memberName ? a.memberName.split(" ").map((n: string) => n[0]).join("").slice(0, 2) : "JA"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {a.memberName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {a.memberRole || "Counsel"}
                          </div>
                        </div>
                      </div>

                      {a.memberPhone && (
                        <div className="flex items-center space-x-1.5">
                          <a
                            href={`tel:${a.memberPhone}`}
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                            title="Call Junior"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://api.whatsapp.com/send?phone=${a.memberPhone.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(`Hello ${a.memberName}, regarding your duty today in ${a.caseTitle}: ${a.duty_type} (${a.notes || ""})`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            title="WhatsApp Junior"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Notes & Instructions */}
                    {a.notes && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 italic bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                        <b>Instructions:</b> {a.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Chamber Roster */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {members.map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                        {m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {m.name}
                        </h3>
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 block w-fit mt-0.5">
                          {m.role}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMember(m.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    {m.barCouncilNumber && (
                      <div>
                        <span className="text-slate-400 font-medium">Bar Reg:</span>{" "}
                        <span className="font-mono text-slate-700 dark:text-slate-300">{m.barCouncilNumber}</span>
                      </div>
                    )}
                    {m.assigned_courts && (
                      <div>
                        <span className="text-slate-400 font-medium">Courts:</span>{" "}
                        <span>{m.assigned_courts}</span>
                      </div>
                    )}
                    {m.phone && (
                      <div>
                        <span className="text-slate-400 font-medium">Phone:</span>{" "}
                        <span className="font-mono">{m.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Duty stats strip */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">Active Matters</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {m.activeCasesCount}
                      </span>
                    </div>
                    <div className="p-2 bg-amber-500/10 rounded-xl">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">Today's Duties</span>
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {m.todayDutiesCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  {m.phone && (
                    <button
                      onClick={() => {
                        const mDuties = assignments.filter((a) => a.member_id === m.id);
                        sendJuniorWhatsApp(m, mDuties);
                      }}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Roster</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Junior Cause List & WhatsApp Dispatch */}
      {activeTab === "junior-list" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-500">Select Junior:</span>
              <select
                value={selectedMemberForList}
                onChange={(e) => setSelectedMemberForList(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id.toString()}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {selectedMemberData && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => sendJuniorWhatsApp(selectedMemberData, selectedMemberDuties)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Duty Sheet</span>
                </button>
              </div>
            )}
          </div>

          {selectedMemberDuties.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No courtroom matters assigned to {selectedMemberData?.name} on {formatDate(dutyDate)}.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {selectedMemberData &&
                  generateJuniorDutyWhatsApp({
                    memberName: selectedMemberData.name,
                    memberRole: selectedMemberData.role,
                    date: formatDate(dutyDate),
                    assignments: selectedMemberDuties.map((a) => ({
                      courtName: a.courtName,
                      judgeName: a.judgeName,
                      caseTitle: a.caseTitle,
                      caseNumber: a.caseNumber,
                      duty_type: a.duty_type,
                      notes: a.notes,
                      stage: a.caseStage,
                    })),
                    chamberHead: "Adv. Rajesh Sharma (Chamber Head)",
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Add Chamber Member */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Add Chamber Member</span>
              </h3>
              <button onClick={() => setIsAddMemberOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="e.g. Adv. Ananya Deshmukh"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chamber Role
                </label>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Junior Advocate">Junior Advocate</option>
                  <option value="Senior Associate">Senior Associate</option>
                  <option value="Court Clerk / Munshi">Court Clerk / Munshi</option>
                  <option value="Intern / Trainee">Intern / Trainee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bar Council Enrollment No.
                </label>
                <input
                  type="text"
                  value={memberForm.barCouncilNumber}
                  onChange={(e) => setMemberForm({ ...memberForm, barCouncilNumber: e.target.value })}
                  placeholder="e.g. D/5412/2021"
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone (for WhatsApp duty dispatch)
                </label>
                <input
                  type="text"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  placeholder="e.g. +91 98111 22334"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Courts Handled
                </label>
                <input
                  type="text"
                  value={memberForm.assigned_courts}
                  onChange={(e) => setMemberForm({ ...memberForm, assigned_courts: e.target.value })}
                  placeholder="e.g. Tis Hazari, Patiala House, Saket"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Court Duty */}
      {isAssignDutyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Assign Courtroom Duty</span>
              </h3>
              <button onClick={() => setIsAssignDutyOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignDuty} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Court Matter *
                </label>
                <select
                  required
                  value={dutyForm.case_id}
                  onChange={(e) => setDutyForm({ ...dutyForm, case_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id.toString()}>
                      {c.CaseTitle} ({c.court_name || "Court unassigned"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign To Junior Advocate / Clerk *
                </label>
                <select
                  required
                  value={dutyForm.member_id}
                  onChange={(e) => setDutyForm({ ...dutyForm, member_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id.toString()}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duty Date
                  </label>
                  <input
                    type="date"
                    value={dutyForm.duty_date}
                    onChange={(e) => setDutyForm({ ...dutyForm, duty_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Task / Duty Type
                  </label>
                  <select
                    value={dutyForm.duty_type}
                    onChange={(e) => setDutyForm({ ...dutyForm, duty_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Pass-Over Request">Pass-Over Request</option>
                    <option value="Argue Bail / Application">Argue Bail / Application</option>
                    <option value="Evidence / Cross">Evidence / Cross</option>
                    <option value="Take Next Date">Take Next Date / Adjournment</option>
                    <option value="Process Fee / Inspection">Process Fee / Inspection</option>
                    <option value="Collect Certified Order">Collect Certified Order</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Specific Instructions / Notes
                </label>
                <textarea
                  rows={2}
                  value={dutyForm.notes}
                  onChange={(e) => setDutyForm({ ...dutyForm, notes: e.target.value })}
                  placeholder="e.g. Seek pass-over till 11:30 AM before ASJ-02; Senior is arguing in High Court."
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAssignDutyOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
                >
                  Delegate Duty
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
