/**
 * create-firestore-db.ts
 * Creates the default Firestore database for the saas-of-funqa project.
 *
 * Usage: npx tsx scripts/create-firestore-db.ts
 */
import { GoogleAuth } from 'google-auth-library';
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

  // Check if (default) database already exists
  const getUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)`;
  const getResp = await fetch(getUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (getResp.ok) {
    const db = await getResp.json() as Record<string, unknown>;
    console.log('✓ Firestore (default) database already exists:', (db as { name?: string }).name);
    return;
  }

  console.log('Creating Firestore (default) database...');

  // Create the database
  const createUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases?databaseId=(default)`;
  const createResp = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'FIRESTORE_NATIVE',
      locationId: 'nam5',
    }),
  });

  const data = await createResp.json() as Record<string, unknown>;
  console.log('HTTP Status:', createResp.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (createResp.ok) {
    console.log('✓ Firestore database creation initiated. Waiting for it to be ready...');
    // Poll until the operation is done
    const op = data as { name?: string };
    if (op.name) {
      await pollOperation(token!, op.name);
    }
  } else {
    const errData = data as { error?: { message?: string } };
    console.error('✗ Failed:', errData.error?.message);
    process.exit(1);
  }
}

async function pollOperation(token: string, opName: string) {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const resp = await fetch(`https://firestore.googleapis.com/v1/${opName}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const op = await resp.json() as { done?: boolean; error?: { message?: string } };
    if (op.done) {
      if (op.error) {
        console.error('✗ Operation failed:', op.error.message);
        process.exit(1);
      }
      console.log('✓ Firestore database is ready!');
      return;
    }
    console.log(`  Waiting... (attempt ${i + 1}/30)`);
  }
  console.error('✗ Timed out waiting for database creation.');
  process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
