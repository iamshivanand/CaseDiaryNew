"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Scale,
  Sparkles,
  Info,
  ChevronRight,
  ArrowRight,
  Printer,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface LimitationOption {
  label: string;
  labelHi: string;
  category: "Civil" | "Criminal" | "Appellate" | "Commercial";
  durationDays: number;
  statutoryArticle: string;
  description: string;
  descriptionHi: string;
}

const LIMITATION_OPTIONS: LimitationOption[] = [
  {
    label: "Suit for Money Recovery (Breach of Contract)",
    labelHi: "धन वसूली का वाद (अनुबंध का उल्लंघन)",
    category: "Civil",
    durationDays: 3 * 365,
    statutoryArticle: "Article 55, Limitation Act 1963",
    description: "Three years from when the contract is broken or where there are successive breaches.",
    descriptionHi: "अनुबंध भंग होने अथवा जहां लगातार उल्लंघन हो, वहां से ३ वर्ष की अवधि।",
  },
  {
    label: "Suit for Specific Performance of Contract",
    labelHi: "अनुबंध के विनिर्दिष्ट पालन हेतु वाद",
    category: "Civil",
    durationDays: 3 * 365,
    statutoryArticle: "Article 54, Limitation Act 1963",
    description: "Three years from the date fixed for the performance, or when plaintiff has notice that performance is refused.",
    descriptionHi: "पालन हेतु नियत तिथि से, अथवा जब वादी को सूचना मिले कि पालन से इंकार कर दिया गया है, ३ वर्ष।",
  },
  {
    label: "Suit for Injunction / Declaration",
    labelHi: "स्थगन आदेश / घोषणात्मक वाद (Injunction)",
    category: "Civil",
    durationDays: 3 * 365,
    statutoryArticle: "Article 58, Limitation Act 1963",
    description: "Three years when the right to sue first accrues.",
    descriptionHi: "वाद चलाने का अधिकार पहली बार उत्पन्न होने की तिथि से ३ वर्ष।",
  },
  {
    label: "First Appeal to High Court against Trial Decree",
    labelHi: "ट्रायल कोर्ट डिक्री के विरुद्ध उच्च न्यायालय में प्रथम अपील",
    category: "Appellate",
    durationDays: 90,
    statutoryArticle: "Article 116(a), Limitation Act 1963",
    description: "Ninety days from the date of the decree or order appealed against.",
    descriptionHi: "डिक्री या आदेश की तिथि से ९० दिन।",
  },
  {
    label: "Appeal to District Court against Subordinate Judge",
    labelHi: "अधीनस्थ न्यायाधीश के विरुद्ध जिला न्यायालय में अपील",
    category: "Appellate",
    durationDays: 30,
    statutoryArticle: "Article 116(b), Limitation Act 1963",
    description: "Thirty days from the date of the decree or order.",
    descriptionHi: "डिक्री या आदेश की तिथि से ३० दिन।",
  },
  {
    label: "Criminal Revision Petition to High Court (CrPC / BNSS)",
    labelHi: "उच्च न्यायालय में आपराधिक निगरानी / रिवीजन (CrPC / BNSS)",
    category: "Criminal",
    durationDays: 90,
    statutoryArticle: "Section 397 CrPC / Sec 438 BNSS",
    description: "Ninety days from the date of the impugned order of the Magistrate or Sessions Court.",
    descriptionHi: "मजिस्ट्रेट या सत्र न्यायालय के आक्षेपित आदेश से ९० दिन।",
  },
  {
    label: "Criminal Complaint under Section 138 NI Act",
    labelHi: "एनआई एक्ट धारा १३८ के तहत आपराधिक परिवाद (चेक बाउंस)",
    category: "Commercial",
    durationDays: 30,
    statutoryArticle: "Section 142(1)(b), NI Act 1881",
    description: "One month (30 days) from the date on which the cause of action arises under clause (c) of section 138.",
    descriptionHi: "धारा १३८ खंड (ग) के तहत वाद कारण उत्पन्न होने से १ माह (३० दिन)।",
  },
  {
    label: "Execution of Civil Decree for Possession / Money",
    labelHi: "कब्जा या धन वसूली हेतु सिविल डिक्री का निष्पादन (Execution)",
    category: "Civil",
    durationDays: 12 * 365,
    statutoryArticle: "Article 136, Limitation Act 1963",
    description: "Twelve years when the decree or order becomes enforceable.",
    descriptionHi: "डिक्री अथवा आदेश के प्रवर्तनीय होने की तिथि से १२ वर्ष।",
  },
];

