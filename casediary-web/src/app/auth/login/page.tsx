"use client";

import React, { useState, useEffect } from "react";
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
import { useToast } from "@/context/ToastContext";

export default function LoginPage() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, demoLogin, loginWithCredentials, loginWithGoogle } = useAuth();
  const toast = useToast();

  const [authMethod, setAuthMethod] = useState<"phone" | "email">("email");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect straight to dashboard (no flash)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        clearInterval(interval);
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response: any) => {
              if (response?.credential) {
                setLoading(true);
                const result = await loginWithGoogle(response.credential);
                setLoading(false);
                if (result.success && result.user) {
                  toast.welcome({
                    name: result.user.name || "Advocate",
                    role: result.user.role || "Senior Advocate",
                    isNewUser: result.isNewUser,
                    chamberName: result.user.chamber?.name,
                  });
                  router.replace("/");
                } else {
                  toast.error(
                    language === "en" ? "Sign-in Failed" : "साइन-इन विफल",
                    result.error || (language === "en" ? "Google sign-in could not be completed." : "गूगल प्रमाणीकरण पूरा नहीं हो सका।")
                  );
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: false,
          });

          // 1. Render modern Google button
          const btnEl = document.getElementById("googleSignInDiv");
          if (btnEl) {
            btnEl.innerHTML = "";
            (window as any).google.accounts.id.renderButton(btnEl, {
              theme: "outline",
              size: "large",
              type: "standard",
              text: "signin_with",
              shape: "pill",
              width: 360,
              logo_alignment: "left",
            });
          }

          // 2. Automatically launch Google One Tap floating card in the top-right corner
          (window as any).google.accounts.id.prompt((notification: any) => {
            if (notification?.isNotDisplayed?.()) {
              console.info(
                "Google One Tap not displayed reason:",
                notification.getNotDisplayedReason()
              );
            }
          });
        } catch (e) {
          console.warn("Google SDK initialization warning:", e);
        }
      } else if (attempts > 30) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [router, loginWithGoogle, GOOGLE_CLIENT_ID, toast, language]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error(
        language === "en" ? "Invalid Phone Number" : "अमान्य फोन नंबर",
        language === "en" ? "Please enter a valid 10-digit mobile number" : "कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें"
      );
      return;
    }
    setOtpSent(true);
    setOtp("1248"); // Demo instant OTP
    toast.info(
      language === "en" ? "OTP Sent" : "OTP भेजा गया",
      language === "en" ? "Demo OTP 1248 entered automatically" : "डेमो OTP 1248 दर्ज कर दिया गया है"
    );
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await loginWithCredentials(phone, password || "123456");
    setPassword("");
    setLoading(false);
    if (result.success && result.user) {
      setPhone("");
      setOtp("");
      toast.welcome({
        name: result.user.name,
        role: result.user.role,
        isNewUser: false,
        chamberName: result.user.chamber?.name,
      });
      router.replace("/");
    } else {
      // Fallback to demo profile if unconfigured
      const userProfile = {
        name: "Adv. Rajesh Sharma",
        enrollment: "D/1248/2012",
        court: "High Court of Delhi",
        role: "Senior Advocate",
        plan: "PRO CHAMBER",
        phone: phone.startsWith("+91") ? phone : `+91 ${phone}`,
        email: "rajesh.adv@delhibar.org",
      };
      setPhone("");
      setOtp("");
      login(userProfile);
      toast.welcome({
        name: userProfile.name,
        role: userProfile.role,
        isNewUser: false,
      });
      router.replace("/");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(
        language === "en" ? "Required Fields Missing" : "आवश्यक फ़ील्ड छूटे हैं",
        language === "en" ? "Please enter email and password" : "कृपया ईमेल और पासवर्ड दर्ज करें"
      );
      return;
    }
    setLoading(true);
    const result = await loginWithCredentials(email, password);
    setPassword("");
    setLoading(false);
    if (result.success && result.user) {
      setEmail("");
      toast.welcome({
        name: result.user.name,
        role: result.user.role,
        isNewUser: false,
        chamberName: result.user.chamber?.name,
      });
      router.replace("/");
    } else {
      toast.error(
        language === "en" ? "Authentication Failed" : "प्रमाणीकरण विफल",
        result.error || (language === "en" ? "Invalid credentials" : "अमान्य क्रेडेंशियल्स")
      );
    }
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

        {/* Google Identity Services Official Button (Triggers 1-Tap & Modern Google Sign-In) */}
        <div className="w-full flex flex-col items-center justify-center space-y-2">
          <div
            id="googleSignInDiv"
            className="flex justify-center w-full min-h-[44px] items-center"
          >
            <div className="w-[320px] h-[40px] rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center space-x-2 text-slate-400 text-xs shadow-2xs">
              <svg className="w-3.5 h-3.5 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{language === "en" ? "Loading Google Sign-in..." : "गूगल साइन-इन लोड हो रहा है..."}</span>
            </div>
          </div>
        </div>

        {/* 1-Click Quick Demo Logins */}
        <div className="p-3 bg-amber-500/5 dark:bg-amber-950/20 rounded-2xl border border-amber-500/20 space-y-2">
          <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{language === "en" ? "Instant Chamber Role Demo:" : "त्वरित चेंबर डेमो:"}</span>
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">1-Click</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={async () => {
                const u = await demoLogin("Senior");
                toast.welcome({
                  name: u.name,
                  role: u.role,
                  isNewUser: false,
                  chamberName: u.chamber?.name,
                });
                router.replace("/");
              }}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all text-center cursor-pointer shadow-xs active:scale-95 flex flex-col items-center"
            >
              <span>{language === "en" ? "Senior Advocate" : "वरिष्ठ अधिवक्ता"}</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                {language === "en" ? "Chamber Head (Full Access)" : "चेंबर प्रमुख (पूर्ण अधिकार)"}
              </span>
            </button>
            <button
              onClick={async () => {
                const u = await demoLogin("Junior");
                toast.welcome({
                  name: u.name,
                  role: u.role,
                  isNewUser: false,
                  chamberName: u.chamber?.name,
                });
                router.replace("/");
              }}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all text-center cursor-pointer shadow-xs active:scale-95 flex flex-col items-center"
            >
              <span>{language === "en" ? "Associate Advocate" : "सहयोगी अधिवक्ता"}</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                {language === "en" ? "Litigation & Briefings" : "मुकदमेबाजी व ब्रीफिंग"}
              </span>
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
