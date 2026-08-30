"use client";
import { useState } from "react";
import { useAuth } from "./auth-provider";
import { clearBrowserSession } from "@/lib/browser-session";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { signOut } from "firebase/auth";
import { LoginIcon, LogoutIcon, UserIcon } from "./menu-icons";

type NavAuthProps = {
  accountLabel: string;
  loginHref: string;
  loginLabel: string;
  logoutLabel: string;
  logoutErrorLabel: string;
};

export function NavAuth({
  accountLabel,
  loginHref,
  loginLabel,
  logoutLabel,
  logoutErrorLabel
}: NavAuthProps) {
  const { user, loading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError(false);
    try {
      await clearBrowserSession();
      await signOut(getFirebaseAuth());
      window.location.assign(loginHref);
    } catch {
      setLogoutError(true);
      setLoggingOut(false);
    }
  };
  if (loading) return null;
  if (user)
    return (
      <div className="nav-auth-user">
        <span className="nav-auth-name">
          <UserIcon className="nav-auth-icon" />
          <span className="sr-only">{accountLabel}: </span>
          {user.displayName || user.email}
        </span>
        <button
          aria-label={logoutLabel}
          className="menu-icon-button"
          disabled={loggingOut}
          onClick={() => void handleLogout()}
          title={logoutLabel}
          type="button"
        >
          <LogoutIcon className="menu-icon-button-glyph" />
          <span className="sr-only">{logoutLabel}</span>
        </button>
        {logoutError ? (
          <span className="nav-auth-error" role="alert">
            {logoutErrorLabel}
          </span>
        ) : null}
      </div>
    );
  return (
    <a aria-label={loginLabel} className="menu-icon-button" href={loginHref} title={loginLabel}>
      <LoginIcon className="menu-icon-button-glyph" />
      <span className="sr-only">{loginLabel}</span>
    </a>
  );
}
