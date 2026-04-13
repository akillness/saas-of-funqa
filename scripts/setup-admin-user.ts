/**
 * setup-admin-user.ts
 * Seeds akillness38@gmail.com as admin in the saas-of-funqa Firebase project.
 *
 * Usage: tsx scripts/setup-admin-user.ts
 */
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
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

const auth = getAuth();
const db   = getFirestore();

async function main() {
  console.log(`Setting up admin user: ${ADMIN_EMAIL}`);

  let uid: string;

  try {
    const userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = userRecord.uid;
    console.log(`Found existing Firebase Auth user: uid=${uid}`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      // Create the user so they can sign in with Google
      const newUser = await auth.createUser({
        email:       ADMIN_EMAIL,
        displayName: 'akillness (Admin)',
      });
      uid = newUser.uid;
      console.log(`Created new Firebase Auth user: uid=${uid}`);
    } else {
      throw err;
    }
  }

  // Upsert Firestore user document with role: 'admin'
  const userRef = db.collection('users').doc(uid);
  await userRef.set({
    displayName: 'akillness (Admin)',
    email:       ADMIN_EMAIL,
    role:        'admin',
    lastLogin:   Timestamp.now(),
  }, { merge: true });

  console.log(`✓ Firestore users/${uid} set to role: 'admin'`);
  console.log(`✓ ${ADMIN_EMAIL} can now log into the admin panel.`);
}

main().catch(e => { console.error(e); process.exit(1); });
