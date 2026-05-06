import type { Provider } from "@funqa/contracts";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase.js";
import type { EncryptedPayload } from "../secrets/crypto.js";

export type ProviderKeyRecord = EncryptedPayload & {
  tenantId: string;
  provider: Provider;
  label: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export async function saveProviderKey(record: Omit<ProviderKeyRecord, "createdAt" | "updatedAt">) {
  const firestore = db();
  const ref = firestore.collection("tenantProviderKeys").doc(`${record.tenantId}_${record.provider}`);
  const now = Timestamp.now();

  await ref.set(
    {
      ...record,
      createdAt: now,
      updatedAt: now
    },
    { merge: true }
  );

  return {
    ...record,
    createdAt: now,
    updatedAt: now
  };
}

export async function getProviderKey(
  tenantId: string,
  provider: string
): Promise<{ exists: boolean; provider: string } | null> {
  const firestore = db();
  const ref = firestore.collection("tenantProviderKeys").doc(`${tenantId}_${provider}`);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { exists: true, provider };
}

export async function deleteProviderKey(tenantId: string, provider: string): Promise<void> {
  const firestore = db();
  await firestore.collection("tenantProviderKeys").doc(`${tenantId}_${provider}`).delete();
}