export default function LegalCalculatorsPage() {
  const { t, language } = useLanguage();

  // Tab State
  const [activeTab, setActiveTab] = useState<"limitation" | "court_fees">("limitation");

  // Limitation State
  const [selectedLimitationIdx, setSelectedLimitationIdx] = useState(0);
  const [causeOfActionDate, setCauseOfActionDate] = useState("");

  // Court Fee State
  const [claimAmount, setClaimAmount] = useState<number>(500000);
  const [stateJurisdiction, setStateJurisdiction] = useState<"Delhi" | "Maharashtra" | "UP">("Delhi");
  const [suitType, setSuitType] = useState<"recovery" | "declaration" | "possession">("recovery");

  // Calculate Limitation Result
  const selectedRule = LIMITATION_OPTIONS[selectedLimitationIdx];
  let limitationResult = null;

  if (causeOfActionDate) {
    const startDate = new Date(causeOfActionDate);
    if (!isNaN(startDate.getTime())) {
      const expiryDate = new Date(startDate.getTime() + selectedRule.durationDays * 24 * 60 * 60 * 1000);
      const today = new Date();
      const diffMs = expiryDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isExpired = daysRemaining < 0;

      limitationResult = {
        expiryDateStr: expiryDate.toLocaleDateString(language === "en" ? "en-IN" : "hi-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        daysRemaining: Math.abs(daysRemaining),
        isExpired,
        isCritical: !isExpired && daysRemaining <= 15,
      };
    }
  }

  // Calculate Court Fee Result (Ad-valorem estimates)
  const calculateCourtFee = () => {
    let fee = 0;
    if (suitType === "declaration") {
      fee = stateJurisdiction === "Delhi" ? 200 : 500;
    } else {
      // Ad valorem tiered scale
      if (claimAmount <= 50000) {
        fee = claimAmount * 0.05;
      } else if (claimAmount <= 200000) {
        fee = 2500 + (claimAmount - 50000) * 0.04;
      } else if (claimAmount <= 1000000) {
        fee = 8500 + (claimAmount - 200000) * 0.03;
      } else {
        fee = 32500 + (claimAmount - 1000000) * 0.02;
      }
    }
    return Math.round(fee);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white p-6 sm:p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{language === "en" ? "Litigation Utilities • Open Access" : "मुकदमा उपकरण • निःशुल्क सुविधा"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
          {language === "en" ? "Court Fee & Limitation Period Calculator" : "कोर्ट फीस व परिसीमा अवधि कैलकुलेटर"}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          {language === "en"
            ? "Accurate procedural calculation engine for Indian trial and appellate courts. Calculate statutory limitation deadlines under the Limitation Act 1963 and estimate ad-valorem court fees."
            : "भारतीय विचारणीय एवं अपीलीय न्यायालयों हेतु सटीक वैधानिक कैलकुलेटर। परिसीमा अधिनियम १९६३ के तहत समय सीमा एवं एड-वैलोरम कोर्ट फीस का त्वरित आकलन करें।"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200/80 dark:border-zinc-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("limitation")}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === "limitation"
              ? "border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{language === "en" ? "Limitation Period Calculator (1963 Act)" : "परिसीमा अवधि कैलकुलेटर (१९६३ अधिनियम)"}</span>
        </button>
        <button
          onClick={() => setActiveTab("court_fees")}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === "court_fees"
              ? "border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>{language === "en" ? "Ad-Valorem Court Fee Estimator" : "एड-वैलोरम कोर्ट फीस का अनुमान"}</span>
        </button>
      </div>

      {/* Limitation Calculator */}
      {activeTab === "limitation" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Controls Form */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                {language === "en" ? "1. Select Nature of Suit / Proceeding" : "१. वाद / कार्यवाही की प्रकृति चुनें"}
              </label>
              <select
                value={selectedLimitationIdx}
                onChange={(e) => setSelectedLimitationIdx(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              >
                {LIMITATION_OPTIONS.map((opt, idx) => (
                  <option key={idx} value={idx}>
                    [{opt.category}] {language === "en" ? opt.label : opt.labelHi}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                {language === "en" ? "2. Date of Cause of Action / Impugned Order" : "२. वाद कारण उत्पन्न होने की तिथि / आक्षेपित आदेश की तिथि"}
              </label>
              <input
                type="date"
                value={causeOfActionDate}
                onChange={(e) => setCauseOfActionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                {language === "en"
                  ? "Enter the exact date when the cheque was returned, contract was breached, or the lower court order was pronounced."
                  : "चेक अनादरण, अनुबंध उल्लंघन या अधीनस्थ न्यायालय के आदेश की सही तिथि दर्ज करें।"}
              </p>
            </div>

            {/* Rule Detail Card */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 text-xs">
              <div className="font-semibold text-zinc-900 dark:text-white flex items-center justify-between">
                <span>{language === "en" ? selectedRule.label : selectedRule.labelHi}</span>
                <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                  {selectedRule.statutoryArticle}
                </span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                {language === "en" ? selectedRule.description : selectedRule.descriptionHi}
              </p>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              {language === "en" ? "Limitation Assessment" : "परिसीमा आकलन"}
            </h3>

            {!limitationResult ? (
              <div className="py-8 text-center text-zinc-400 text-xs space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700" />
                <p>
                  {language === "en"
                    ? "Pick a cause of action date to calculate the filing deadline."
                    : "दाखिल करने की अंतिम तिथि की गणना हेतु वाद कारण तिथि चुनें।"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {limitationResult.isExpired ? (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1 text-center">
                    <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
                    <div className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                      {language === "en" ? "Limitation Period Expired" : "परिसीमा अवधि समाप्त हो चुकी है"}
                    </div>
                    <div className="text-xs text-rose-600 dark:text-rose-400">
                      {language === "en"
                        ? `Expired ${limitationResult.daysRemaining} days ago on ${limitationResult.expiryDateStr}.`
                        : `${limitationResult.daysRemaining} दिन पहले ${limitationResult.expiryDateStr} को अवधि समाप्त हुई।`}
                    </div>
                    <p className="text-[10px] text-rose-500 mt-2">
                      {language === "en"
                        ? "*Section 5 condonation of delay application required explaining sufficient cause."
                        : "*धारा ५ के तहत विलंब क्षमा हेतु उचित कारण का आवेदन पत्र आवश्यक होगा।"}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`p-4 rounded-xl border text-center space-y-1 ${
                      limitationResult.isCritical
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                        : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    }`}
                  >
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600 dark:text-emerald-400" />
                    <div className="text-xs font-medium uppercase tracking-wider">
                      {language === "en" ? "Last Day to File:" : "दाखिल करने की अंतिम तिथि:"}
                    </div>
                    <div className="text-lg font-bold text-zinc-950 dark:text-white">
                      {limitationResult.expiryDateStr}
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {language === "en"
                        ? `${limitationResult.daysRemaining} Days Remaining`
                        : `${limitationResult.daysRemaining} दिन शेष`}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href={`/cases/new?limitation_date=${encodeURIComponent(limitationResult.expiryDateStr)}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <span>{language === "en" ? "Save into Case Diary" : "केस डायरी में सहेजें"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Court Fee Calculator */}
      {activeTab === "court_fees" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {language === "en" ? "Jurisdiction / State" : "राज्य / क्षेत्राधिकार"}
                </label>
                <select
                  value={stateJurisdiction}
                  onChange={(e: any) => setStateJurisdiction(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Delhi">
                    {language === "en" ? "Delhi (Court Fees Act 1870 as amended)" : "दिल्ली (कोर्ट फीस अधिनियम १८७०)"}
                  </option>
                  <option value="Maharashtra">
                    {language === "en" ? "Maharashtra (Bombay Court Fees Act)" : "महाराष्ट्र (बॉम्बे कोर्ट फीस अधिनियम)"}
                  </option>
                  <option value="UP">
                    {language === "en" ? "Uttar Pradesh" : "उत्तर प्रदेश"}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {language === "en" ? "Suit Category" : "वाद की श्रेणी"}
                </label>
                <select
                  value={suitType}
                  onChange={(e: any) => setSuitType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                >
                  <option value="recovery">
                    {language === "en" ? "Money Recovery / Damages (Ad-Valorem)" : "धन वसूली / क्षतिपूर्ति (मूल्यानुसार)"}
                  </option>
                  <option value="possession">
                    {language === "en" ? "Possession of Immovable Property" : "अचल संपत्ति का कब्जा प्राप्ति"}
                  </option>
                  <option value="declaration">
                    {language === "en" ? "Declaratory Suit with Injunction (Fixed Fee)" : "निषेधाज्ञा सहित घोषणात्मक वाद (नियत फीस)"}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                {language === "en" ? "Claim Valuation Amount (Rs. INR)" : "दावे की मूल्यांकन राशि (₹)"}
              </label>
              <input
                type="number"
                value={claimAmount}
                onChange={(e) => setClaimAmount(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex items-center space-x-2 mt-2">
                {[100000, 500000, 1000000, 2500000, 5000000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setClaimAmount(val)}
                    className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[11px] font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    ₹{(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}{language === "en" ? "L" : " लाख"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              {language === "en" ? "Court Fee Estimate" : "कोर्ट फीस का अनुमान"}
            </h3>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-1">
              <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium uppercase tracking-wider">
                {language === "en" ? "Total Ad-Valorem Stamp:" : "कुल मूल्यानुसार कोर्ट स्टाम्प:"}
              </div>
              <div className="text-3xl font-bold text-zinc-950 dark:text-white">
                ₹{calculateCourtFee().toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                {language === "en"
                  ? `Valuation: ₹${claimAmount.toLocaleString("en-IN")} (${stateJurisdiction})`
                  : `मूल्यांकन: ₹${claimAmount.toLocaleString("en-IN")} (${stateJurisdiction})`}
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
              {language === "en"
                ? "*Preliminary estimate based on standard state ad-valorem slabs. Special advocate welfare stamps and e-court stamp paper charges may apply."
                : "*राज्य के मानक स्लैब पर आधारित प्रारंभिक अनुमान। अधिवक्ता कल्याण स्टाम्प व ई-कोर्ट स्टाम्प शुल्क अतिरिक्त हो सकते हैं।"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
