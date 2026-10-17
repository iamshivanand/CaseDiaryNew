"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Save,
  Scale,
  Briefcase,
  Users,
  Shield,
  Calendar,
  IndianRupee,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { getTodayDateString } from "@/lib/utils";
import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { apiFetch } from "@/lib/apiClient";
import { useDraftStore } from "@/store/useDraftStore";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { RotateCcw, ShieldCheck } from "lucide-react";

const INITIAL_FORM = {
  CaseTitle: "",
  ClientName: "",
  OnBehalfOf: "Petitioner",
  CNRNumber: "",
  case_number: "",
  case_year: new Date().getFullYear().toString(),
  court_name: "",
  case_type_name: "Criminal Bail Application",
  JudgeName: "",
  dateFiled: getTodayDateString(),
  NextDate: "",
  StatuteOfLimitations: "",
  crime_number: "",
  crime_year: new Date().getFullYear().toString(),
  Undersection: "",
  FirstParty: "",
  OppositeParty: "",
  Accussed: "",
  ClientContactNumber: "",
  OpposingCounsel: "",
  OppositeAdvocate: "",
  OppAdvocateContactNumber: "",
  CaseStatus: "Open",
  Priority: "Medium",
  case_stage: "Filing / Initial Scrutiny",
  total_fee: "",
  fee_paid: "",
  date_fee: "",
  CaseDescription: "",
  CaseNotes: "",
};

