"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Scale,
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  FileText,
  FileEdit,
  DollarSign,
  RefreshCw,
  Settings,
  Menu,
  X,
  ShieldCheck,
  Search,
  Calendar,
  Users,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  Calculator,
  Sparkles,
  LogIn,
  LogOut,
  Languages,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { QuickSearchDialog } from "./QuickSearchDialog";
import { NotificationCenter } from "./NotificationCenter";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("advocase_sidebar_collapsed");
    if (saved === "true") {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("advocase_sidebar_collapsed", String(next));
      return next;
    });
  };

  const toggleLanguage = () => {
    const next = language === "en" ? "hi" : "en";
    setLanguage(next);
  };

  const handleSignOut = () => {
    logout();
    router.push("/auth/login");
  };

  const fetchUnread = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success && typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 45000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Chamber workspace links (Secure)
  const chamberLinks = [
    { label: t("dailyDiary"), href: "/", icon: LayoutDashboard, color: "text-blue-500 dark:text-blue-400" },
    { label: t("courtCalendar"), href: "/calendar", icon: Calendar, color: "text-purple-500 dark:text-purple-400" },
    { label: t("chamberTeam"), href: "/team", icon: Users, color: "text-teal-500 dark:text-teal-400" },
    { label: t("casesDirectory"), href: "/cases", icon: Briefcase, color: "text-amber-500 dark:text-amber-400" },
    { label: t("addNewCase"), href: "/cases/new", icon: PlusCircle, color: "text-emerald-500 dark:text-emerald-400" },
    { label: t("dailyCauseList"), href: "/cause-list", icon: FileText, color: "text-sky-500 dark:text-sky-400" },
    { label: t("legalDrafting"), href: "/drafts", icon: FileEdit, badge: "Word/Docs", color: "text-fuchsia-500 dark:text-fuchsia-400" },
    { label: t("feeLedger"), href: "/finance", icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400" },
    { label: t("ecourtsSync"), href: "/sync", icon: RefreshCw, color: "text-indigo-500 dark:text-indigo-400" },
  ];

  // Public tools & knowledge (No login needed)
  const publicLinks = [
    { label: t("bareActs"), href: "/bare-acts", icon: BookOpen, tag: "Free", color: "text-blue-500 dark:text-blue-400" },
    { label: t("legalCalculators"), href: "/calculators", icon: Calculator, tag: "Free", color: "text-emerald-500 dark:text-emerald-400" },
    { label: t("pricingPlans"), href: "/pricing", icon: Sparkles, tag: "₹333/mo", color: "text-amber-500 dark:text-amber-400" },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-zinc-950/95 text-zinc-900 dark:text-zinc-100 border-b border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-md sticky top-0 z-50 no-print print:hidden">
        <Link href="/" className="flex items-center space-x-2.5">
          <img
            src="/logo.png"
            alt="Advocase Logo"
            className="w-8 h-8 rounded-xl object-contain shadow-xs"
          />
          <div>
            <span className="font-bold text-base tracking-tight block leading-tight text-zinc-950 dark:text-white">Advocase Web</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
              {language === "en" ? "DIGITAL COURT MUNSHI" : "डिजिटल कोर्ट मुंशी"}
            </span>
          </div>
        </Link>
        <div className="flex items-center space-x-1">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors flex items-center space-x-1"
            title="Toggle English / Hindi"
          >
            <Languages className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{language === "en" ? "हिन्दी" : "EN"}</span>
          </button>

          {/* Theme Toggle Button */}
          <ThemeToggle variant="icon" className="p-1.5" />

          {/* Mobile Notification Bell (if authenticated) */}
          {isAuthenticated ? (
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              aria-label="Chamber alerts"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
              )}
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
              title="Sign In"
            >
              <LogIn className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
            aria-label="Quick search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar & Mobile Drawer */}
      <aside
        className={`no-print print:hidden fixed md:sticky top-0 left-0 z-40 h-screen bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md text-zinc-900 dark:text-zinc-100 flex flex-col border-r border-zinc-200/80 dark:border-zinc-800/80 transition-all duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "md:w-20" : "md:w-72"}`}
      >
        {/* Brand Header */}
        <div className={`border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between transition-all ${collapsed ? "p-3.5 justify-center flex-col gap-2" : "p-4"}`}>
          <Link href="/" className="flex items-center space-x-3 group min-w-0" title="Advocase Home">
            <img
              src="/logo.png"
              alt="Advocase Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-xs shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-tight text-zinc-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                    Advocase
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800 shrink-0">
                    {isAuthenticated ? (language === "en" ? "Chamber" : "चेंबर") : (language === "en" ? "Public" : "पब्लिक")}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                  {language === "en" ? "Court Diary & Litigation" : "कोर्ट डायरी व मुकदमे"}
                </p>
              </div>
            )}
          </Link>

          {/* Header Action Controls */}
          <div className={`flex items-center ${collapsed ? "flex-col space-y-1.5" : "space-x-1"}`}>
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className={`p-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center ${
                collapsed ? "justify-center w-8 h-8" : "px-2 py-1 space-x-1 border border-zinc-200 dark:border-zinc-800"
              }`}
              title={`Switch to ${language === "en" ? "Hindi (हिन्दी)" : "English"}`}
            >
              <Languages className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              {!collapsed && <span>{language === "en" ? "HI" : "EN"}</span>}
            </button>

            {/* Theme Switcher */}
            <ThemeToggle
              variant="icon"
              className={collapsed ? "justify-center w-8 h-8 p-1.5" : "p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg"}
            />

            {/* Notification Bell Trigger (Only if authenticated) */}
            {isAuthenticated && (
              <button
                onClick={() => setNotifOpen(true)}
                className="relative p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                title={`Chamber Alerts ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
                )}
              </button>
            )}

            {/* Sidebar Collapse Toggle Button (Desktop Only) */}
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              title={collapsed ? t("expandSidebar") : t("collapseSidebar")}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Search Trigger */}
        <div className={`pt-3 pb-1 ${collapsed ? "px-2" : "px-4"}`}>
          {collapsed ? (
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-center p-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/70 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200/80 dark:border-zinc-800/80 transition-colors"
              title={`${t("quickSearch")} (Ctrl+K)`}
            >
              <Search className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/70 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/80 text-xs transition-colors min-w-0 group text-left"
              title={`${t("quickSearch")} (Ctrl+K)`}
            >
              <span className="flex items-center space-x-2 min-w-0 flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                <span className="truncate block">{t("searchPlaceholder")}</span>
              </span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                Ctrl+K
              </kbd>
            </button>
          )}
        </div>

        {/* Advocate Profile Summary / Authentication State */}
        <div className={`my-2 ${collapsed ? "px-2" : "mx-4"}`}>
          {collapsed ? (
            <div
              className={`w-full p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                isAuthenticated
                  ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                  : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500"
              }`}
              title={isAuthenticated ? `${user?.name} (${user?.enrollment})` : t("chamberGuest")}
              onClick={() => router.push(isAuthenticated ? "/settings" : "/auth/login")}
            >
              {isAuthenticated ? (
                <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.name ? user.name.split(" ").slice(-1)[0][0] : "A"}
                </div>
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
          ) : isAuthenticated ? (
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between group">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {user?.name ? user.name.split(" ").slice(-1)[0][0] : "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {user?.name || (language === "en" ? "Adv. Rajesh Sharma" : "अधिवक्ता राजेश शर्मा")}
                    </h4>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                    {user?.role || t("seniorAdvocate")} • {user?.enrollment || "D/1248/2012"}
                  </p>
                </div>
              </div>
              <Link
                href="/auth/login"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                title={t("switchProfile")}
              >
                <LogIn className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">{t("chamberGuest")}</h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{t("signInToUnlock")}</p>
                </div>
              </div>
              <Link
                href="/auth/login"
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-[11px] font-semibold transition-colors shrink-0"
              >
                {t("login")}
              </Link>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Links */}
        <nav className={`flex-1 space-y-4 overflow-y-auto ${collapsed ? "px-2 py-1" : "px-3 py-1"}`}>
          {/* Section: Chamber Workspace (Secure) */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
                <span>{t("chamberWorkspace")}</span>
                {!isAuthenticated && (
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium flex items-center space-x-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{t("protected")}</span>
                  </span>
                )}
              </div>
            )}
            <div className="space-y-0.5">
              {chamberLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center justify-between rounded-xl font-medium transition-all ${
                      collapsed
                        ? "justify-center p-2.5 my-1"
                        : "px-3 py-2 text-xs"
                    } ${
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-950 dark:text-zinc-50 font-semibold border border-zinc-200/80 dark:border-zinc-700/60"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex items-center min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${item.color} ${!collapsed ? "mr-2.5" : ""}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!collapsed && (
                      <div className="flex items-center space-x-1">
                        {!isAuthenticated && (
                          <Lock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                        )}
                        {item.badge && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section: Public Legal Tools & Knowledge (No Login Required) */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
                <span>{t("legalToolsLibrary")}</span>
                <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1 rounded border border-zinc-200 dark:border-zinc-700 font-medium">
                  {t("publicTag")}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {publicLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center justify-between rounded-xl font-medium transition-all ${
                      collapsed
                        ? "justify-center p-2.5 my-1"
                        : "px-3 py-2 text-xs"
                    } ${
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-950 dark:text-zinc-50 font-semibold border border-zinc-200/80 dark:border-zinc-700/60"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex items-center min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${item.color} ${!collapsed ? "mr-2.5" : ""}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!collapsed && item.tag && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {item.tag === "Free" ? t("freeBadge") : item.tag}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section: Settings */}
          <div className="pt-1">
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              title={collapsed ? t("chamberSettings") : undefined}
              className={`flex items-center rounded-xl font-medium transition-all ${
                collapsed ? "justify-center p-2.5" : "px-3 py-2 text-xs"
              } ${
                pathname === "/settings"
                  ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-950 dark:text-zinc-50 font-semibold border border-zinc-200/80 dark:border-zinc-700/60"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
              }`}
            >
              <Settings className={`w-4 h-4 shrink-0 ${pathname === "/settings" ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-500"} ${!collapsed ? "mr-2.5" : ""}`} />
              {!collapsed && <span className="truncate">{t("chamberSettings")}</span>}
            </Link>
          </div>
        </nav>

        {/* Footer Status & Sign In/Out */}
        <div className={`border-t border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 ${collapsed ? "p-3 text-center" : "p-3.5 space-y-2 text-xs"}`}>
          {collapsed ? (
            <div className="flex flex-col items-center space-y-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Database Synced" />
              <button
                onClick={toggleCollapse}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                    {language === "en" ? "SQLite Synced" : "डेटाबेस सिंक"}
                  </span>
                </span>
                <Link
                  href="/pricing"
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  {language === "en" ? "UPGRADE" : "अपग्रेड"}
                </Link>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 pt-0.5">
                <span>Advocase Web v2.6</span>
                {isAuthenticated ? (
                  <button
                    onClick={handleSignOut}
                    className="text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center space-x-1 transition-colors"
                    title="Sign out of chamber"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{t("logout")}</span>
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>{t("login")}</span>
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* Global Quick Search Modal */}
      <QuickSearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Chamber Notification Center Drawer */}
      <NotificationCenter
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUpdateUnreadCount={setUnreadCount}
      />
    </>
  );
}
