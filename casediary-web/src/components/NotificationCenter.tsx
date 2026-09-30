"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  X,
  CheckCheck,
  Scale,
  Clock,
  IndianRupee,
  AlertTriangle,
  ExternalLink,
  Users,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: "hearing" | "team" | "fee" | "limitation" | "system";
  case_id?: number;
  action_url?: string;
  action_label?: string;
  is_urgent?: boolean;
  is_read: number;
  timestamp?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUnreadCount?: (count: number) => void;
}

export function NotificationCenter({
  isOpen,
  onClose,
  onUpdateUnreadCount,
}: NotificationCenterProps) {
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        if (onUpdateUnreadCount) {
          const effectiveUnread = (data.notifications || []).filter(
            (n: NotificationItem) => !n.is_read && !dismissedIds.has(n.id)
          ).length;
          onUpdateUnreadCount(effectiveUnread);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      const allIds = new Set(notifications.map((n) => n.id));
      setDismissedIds(allIds);
      if (onUpdateUnreadCount) onUpdateUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      const remainingUnread = notifications.filter(
        (n) => !n.is_read && !next.has(n.id)
      ).length;
      if (onUpdateUnreadCount) onUpdateUnreadCount(remainingUnread);
      return next;
    });
  };

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (dismissedIds.has(n.id)) return false;
    if (filter === "all") return true;
    return n.category === filter;
  });

  const unreadCount = notifications.filter(
    (n) => !n.is_read && !dismissedIds.has(n.id)
  ).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "hearing":
        return <Scale className="w-4 h-4 text-amber-500" />;
      case "team":
        return <Users className="w-4 h-4 text-indigo-500" />;
      case "fee":
        return <IndianRupee className="w-4 h-4 text-emerald-500" />;
      case "limitation":
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl border-l border-zinc-200/80 dark:border-zinc-800 flex flex-col z-10 animate-slide-in-right">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
                <span>{language === "en" ? "Chamber Alerts" : "चेंबर अलर्ट"}</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
                    {unreadCount} {language === "en" ? "new" : "नए"}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {language === "en"
                  ? "Hearings, pass-overs, fees & deadlines"
                  : "सुनवाई, पास-ओवर, फीस बहीखाता व समय-सीमाएं"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="p-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center space-x-1"
                title={language === "en" ? "Mark all as read" : "सभी को पढ़ा हुआ चिह्नित करें"}
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{language === "en" ? "Read all" : "सभी पढ़ें"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex space-x-1.5 overflow-x-auto text-xs scrollbar-none">
          {[
            { key: "all", label: language === "en" ? "All" : "सभी" },
            { key: "hearing", label: language === "en" ? "Hearings" : "सुनवाई" },
            { key: "team", label: language === "en" ? "Court Duties" : "कोर्ट ड्यूटियां" },
            { key: "fee", label: language === "en" ? "Fee Dues" : "फीस बकाया" },
            { key: "limitation", label: language === "en" ? "Limitations" : "परिसीमाएं" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                filter === tab.key
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-20 text-center text-zinc-400 text-xs">
              {language === "en" ? "Loading chamber alerts..." : "चेंबर अलर्ट लोड हो रहे हैं..."}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-24 text-center space-y-3 text-zinc-500">
              <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {language === "en" ? "You're all caught up!" : "सभी कार्य अद्यतन हैं!"}
                </p>
                <p className="text-xs text-zinc-400">
                  {language === "en"
                    ? "No pending court hearings, pass-overs, or alerts in this view."
                    : "इस दृश्य में कोई लंबित सुनवाई, पास-ओवर अथवा अलर्ट नहीं है।"}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                  n.is_urgent
                    ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                    : "bg-white dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                      {getCategoryIcon(n.category)}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">
                        {n.title}
                      </h4>
                      {n.timestamp && (
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 block">
                          {n.timestamp}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDismiss(n.id)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 text-xs"
                    title={language === "en" ? "Dismiss alert" : "हटाएं"}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 pl-8 leading-relaxed">
                  {n.body}
                </p>

                {n.action_url && (
                  <div className="pl-8 pt-1">
                    <Link
                      href={n.action_url}
                      onClick={onClose}
                      className="inline-flex items-center space-x-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                    >
                      <span>{n.action_label || (language === "en" ? "View Details" : "विवरण देखें")}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 text-center text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50">
          <span>{language === "en" ? "Advocase Real-Time Chamber Watchdog" : "एडवोकेस रियल-टाइम चेंबर वॉचडॉग"}</span>
        </div>
      </div>
    </div>
  );
}

