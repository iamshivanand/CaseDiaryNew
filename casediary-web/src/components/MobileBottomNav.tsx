"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileEdit,
  Calendar,
  Users,
  Settings,
  Plus,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();

  // Hide on public landing, auth pages, or print views
  if (!isAuthenticated) return null;
  if (pathname.startsWith("/auth/")) return null;

  const navItems = [
    {
      id: "home",
      label: language === "en" ? "Diary" : "डायरी",
      href: "/",
      icon: LayoutDashboard,
      isActive: pathname === "/",
    },
    {
      id: "cases",
      label: language === "en" ? "Cases" : "मुकदमे",
      href: "/cases",
      icon: Briefcase,
      isActive: pathname.startsWith("/cases"),
    },
    {
      id: "drafts",
      label: language === "en" ? "Drafts" : "ड्राफ्ट",
      href: "/drafts",
      icon: FileEdit,
      isActive: pathname.startsWith("/drafts"),
    },
    {
      id: "calendar",
      label: language === "en" ? "Calendar" : "कैलेंडर",
      href: "/calendar",
      icon: Calendar,
      isActive: pathname.startsWith("/calendar"),
    },
    {
      id: "chamber",
      label: language === "en" ? "Chamber" : "चेंबर",
      href: "/team",
      icon: Users,
      isActive: pathname.startsWith("/team") || pathname.startsWith("/settings"),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] no-print print:hidden pb-[env(safe-area-inset-bottom,8px)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all select-none group relative ${
                active
                  ? "text-amber-600 dark:text-amber-400 font-bold scale-105"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {active && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-amber-500 shadow-xs" />
              )}
              <div
                className={`p-1 rounded-xl transition-all ${
                  active
                    ? "bg-amber-500/15 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
