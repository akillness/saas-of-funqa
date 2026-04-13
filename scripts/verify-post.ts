import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SA = JSON.parse(readFileSync(resolve('./saas-of-funqa-firebase-adminsdk-fbsvc-cee18265fb.json'), 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(SA), projectId: 'saas-of-funqa' });

async function main() {
  const db = getFirestore();
  const snap = await db.collection('blog_posts').orderBy('createdAt', 'desc').limit(3).get();
  if (snap.empty) { console.log('No posts found'); return; }
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`id: ${doc.id}`);
    console.log(`  title: "${d.title}" | status: ${d.status} | authorUid: ${d.authorUid}`);
    console.log(`  tags: ${JSON.stringify(d.tags)}`);
  });
}
main().catch(e => { console.error(e); process.exit(1); });
