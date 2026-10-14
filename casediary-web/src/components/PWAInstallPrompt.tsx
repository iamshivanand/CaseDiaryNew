"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Sparkles, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function PWAInstallPrompt() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show if user dismissed recently
      const dismissed = localStorage.getItem("advocase_pwa_dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("advocase_pwa_dismissed", "true");
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white border border-amber-500/30 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm text-white">
              {language === "en" ? "Install Advocase App" : "एडवोकेस ऐप इंस्टॉल करें"}
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              PWA
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            {language === "en"
              ? "Fast 1-tap access on your home screen with offline diary support & court cause lists."
              : "होम स्क्रीन से 1-टैप में खोलें। ऑफलाइन डायरी व दैनिक कॉज लिस्ट सपोर्ट।"}
          </p>
          <div className="flex items-center space-x-2 mt-3">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Add to Home Screen" : "होम स्क्रीन पर जोड़ें"}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
            >
              {language === "en" ? "Maybe Later" : "बाद में"}
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
