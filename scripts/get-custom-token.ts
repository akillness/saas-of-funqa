/**
 * get-custom-token.ts
 * Generates a Firebase custom auth token for akillness38@gmail.com
 * so Playwriter can sign in without the Google OAuth popup.
 *
 * Usage: npx tsx scripts/get-custom-token.ts
 * Output: prints the custom token to stdout
 */
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SERVICE_ACCOUNT_PATH = resolve('./saas-of-funqa-firebase-adminsdk-fbsvc-cee18265fb.json');
const ADMIN_EMAIL = 'akillness38@gmail.com';

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'saas-of-funqa',
  });
}

async function main() {
  const auth = getAuth();
  const userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
  const customToken = await auth.createCustomToken(userRecord.uid, { role: 'admin' });
  // Only print the token (no extra logging) so it can be captured cleanly
  process.stdout.write(customToken);
}

main().catch(e => { console.error(e); process.exit(1); });
