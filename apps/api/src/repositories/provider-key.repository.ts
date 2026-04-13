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

