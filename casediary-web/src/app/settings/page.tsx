"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings,
  User,
  ShieldCheck,
  Building,
  Save,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Palette,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { ChamberAuthGuard } from "@/components/ChamberAuthGuard";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

export default function ChamberSettingsPage() {
  const { t, language } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [profile, setProfile] = useState({
    name: "",
    designation: "",
    barCouncilNumber: "",
    chamberAddress: "",
    contactInfo: "",
    practiceAreas: "",
    aboutMe: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setProfile({
            name: data.profile.name || "",
            designation: data.profile.designation || "",
            barCouncilNumber: data.profile.barCouncilNumber || "",
            chamberAddress: data.profile.chamberAddress || "",
            contactInfo: data.profile.contactInfo || "",
            practiceAreas: data.profile.practiceAreas || "",
            aboutMe: data.profile.aboutMe || "",
          });
        }
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ChamberAuthGuard featureName={t("settingsTitle")}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Link
          href="/"
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2">
            <Settings className="w-6 h-6 text-amber-500" />
            <span>{t("settingsTitle")}</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t("settingsSub")}
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{language === "en" ? "Chamber profile and letterhead successfully updated!" : "चेंबर प्रोफ़ाइल और लेटरहेड सफलतापूर्वक अपडेट किया गया!"}</span>
        </div>
      )}

      {/* Appearance & Theme Section */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <Palette className="w-4 h-4 text-amber-500" />
            <span>{t("themeAppearance")}</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 uppercase">
            {resolvedTheme === "dark" ? "Dark Active" : "Light Active"}
          </span>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("themeAppearanceDesc")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
              theme === "light"
                ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-zinc-800 flex items-center justify-center text-amber-600">
                <Sun className="w-4 h-4" />
              </div>
              {theme === "light" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono">
                  ACTIVE
                </span>
              )}
            </div>
            <div>
              <div className="font-semibold text-xs text-zinc-900 dark:text-white">
                {t("themeLight")}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {language === "en" ? "Crisp white courtroom theme for daytime peshi" : "दिन में कोर्ट पेशी हेतु स्वच्छ श्वेत थीम"}
              </div>
            </div>
          </button>

          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
              theme === "dark"
                ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-blue-400 border border-zinc-700 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              {theme === "dark" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500 text-white font-mono">
                  ACTIVE
                </span>
              )}
            </div>
            <div>
              <div className="font-semibold text-xs text-zinc-900 dark:text-white">
                {t("themeDark")}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {language === "en" ? "Deep courtroom slate for night drafting & brief study" : "रात्रि अध्ययन व ड्राफ्टिंग हेतु डार्क थीम"}
              </div>
            </div>
          </button>

          {/* System Mode Card */}
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
              theme === "system"
                ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Monitor className="w-4 h-4" />
              </div>
              {theme === "system" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono">
                  ACTIVE
                </span>
              )}
            </div>
            <div>
              <div className="font-semibold text-xs text-zinc-900 dark:text-white">
                {t("themeSystem")}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {language === "en" ? "Automatically adapts to your device OS theme" : "कंप्यूटर व फोन के सिस्टम अनुसार स्वतः बदले"}
              </div>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <User className="w-4 h-4 text-amber-500" />
            <span>{language === "en" ? "Advocate Profile & Credentials" : "अधिवक्ता विवरण एवं क्रेडेंशियल्स"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("advocateName")}
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder={language === "en" ? "e.g. Adv. Rajesh Sharma" : "उदा. अधि. राजेश शर्मा"}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("barCouncilNo")}
              </label>
              <input
                type="text"
                name="barCouncilNumber"
                value={profile.barCouncilNumber}
                onChange={handleChange}
                placeholder="e.g. D/1248/2012"
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("designation")}
              </label>
              <input
                type="text"
                name="designation"
                value={profile.designation}
                onChange={handleChange}
                placeholder={language === "en" ? "e.g. Senior Litigator & Chamber Head" : "उदा. वरिष्ठ अधिवक्ता एवं चेंबर प्रमुख"}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "en" ? "Official Contact / Phone / Email" : "आधिकारिक संपर्क / फोन / ईमेल"}
              </label>
              <input
                type="text"
                name="contactInfo"
                value={profile.contactInfo}
                onChange={handleChange}
                placeholder="e.g. +91 98101 23456 | adv@delhibar.in"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("chamberAddress")} ({language === "en" ? "Appears on Cause List Letterhead" : "कॉज लिस्ट लेटरहेड पर दिखाई देगा"})
              </label>
              <input
                type="text"
                name="chamberAddress"
                value={profile.chamberAddress}
                onChange={handleChange}
                placeholder={language === "en" ? "e.g. Chamber No. 412, Lawyers Chambers Block, Tis Hazari Courts, Delhi - 110054" : "उदा. चेंबर नं. ४१२, लॉयर्स चेंबर ब्लॉक, तीस हजारी कोर्ट, दिल्ली"}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("practiceAreas")}
              </label>
              <input
                type="text"
                name="practiceAreas"
                value={profile.practiceAreas}
                onChange={handleChange}
                placeholder={language === "en" ? "e.g. Criminal Trials, High Court Writs, Commercial Arbitration, Cheque Bounce" : "उदा. आपराधिक मुकदमे, उच्च न्यायालय रिट, वाणिज्यिक मध्यस्थता, चेक बाउंस"}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs flex items-center space-x-2 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? (language === "en" ? "Saving Changes..." : "सहेजा जा रहा है...") : t("btnSaveChanges")}</span>
          </button>
        </div>
      </form>
    </div>
    </ChamberAuthGuard>
  );
}
