"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Zap,
  Shield,
  Building,
  Scale,
  Sparkles,
  HelpCircle,
  ArrowRight,
  PhoneCall,
  Download,
  Users,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PricingPage() {
  const { t, language } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-12 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{language === "en" ? "Simple, Transparent Chamber Pricing" : "सरल, पारदर्शी चेंबर शुल्क"}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-950 dark:text-white tracking-tight">
          {language === "en" ? "Invest in Your Chamber's Productivity" : "अपने चेंबर की कार्यकुशलता में निवेश करें"}
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {language === "en"
            ? "From independent trial advocates to multi-lawyer litigation chambers. No setup fees, no lock-ins, and 100% offline-ready mobile sync."
            : "स्वतंत्र विचारणीय अधिवक्ताओं से लेकर बहु-सदस्यीय कानूनी चेंबर तक। कोई छुपा शुल्क नहीं, कोई लॉक-इन नहीं, और १००% ऑफलाइन मोबाइल सिंक।"}
        </p>

        {/* Billing Toggle */}
        <div className="pt-2 flex items-center justify-center">
          <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center space-x-1 text-xs font-medium">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-xl transition-all ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              {language === "en" ? "Monthly Billing" : "मासिक भुगतान"}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all ${
                billingCycle === "yearly"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <span>{language === "en" ? "Annual Billing" : "वार्षिक भुगतान"}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider ${
                billingCycle === "yearly"
                  ? "bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}>
                {language === "en" ? "Save 33%" : "३३% बचत"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {/* Tier 1: Solo Starter */}
        <div className="bg-white dark:bg-zinc-900 p-7 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
                {language === "en" ? "Solo Starter" : "सोलो स्टार्टर"}
              </h3>
              <p className="text-xs text-zinc-500">
                {language === "en" ? "For newly enrolled advocates and junior litigators." : "नव-नामांकित अधिवक्ताओं एवं कनिष्ठ वकीलों हेतु।"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-bold text-zinc-950 dark:text-white">₹0</span>
                <span className="text-xs text-zinc-400">{language === "en" ? "/ forever" : "/ सदैव"}</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                {language === "en" ? "Free access to all core essentials" : "सभी बुनियादी सुविधाओं का निःशुल्क उपयोग"}
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {language === "en" ? (
                    <>Up to <b className="text-zinc-800 dark:text-zinc-200">10 Active Cases</b></>
                  ) : (
                    <>अधिकतम <b className="text-zinc-800 dark:text-zinc-200">१० सक्रिय मुकदमे</b></>
                  )}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{language === "en" ? "Daily Court Cause List View" : "दैनिक कोर्ट कॉज लिस्ट दर्शन"}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{language === "en" ? "Free Public Bare Acts & Calculators" : "निःशुल्क बेयर एक्ट्स व कैलकुलेटर"}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{language === "en" ? "Mobile App Offline Diary Sync" : "मोबाइल ऐप ऑफलाइन डायरी सिंक"}</span>
              </li>
            </ul>
          </div>

          <Link
            href="/auth/register?plan=free"
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-xs text-center transition-all"
          >
            {language === "en" ? "Get Started Free" : "निःशुल्क शुरू करें"}
          </Link>
        </div>

        {/* Tier 2: Pro Advocate (Featured) */}
        <div className="bg-zinc-950 text-white dark:bg-zinc-900 p-7 rounded-2xl border-2 border-zinc-900 dark:border-zinc-700 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden ring-1 ring-amber-500/20">
          <div className="absolute top-4 right-4 bg-zinc-800 text-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-700 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide">
            {language === "en" ? "Most Popular" : "सर्वाधिक लोकप्रिय"}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>{language === "en" ? "Pro Advocate" : "प्रो एडवोकेट"}</span>
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              </h3>
              <p className="text-xs text-zinc-400">
                {language === "en" ? "For active trial advocates and appellate practitioners." : "सक्रिय विचारणीय अधिवक्ताओं एवं उच्च न्यायालय प्रैक्टिशनर्स हेतु।"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-bold text-white">
                  {billingCycle === "yearly" ? "₹333" : "₹499"}
                </span>
                <span className="text-xs text-zinc-400">{language === "en" ? "/ month" : "/ माह"}</span>
              </div>
              <div className="text-[11px] text-amber-400 font-medium">
                {billingCycle === "yearly"
                  ? (language === "en" ? "Billed annually at ₹3,999 (Save ₹1,989)" : "वार्षिक बिल ₹३,९९९ (बचत ₹१,९८९)")
                  : (language === "en" ? "Billed monthly" : "मासिक बिल")}
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-zinc-300 pt-3 border-t border-zinc-800">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {language === "en" ? (
                    <><b className="text-white">Unlimited Active Cases</b> & Documents</>
                  ) : (
                    <><b className="text-white">असीमित सक्रिय मुकदमे</b> व दस्तावेज</>
                  )}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {language === "en" ? (
                    <><b className="text-white">eCourts Auto-Sync</b> for Daily Cause Lists</>
                  ) : (
                    <><b className="text-white">ई-कोर्ट्स ऑटो-सिंक</b> दैनिक कॉज लिस्ट हेतु</>
                  )}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {language === "en" ? (
                    <><b className="text-white">TipTap Legal Drafting Studio</b></>
                  ) : (
                    <><b className="text-white">टिपटैप कानूनी ड्राफ्टिंग स्टूडियो</b></>
                  )}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {language === "en" ? (
                    <><b className="text-white">WhatsApp Client Updates</b></>
                  ) : (
                    <><b className="text-white">व्हाट्सएप मुवक्किल अपडेट</b></>
                  )}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{language === "en" ? "Word (.doc) & Courtroom Print PDF Exports" : "वर्ड (.doc) व कोर्ट प्रिंट पीडीएफ एक्सपोर्ट"}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{language === "en" ? "Automated Statutory Limitation Alerts" : "स्वचालित वैधानिक परिसीमा अलर्ट"}</span>
              </li>
            </ul>
          </div>

          <Link
            href="/auth/register?plan=pro"
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs text-center transition-all flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <span>{language === "en" ? "Upgrade to Pro Advocate" : "प्रो एडवोकेट में अपग्रेड करें"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tier 3: Chamber Enterprise */}
        <div className="bg-white dark:bg-zinc-900 p-7 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
                {language === "en" ? "Chamber Enterprise" : "चेंबर एंटरप्राइज"}
              </h3>
              <p className="text-xs text-zinc-500">
                {language === "en" ? "For multi-lawyer chambers, senior counsels & law firms." : "बहु-अधिवक्ता चेंबर, वरिष्ठ वकीलों व फर्मों हेतु।"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-bold text-zinc-950 dark:text-white">
                  {billingCycle === "yearly" ? "₹999" : "₹1,499"}
                </span>
                <span className="text-xs text-zinc-400">{language === "en" ? "/ month" : "/ माह"}</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                {billingCycle === "yearly"
                  ? (language === "en" ? "Billed annually at ₹11,999 (Save ₹5,989)" : "वार्षिक बिल ₹११,९९९ (बचत ₹५,९८९)")
                  : (language === "en" ? "Billed monthly" : "मासिक बिल")}
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {language === "en" ? (
                    <><b className="text-zinc-800 dark:text-zinc-200">Everything in Pro Advocate</b></>
                  ) : (
                    <><b className="text-zinc-800 dark:text-zinc-200">प्रो एडवोकेट की सभी सुविधाएं</b></>
                  )}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {language === "en" ? (
                    <><b className="text-zinc-800 dark:text-zinc-200">Chamber Team Delegation</b> (Seniors & Munshis)</>
                  ) : (
                    <><b className="text-zinc-800 dark:text-zinc-200">चेंबर टीम कार्य-विभाजन</b> (सीनियर व मुंशी)</>
                  )}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {language === "en" ? (
                    <>Real-Time <b className="text-zinc-800 dark:text-zinc-200">Court Pass-Over Board</b></>
                  ) : (
                    <>रियल-टाइम <b className="text-zinc-800 dark:text-zinc-200">कोर्ट पास-ओवर बोर्ड</b></>
                  )}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {language === "en" ? (
                    <><b className="text-zinc-800 dark:text-zinc-200">Custom Letterhead</b> & Digital Seal</>
                  ) : (
                    <><b className="text-zinc-800 dark:text-zinc-200">कस्टम लेटरहेड</b> व डिजिटल मुहर</>
                  )}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{language === "en" ? "Shared Chamber Fee Ledger" : "साझा चेंबर फीस बहीखाता"}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{language === "en" ? "Priority 24/7 Chamber Support" : "२४/७ प्राथमिकता चेंबर सहायता"}</span>
              </li>
            </ul>
          </div>

          <Link
            href="/auth/register?plan=chamber"
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs text-center hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
          >
            {language === "en" ? "Start Chamber Trial (14 Days)" : "चेंबर ट्रायल शुरू करें (१४ दिन)"}
          </Link>
        </div>
      </div>

      {/* Tax & Invoicing Note */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 gap-2">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            {language === "en" ? (
              <><b className="text-zinc-800 dark:text-zinc-200">GST Compliant:</b> Enter your chamber GSTIN at checkout to claim 18% input tax credit (ITC).</>
            ) : (
              <><b className="text-zinc-800 dark:text-zinc-200">जीएसटी अनुपालित:</b> १८% इनपुट टैक्स क्रेडिट (ITC) क्लेम करने हेतु चेकआउट पर अपना चेंबर GSTIN दर्ज करें।</>
            )}
          </span>
        </div>
        <div className="font-medium text-zinc-500">
          {language === "en" ? "Payment via UPI, RuPay, Visa, Mastercard, NetBanking" : "भुगतान: UPI, रुपे, वीज़ा, मास्टरकार्ड, नेटबैंकिंग"}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-zinc-950 dark:text-white text-center">
          {language === "en" ? "Frequently Asked Questions" : "अक्सर पूछे जाने वाले प्रश्न (FAQ)"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-1">
            <h4 className="font-semibold text-xs sm:text-sm text-zinc-950 dark:text-white">
              {language === "en" ? "Can I access my diary offline in court without internet?" : "क्या मैं कोर्ट में बिना इंटरनेट के अपनी डायरी देख सकता हूँ?"}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {language === "en"
                ? "Yes! The Advocase mobile app is built with an offline-first SQLite database. All your cases and cause lists are cached locally on your phone so you can check hearings even inside deep court basements with zero network."
                : "हाँ! एडवोकेस मोबाइल ऐप एक ऑफलाइन-फर्स्ट SQLite डेटाबेस पर आधारित है। आपके सभी मुकदमे व कॉज लिस्ट फोन पर सुरक्षित रहते हैं, जिससे बिना नेटवर्क वाले कोर्ट बेसमेंट में भी सुनवाई जांची जा सके।"}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-1">
            <h4 className="font-semibold text-xs sm:text-sm text-zinc-950 dark:text-white">
              {language === "en" ? "How does eCourts automatic synchronization work?" : "ई-कोर्ट्स ऑटोमैटिक सिंक्रोनाइज़ेशन कैसे काम करता है?"}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {language === "en"
                ? "Advocase connects with the National Judicial Data Grid (NJDG) via CNR numbers. Every evening, your next hearing dates, business orders, and bench assignments are updated automatically without manual typing."
                : "एडवोकेस सीएनआर (CNR) नंबरों के माध्यम से राष्ट्रीय न्यायिक डेटा ग्रिड (NJDG) से जुड़ता है। हर शाम आपकी अगली तारीखें, अदालती आदेश व बेंच विवरण स्वतः अपडेट हो जाते हैं।"}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-1">
            <h4 className="font-semibold text-xs sm:text-sm text-zinc-950 dark:text-white">
              {language === "en" ? "Can multiple junior lawyers and munshis share the same chamber?" : "क्या कई जूनियर वकील और मुंशी एक ही चेंबर साझा कर सकते हैं?"}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {language === "en"
                ? "Yes, the Chamber Enterprise plan allows Senior Advocates to invite Junior Counsels and Court Munshis with role-based permissions (view, draft, attend, or manage finances)."
                : "हाँ, चेंबर एंटरप्राइज प्लान में वरिष्ठ अधिवक्ता अपने कनिष्ठ वकीलों एवं मुंशियों को भूमिका-आधारित अनुमतियों (देखना, ड्राफ्ट, उपस्थिति, या फीस प्रबंधन) के साथ जोड़ सकते हैं।"}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-1">
            <h4 className="font-semibold text-xs sm:text-sm text-zinc-950 dark:text-white">
              {language === "en" ? "Is my client and case strategy data confidential?" : "क्या मेरे मुवक्किल और मुकदमे की रणनीति का डेटा गोपनीय है?"}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {language === "en"
                ? "Advocase treats advocate-client privilege with bank-grade encryption. We never sell, index, or expose your case notes, FIR details, or fee accounts."
                : "एडवोकेस वकील-मुवक्किल विशेषाधिकार (Advocate-Client Privilege) की बैंक-स्तरीय एन्क्रिप्शन के साथ रक्षा करता है। आपकी केस टिप्पणियां, एफआईआर विवरण या फीस खाते कभी साझा नहीं किए जाते।"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
