"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Scale,
  Briefcase,
  BookOpen,
  Calculator,
  ShieldCheck,
  Zap,
  Users,
  FileEdit,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ArrowRightLeft,
  ChevronRight,
  Building2,
  Calendar,
  Search,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export function PublicLandingPage() {
  const { demoLogin } = useAuth();
  const { t, language } = useLanguage();

  // Law Diff Category and Search State
  const [diffCategory, setDiffCategory] = useState<"all" | "bns" | "bnss" | "bsa">("all");
  const [quickSearch, setQuickSearch] = useState("");

  const LAW_DIFF_DATA = [
    {
      type: "bns",
      old: "IPC 302",
      newLaw: "BNS Sec 103(1)",
      title: language === "en" ? "Punishment for Murder" : "हत्या के लिए दंड",
      changeNote: language === "en"
        ? "Death or life imprisonment + mandatory fine. Introduces Sec 103(2) for mob lynching / hate crimes (5+ persons) with separate capital provisions."
        : "मृत्युदंड या आजीवन कारावास एवं अनिवार्य जुर्माना। मॉब लिंचिंग व घृणा अपराधों (५+ व्यक्ति) हेतु धारा १०३(२) के तहत अलग मृत्युदंड प्रावधान।",
      badge: language === "en" ? "Major Structural Update" : "प्रमुख संशोधन",
    },
    {
      type: "bns",
      old: "IPC 420",
      newLaw: "BNS Sec 318(4)",
      title: language === "en" ? "Cheating & Dishonestly Inducing Delivery" : "धोखाधड़ी व संपत्ति परिदान हेतु उत्प्रेरित करना",
      changeNote: language === "en"
        ? "Consolidated under Chapter XVII on property offences. Imprisonment up to 7 years and fine preserved."
        : "संपत्ति संबंधी अपराधों के अध्याय १७ में समाहित। ७ वर्ष तक का कारावास एवं जुर्माना यथावत।",
      badge: language === "en" ? "Re-numbered" : "पुनःक्रमांकित",
    },
    {
      type: "bns",
      old: "IPC 376",
      newLaw: "BNS Sec 64(1)",
      title: language === "en" ? "Punishment for Rape" : "बलात्कार हेतु दंड",
      changeNote: language === "en"
        ? "Grouped into Chapter V (Offences Against Women & Children). Minimum sentence raised to 10 years rigorous imprisonment."
        : "महिला व बाल अपराधों के अध्याय ५ में समूहीकृत। न्यूनतम सजा बढ़ाकर १० वर्ष का कठोर कारावास।",
      badge: language === "en" ? "Stricter Minimums" : "सख्त न्यूनतम सजा",
    },
    {
      type: "bnss",
      old: "CrPC 438",
      newLaw: "BNSS Sec 482",
      title: language === "en" ? "Anticipatory Bail Directions" : "अग्रिम जमानत के निर्देश",
      changeNote: language === "en"
        ? "Notice to Public Prosecutor made mandatory in non-bailable cases. Retains High Court & Sessions Court concurrent jurisdiction."
        : "गैर-जमानती मामलों में लोक अभियोजक को नोटिस अनिवार्य। उच्च न्यायालय एवं सत्र न्यायालय का समवर्ती क्षेत्राधिकार बरकरार।",
      badge: language === "en" ? "Procedural Clarification" : "प्रक्रियात्मक स्पष्टता",
    },
    {
      type: "bnss",
      old: "CrPC 154",
      newLaw: "BNSS Sec 173",
      title: language === "en" ? "Registration of FIR / Zero FIR" : "एफआईआर व जीरो एफआईआर पंजीकरण",
      changeNote: language === "en"
        ? "Statutory recognition of Zero FIR across any police station. Express statutory framework for e-FIR with mandatory 3-day verification."
        : "किसी भी थाने में जीरो एफआईआर की वैधानिक मान्यता। ३ दिन के भीतर सत्यापन के साथ ई-एफआईआर का स्पष्ट कानूनी ढांचा।",
      badge: language === "en" ? "Statutory Zero FIR" : "वैधानिक जीरो एफआईआर",
    },
    {
      type: "bnss",
      old: "CrPC 167",
      newLaw: "BNSS Sec 187",
      title: language === "en" ? "Remand & Police Custody Periods" : "रिमांड एवं पुलिस हिरासत की अवधि",
      changeNote: language === "en"
        ? "15-day police custody can now be granted in whole or in parts during the initial 40 or 60 days of judicial remand."
        : "न्यायिक रिमांड के आरंभिक ४० या ६० दिनों के दौरान १५ दिनों की पुलिस हिरासत एकमुश्त या किश्तों में दी जा सकती है।",
      badge: language === "en" ? "Crucial Bail Precedent" : "महत्वपूर्ण जमानत नियम",
    },
    {
      type: "bsa",
      old: "IEA 65B",
      newLaw: "BSA Sec 63",
      title: language === "en" ? "Admissibility of Electronic Records" : "इलेक्ट्रॉनिक अभिलेखों की ग्राह्यता",
      changeNote: language === "en"
        ? "Subsumed into unified electronic evidence schedule. Added clear statutory certificate formats under Schedule to the Bharatiya Sakshya Adhiniyam."
        : "एकीकृत इलेक्ट्रॉनिक साक्ष्य अनुसूची में समाहित। भारतीय साक्ष्य अधिनियम की अनुसूची के तहत वैधानिक प्रमाण-पत्र प्रारूप।",
      badge: language === "en" ? "Digital Evidence Standard" : "डिजिटल साक्ष्य मानक",
    },
    {
      type: "bns",
      old: "IPC 406",
      newLaw: "BNS Sec 316(2)",
      title: language === "en" ? "Criminal Breach of Trust" : "आपराधिक विश्वासघात",
      changeNote: language === "en"
        ? "Consolidated with enhanced clarity on fiduciary obligations of bankers, merchants, and chamber associates."
        : "बैंकर्स, व्यापारियों एवं चेंबर सहयोगियों के न्यास दायित्वों पर स्पष्टता के साथ समेकित।",
      badge: language === "en" ? "Re-numbered" : "पुनःक्रमांकित",
    },
  ];

  const filteredDiffs = LAW_DIFF_DATA.filter((item) => {
    const matchesCat = diffCategory === "all" || item.type === diffCategory;
    const matchesSearch =
      !quickSearch ||
      item.old.toLowerCase().includes(quickSearch.toLowerCase()) ||
      item.newLaw.toLowerCase().includes(quickSearch.toLowerCase()) ||
      item.title.toLowerCase().includes(quickSearch.toLowerCase()) ||
      item.changeNote.toLowerCase().includes(quickSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-full space-y-16 sm:space-y-24 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      {/* Subtle ambient radiant background blurs (Deep Emerald + Midnight Navy) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/10 dark:bg-emerald-500/12 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-24 right-1/4 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-2 sm:pt-6 relative">
        <div className="space-y-6 max-w-3xl">
          {/* Shimmering Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/5 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {language === "en" ? "Institutional Litigation Workspace • High Courts & District Courts" : "संस्थागत लीगल वर्कस्पेस • उच्च व जिला न्यायालय"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-950 dark:text-white leading-[1.1]">
            {language === "en" ? (
              <>
                Precision litigation software for{" "}
                <span className="bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-800 dark:from-emerald-400 dark:via-teal-300 dark:to-blue-400 bg-clip-text text-transparent">
                  Indian court chambers.
                </span>
              </>
            ) : (
              <>
                भारतीय न्यायालयों के लिए{" "}
                <span className="bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-800 dark:from-emerald-400 dark:via-teal-300 dark:to-blue-400 bg-clip-text text-transparent">
                  विश्वसनीय लीगल वर्कस्पेस।
                </span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
            {language === "en"
              ? "Streamline High Court and District Court cause lists, track item numbers in real-time, draft pleadings with strict 1.75-inch court gutters, and navigate the 2023 criminal law reforms."
              : "हाई कोर्ट व जिला न्यायालयों की दैनिक कॉज लिस्ट, रीयल-टाइम पेशी ट्रैकिंग, १.७५-इंच मार्जिन के साथ अदालत में प्रस्तुत करने योग्य ड्राफ्टिंग, एवं २०२३ के नए आपराधिक कानूनों की त्वरित तुलना।"}
          </p>

          {/* Action Button Pair: British Racing Emerald + Ice Slate */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/auth/register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-800 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98]"
            >
              <span>{language === "en" ? "Start Free Chamber Workspace" : "निःशुल्क चेंबर वर्कस्पेस शुरू करें"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/bare-acts"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs sm:text-sm flex items-center space-x-2 border border-slate-300/80 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t("bareActs")}</span>
            </Link>
          </div>
        </div>

        {/* Dark Glassmorphic Chamber Preview Window with Cool Glowing Borders */}
        <div className="mt-8 rounded-2xl relative overflow-hidden bg-slate-950 text-slate-100 border border-slate-800/80 shadow-2xl shadow-emerald-950/30 ring-1 ring-emerald-500/20">
          {/* Top glowing ambient gradient beam */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

          {/* Chamber Mockup Window Header */}
          <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-mono text-[11px] text-slate-400 flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Delhi High Court • Court Room 14 • Chamber Cause Tracker</span>
              </span>
            </div>
            <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE ITEM #14 PROCEEDING</span>
            </div>
          </div>

          {/* Chamber Mockup Body */}
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
            {/* Live Case 1 */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-emerald-400 font-bold">Item #12</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Passed Over • 12:30 PM
                </span>
              </div>
              <p className="font-bold text-xs text-white mt-1.5 truncate">State of Delhi vs. Ramesh & Anr</p>
              <p className="text-[10px] text-slate-400 mt-0.5">BAIL APPLN 412/2026 • Regular Bail (BNSS 483)</p>
            </div>

            {/* Live Case 2 */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-blue-500/40 bg-blue-950/15">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-blue-400 font-bold">Item #14 (Calling Now)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Arguments On</span>
                </span>
              </div>
              <p className="font-bold text-xs text-white mt-1.5 truncate">Sharma Infra vs. Union of India</p>
              <p className="text-[10px] text-slate-400 mt-0.5">ARB. P. 89/2026 • Sec 11 Appointment</p>
            </div>

            {/* Live Case 3 */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400 font-bold">Item #21</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  Listed for Orders
                </span>
              </div>
              <p className="font-bold text-xs text-white mt-1.5 truncate">Mehra & Co. vs. Bank of Baroda</p>
              <p className="text-[10px] text-slate-400 mt-0.5">CS(COMM) 204/2025 • Chamber Summons</p>
            </div>
          </div>
        </div>

        {/* 1-Click Instant Evaluation Strip with British Racing Emerald + Midnight Navy Accents */}
        <div className="mt-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600" />
              <span>
                {language === "en"
                  ? "Instant Chamber Test Drive — No sign-up required"
                  : "त्वरित चेंबर डेमो — बिना पंजीकरण के अनुभव करें"}
              </span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-medium px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {language === "en" ? "Interactive Demo" : "इंटरैक्टिव डेमो"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Senior Advocate: Midnight Navy / Oxford Theme */}
            <button
              onClick={() => demoLogin("Senior")}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-sm hover:shadow-blue-500/10 transition-all text-left group cursor-pointer"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>{language === "en" ? "Senior Advocate" : "वरिष्ठ अधिवक्ता"}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                {language === "en" ? "Adv. Rajesh Sharma • High Court" : "अधिवक्ता राजेश शर्मा • उच्च न्यायालय"}
              </p>
            </button>

            {/* Junior Counsel: British Racing Emerald Theme */}
            <button
              onClick={() => demoLogin("Junior")}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-sm hover:shadow-emerald-500/10 transition-all text-left group cursor-pointer"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>{language === "en" ? "Junior Counsel" : "जूनियर अधिवक्ता"}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                {language === "en" ? "Adv. Vikram Mehra • District Courts" : "अधिवक्ता विक्रम मेहरा • जिला न्यायालय"}
              </p>
            </button>

            {/* Court Munshi: Cool Slate Theme */}
            <button
              onClick={() => demoLogin("Munshi")}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-sm transition-all text-left group cursor-pointer"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>{language === "en" ? "Court Munshi" : "कोर्ट मुंशी"}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                {language === "en" ? "Ramesh Kumar • Daily Cause Lists" : "रमेश कुमार • दैनिक कॉज लिस्ट"}
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Trust & Jurisdictions Ribbon */}
      <section className="border-y border-zinc-200/80 dark:border-zinc-800 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {language === "en" ? "Jurisdictions Supported" : "समर्थित न्यायालय"}
          </span>
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 font-medium">
            <span className="flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>{language === "en" ? "Supreme Court of India" : "भारत का सर्वोच्च न्यायालय"}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-zinc-400" />
              <span>{language === "en" ? "All 25 High Courts" : "समस्त २५ उच्च न्यायालय"}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>{language === "en" ? "672 District Courts" : "६७२ जिला न्यायालय"}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{language === "en" ? "Client Privilege Encrypted" : "गोपनीय डेटा एन्क्रिप्टेड"}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Editorial Comparison: Traditional Chamber vs Advocase */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{language === "en" ? "Comparative Architecture" : "तुलनात्मक कार्यप्रणाली"}</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">
            {language === "en" ? "Replacing physical registers with digital precision." : "भौतिक रजिस्टरों की जगह डिजिटल सटीकता।"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Column 1: Traditional Chamber (Subtle Slate Theme) */}
          <div className="rounded-2xl p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{language === "en" ? "Traditional Physical Practice" : "पारंपरिक भौतिक वकालत"}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                {language === "en" ? "Fragile" : "त्रुटिप्रवण"}
              </span>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start space-x-2.5">
                <span className="text-rose-500/80 font-bold text-sm mt-0.5">✕</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100">{language === "en" ? "Physical cloth registers:" : "कपड़े की भारी जिल्द डायरियां:"}</strong>{" "}
                  {language === "en"
                    ? "Heavy handwritten diaries that risk water damage, loss in courtrooms, and lack indexing."
                    : "हाथ से लिखी भारी डायरियां जिनके फटने, भीगने या कोर्ट परिसर में खोने का खतरा रहता है।"}
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="text-rose-500/80 font-bold text-sm mt-0.5">✕</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100">{language === "en" ? "Morning item scramble:" : "सुबह पेशी की भागदौड़:"}</strong>{" "}
                  {language === "en"
                    ? "Repeated phone calls to munshis inquiring if an item is passed over in Court 12 or 24."
                    : "मुंशी को बार-बार फोन करके पूछना कि कोर्ट १२ या २४ में कौन सा आइटम चल रहा है।"}
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="text-rose-500/80 font-bold text-sm mt-0.5">✕</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100">{language === "en" ? "Manual limitation checks:" : "मैन्युअल परिसीमा गणना:"}</strong>{" "}
                  {language === "en"
                    ? "Mental calculation of 30-day revision or 90-day appeal deadlines risking suit dismissal."
                    : "३०-दिन की निगरानी या ९०-दिन की अपील की गणना में चूक से वाद खारिज होने का डर।"}
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="text-rose-500/80 font-bold text-sm mt-0.5">✕</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100">{language === "en" ? "Formatting rejections:" : "प्रारूपण आपत्तियां:"}</strong>{" "}
                  {language === "en"
                    ? "MS Word pleadings with improper 1.75-inch legal gutters returned by the registry."
                    : "१.७५-इंच मार्जिन के अभाव में फाइलिंग काउंटर द्वारा याचिकाओं पर आपत्ति लगाना।"}
                </span>
              </li>
            </ul>
          </div>

          {/* Column 2: Advocase Platform (British Racing Emerald Theme) */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 dark:from-emerald-950/25 dark:via-slate-900 dark:to-slate-900 border border-emerald-500/30 dark:border-emerald-500/30 space-y-4 shadow-md shadow-emerald-950/5 ring-1 ring-emerald-500/20">
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center justify-between">
              <span>{language === "en" ? "Advocase Digital Standard" : "एडवोकेस डिजिटल मानक"}</span>
              <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-semibold border border-emerald-300 dark:border-emerald-800">
                {language === "en" ? "Integrated" : "एकीकृत"}
              </span>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-950 dark:text-white">{language === "en" ? "Synchronized chamber workspace:" : "सिंक्रनाइज़्ड चेंबर वर्कस्पेस:"}</strong>{" "}
                  {language === "en"
                    ? "Real-time access across Senior Counsel, Junior Advocates, and Munshi devices."
                    : "सीनियर वकील, जूनियर सहयोगी और मुंशी के मध्य एक साथ रीयल-टाइम डेटा एक्सेस।"}
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-950 dark:text-white">{language === "en" ? "1-Tap WhatsApp briefings:" : "१-क्लिक व्हाट्सएप सूचना:"}</strong>{" "}
                  {language === "en"
                    ? "Formatted hearing outcomes generated instantly with next date and bench details."
                    : "अगली तारीख व पीठ विवरण के साथ मुवक्किलों को तत्काल औपचारिक व्हाट्सएप संदेश।"}
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-950 dark:text-white">{language === "en" ? "Statutory limitation countdowns:" : "परिसीमा अधिनियम गणना:"}</strong>{" "}
                  {language === "en"
                    ? "Built-in Section 5 calculations under Limitation Act 1963 for suits and revisions."
                    : "परिसीमा अधिनियम १९६३ के तहत दीवानी वादों, अपीलों व निगरानी की स्वतः गणना।"}
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-950 dark:text-white">{language === "en" ? "TipTap Courtroom Drafting Studio:" : "टिप-टैप कानूनी ड्राफ्टिंग स्टूडियो:"}</strong>{" "}
                  {language === "en"
                    ? "Strict 1.75\" High Court margins, court line numbering (1–32), and clean DOCX export."
                    : "हाई कोर्ट के १.७५-इंच मार्जिन, पंक्ति संख्या (१-३२) एवं वर्ड (.docx) निर्यात।"}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* BNS 2023 Criminal Law Reform Explorer */}
      <section className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold">
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === "en" ? "Criminal Law Reform Engine" : "आपराधिक कानून सुधार इंजन"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">
              {t("landingConverterTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              {t("landingConverterSub")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Act Category Filter Pills */}
            <div className="flex items-center space-x-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium w-full sm:w-auto">
              <button
                onClick={() => setDiffCategory("all")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  diffCategory === "all"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-xs font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-medium"
                }`}
              >
                {t("btnAll")}
              </button>
              <button
                onClick={() => setDiffCategory("bns")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  diffCategory === "bns"
                    ? "bg-rose-700 text-white dark:bg-rose-600 shadow-xs font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-medium"
                }`}
              >
                {language === "en" ? "BNS (Penal)" : "बीएनएस (दंड)"}
              </button>
              <button
                onClick={() => setDiffCategory("bnss")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  diffCategory === "bnss"
                    ? "bg-blue-700 text-white dark:bg-blue-600 shadow-xs font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                }`}
              >
                {language === "en" ? "BNSS (Procedure)" : "बीएनएसएस (प्रक्रिया)"}
              </button>
              <button
                onClick={() => setDiffCategory("bsa")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  diffCategory === "bsa"
                    ? "bg-emerald-700 text-white dark:bg-emerald-600 shadow-xs font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                }`}
              >
                {language === "en" ? "BSA (Evidence)" : "बीएसए (साक्ष्य)"}
              </button>
            </div>

            <div className="w-full sm:w-60 relative">
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder={language === "en" ? "Search 302, bail, murder..." : "302, जमानत, हत्या खोजें..."}
                className="w-full pl-8.5 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDiffs.map((conv, idx) => {
            const isBns = conv.type === "bns";
            const isBnss = conv.type === "bnss";

            const borderAccent = isBns
              ? "border-l-4 border-l-rose-500 hover:border-rose-300 dark:hover:border-rose-700"
              : isBnss
              ? "border-l-4 border-l-blue-600 hover:border-blue-300 dark:hover:border-blue-700"
              : "border-l-4 border-l-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-700";

            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 ${borderAccent} flex flex-col justify-between shadow-xs hover:shadow-md transition-all space-y-3.5`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 px-2.5 py-0.5 rounded-md">
                        {conv.old}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-md">
                        {conv.newLaw}
                      </span>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md shrink-0 ${
                      isBns
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                        : isBnss
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60"
                    }`}>
                      {conv.badge}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-slate-50 tracking-tight leading-snug">
                    {conv.title}
                  </h3>

                  <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                    {conv.changeNote}
                  </p>
                </div>

                <Link
                  href={`/bare-acts?q=${encodeURIComponent(conv.newLaw)}`}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center space-x-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-900 transition-colors"
                >
                  <span>{language === "en" ? "Read Full Bare Act Provision" : "संपूर्ण कानूनी धारा पढ़ें"}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <Link
            href="/bare-acts"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center space-x-1.5 transition-colors"
          >
            <span>
              {language === "en"
                ? "Explore all 531 BNS, 535 BNSS & civil codes in the Bare Acts Portal"
                : "बेयर एक्ट्स पोर्टल में समस्त ५३१ बीएनएस, ५३५ बीएनएसएस एवं सिविल संहिताओं का अध्ययन करें"}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </section>

      {/* Bento Feature Pillars: Midnight Navy + British Racing Emerald + Deep Spruce */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pillar 1: Daily Cause List (Midnight Navy) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/5 transition-all shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 text-white flex items-center justify-center shadow-md shadow-blue-950/20">
            <Scale className="w-5 h-5 text-blue-300" />
          </div>
          <h3 className="text-base font-bold text-slate-950 dark:text-white">
            {language === "en" ? "Daily Cause List & Hearing Queue" : "दैनिक कॉज लिस्ट एवं पेशी सूची"}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {language === "en"
              ? "Sort cases by courtroom number, prioritize urgent bail arguments, and log hearing outcomes with 1 tap. Instant WhatsApp briefing to clients and junior associates."
              : "कोर्ट रूम अनुसार मुकदमों का क्रम, आवश्यक जमानत बहसों को प्राथमिकता एवं १-क्लिक में परिणाम प्रविष्टि। मुवक्किलों को त्वरित व्हाट्सएप संदेश।"}
          </p>
        </div>

        {/* Pillar 2: Courtroom Drafting Studio (British Racing Emerald) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-500/5 transition-all shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white flex items-center justify-center shadow-md shadow-emerald-950/20">
            <FileEdit className="w-5 h-5 text-emerald-300" />
          </div>
          <h3 className="text-base font-bold text-slate-950 dark:text-white">
            {language === "en" ? "Courtroom Drafting Studio" : "कोर्ट ड्राफ्टिंग स्टूडियो"}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {language === "en"
              ? "High-grade legal editor tailored for Indian High Courts. Strict 1.75-inch gutter margins, court line numbering (1–32), Track Changes, and Word (.docx) export."
              : "भारतीय उच्च न्यायालयों हेतु अनुकूलित कानूनी संपादक। १.७५-इंच का कानूनी मार्जिन, पंक्ति संख्या (१–३२), संशोधन ट्रैकिंग और वर्ड (.docx) निर्यात।"}
          </p>
        </div>

        {/* Pillar 3: Limitation & Fees (Deep Spruce / Platinum Slate) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-600 hover:shadow-md hover:shadow-teal-500/5 transition-all shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-800 via-slate-800 to-slate-950 text-white flex items-center justify-center shadow-md shadow-slate-950/20">
            <Calculator className="w-5 h-5 text-teal-300" />
          </div>
          <h3 className="text-base font-bold text-slate-950 dark:text-white">
            {language === "en" ? "Statutory Limitation & Fees" : "वैधानिक परिसीमा एवं न्यायालय शुल्क"}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {language === "en"
              ? "Limitation Act 1963 countdowns for money suits, appeals, and revisions. Ad-valorem state court fee schedules for Delhi, UP, Maharashtra, and Karnataka."
              : "परिसीमा अधिनियम १९६३ के अंतर्गत वसूली वादों, अपीलों व निगरानी की गणना। दिल्ली, यूपी, महाराष्ट्र और कर्नाटक के राज्यवार न्यायालय शुल्क।"}
          </p>
        </div>
      </section>

      {/* Refined Midnight Slate & British Racing Emerald Bottom CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 text-center space-y-4 border border-emerald-900/40 shadow-2xl shadow-emerald-950/40">
        {/* Decorative cool ambient lights */}
        <div className="absolute top-0 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 inline-block">
            {language === "en" ? "Institutional Chamber Infrastructure" : "संस्थागत चेंबर प्लेटफॉर्म"}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            {language === "en" ? "Modernize your chamber's daily practice." : "अपने चेंबर की दैनिक वकालत को आधुनिक बनाएं।"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {language === "en"
              ? "Built for advocates across High Courts and District Courts streamlining appearances, case timelines, and litigation accounting."
              : "उच्च न्यायालयों एवं जिला अदालतों के अधिवक्ताओं के लिए पेशी, केस समयरेखा एवं फीस बहीखाता प्रबंधन।"}
          </p>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
            >
              {language === "en" ? "Create Chamber Workspace" : "चेंबर वर्कस्पेस बनाएं"}
            </Link>
            <Link
              href="/calculators"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-sm transition-all"
            >
              {t("legalCalculators")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
