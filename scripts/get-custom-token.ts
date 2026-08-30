/**
 * Generate a Firebase custom token for an explicitly configured admin account.
 *
 * Usage: ADMIN_EMAIL=admin@example.com npx tsx scripts/get-custom-token.ts
 * Optional: FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/service-account.json
 */
import { readFileSync } from "node:fs";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const adminEmail = process.env.ADMIN_EMAIL?.trim();
if (!adminEmail) throw new Error("ADMIN_EMAIL is required.");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
if (getApps().length === 0) {
  initializeApp({
    credential: serviceAccountPath
      ? cert(JSON.parse(readFileSync(serviceAccountPath, "utf8")))
      : applicationDefault()
  });
}

async function main() {
  const auth = getAuth();
  const user = await auth.getUserByEmail(adminEmail);
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
  process.stdout.write(await auth.createCustomToken(user.uid, { admin: true }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
