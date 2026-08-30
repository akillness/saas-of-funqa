/**
 * Give one existing Firebase user the signed `admin` claim used by both the
 * API and role-aware web shell.
 *
 * Usage: ADMIN_EMAIL=user@example.com tsx scripts/setup-admin-user.ts
 */
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!adminEmail) throw new Error("ADMIN_EMAIL is required.");

if (!getApps().length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const credential = serviceAccountPath
    ? cert(JSON.parse(readFileSync(serviceAccountPath, "utf8")))
    : applicationDefault();
  initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID ?? "saas-of-funqa" });
}

const auth = getAuth();
const db = getFirestore();

async function main() {
  const user = await auth.getUserByEmail(adminEmail);
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
  await db
    .collection("users")
    .doc(user.uid)
    .set(
      {
        displayName: user.displayName ?? "FunQA admin",
        email: adminEmail,
        role: "admin",
        updatedAt: Timestamp.now()
      },
      { merge: true }
    );

  console.log(`Admin claim and profile updated for uid=${user.uid}.`);
  console.log("The user must refresh their ID token by signing out and back in.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
