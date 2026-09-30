"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scale,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Zap,
  User,
  Users,
  CheckCircle2,
  Languages,
} from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Set demo session in localStorage
    localStorage.setItem(
      "advocase_user",
      JSON.stringify({
        name: "Adv. Rajesh Sharma",
        enrollment: "D/1248/2012",
        court: "High Court of Delhi",
        role: "Senior Advocate",
        plan: "PRO CHAMBER",
      })
    );

    setTimeout(() => {
      router.push("/");
    }, 600);
  };

  const handleDemoLogin = (role: "Senior" | "Junior" | "Munshi") => {
    const profiles = {
      Senior: {
        name: "Adv. Rajesh Sharma",
        enrollment: "D/1248/2012",
        court: "High Court of Delhi",
        role: "Senior Advocate",
        plan: "PRO CHAMBER",
      },
      Junior: {
        name: "Adv. Vikram Mehra",
        enrollment: "D/4590/2021",
        court: "Tis Hazari Courts",
        role: "Junior Counsel",
        plan: "PRO CHAMBER",
      },
      Munshi: {
        name: "Ramesh Kumar",
        enrollment: "Chamber Munshi #04",
        court: "Delhi District Courts",
        role: "Court Clerk / Munshi",
        plan: "CHAMBER TEAM",
      },
    };

    localStorage.setItem("advocase_user", JSON.stringify(profiles[role]));
    router.push("/");
  };

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

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {language === "en" ? "Advocate Chamber Login" : "अधिवक्ता चेंबर लॉगिन"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {language === "en"
              ? "Sign in to access your digital court diary, cause list, and drafting studio."
              : "अपनी डिजिटल कोर्ट डायरी, कॉज लिस्ट एवं ड्राफ्टिंग स्टूडियो खोलने हेतु लॉगिन करें।"}
          </p>
        </div>

        {/* 1-Click Quick Demo Logins */}
        <div className="p-3.5 bg-amber-500/5 dark:bg-amber-950/20 rounded-xl border border-amber-500/20 space-y-2">
          <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{language === "en" ? "Quick Demo Access:" : "त्वरित डेमो लॉगिन:"}</span>
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">1-Click</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoLogin("Senior")}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-all text-center cursor-pointer shadow-xs"
            >
              {language === "en" ? "Senior Counsel" : "वरिष्ठ वकील"}
            </button>
            <button
              onClick={() => handleDemoLogin("Junior")}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-all text-center cursor-pointer shadow-xs"
            >
              {language === "en" ? "Junior Counsel" : "कनिष्ठ वकील"}
            </button>
            <button
              onClick={() => handleDemoLogin("Munshi")}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-all text-center cursor-pointer shadow-xs"
            >
              {language === "en" ? "Court Munshi" : "कोर्ट मुंशी"}
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {language === "en" ? "Email or Bar Enrollment Number" : "ईमेल या बार पंजीकरण संख्या"}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === "en" ? "rajesh.adv@delhibar.org or D/1248/2012" : "rajesh.adv@delhibar.org या D/1248/2012"}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {language === "en" ? "Password" : "पासवर्ड"}
              </label>
              <a href="#" className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline">
                {language === "en" ? "Forgot password?" : "पासवर्ड भूल गए?"}
              </a>
            </div>
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
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? (language === "en" ? "Signing in..." : "प्रवेश किया जा रहा है...") : (language === "en" ? "Enter Chamber Workspace" : "चेंबर वर्कस्पेस में प्रवेश करें")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 text-xs text-zinc-500">
          {language === "en" ? "Don't have an advocate account?" : "खाता नहीं है?"}{" "}
          <Link href="/auth/register" className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
            {language === "en" ? "Register your Chamber" : "चेंबर रजिस्टर करें"}
          </Link>
        </div>
      </div>
    </div>
  );
}
