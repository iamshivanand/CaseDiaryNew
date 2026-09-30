"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface ChamberUser {
  name: string;
  enrollment: string;
  court: string;
  role: string;
  plan: string;
  email?: string;
}

export const DEMO_PROFILES: Record<"Senior" | "Junior" | "Munshi", ChamberUser> = {
  Senior: {
    name: "Adv. Rajesh Sharma",
    enrollment: "D/1248/2012",
    court: "High Court of Delhi",
    role: "Senior Advocate",
    plan: "PRO CHAMBER",
    email: "rajesh.sharma@delhibar.org",
  },
  Junior: {
    name: "Adv. Vikram Mehra",
    enrollment: "D/4590/2021",
    court: "Tis Hazari Courts",
    role: "Junior Counsel",
    plan: "PRO CHAMBER",
    email: "vikram.mehra@delhibar.org",
  },
  Munshi: {
    name: "Ramesh Kumar",
    enrollment: "Chamber Munshi #04",
    court: "Delhi District Courts",
    role: "Court Clerk / Munshi",
    plan: "CHAMBER TEAM",
    email: "munshi.ramesh@delhibar.org",
  },
};

interface AuthContextType {
  user: ChamberUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: ChamberUser) => void;
  logout: () => void;
  demoLogin: (role: "Senior" | "Junior" | "Munshi") => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  demoLogin: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ChamberUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncSession = () => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("advocase_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        document.cookie = `advocase_session=true; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        setUser(null);
        document.cookie = `advocase_session=; path=/; max-age=0`;
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
      if (e.key === "advocase_user") {
        syncSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (userData: ChamberUser) => {
    setUser(userData);
    localStorage.setItem("advocase_user", JSON.stringify(userData));
    document.cookie = `advocase_session=true; path=/; max-age=2592000; SameSite=Lax`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("advocase_user");
    document.cookie = `advocase_session=; path=/; max-age=0`;
  };

  const demoLogin = (role: "Senior" | "Junior" | "Munshi") => {
    const profile = DEMO_PROFILES[role];
    login(profile);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
