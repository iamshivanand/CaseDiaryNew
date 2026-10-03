"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scale,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Zap,
  KeyRound,
  CheckCircle2,
  Languages,
  Smartphone,
  Info,
} from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const { login, demoLogin } = useAuth();

  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert(language === "en" ? "Please enter a valid 10-digit mobile number" : "कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें");
      return;
    }
    setOtpSent(true);
    setOtp("1248"); // Demo instant OTP
  };

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userProfile = {
      name: "Adv. Rajesh Sharma",
      enrollment: "D/1248/2012",
      court: "High Court of Delhi",
      role: "Senior Advocate",
      plan: "PRO CHAMBER",
      phone: phone.startsWith("+91") ? phone : `+91 ${phone}`,
      email: "rajesh.adv@delhibar.org",
    };

    login(userProfile);
    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userProfile = {
      name: email.split("@")[0] || "Adv. Rajesh Sharma",
      enrollment: "D/1248/2012",
      court: "High Court of Delhi",
      role: "Senior Advocate",
      plan: "PRO CHAMBER",
      email: email,
    };

    login(userProfile);
    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    const googleProfile = {
      name: "Adv. Rajesh Sharma",
      enrollment: "D/1248/2012",
      court: "High Court of Delhi",
      role: "Senior Advocate",
      plan: "PRO CHAMBER",
      email: "rajesh.advocase@gmail.com",
    };
    login(googleProfile);
    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative">
      {/* Top Floating Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <ThemeToggle
          variant="icon"
          className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg"
        />
        <button
          onClick={() => setLanguage(language === "en" ? "hi" : "en")}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 flex items-center space-x-1 cursor-pointer"
          title="Switch Language"
        >
          <Languages className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-[11px]">{language === "en" ? "हिन्दी" : "EN"}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {language === "en" ? "Advocate Chamber Login" : "अधिवक्ता चेंबर लॉगिन"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === "en"
              ? "Access your digital court diary, daily cause lists & drafting studio."
              : "अपनी डिजिटल कोर्ट डायरी, कॉज लिस्ट एवं ड्राफ्टिंग स्टूडियो खोलने हेतु लॉगिन करें।"}
          </p>
        </div>

        {/* Existing Mobile App User Zero-Loss Assurance Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-950 dark:text-emerald-200 flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">
              {language === "en"
                ? "Existing Mobile App User? Zero Data Loss"
                : "पहले से मोबाइल ऐप यूजर हैं? शून्य डेटा हानि"}
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === "en"
                ? "Logging in will NEVER erase your phone's offline cases. Your database seamlessly syncs with your chamber cloud."
                : "वेब पर लॉगिन करने से आपके फ़ोन का डेटा कभी नहीं मिटेगा। आपके ऑफलाइन मामले क्लाउड से सुरक्षित जुड़ेंगे।"}
            </p>
          </div>
        </div>

        {/* Login Method Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setAuthMethod("phone")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              authMethod === "phone"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Mobile OTP" : "मोबाइल OTP"}</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("email")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              authMethod === "email"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Email / Bar No." : "ईमेल / बार नं."}</span>
          </button>
        </div>

        {/* 1. Mobile OTP Form */}
        {authMethod === "phone" && (
          <form onSubmit={otpSent ? handlePhoneLogin : handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {language === "en" ? "Mobile Number" : "मोबाइल नंबर"}
              </label>
              <div className="relative flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="98100 12345"
                  className="w-full px-3.5 py-2 rounded-r-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 font-mono tracking-wider"
                />
              </div>
            </div>

            {otpSent && (
              <div className="space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    {language === "en" ? "Enter 4-Digit OTP" : "4-अंकीय OTP दर्ज करें"}
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {language === "en" ? "Code sent (Demo: 1248)" : "कोड भेजा गया (डेमो: 1248)"}
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1248"
                    className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 font-mono text-center tracking-widest text-sm font-bold"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/10 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <span>
                {loading
                  ? (language === "en" ? "Verifying..." : "सत्यापन जारी...")
                  : otpSent
                  ? (language === "en" ? "Verify & Open Chamber" : "सत्यापित कर चेंबर खोलें")
                  : (language === "en" ? "Send Instant OTP" : "त्वरित OTP प्राप्त करें")}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* 2. Email & Password Form */}
        {authMethod === "email" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {language === "en" ? "Email or Bar Enrollment Number" : "ईमेल या बार पंजीकरण संख्या"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === "en" ? "rajesh.adv@delhibar.org or D/1248/2012" : "rajesh.adv@delhibar.org या D/1248/2012"}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {language === "en" ? "Password" : "पासवर्ड"}
                </label>
                <a href="#" className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline">
                  {language === "en" ? "Forgot password?" : "पासवर्ड भूल गए?"}
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <span>{loading ? (language === "en" ? "Signing in..." : "प्रवेश किया जा रहा है...") : (language === "en" ? "Enter Chamber Workspace" : "चेंबर वर्कस्पेस में प्रवेश करें")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 uppercase font-semibold">
            {language === "en" ? "Or" : "अथवा"}
          </span>
        </div>

        {/* Google 1-Tap Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{language === "en" ? "Continue with Google" : "गूगल से जारी रखें"}</span>
        </button>

        {/* 1-Click Quick Demo Logins */}
        <div className="p-3 bg-amber-500/5 dark:bg-amber-950/20 rounded-2xl border border-amber-500/20 space-y-2">
          <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{language === "en" ? "Instant Chamber Role Demo:" : "त्वरित चेंबर डेमो:"}</span>
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">1-Click</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                demoLogin("Senior");
                router.push("/");
              }}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium hover:bg-slate-50 transition-all text-center cursor-pointer shadow-xs active:scale-95"
            >
              {language === "en" ? "Senior" : "वरिष्ठ"}
            </button>
            <button
              onClick={() => {
                demoLogin("Junior");
                router.push("/");
              }}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium hover:bg-slate-50 transition-all text-center cursor-pointer shadow-xs active:scale-95"
            >
              {language === "en" ? "Junior" : "कनिष्ठ"}
            </button>
            <button
              onClick={() => {
                demoLogin("Munshi");
                router.push("/");
              }}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium hover:bg-slate-50 transition-all text-center cursor-pointer shadow-xs active:scale-95"
            >
              {language === "en" ? "Munshi" : "मुंशी"}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center pt-1 text-xs text-slate-500">
          {language === "en" ? "Don't have an advocate account?" : "खाता नहीं है?"}{" "}
          <Link href="/auth/register" className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
            {language === "en" ? "Register your Chamber" : "चेंबर रजिस्टर करें"}
          </Link>
        </div>
      </div>
    </div>
  );
}
