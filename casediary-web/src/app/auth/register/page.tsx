"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Scale,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Languages,
} from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";

function RegisterForm() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") || "pro";

  const [fullName, setFullName] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [court, setCourt] = useState("High Court of Delhi");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userProfile = {
      name: fullName || "Advocate",
      enrollment: enrollment || "D/XXXX/2026",
      court,
      role: "Lead Advocate",
      plan: planParam === "chamber" ? "CHAMBER ENTERPRISE" : planParam === "free" ? "SOLO FREE" : "PRO ADVOCATE",
    };

    localStorage.setItem("advocase_user", JSON.stringify(userProfile));

    setTimeout(() => {
      router.push("/");
    }, 600);
  };

  return (
    <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <Scale className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {language === "en" ? "Register Advocate Chamber" : "अधिवक्ता चेंबर पंजीकरण"}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {language === "en"
            ? "Create your digital courtroom workspace with 14-day Pro features included."
            : "१४ दिनों के निःशुल्क प्रो फीचर्स सहित अपना डिजिटल न्यायालय वर्कस्पेस बनाएं।"}
        </p>

        {planParam && (
          <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-semibold uppercase tracking-wider">
            {language === "en" ? "Selected Plan:" : "चुना गया प्लान:"} {planParam.toUpperCase()}
          </div>
        )}
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("advocateName")}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === "en" ? "Adv. Rajesh Sharma" : "उदा. अधि. राजेश शर्मा"}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("barCouncilNo")}
            </label>
            <input
              type="text"
              required
              value={enrollment}
              onChange={(e) => setEnrollment(e.target.value)}
              placeholder="e.g. D/1248/2012"
              className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {language === "en" ? "Primary Practice Court" : "प्रमुख अभ्यास न्यायालय"}
          </label>
          <select
            value={court}
            onChange={(e) => setCourt(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
          >
            <option value="Supreme Court of India">Supreme Court of India (सर्वोच्च न्यायालय)</option>
            <option value="High Court of Delhi">High Court of Delhi (दिल्ली उच्च न्यायालय)</option>
            <option value="Tis Hazari Courts, Delhi">Tis Hazari Courts, Delhi (तीस हजारी कोर्ट)</option>
            <option value="Saket Courts, Delhi">Saket Courts, Delhi (साकेत कोर्ट)</option>
            <option value="Patiala House Courts, Delhi">Patiala House Courts, Delhi (पटियाला हाउस कोर्ट)</option>
            <option value="Bombay High Court">Bombay High Court (बॉम्बे उच्च न्यायालय)</option>
            <option value="Allahabad High Court">Allahabad High Court (इलाहाबाद उच्च न्यायालय)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {language === "en" ? "Chamber Email" : "चेंबर आधिकारिक ईमेल"}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rajesh.chamber@delhibar.org"
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {language === "en" ? "Password" : "पासवर्ड"}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          <span>{loading ? (language === "en" ? "Registering..." : "पंजीकरण किया जा रहा है...") : (language === "en" ? "Create Chamber Workspace" : "चेंबर वर्कस्पेस बनाएं")}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="text-center pt-2 text-xs text-zinc-500">
        {language === "en" ? "Already registered?" : "पहले से पंजीकृत हैं?"}{" "}
        <Link href="/auth/login" className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
          {language === "en" ? "Sign In to your Chamber" : "चेंबर में साइन इन करें"}
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-950 relative">
      {/* Top Floating Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <ThemeToggle variant="icon" className="p-1.5 border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg" />
        <button
          onClick={() => setLanguage(language === "en" ? "hi" : "en")}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 flex items-center space-x-1 cursor-pointer"
          title="Switch Language"
        >
          <Languages className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-[11px]">{language === "en" ? "हिन्दी" : "EN"}</span>
        </button>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
