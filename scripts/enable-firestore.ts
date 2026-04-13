/**
 * enable-firestore.ts
 * Enables the Cloud Firestore API for the saas-of-funqa project via Service Usage API.
 *
 * Usage: npx tsx scripts/enable-firestore.ts
 */
import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SERVICE_ACCOUNT_PATH = resolve('./saas-of-funqa-firebase-adminsdk-fbsvc-cee18265fb.json');
const PROJECT_ID = 'saas-of-funqa';

async function main() {
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();
  const token = tokenRes.token;

  console.log('Got access token. Enabling Firestore API...');

  const url = `https://serviceusage.googleapis.com/v1/projects/${PROJECT_ID}/services/firestore.googleapis.com:enable`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  const data = await response.json() as Record<string, unknown>;
  console.log('HTTP Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log('✓ Firestore API enable request sent. It may take up to 1 minute to propagate.');
  } else {
    const errData = data as { error?: { message?: string; code?: number } };
    if (errData.error?.code === 403) {
      console.error('✗ Permission denied. The service account needs roles/serviceusage.serviceUsageAdmin.');
      console.error('  Please enable Firestore manually at:');
      console.error('  https://console.firebase.google.com/project/saas-of-funqa/firestore');
    } else {
      console.error('✗ Failed:', errData.error?.message);
    }
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
