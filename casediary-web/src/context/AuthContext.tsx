"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface ChamberUser {
  id?: string;
  name: string;
  enrollment?: string;
  barCouncilNumber?: string;
  court?: string;
  role: string;
  plan?: string;
  email?: string;
  phone?: string;
  token?: string;
  chamber?: {
    id: string;
    name: string;
    plan_tier: string;
    max_seats: number;
    plan_status?: string;
  };
}

export const DEMO_PROFILES: Record<"Senior" | "Junior", ChamberUser> = {
  Senior: {
    id: "demo-senior-id",
    name: "Adv. Rajesh Sharma",
    enrollment: "D/1248/2012",
    court: "High Court of Delhi",
    role: "Senior Advocate",
    plan: "PRO CHAMBER",
    email: "rajesh.sharma@delhibar.org",
    chamber: {
      id: "demo-chamber-id",
      name: "Rajesh Sharma Law Chambers",
      plan_tier: "chamber_pro",
      max_seats: 5,
    },
  },
  Junior: {
    id: "demo-junior-id",
    name: "Adv. Vikram Mehra",
    enrollment: "D/4590/2021",
    court: "Tis Hazari Courts",
    role: "Associate Advocate",
    plan: "PRO CHAMBER",
    email: "vikram.mehra@delhibar.org",
    chamber: {
      id: "demo-chamber-id",
      name: "Rajesh Sharma Law Chambers",
      plan_tier: "chamber_pro",
      max_seats: 5,
    },
  },
};

interface AuthContextType {
  user: ChamberUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: ChamberUser) => void;
  logout: () => void;
  demoLogin: (role: "Senior" | "Junior") => Promise<ChamberUser>;
  loginWithCredentials: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: ChamberUser }>;
  loginWithGoogle: (
    tokenPayload: string | { idToken?: string; accessToken?: string }
  ) => Promise<{
    success: boolean;
    error?: string;
    isNewUser?: boolean;
    user?: ChamberUser;
  }>;
  registerChamber: (payload: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    chamberName?: string;
    barCouncilNumber?: string;
    planTier?: string;
  }) => Promise<{ success: boolean; error?: string; user?: ChamberUser }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  demoLogin: async () => DEMO_PROFILES.Senior,
  loginWithCredentials: async () => ({ success: false }),
  loginWithGoogle: async () => ({ success: false }),
  registerChamber: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ChamberUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncSession = () => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("advocase_user");
      const savedToken = localStorage.getItem("advocase_token");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (savedToken && !parsed.token) {
          parsed.token = savedToken;
        }
        setUser(parsed);
        // Clear any legacy client-accessible cookie to favor server-side HttpOnly cookie
        document.cookie = `advocase_token=; path=/; max-age=0; SameSite=Lax`;
        document.cookie = `advocase_session=true; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        setUser(null);
        document.cookie = `advocase_token=; path=/; max-age=0; SameSite=Lax`;
        document.cookie = `advocase_session=; path=/; max-age=0; SameSite=Lax`;
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncSession();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "advocase_user" || e.key === "advocase_token") {
        syncSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (userData: ChamberUser) => {
    // Cancel any active Google One Tap / FedCM prompts in the corner
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id?.cancel) {
      try {
        (window as any).google.accounts.id.cancel();
      } catch (e) {}
    }

    // Purge any stale session state first to prevent cross-account credential leakage
    localStorage.removeItem("advocase_user");
    localStorage.removeItem("advocase_token");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }

    setUser(userData);
    localStorage.setItem("advocase_user", JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem("advocase_token", userData.token);
    }
    // Remove client-accessible token cookie so server HttpOnly cookie takes precedence
    document.cookie = `advocase_token=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `advocase_session=true; path=/; max-age=2592000; SameSite=Lax`;
  };

  // Ensure Google One Tap prompt never appears while user is authenticated
  useEffect(() => {
    if (user && typeof window !== "undefined" && (window as any).google?.accounts?.id?.cancel) {
      try {
        (window as any).google.accounts.id.cancel();
      } catch (e) {}
    }
  }, [user]);

  const logout = () => {
    // Call server route to ensure cookies are invalidated on server & client
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});

    setUser(null);
    localStorage.removeItem("advocase_user");
    localStorage.removeItem("advocase_token");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }
    document.cookie = `advocase_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
    document.cookie = `advocase_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
  };

  const demoLogin = async (role: "Senior" | "Junior"): Promise<ChamberUser> => {
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        login(data.user);
        return data.user;
      }
    } catch (e) {
      console.warn("Failed to reach /api/auth/demo, fallback to local demo profile:", e);
    }
    const profile = DEMO_PROFILES[role];
    login(profile);
    return profile;
  };

  const loginWithCredentials = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: ChamberUser }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || "Login failed" };
      }

      const userProfile: ChamberUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role === "senior_advocate" ? "Senior Advocate" : data.user.role,
        barCouncilNumber: data.user.barCouncilNumber,
        plan: data.chamber?.plan_tier ? `${data.chamber.plan_tier.toUpperCase()} PLAN` : "SOLO PLAN",
        token: data.token,
        chamber: data.chamber,
      };

      login(userProfile);
      return { success: true, user: userProfile };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const registerChamber = async (payload: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    chamberName?: string;
    barCouncilNumber?: string;
    planTier?: string;
  }): Promise<{ success: boolean; error?: string; user?: ChamberUser }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || "Registration failed" };
      }

      const userProfile: ChamberUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: "Senior Advocate",
        barCouncilNumber: data.user.barCouncilNumber,
        plan: `${(data.chamber?.plan_tier || "solo").toUpperCase()} PLAN`,
        token: data.token,
        chamber: data.chamber,
      };

      login(userProfile);
      return { success: true, user: userProfile };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const loginWithGoogle = async (
    tokenPayload: string | { idToken?: string; accessToken?: string }
  ): Promise<{
    success: boolean;
    error?: string;
    isNewUser?: boolean;
    user?: ChamberUser;
  }> => {
    try {
      const payload =
        typeof tokenPayload === "string"
          ? { idToken: tokenPayload }
          : tokenPayload;

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || "Google login failed" };
      }

      const userProfile: ChamberUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role === "senior_advocate" ? "Senior Advocate" : data.user.role,
        barCouncilNumber: data.user.barCouncilNumber,
        plan: data.chamber?.plan_tier ? `${data.chamber.plan_tier.toUpperCase()} PLAN` : "SOLO PLAN",
        token: data.token,
        chamber: data.chamber,
      };

      login(userProfile);
      return { success: true, isNewUser: !!data.isNewUser, user: userProfile };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        demoLogin,
        loginWithCredentials,
        loginWithGoogle,
        registerChamber,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
