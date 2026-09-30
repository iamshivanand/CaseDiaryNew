import React, { useState, useEffect } from "react";
import { X, Calendar, Send, CheckCircle2, MessageSquare, IndianRupee, AlertCircle } from "lucide-react";
import { generateWhatsAppHearingUpdate } from "@/lib/whatsapp";
import { getTodayDateString } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface HearingUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: {
    id: number;
    CaseTitle?: string | null;
    ClientName?: string | null;
    case_number?: string | null;
    CNRNumber?: string | null;
    court_name?: string | null;
    JudgeName?: string | null;
    NextDate?: string | null;
    case_stage?: string | null;
    ClientContactNumber?: string | null;
  };
  onSuccess?: () => void;
}

export function HearingUpdateModal({ isOpen, onClose, caseItem, onSuccess }: HearingUpdateModalProps) {
  const { t, language } = useLanguage();
  const [hearingDate, setHearingDate] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [isReserved, setIsReserved] = useState(false);
  const [stage, setStage] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (caseItem) {
      setHearingDate(caseItem.NextDate || getTodayDateString());
      setStage(caseItem.case_stage || "Hearing");
      setNotes("");
      setNextDate("");
      setIsReserved(false);
      setAmount("");
      setStatusMessage(null);
    }
  }, [caseItem]);

  if (!isOpen || !caseItem) return null;

  const previewMessage = generateWhatsAppHearingUpdate({
    clientName: caseItem.ClientName,
    caseTitle: caseItem.CaseTitle,
    caseNumber: caseItem.case_number,
    cnrNumber: caseItem.CNRNumber,
    courtName: caseItem.court_name,
    judgeName: caseItem.JudgeName,
    nextDate: isReserved
      ? (language === "en" ? "Order / Judgment Reserved" : "निर्णय / आदेश हेतु सुरक्षित")
      : nextDate || (language === "en" ? "[Next Date]" : "[अगली तारीख]"),
    stage: stage || (language === "en" ? "[Purpose/Stage]" : "[प्रयोजन/चरण]"),
    notes: notes || (language === "en" ? "[Court notes]" : "[अदालती आदेश]"),
    advocateName: language === "en" ? "Adv. Rajesh Sharma" : "अधिवक्ता राजेश शर्मा",
    phone: caseItem.ClientContactNumber,
  });

  const handleSubmit = async (openWhatsApp: boolean) => {
    if (!isReserved && !nextDate) {
      alert(
        language === "en"
          ? "Please select a Next Hearing Date or check 'Order Reserved / Undated'"
          : "कृपया अगली सुनवाई की तिथि चुनें अथवा 'निर्णय सुरक्षित' चेक करें"
      );
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/cases/${caseItem.id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hearingDate,
          nextDate: isReserved ? null : nextDate,
          stage: isReserved ? (language === "en" ? "Judgment / Order Reserved" : "निर्णय हेतु सुरक्षित") : stage,
          notes,
          amount: amount ? Number(amount) : 0,
          payment_mode: paymentMode,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to record hearing");
      }

      if (openWhatsApp) {
        const phone = (caseItem.ClientContactNumber || "").replace(/[^0-9]/g, "");
        const waUrl = phone
          ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(previewMessage)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(previewMessage)}`;
        window.open(waUrl, "_blank");
      }

      setStatusMessage(
        language === "en"
          ? "Hearing update successfully recorded in diary!"
          : "सुनवाई का परिणाम डायरी में सफलतापूर्वक दर्ज कर लिया गया!"
      );
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      alert(err.message || "Failed to update hearing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
          <div>
            <h3 className="font-bold text-lg text-zinc-950 dark:text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>{language === "en" ? "Record Hearing Outcome" : "सुनवाई का परिणाम दर्ज करें"}</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium truncate max-w-md">
              {caseItem.CaseTitle} ({caseItem.case_number || (language === "en" ? "No Case No." : "वाद सं. अनिर्धारित")})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {statusMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hearing Date Taken Up */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "en" ? "Date Heard Today" : "आज की सुनवाई तिथि"}
              </label>
              <input
                type="date"
                value={hearingDate}
                onChange={(e) => setHearingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Next Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {language === "en" ? "Next Hearing Date" : "अगली सुनवाई तिथि"}
                </label>
                <label className="flex items-center space-x-1.5 text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isReserved}
                    onChange={(e) => setIsReserved(e.target.checked)}
                    className="rounded border-zinc-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>{language === "en" ? "Order Reserved" : "निर्णय सुरक्षित"}</span>
                </label>
              </div>
              <input
                type="date"
                disabled={isReserved}
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Procedural Stage */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              {language === "en" ? "Purpose / Stage for Next Date" : "अगली तिथि हेतु प्रयोजन / चरण"}
            </label>
            <input
              type="text"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              placeholder={
                language === "en"
                  ? "e.g. Cross-Examination of PW-1, Arguments on Stay, Notice"
                  : "उदा. गवाह जिरह (Cross-Examination), स्थगन पर बहस, नोटिस तामील"
              }
              className="w-full px-3 py-2 rounded-xl text-sm border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Hearing Proceedings / Court Order Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              {language === "en" ? "Court Orders / What Happened in Court" : "अदालती आदेश / आज अदालत में क्या हुआ"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                language === "en"
                  ? "e.g. Judge directed respondent to file counter affidavit within 2 weeks. Interim stay extended."
                  : "उदा. न्यायाधीश ने विपक्षी को २ सप्ताह में जवाब दाखिल करने का निर्देश दिया। अंतरिम स्थगन बढ़ाया गया।"
              }
              className="w-full px-3 py-2 rounded-xl text-sm border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Fee / Peshi Collection */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 rounded-xl">
            <div className="flex items-center space-x-2 mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {language === "en"
                  ? "Court Appearance Fee Collected Today (Optional)"
                  : "आज प्राप्त पेशी / वकालत फीस (वैकल्पिक)"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={language === "en" ? "Amount (e.g. 5000)" : "राशि (उदा. 5000)"}
                className="w-full px-3 py-1.5 rounded-lg text-sm border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-sm border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              >
                <option value="Cash">{language === "en" ? "Cash" : "नकद (Cash)"}</option>
                <option value="UPI">{language === "en" ? "UPI / GPay / PhonePe" : "यूपीआई (UPI)"}</option>
                <option value="Bank Transfer">{language === "en" ? "Bank Transfer (NEFT/RTGS)" : "बैंक ट्रांसफर"}</option>
                <option value="Cheque">{language === "en" ? "Cheque" : "चेक"}</option>
              </select>
            </div>
          </div>

          {/* Dynamic WhatsApp Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>
                  {language === "en"
                    ? "Automated WhatsApp Client Message Preview"
                    : "स्वचालित व्हाट्सएप मुवक्किल संदेश पूर्वावलोकन"}
                </span>
              </span>
              <span className="text-[11px] text-zinc-400">
                {language === "en" ? "To:" : "प्रति:"} {caseItem.ClientContactNumber || (language === "en" ? "No phone added" : "फोन नंबर दर्ज नहीं")}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {previewMessage}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-end gap-3 bg-zinc-50 dark:bg-zinc-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            {language === "en" ? "Cancel" : "रद्द करें"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50"
          >
            {submitting ? (language === "en" ? "Saving..." : "सहेज रहे हैं...") : (language === "en" ? "Save Outcome" : "परिणाम सहेजें")}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 shadow-xs disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>
              {submitting
                ? (language === "en" ? "Saving..." : "सहेज रहे हैं...")
                : (language === "en" ? "Save & Send WhatsApp" : "सहेजें व व्हाट्सएप भेजें")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
