"use client";

import React, { useEffect, useState } from "react";
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  ShieldCheck,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  User,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface ActiveSessionsRadarProps {
  isSenior?: boolean;
}

export function ActiveSessionsRadar({ isSenior = false }: ActiveSessionsRadarProps) {
  const { language } = useLanguage();
  const [sessions, setSessions] = useState<any[]>([]);
  const [seats, setSeats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/team/sessions");
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setSeats(data.seats || null);
      } else {
        setError(data.error || "Failed to load active sessions.");
      }
    } catch (err) {
      setError("Network error fetching active sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: string, deviceName: string) => {
    const confirmMsg = language === "en"
      ? `Are you sure you want to revoke session on "${deviceName}"? That device will be immediately logged out.`
      : `क्या आप "${deviceName}" पर सत्र समाप्त करना चाहते हैं? वह डिवाइस तुरंत लॉग आउट हो जाएगा।`;

    if (!confirm(confirmMsg)) return;

    setRevokingId(sessionId);
    try {
      const res = await fetch(`/api/team/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchSessions();
      } else {
        alert(data.error || "Failed to revoke session");
      }
    } catch (err) {
      alert("Network error revoking session");
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("phone") || lower.includes("android") || lower.includes("mobile")) {
      return <Smartphone className="w-4 h-4 text-emerald-500" />;
    }
    if (lower.includes("pad") || lower.includes("tablet")) {
      return <Tablet className="w-4 h-4 text-blue-500" />;
    }
    if (lower.includes("pc") || lower.includes("windows") || lower.includes("mac") || lower.includes("laptop")) {
      return <Laptop className="w-4 h-4 text-amber-500" />;
    }
    return <Globe className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Seat Meter Header */}
      {seats && (
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {language === "en" ? "Chamber Seat Radar:" : "चेंबर सीट रडार:"}
              </span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase text-[11px]">
                {seats.planTier} Plan
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {seats.chamberName} • {seats.activeAdvocatesCount} {language === "en" ? "Advocates Online across" : "वकील ऑनलाइन"} {seats.activeDevicesCount} {language === "en" ? "Active Devices" : "डिवाइस"}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-zinc-400 block font-medium">
                {language === "en" ? "Seat Allowance" : "सीट सीमा"}
              </span>
              <span className="font-bold text-sm text-zinc-900 dark:text-white">
                {seats.activeAdvocatesCount} / {seats.maxSeats} {language === "en" ? "Seats Used" : "सीटें प्रयुक्त"}
              </span>
            </div>
            <button
              onClick={fetchSessions}
              className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              title="Refresh Radar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {loading && sessions.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
          <span>{language === "en" ? "Scanning active chamber sessions..." : "सक्रिय सत्र स्कैन किए जा रहे हैं..."}</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-6 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          {language === "en" ? "No active sessions found." : "कोई सक्रिय सत्र नहीं मिला।"}
        </div>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                sess.isCurrentDevice
                  ? "bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/20"
                  : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                  {getDeviceIcon(sess.deviceName)}
                </div>

                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {sess.deviceName}
                    </span>
                    {sess.isCurrentDevice && (
                      <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                        {language === "en" ? "THIS DEVICE" : "यह डिवाइस"}
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 font-mono">
                      IP: {sess.ipAddress || "127.0.0.1"}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    <b className="text-zinc-700 dark:text-zinc-300">{sess.userName}</b> ({sess.userRole})
                    {sess.lastHeartbeatAt && (
                      <span className="ml-2">
                        • {language === "en" ? "Last active:" : "अंतिम सक्रिय:"} {formatDate(sess.lastHeartbeatAt)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleRevoke(sess.id, sess.deviceName)}
                  disabled={revokingId === sess.id}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-800/60 flex items-center space-x-1.5 transition-all cursor-pointer"
                  title="Revoke and force logout"
                >
                  {revokingId === sess.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{sess.isCurrentDevice ? (language === "en" ? "Sign Out Device" : "डिवाइस साइन आउट करें") : (language === "en" ? "Disconnect Device" : "डिवाइस हटाएं")}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
