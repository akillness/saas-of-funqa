'use client';
import { useAuth } from './auth-provider';
import { auth } from '@/lib/firebase-client';
import { signOut } from 'firebase/auth';

export function NavAuth() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return (
    <div className="nav-auth-user">
      <span className="nav-auth-name">{user.displayName || user.email}</span>
      <button onClick={() => signOut(auth)} className="btn-ghost">로그아웃</button>
    </div>
  );
  return <a href="/login" className="btn-primary">로그인</a>;
}
