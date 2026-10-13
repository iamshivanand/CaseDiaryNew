"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicLandingPage } from "@/components/PublicLandingPage";
import { useAuth } from "@/context/AuthContext";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // 1. Auth routes (distraction-free, no sidebar or navbar)
  const isAuthRoute = pathname.startsWith("/auth/");
  if (isAuthRoute) {
    return (
      <main className="flex-1 min-h-screen w-full">
        {children}
        <PWAInstallPrompt />
      </main>
    );
  }

  // 2. Dedicated public tool & knowledge routes (render PublicNavbar, NO sidebar)
  const isPublicToolRoute =
    pathname.startsWith("/bare-acts") ||
    pathname.startsWith("/calculators") ||
    pathname.startsWith("/pricing");

  if (isPublicToolRoute) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <PublicNavbar />
        <main className="flex-1 w-full pb-12">{children}</main>
        <PWAInstallPrompt />
      </div>
    );
  }

  // 3. Homepage (root '/')
  if (pathname === "/") {
    if (isLoading) {
      return (
        <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <p className="text-xs font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
              Verifying Chamber Session...
            </p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex flex-col min-h-screen w-full">
          <PublicNavbar />
          <main className="flex-1 w-full">
            <PublicLandingPage />
          </main>
          <PWAInstallPrompt />
        </div>
      );
    }
    // Authenticated homepage -> Chamber workspace
    return (
      <div className="flex min-h-screen w-full">
        <Navigation />
        <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden pb-20 md:pb-0">
          {children}
        </main>
        <MobileBottomNav />
        <PWAInstallPrompt />
      </div>
    );
  }

  // 4. All other chamber routes (/cases, /drafts, /cause-list, /calendar, /team, /finance, /sync, /settings)
  const isDrafts = pathname.startsWith("/drafts");

  return (
    <div className={`flex w-full ${isDrafts ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <Navigation />
      <main
        className={`flex-1 min-w-0 flex flex-col ${
          isDrafts
            ? "h-screen overflow-hidden"
            : "min-h-screen overflow-x-hidden pb-20 md:pb-0"
        }`}
      >
        {children}
      </main>
      {!isDrafts && <MobileBottomNav />}
      <PWAInstallPrompt />
    </div>
  );
}
