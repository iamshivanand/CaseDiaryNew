"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Printer,
  Calendar,
  ChevronLeft,
  Share2,
  FileDown,
  Scale,
  Building,
  User,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatDate, getTodayDateString, getTomorrowDateString } from "@/lib/utils";
import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";
import { useLanguage } from "@/context/LanguageContext";

export default function CauseListPage() {
  const { t, language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printTimestamp, setPrintTimestamp] = useState("");

  useEffect(() => {
    setPrintTimestamp(new Date().toLocaleString(language === "en" ? "en-IN" : "hi-IN"));
  }, [language]);

  const fetchCauseList = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cause-list?date=${date}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Error loading cause list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCauseList(selectedDate);
  }, [selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  const lawyer = data?.lawyer;
  const cases = data?.cases || [];

  return (
    <ChamberAuthGuard featureName={language === "en" ? "Daily Court Cause List" : "दैनिक कोर्ट कॉज लिस्ट"}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Top Toolbar (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
              <Printer className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>{language === "en" ? "Daily Court Cause List Studio" : "दैनिक कोर्ट कॉज लिस्ट स्टूडियो"}</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {language === "en"
                ? "Generate formatted cause list on chamber letterhead for juniors, clerks & peons."
                : "कनिष्ठ वकीलों, लिपिकों एवं मुंशियों हेतु चेंबर लेटरहेड पर औपचारिक कॉज लिस्ट तैयार करें।"}
            </p>
          </div>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs">
            <button
              onClick={() => setSelectedDate(getTodayDateString())}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedDate === getTodayDateString()
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {language === "en" ? "Today" : "आज"}
            </button>
            <button
              onClick={() => setSelectedDate(getTomorrowDateString())}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedDate === getTomorrowDateString()
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {language === "en" ? "Tomorrow" : "कल"}
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 bg-transparent text-zinc-800 dark:text-zinc-200 border-l border-zinc-300 dark:border-zinc-700 text-xs focus:outline-hidden"
            />
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold flex items-center space-x-2 shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{language === "en" ? "Print / Save as PDF" : "प्रिंट / पीडीएफ सेव करें"}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Letterhead Paper Preview) */}
      <div className="bg-white text-zinc-950 p-8 sm:p-12 rounded-2xl shadow-xl border border-zinc-200 print:border-0 print:shadow-none print:p-0 print:m-0 min-h-[800px] flex flex-col justify-between">
        <div>
          {/* Chamber Letterhead Header */}
          <div className="border-b-2 border-zinc-900 pb-4 mb-6 text-center">
            <div className="flex items-center justify-center space-x-3 mb-1">
              <img src="/logo.png" alt="Advocase Seal" className="w-8 h-8 rounded-lg object-contain" />
              <h2 className="text-xl font-extrabold uppercase tracking-wide text-zinc-950">
                {lawyer?.name || (language === "en" ? "ADV. RAJESH SHARMA" : "अधिवक्ता राजेश शर्मा")}
              </h2>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">
              {language === "en"
                ? "ADVOCATE & LEGAL CONSULTANTS • HIGH COURT & DISTRICT COURTS"
                : "अधिवक्ता एवं विधिक सलाहकार • उच्च न्यायालय एवं जिला न्यायालय"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {language === "en" ? "Bar Council Enrollment No:" : "बार काउंसिल नामांकन संख्या:"} <b>{lawyer?.barCouncilNumber || "D/1248/2012"}</b> • {language === "en" ? "Chamber:" : "चेंबर:"} {lawyer?.chamberAddress || "Chamber 412, Tis Hazari Courts, Delhi"}
            </p>
            <div className="mt-3 py-1.5 px-4 bg-zinc-100 inline-block rounded-md border border-zinc-300">
              <span className="text-xs font-extrabold tracking-wider uppercase text-zinc-800">
                {language === "en" ? `DAILY CAUSE LIST FOR: ${formatDate(selectedDate)}` : `दैनिक कॉज लिस्ट तिथि: ${formatDate(selectedDate)}`}
              </span>
            </div>
          </div>

          {/* Cause List Table */}
          {loading ? (
            <div className="py-20 text-center text-zinc-500 text-sm">
              {language === "en" ? "Compiling daily cause list..." : "दैनिक कॉज लिस्ट तैयार की जा रही है..."}
            </div>
          ) : cases.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="text-base font-bold text-zinc-700">
                {language === "en" ? `No matters listed for ${formatDate(selectedDate)}` : `${formatDate(selectedDate)} को कोई मुकदमा सूचीबद्ध नहीं है`}
              </p>
              <p className="text-xs text-zinc-500">
                {language === "en"
                  ? "Enjoy court-free time or prepare upcoming cases in advance."
                  : "अदालत से मुक्त समय का उपयोग करें अथवा आगामी मुकदमों की अग्रिम तैयारी करें।"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-zinc-800 bg-zinc-100 text-zinc-900 font-bold uppercase text-[11px]">
                    <th className="py-2 px-3 w-12 text-center">{language === "en" ? "Item" : "क्रम"}</th>
                    <th className="py-2 px-3 w-44">{language === "en" ? "Courtroom & Judge" : "न्यायालय कक्ष व न्यायाधीश"}</th>
                    <th className="py-2 px-3 w-36">{language === "en" ? "Case Details" : "मुकदमा विवरण"}</th>
                    <th className="py-2 px-3">{language === "en" ? "Parties & Representation" : "पक्षकार व प्रतिनिधित्व"}</th>
                    <th className="py-2 px-3 w-32">{language === "en" ? "Purpose / Stage" : "प्रयोजन / चरण"}</th>
                    <th className="py-2 px-3 w-36">{language === "en" ? "Attending Counsel" : "उपस्थित वकील"}</th>
                    <th className="py-2 px-3 w-28">{language === "en" ? "Opp. Counsel" : "विपक्षी वकील"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-300">
                  {cases.map((c: any, idx: number) => (
                    <tr key={c.id} className="align-top hover:bg-zinc-50">
                      <td className="py-2.5 px-3 text-center font-bold text-zinc-800">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-zinc-900">{c.court_name || (language === "en" ? "Court unassigned" : "अदालत अनिर्धारित")}</div>
                        {c.JudgeName && (
                          <div className="text-[10px] text-zinc-600 font-medium">
                            {c.JudgeName}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-zinc-900">{c.case_number || "No Case No."}</div>
                        <div className="text-[10px] text-zinc-600">{c.case_type_name || "General"}</div>
                        {c.CNRNumber && (
                          <div className="text-[9px] font-mono text-zinc-500">CNR: {c.CNRNumber}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-zinc-900">{c.CaseTitle}</div>
                        <div className="text-[10px] text-zinc-600">
                          {language === "en" ? "For:" : "पक्ष:"} <span className="font-semibold text-zinc-800">{c.ClientName || (language === "en" ? "Client" : "मुवक्किल")}</span> ({c.OnBehalfOf || (language === "en" ? "Petitioner" : "याचिकाकर्ता")})
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-zinc-900 block">{c.case_stage || (language === "en" ? "Hearing" : "सुनवाई")}</span>
                        {c.Priority === "High" && (
                          <span className="text-[9px] uppercase font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {language === "en" ? "Urgent / High" : "अति-आवश्यक"}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {c.duty?.member ? (
                          <div>
                            <div className="font-bold text-zinc-900">{c.duty.member.name}</div>
                            <div className="text-[10px] text-amber-700 font-semibold">{c.duty.duty_type}</div>
                            {c.duty.status && c.duty.status !== "Pending" && (
                              <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                {c.duty.status}
                              </span>
                            )}
                          </div>
                        ) : c.assignedMember ? (
                          <div>
                            <div className="font-bold text-zinc-900">{c.assignedMember.name}</div>
                            <div className="text-[10px] text-zinc-500">{c.assignedMember.role}</div>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">{language === "en" ? "Self / Lead" : "स्वयं / मुख्य"}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-700">
                        {c.OpposingCounsel ? `${language === "en" ? "Adv." : "अधिवक्ता"} ${c.OpposingCounsel}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Letterhead Footer */}
        <div className="border-t border-zinc-400 pt-3 mt-8 text-center text-[10px] text-zinc-500 flex items-center justify-between">
          <span>{language === "en" ? "Generated by Advocase Digital Court Munshi" : "एडवोकेस डिजिटल कोर्ट मुंशी द्वारा निर्मित"}</span>
          <span suppressHydrationWarning>{printTimestamp ? `${language === "en" ? "Printed on" : "मुद्रण तिथि"} ${printTimestamp}` : (language === "en" ? "Official Chamber Record" : "आधिकारिक चेंबर अभिलेख")}</span>
          <span>{language === "en" ? "Chamber Office Copy" : "चेंबर कार्यालय प्रति"}</span>
        </div>
      </div>
    </div>
    </ChamberAuthGuard>
  );
}
