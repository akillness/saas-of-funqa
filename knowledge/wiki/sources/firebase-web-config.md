# Firebase Web Config

## Summary

The Firebase console settings for the `saas-of-funqa` web app now match the App Hosting backend metadata already observed during deploy attempts. The shared identifiers are `projectId=saas-of-funqa`, `messagingSenderId=74495319833`, and `appId=1:74495319833:web:d75e2d769b97c48bdeaf88`.

## Grounded Facts

- Raw source: `raw/sources/firebase-web-config-2026-04-13.md`
- `authDomain` is `saas-of-funqa.firebaseapp.com`.
- `storageBucket` is `saas-of-funqa.firebasestorage.app`.
- `measurementId` is `G-XTVCB7JPNF`.

## Repo Impact

- `.env.example` now exposes the web config as `NEXT_PUBLIC_FIREBASE_*` variables.
- `apps/web/lib/firebase-client.ts` centralizes browser-side Firebase initialization with safe defaults from the provided project config.
- `apps/web/app/firebase-analytics.tsx` initializes Analytics only in supported browser environments.

## Follow-up

- Add Auth client flows once login stops being a static shell and starts using Firebase Auth for real sessions.
- Keep this page aligned with any future secondary web app registrations or environment-specific Firebase projects.
