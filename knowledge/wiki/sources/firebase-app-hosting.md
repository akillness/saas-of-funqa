# Firebase App Hosting

## Summary

Firebase App Hosting supports monorepo deployment by pointing a backend at an app root such as `apps/web`, while still uploading the repository context needed for builds. Local source deployment is supported through `firebase init apphosting` and `firebase deploy`, and runtime/build settings can be declared in `apphosting.yaml`.

## Why It Matters Here

- `funqa` can keep Next.js in `apps/web` and still deploy through one App Hosting backend.
- Local development can use the App Hosting emulator while the trusted API remains a separate process.
- Environment variables and runtime settings belong in `apphosting.yaml`, with environment-specific overrides in files such as `apphosting.emulator.yaml`.

## Key Notes

- Monorepo backend setup requires a root directory such as `apps/web`.
- Local-source deployment stores backend preferences in `firebase.json`.
- `apphosting.yaml` supports environment variables, secret references, and Cloud Run runtime settings.
- App Hosting is a good fit for the Next.js web surface, while the Express API should remain its own trusted boundary.

## Sources

- https://firebase.google.com/docs/app-hosting/monorepos
- https://firebase.google.com/docs/app-hosting/alt-deploy
- https://firebase.google.com/docs/app-hosting/configure
