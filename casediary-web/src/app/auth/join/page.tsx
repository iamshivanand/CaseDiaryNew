"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/navigation";
import {
  Scale,
  Building2,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  User,
  Briefcase,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { login } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [validatingError, setValidatingError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    barCouncilNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setValidatingError("No invitation token provided. Please scan the QR code or use the link provided by your Senior Advocate.");
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/team/invite?token=${token}`);
        const data = await res.json();
        if (data.success && data.valid) {
          setInvitation(data.invitation);
          setFormData((prev) => ({
            ...prev,
            email: data.invitation.targetEmail || "",
            phone: data.invitation.targetPhone || "",
          }));
        } else {
          setValidatingError(data.error || "This invitation link is invalid or has expired.");
        }
      } catch (err: any) {
        setValidatingError("Failed to verify invitation. Please check your network connection.");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Full name is required.");
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      setFormError("Either email address or phone number is required.");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          password: formData.password,
          barCouncilNumber: formData.barCouncilNumber.trim() || undefined,
          deviceName: navigator.userAgent.includes("Mobile")
            ? "Mobile Device"
            : "Advocate Laptop / Desktop",
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Authenticate into context
        login({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role,
          barCouncilNumber: data.user.barCouncilNumber,
          chamber: data.chamber,
          token: data.token,
        });

        toast.welcome({
          name: data.user.name,
          role: data.user.role,
          isNewUser: true,
          chamberName: data.chamber.name,
        });

        router.push("/dashboard");
      } else {
        setFormError(data.error || "Failed to join chamber.");
      }
    } catch (err: any) {
      setFormError("Network error while submitting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
          </div>
          <h2 className="text-xl font-serif font-bold text-white tracking-wide">
            Verifying Chamber Invitation...
          </h2>
          <p className="text-xs text-slate-400 max-w-sm">
            Contacting digital court ledger to authenticate security token.
          </p>
        </div>
      </div>
    );
  }

  if (validatingError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
              Invitation Invalid or Expired
            </h2>
            <p className="text-sm text-slate-400">{validatingError}</p>
          </div>
          <div className="pt-2">
            <a
              href="/auth/login"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all"
            >
              Return to Advocate Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-inner">
            <Scale className="w-9 h-9 text-amber-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">
            Advocase
          </h1>
          <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
            Official Chamber Onboarding
          </p>
        </div>

        {/* Locked Chamber Invitation Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Invitation Banner */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Invited To Join
                </p>
                <h3 className="text-base font-bold text-white">
                  {invitation?.chamberName}
                </h3>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <UserCheck className="w-4 h-4" />
                <span className="font-semibold">Pre-Assigned Role:</span>
                <span className="bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {invitation?.role}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400">
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Locked by Senior</span>
              </div>
            </div>

            {invitation?.inviterName && (
              <p className="text-[11px] text-slate-400 pt-1">
                Issued by Senior Advocate: <b className="text-slate-200">{invitation.inviterName}</b>
              </p>
            )}
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Advocate Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Adv. Amit Saxena"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="advocate@barcouncil.org"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mobile Number (for SMS & WhatsApp brief alerts)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bar Council Enrollment Number (Optional)
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. D/2345/2021"
                  value={formData.barCouncilNumber}
                  onChange={(e) => setFormData({ ...formData, barCouncilNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 flex items-center justify-center space-x-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating Chamber Seat...</span>
                </>
              ) : (
                <>
                  <span>Join Chamber as {invitation?.role}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Already have an advocate account?{" "}
              <a href="/auth/login" className="text-amber-400 hover:underline font-medium">
                Log in directly
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChamberJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
