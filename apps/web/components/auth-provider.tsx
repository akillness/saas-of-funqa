"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onIdTokenChanged } from "firebase/auth";
import { establishBrowserSession, clearBrowserSession } from "@/lib/browser-session";
import { getFirebaseAuth } from "@/lib/firebase-client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  claimsLoading: boolean;
  sessionReady: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  claimsLoading: true,
  sessionReady: false,
  isAdmin: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let roleRun = 0;
    // Keep the short-lived HttpOnly bridge aligned with Firebase token rotation.
    const unsubscribe = onIdTokenChanged(getFirebaseAuth(), (nextUser) => {
      const currentRun = ++roleRun;
      setUser(nextUser);
      setLoading(false);
      setSessionReady(false);
      setIsAdmin(false);

      if (!nextUser) {
        void clearBrowserSession().catch(() => undefined);
        setClaimsLoading(false);
        return;
      }

      setClaimsLoading(true);
      void establishBrowserSession(nextUser)
        .then((session) => {
          if (currentRun !== roleRun) return;
          setSessionReady(true);
          setIsAdmin(session.isAdmin);
        })
        .catch(() => undefined)
        .finally(() => {
          if (currentRun !== roleRun) return;
          setClaimsLoading(false);
        });
    });
    return () => {
      roleRun += 1;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, claimsLoading, sessionReady, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
