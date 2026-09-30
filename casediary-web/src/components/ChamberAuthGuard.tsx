import React from "react";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  BookOpen,
  Calculator,
  Sparkles,
  Users,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface ChamberAuthGuardProps {
  children: React.ReactNode;
  featureName?: string;
}

export function ChamberAuthGuard({
  children,
  featureName = "Advocate Chamber Workspace",
}: ChamberAuthGuardProps) {
  const { isAuthenticated, isLoading, demoLogin } = useAuth();
  const { t, language } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3 text-zinc-400">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-xs font-medium">
            {language === "en" ? "Verifying chamber credentials..." : "चेंबर क्रेडेंशियल्स का सत्यापन जारी है..."}
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated: render security gate
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6 my-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl p-6 sm:p-10 text-center space-y-6 relative overflow-hidden">
        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        {/* Heading & Details */}
        <div className="max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{language === "en" ? "CONFIDENTIAL ADVOCATE ENCLAVE" : "गोपनीय अधिवक्ता चेंबर"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white tracking-tight">
            {language === "en" ? "Chamber Authentication Required" : "चेंबर प्रमाणीकरण आवश्यक"}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            {language === "en" ? (
              <>
                <strong>{featureName}</strong> contains confidential litigation dossiers, daily court cause lists, and client records. Sign in with your chamber credentials or use 1-click demo access to inspect the features.
              </>
            ) : (
              <>
                <strong>{featureName}</strong> में गोपनीय मुकदमा पत्रावलियां, दैनिक कोर्ट कॉज लिस्ट और मुवक्किल विवरण शामिल हैं। अपने चेंबर खाते से लॉगिन करें अथवा १-क्लिक डेमो द्वारा जांचें।
              </>
            )}
          </p>
        </div>

        {/* 1-Click Instant Demo Login Options */}
        <div className="bg-zinc-50 dark:bg-zinc-950/60 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 max-w-2xl mx-auto text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
              <span>{language === "en" ? "Instant 1-Click Demo Evaluation:" : "त्वरित १-क्लिक डेमो मूल्यांकन:"}</span>
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {language === "en" ? "No password needed" : "पासवर्ड की आवश्यकता नहीं"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => demoLogin("Senior")}
              className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left group"
            >
              <div className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-between">
                <span>{language === "en" ? "Senior Advocate" : "वरिष्ठ अधिवक्ता"}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">{language === "en" ? "Adv. Rajesh Sharma" : "अधिवक्ता राजेश शर्मा"}</p>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Bar: D/1248/2012</span>
            </button>

            <button
              onClick={() => demoLogin("Junior")}
              className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left group"
            >
              <div className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-between">
                <span>{language === "en" ? "Junior Counsel" : "कनिष्ठ वकील"}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">{language === "en" ? "Adv. Vikram Mehra" : "अधिवक्ता विक्रम मेहरा"}</p>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Bar: D/4590/2021</span>
            </button>

            <button
              onClick={() => demoLogin("Munshi")}
              className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left group"
            >
              <div className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-between">
                <span>{language === "en" ? "Chamber Munshi" : "चेंबर मुंशी"}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">{language === "en" ? "Ramesh Kumar" : "रमेश कुमार"}</p>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                {language === "en" ? "District Courts Clerk" : "जिला न्यायालय लिपिक"}
              </span>
            </button>
          </div>
        </div>

        {/* Regular Login & Register Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/auth/login"
            className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs flex items-center space-x-2 transition-all"
          >
            <span>{language === "en" ? "Sign In to Your Chamber" : "अपने चेंबर में लॉगिन करें"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs transition-all border border-zinc-200 dark:border-zinc-700"
          >
            <span>{language === "en" ? "Create New Chamber" : "नया चेंबर बनाएं"}</span>
          </Link>
        </div>

        {/* Public Alternatives Notice */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800 pt-5 text-xs text-zinc-500 flex flex-wrap items-center justify-center gap-4">
          <span>{language === "en" ? "Looking for free public legal utilities?" : "निःशुल्क कानूनी उपकरण खोज रहे हैं?"}</span>
          <Link
            href="/bare-acts"
            className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium hover:underline flex items-center space-x-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Bare Acts & New Laws" : "बेयर एक्ट्स व नए कानून"}</span>
          </Link>
          <Link
            href="/calculators"
            className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium hover:underline flex items-center space-x-1"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Court Fee Calculator" : "कोर्ट फीस कैलकुलेटर"}</span>
          </Link>
          <Link
            href="/pricing"
            className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium hover:underline flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Chamber Plans" : "चेंबर प्लान्स"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
