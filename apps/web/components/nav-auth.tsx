'use client';
import { useAuth } from './auth-provider';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { signOut } from 'firebase/auth';
import { LoginIcon, LogoutIcon, UserIcon } from './menu-icons';

type NavAuthProps = {
  accountLabel: string;
  loginHref: string;
  loginLabel: string;
  logoutLabel: string;
};

export function NavAuth({ accountLabel, loginHref, loginLabel, logoutLabel }: NavAuthProps) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return (
    <div className="nav-auth-user">
      <span className="nav-auth-name">
        <UserIcon className="nav-auth-icon" />
        <span className="sr-only">{accountLabel}: </span>
        {user.displayName || user.email}
      </span>
      <button
        aria-label={logoutLabel}
        className="menu-icon-button"
        onClick={() => signOut(getFirebaseAuth())}
        title={logoutLabel}
        type="button"
      >
        <LogoutIcon className="menu-icon-button-glyph" />
        <span className="sr-only">{logoutLabel}</span>
      </button>
    </div>
  );
  return (
    <a aria-label={loginLabel} className="menu-icon-button" href={loginHref} title={loginLabel}>
      <LoginIcon className="menu-icon-button-glyph" />
      <span className="sr-only">{loginLabel}</span>
    </a>
  );
}
