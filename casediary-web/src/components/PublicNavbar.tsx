"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calculator,
  Sparkles,
  Languages,
  Menu,
  X,
  ArrowRight,
  Search,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

export function PublicNavbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en");
  };

  const navLinks = [
    { label: t("bareActs"), href: "/bare-acts", icon: BookOpen, color: "text-blue-600 dark:text-blue-400" },
    { label: t("legalCalculators"), href: "/calculators", icon: Calculator, color: "text-emerald-600 dark:text-emerald-400" },
    { label: t("pricingPlans"), href: "/pricing", icon: Sparkles, color: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between">
        {/* Brandmark */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-lg"
          >
            <img
              src="/logo.png"
              alt="Advocase"
              className="w-8 h-8 rounded-lg object-contain ring-1 ring-zinc-200 dark:ring-zinc-800 transition-transform group-hover:scale-105"
            />
            <span className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
              Advocase
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-2 transition-all ${
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${link.color}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Bare Acts Search Shortcut */}
          <Link
            href="/bare-acts"
            className="hidden xl:flex items-center space-x-2 ml-1 px-2.5 py-1.5 rounded-lg bg-zinc-100/60 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 border border-zinc-200/60 dark:border-zinc-800/60 text-xs transition-colors"
            title="Search Bare Acts"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px]">Search...</span>
            <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400">
              Ctrl+K
            </kbd>
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-2 sm:space-x-2.5">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Switch Language / भाषा बदलें"
          >
            <Languages className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="tracking-wide text-[11px] font-semibold">{language === "en" ? "हिन्दी" : "EN"}</span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle
            variant="icon"
            className="p-1.5 border border-zinc-200/70 dark:border-zinc-800 rounded-lg"
          />

          {isAuthenticated ? (
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-medium text-xs flex items-center space-x-1.5 transition-all shadow-xs active:scale-[0.98]"
            >
              <span>Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/auth/login"
                className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white text-xs font-medium transition-colors"
              >
                {t("login")}
              </Link>
              <Link
                href="/auth/register"
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-sm shadow-emerald-950/20 active:scale-[0.98]"
              >
                <span>Start Free</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Controls */}
        <div className="flex items-center space-x-1.5 md:hidden">
          <ThemeToggle
            variant="icon"
            className="p-1.5 border border-zinc-200/80 dark:border-zinc-750 rounded-lg"
          />

          <button
            onClick={toggleLanguage}
            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 flex items-center space-x-1"
          >
            <Languages className="w-3 h-3 text-zinc-500" />
            <span className="text-[11px] font-semibold">{language === "en" ? "हिन्दी" : "EN"}</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 h-11 px-3.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${link.color}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <Link
              href="/bare-acts"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 h-11 px-3.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <Search className="w-4 h-4 text-zinc-400" />
              <span>Search Bare Acts</span>
            </Link>
          </div>

          <div className="border-t border-zinc-200/80 dark:border-zinc-800 pt-3 flex flex-col space-y-2">
            {isAuthenticated ? (
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-11 flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-medium text-xs transition-colors shadow-xs"
              >
                Workspace
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-11 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-medium border border-zinc-200/80 dark:border-zinc-800"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-11 flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs transition-all shadow-sm shadow-emerald-950/20 active:scale-[0.98]"
                >
                  Start Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
