'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, getRedirectResult, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if returning from a redirect-based login
    getRedirectResult(getFirebaseAuth())
      .then((result) => {
        if (result?.user) {
          router.push('/search');
        } else {
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
        setError(message);
        setLoading(false);
      });
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getFirebaseAuth(), provider);
      router.push('/search');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        // Fallback to redirect when popup is blocked
        await signInWithRedirect(getFirebaseAuth(), new GoogleAuthProvider());
        return;
      }
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="stack-lg">
      <section className="page-intro page-intro-wide">
        <p className="eyebrow">Authentication</p>
        <h1>Sign in with Google to enter the search workspace and operator console.</h1>
        <p className="lede">
          End users see saved search and citations. Admins also get ingestion controls, model-key
          settings, and usage telemetry.
        </p>
      </section>

      <div className="auth-layout">
        <section className="panel auth-card">
          <h2>Continue with Google</h2>
          <p>
            Workspace login unlocks saved searches, grounded citations, admin controls, and
            audit-aware provider key actions.
          </p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="action-row">
            <button
              className="primary-button"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? '로그인 중...' : 'Continue With Google'}
            </button>
          </div>
        </section>

        <aside className="panel">
          <h2>Trust boundary</h2>
          <ul className="bullet-list">
            <li>You need a Google account allowed by workspace policy.</li>
            <li>Admin privileges are assigned server-side after sign-in.</li>
            <li>No provider API key is ever stored in browser storage.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
