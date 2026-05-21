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
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--gm-bg-base, #0a0a0f)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--gm-bg-surface, #13131a)',
          borderRadius: '16px',
          border: '1px solid var(--gm-border, rgba(255,255,255,0.08))',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
          }}
        />

        <div style={{ padding: '40px 36px 36px' }}>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--gm-accent-ai, #6366f1)',
            }}
          >
            게임 AI 검색엔진
          </p>

          <h1
            style={{
              margin: '0 0 8px',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--gm-text-primary, #f1f5f9)',
              lineHeight: 1.3,
            }}
          >
            Sign in
          </h1>

          <p
            style={{
              margin: '0 0 32px',
              fontSize: '14px',
              color: 'var(--gm-text-secondary, #94a3b8)',
              lineHeight: 1.6,
            }}
          >
            Workspace login unlocks saved searches, grounded citations, admin controls, and
            audit-aware provider key actions.
          </p>

          {error && (
            <p
              role="alert"
              style={{
                margin: '0 0 20px',
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#f87171',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: loading
                ? 'rgba(99,102,241,0.5)'
                : 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {!loading && (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                  fill="#fff"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                  fill="#fff"
                />
                <path
                  d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
                  fill="#fff"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
                  fill="#fff"
                />
              </svg>
            )}
            {loading ? '로그인 중...' : 'Continue with Google'}
          </button>

          <div
            style={{
              marginTop: '28px',
              paddingTop: '24px',
              borderTop: '1px solid var(--gm-border, rgba(255,255,255,0.08))',
            }}
          >
            <p
              style={{
                margin: '0 0 12px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--gm-text-secondary, #94a3b8)',
              }}
            >
              Trust boundary
            </p>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {[
                'You need a Google account allowed by workspace policy.',
                'Admin privileges are assigned server-side after sign-in.',
                'No provider API key is ever stored in browser storage.',
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--gm-text-secondary, #94a3b8)',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      marginTop: '4px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--gm-accent-ai, #6366f1)',
                      flexShrink: 0,
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