export default function AddNewCasePage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [lookups, setLookups] = useState<any>({ courts: [], caseTypes: [], districts: [], policeStations: [], stages: [] });

  const draftStore = useDraftStore();
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  // Hardware-Level Refresh Lock (Intercepts accidental F5, Ctrl+R, back-swipe, tab close)
  useUnsavedChangesWarning(
    isDirty,
    language === "en"
      ? "You have unsaved case filing data. Refreshing or leaving will lose your changes. Do you want to stay on page?"
      : "आपके पास बिना सहेजा गया केस डेटा है। पेज रीलोड करने पर डेटा मिट जाएगा। क्या आप इसी पेज पर रहना चाहते हैं?"
  );

  // Restore saved draft on mount if available
  useEffect(() => {
    const saved = draftStore.getDraft("new_case_form_draft");
    if (saved?.formData && Object.keys(saved.formData).length > 0) {
      setForm((prev) => ({
        ...prev,
        ...saved.formData,
      }));
      setIsDirty(true);
    }
  }, []);

  useEffect(() => {
    fetch("/api/lookups")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLookups(data);
          setForm((prev) => ({
            ...prev,
            court_name: prev.court_name || (data.courts.length > 0 ? data.courts[0].name : ""),
            case_type_name: prev.case_type_name || (data.caseTypes.length > 0 ? data.caseTypes[0].name : "Criminal Bail Application"),
          }));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      draftStore.saveDraft("new_case_form_draft", { formData: updated });
      return updated;
    });
    setIsDirty(true);
  };

  const handleDiscardDraft = () => {
    if (window.confirm(language === "en" ? "Discard this unsaved draft and reset form?" : "क्या आप यह ड्राफ्ट हटाकर फॉर्म रीसेट करना चाहते हैं?")) {
      draftStore.removeDraft("new_case_form_draft");
      setForm(INITIAL_FORM);
      setIsDirty(false);
      toast.info(language === "en" ? "Draft Discarded" : "ड्राफ्ट हटा दिया गया", language === "en" ? "Form has been reset." : "फॉर्म रीसेट हो गया है।");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.CaseTitle.trim()) {
      toast.error(
        language === "en" ? "Case Title Required" : "मामले का शीर्षक आवश्यक है",
        language === "en" ? "Please enter the title or parties involved." : "कृपया मामले का शीर्षक या पक्षों के नाम दर्ज करें।"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create case");
      }

      // Success: Clear auto-saved draft & disengage refresh lock
      draftStore.removeDraft("new_case_form_draft");
      setIsDirty(false);

      toast.success(
        language === "en" ? "Case Added to Diary" : "मामला डायरी में दर्ज किया गया",
        `"${form.CaseTitle}" ${language === "en" ? "registered successfully in chamber." : "सफलतापूर्वक दर्ज किया गया।"}`
      );
      router.push(`/cases/${data.case.id}`);
    } catch (err: any) {
      toast.error(
        language === "en" ? "Failed to Create Case" : "मामला दर्ज करने में विफल",
        err.message || "An unexpected error occurred."
      );
      setSubmitting(false);
    }
  };

  return (
    <ChamberAuthGuard featureName={t("addNewCase")}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/cases"
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {t("addNewCase")}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {language === "en" ? "Register matter into your chamber's online court diary." : "अपने चेंबर की ऑनलाइन कोर्ट डायरी में नया मुकदमा दर्ज करें।"}
            </p>
          </div>
        </div>

        {isDirty && (
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Reset Draft" : "ड्राफ्ट रीसेट"}</span>
          </button>
        )}
      </div>

      {/* Hardware-level Refresh Lock & Auto-Save Banner */}
      {isDirty && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {language === "en"
                ? "Hardware Refresh Lock Active — Draft auto-saved in local chamber cache."
                : "हार्डवेयर रिफ्रेश लॉक सक्रिय — ड्राफ्ट स्थानीय चेंबर कैश में सुरक्षित है।"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400/80">
            {language === "en" ? "Protected against F5 & tab close" : "F5 व टैब बंद होने से सुरक्षित"}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Core Case Metadata */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <Scale className="w-4 h-4 text-amber-500" />
            <span>{language === "en" ? "Core Case Identification" : "केस की मुख्य पहचान"}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldCaseTitle")} *
              </label>
              <input
                type="text"
                name="CaseTitle"
                required
                value={form.CaseTitle}
                onChange={handleChange}
                placeholder={language === "en" ? "e.g. State vs. Vikram Malhotra & Ors. or ABC Ltd vs. XYZ Corp" : "उदा. स्टेट बनाम विक्रम मल्होत्रा आदि या एबीसी प्रा. लि. बनाम एक्सवाईजेड"}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldCnrNumber")} ({language === "en" ? "16-Digit eCourts ID" : "१६ अंकों का ई-कोर्ट्स कोड"})
              </label>
              <input
                type="text"
                name="CNRNumber"
                maxLength={16}
                value={form.CNRNumber}
                onChange={handleChange}
                placeholder="e.g. DLCT010045232025"
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("fieldCaseNumber")}
                </label>
                <input
                  type="text"
                  name="case_number"
                  value={form.case_number}
                  onChange={handleChange}
                  placeholder="e.g. SC No. 412"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === "en" ? "Filing Year" : "दाखिल वर्ष"}
                </label>
                <input
                  type="number"
                  name="case_year"
                  value={form.case_year}
                  onChange={handleChange}
                  placeholder="2026"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldCourt")}
              </label>
              <input
                list="courts-list"
                name="court_name"
                value={form.court_name}
                onChange={handleChange}
                placeholder={language === "en" ? "Select or enter court name" : "अदालत का नाम चुनें या लिखें"}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
              <datalist id="courts-list">
                {lookups.courts?.map((c: any) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldCaseType")}
              </label>
              <select
                name="case_type_name"
                value={form.case_type_name}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              >
                {lookups.caseTypes?.map((k: any) => (
                  <option key={k.id} value={k.name}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldJudgeName")}
              </label>
              <input
                type="text"
                name="JudgeName"
                value={form.JudgeName}
                onChange={handleChange}
                placeholder={language === "en" ? "e.g. Sh. Ajay Kumar, ASJ-02" : "उदा. श्री अजय कुमार, एएसजे-०२"}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "en" ? "Initial Procedural Stage" : "प्रारंभिक सुनवाई चरण"}
              </label>
              <input
                list="stages-list"
                name="case_stage"
                value={form.case_stage}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
              <datalist id="stages-list">
                {lookups.stages?.map((s: string) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Section 2: Parties & Representation */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <Users className="w-4 h-4 text-blue-500" />
            <span>{language === "en" ? "Parties & Representation" : "पक्षकार एवं कानूनी प्रतिनिधित्व"}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldClientName")}
              </label>
              <input
                type="text"
                name="ClientName"
                value={form.ClientName}
                onChange={handleChange}
                placeholder={language === "en" ? "e.g. Vikram Malhotra" : "उदा. विक्रम मल्होत्रा"}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldClientContact")} ({language === "en" ? "for WhatsApp updates" : "व्हाट्सएप सूचना हेतु"})
              </label>
              <input
                type="text"
                name="ClientContactNumber"
                value={form.ClientContactNumber}
                onChange={handleChange}
                placeholder="e.g. +91 98100 12345"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "en" ? "On Behalf Of" : "की ओर से (प्रतिनिधित्व)"}
              </label>
              <select
                name="OnBehalfOf"
                value={form.OnBehalfOf}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              >
                <option value="Petitioner">{language === "en" ? "Petitioner" : "याचिकाकर्ता (Petitioner)"}</option>
                <option value="Respondent">{language === "en" ? "Respondent" : "प्रत्यर्थी (Respondent)"}</option>
                <option value="Applicant">{language === "en" ? "Applicant / Accused" : "आवेदक / अभियुक्त (Applicant)"}</option>
                <option value="Complainant">{language === "en" ? "Complainant / Plaintiff" : "शिकायतकर्ता / वादी (Plaintiff)"}</option>
                <option value="Appellant">{language === "en" ? "Appellant" : "अपीलार्थी (Appellant)"}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "en" ? "Opposing Party Name" : "विपक्षी पक्षकार का नाम"}
              </label>
              <input
                type="text"
                name="OppositeParty"
                value={form.OppositeParty}
                onChange={handleChange}
                placeholder={language === "en" ? "e.g. State of NCT of Delhi / M/s ABC Corp" : "उदा. राज्य सरकार / मेसर्स एबीसी कॉर्प"}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldOpposingCounsel")}
              </label>
              <input
                type="text"
                name="OpposingCounsel"
                value={form.OpposingCounsel}
                onChange={handleChange}
                placeholder={language === "en" ? "e.g. Adv. K.R. Swaminathan / Addl. PP" : "उदा. अधि. के.आर. स्वामीनाथन / एपीपी"}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldOppAdvocateContact")}
              </label>
              <input
                type="text"
                name="OppAdvocateContactNumber"
                value={form.OppAdvocateContactNumber}
                onChange={handleChange}
                placeholder="e.g. +91 98200 88776"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
          </div>
        </div>

        {/* Section 3: FIR / Police & Criminal Details */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <Shield className="w-4 h-4 text-rose-500" />
            <span>{language === "en" ? "FIR & Criminal Sections (If applicable)" : "प्राथमिकी एवं आपराधिक धाराएं (यदि लागू हो)"}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldCrimeNumber")}
              </label>
              <input
                type="text"
                name="crime_number"
                value={form.crime_number}
                onChange={handleChange}
                placeholder="e.g. FIR 182/2025"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldPoliceStation")}
              </label>
              <input
                type="text"
                name="police_station_name"
                placeholder={language === "en" ? "e.g. PS Karol Bagh" : "उदा. थाना करोल बाग"}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldUnderSection")} (IPC / BNS)
              </label>
              <input
                type="text"
                name="Undersection"
                value={form.Undersection}
                onChange={handleChange}
                placeholder="e.g. Sec 420, 468 IPC / Sec 318 BNS"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Hearing Dates & Status */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>{language === "en" ? "Court Calendar & Status" : "अदालती कैलेंडर एवं स्थिति"}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldHearingDate")}
              </label>
              <input
                type="date"
                name="NextDate"
                value={form.NextDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldCaseStatus")}
              </label>
              <select
                name="CaseStatus"
                value={form.CaseStatus}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              >
                <option value="Open">{t("statusOpen")}</option>
                <option value="In Progress">{t("statusInProgress")}</option>
                <option value="Reserved">{t("statusReserved")}</option>
                <option value="Disposed">{t("statusDisposed")}</option>
                <option value="Appealed">{t("statusAppealed")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldPriorityLevel")}
              </label>
              <select
                name="Priority"
                value={form.Priority}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              >
                <option value="High">{t("priorityHigh")}</option>
                <option value="Medium">{t("priorityMedium")}</option>
                <option value="Low">{t("priorityLow")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Financials & Notes */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <IndianRupee className="w-4 h-4 text-emerald-500" />
            <span>{language === "en" ? "Advocate Fee & Case Notes" : "अधिवक्ता फीस व केस टिप्पणियां"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldTotalFee")} (₹)
              </label>
              <input
                type="number"
                name="total_fee"
                value={form.total_fee}
                onChange={handleChange}
                placeholder="e.g. 75000"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "en" ? "Advance Fee Collected (₹)" : "अग्रिम प्राप्त फीस (₹)"}
              </label>
              <input
                type="number"
                name="fee_paid"
                value={form.fee_paid}
                onChange={handleChange}
                placeholder="e.g. 25000"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("fieldCaseNotes")}
              </label>
              <textarea
                rows={3}
                name="CaseNotes"
                value={form.CaseNotes}
                onChange={handleChange}
                placeholder={language === "en" ? "Key arguments, precedents to cite, witness points..." : "मुख्य तर्क, नज़ीरें, गवाह बिंदु..."}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Link
            href="/cases"
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t("btnCancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold flex items-center space-x-2 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{submitting ? (language === "en" ? "Saving Matter..." : "दर्ज किया जा रहा है...") : (language === "en" ? "Save Case Dossier" : "केस दर्ज करें")}</span>
          </button>
        </div>
      </form>
    </div>
    </ChamberAuthGuard>
  );
}
