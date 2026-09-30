"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicLandingPage } from "@/components/PublicLandingPage";
import { useAuth } from "@/context/AuthContext";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // 1. Auth routes (distraction-free, no sidebar or navbar)
  const isAuthRoute = pathname.startsWith("/auth/");
  if (isAuthRoute) {
    return <main className="flex-1 min-h-screen w-full">{children}</main>;
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
        <main className="flex-1 w-full">{children}</main>
      </div>
    );
  }

  // 3. Homepage (root '/')
  if (pathname === "/") {
    if (!isAuthenticated) {
      return (
        <div className="flex flex-col min-h-screen w-full">
          <PublicNavbar />
          <main className="flex-1 w-full">
            <PublicLandingPage />
          </main>
        </div>
      );
    }
    // Authenticated homepage -> Chamber workspace
    return (
      <div className="flex min-h-screen w-full">
        <Navigation />
        <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
          {children}
        </main>
      </div>
    );
  }

  // 4. All other chamber routes (/cases, /drafts, /cause-list, /calendar, /team, /finance, /sync, /settings)
  const isDrafts = pathname.startsWith("/drafts");

  return (
    <div className={`flex w-full ${isDrafts ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <Navigation />
      <main className={`flex-1 min-w-0 flex flex-col ${isDrafts ? "h-screen overflow-hidden" : "min-h-screen overflow-x-hidden"}`}>
        {children}
      </main>
    </div>
  );
}
