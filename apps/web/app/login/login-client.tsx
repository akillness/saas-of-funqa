"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect
} from "firebase/auth";
import { useAuth } from "@/components/auth-provider";
import { getFirebaseAuth } from "@/lib/firebase-client";
import type { Locale } from "@/lib/i18n";

export function LoginClient({ destination, locale }: { destination: string; locale: Locale }) {
  const router = useRouter();
  const { user, loading: authLoading, claimsLoading, sessionReady } = useAuth();
  const [submitting, setSubmitting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isKo = locale === "ko";
  const busy = submitting || authLoading || (Boolean(user) && claimsLoading);

  useEffect(() => {
    void getRedirectResult(getFirebaseAuth())
      .catch((caught: unknown) => {
        setError(
          caught instanceof Error
            ? caught.message
            : isKo
              ? "로그인에 실패했습니다."
              : "Sign-in failed."
        );
      })
      .finally(() => setSubmitting(false));
  }, [isKo]);

  useEffect(() => {
    if (authLoading || claimsLoading || !user) return;
    if (!sessionReady) {
      setError(
        isKo
          ? "서버 세션을 만들지 못했습니다. 잠시 후 다시 시도하세요."
          : "Could not establish the server session. Try again shortly."
      );
      setSubmitting(false);
      return;
    }
    router.replace(destination);
    router.refresh();
  }, [authLoading, claimsLoading, destination, isKo, router, sessionReady, user]);

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    } catch (caught: unknown) {
      const code = (caught as { code?: string }).code;
      if (code === "auth/popup-blocked") {
        await signInWithRedirect(getFirebaseAuth(), new GoogleAuthProvider());
        return;
      }
      setError(
        caught instanceof Error
          ? caught.message
          : isKo
            ? "로그인에 실패했습니다."
            : "Sign-in failed."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <p className="login-kicker">FUNQA · VIDEO EVIDENCE SEARCH</p>
        <h1 id="login-title">
          {isKo ? "검색 워크스페이스 로그인" : "Sign in to the search workspace"}
        </h1>
        <p>
          {isKo
            ? "검증된 영상 장면을 검색하고 타임코드 근거를 확인합니다. 관리자 도구는 권한이 확인된 계정에만 열립니다."
            : "Search verified video scenes and inspect timestamped evidence. Admin tools open only after role verification."}
        </p>
        {error ? (
          <p className="login-error" role="alert">
            {error}
          </p>
        ) : null}
        <button disabled={busy} onClick={() => void handleGoogleLogin()} type="button">
          {busy
            ? isKo
              ? "확인 중…"
              : "Checking…"
            : isKo
              ? "Google로 계속"
              : "Continue with Google"}
        </button>
      </section>
    </div>
  );
}
