import type { EmbeddedChunk, ExtractedDocument } from "@funqa/ai";
import type { StoredDocument } from "@funqa/db";
import type { DocumentReference, DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { config } from "../config.js";
import { db } from "../firebase.js";

const FIRESTORE_BATCH_SIZE = 400;
const SAFE_PATH_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,255}$/;

function assertSafePathSegment(value: string, label: string): void {
  if (!SAFE_PATH_SEGMENT.test(value)) {
    throw new Error(`${label} is not a safe Firestore path segment`);
  }
}

async function commitSets(
  firestore: Firestore,
  entries: { ref: DocumentReference; data: object }[]
): Promise<void> {
  for (let offset = 0; offset < entries.length; offset += FIRESTORE_BATCH_SIZE) {
    const batch = firestore.batch();
    entries.slice(offset, offset + FIRESTORE_BATCH_SIZE).forEach(({ ref, data }) => {
      batch.set(ref, data);
    });
    await batch.commit();
  }
}

async function commitDeletes(firestore: Firestore, refs: DocumentReference[]): Promise<void> {
  for (let offset = 0; offset < refs.length; offset += FIRESTORE_BATCH_SIZE) {
    const batch = firestore.batch();
    refs.slice(offset, offset + FIRESTORE_BATCH_SIZE).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

export async function getFirestoreRagDocuments(tenantId: string): Promise<StoredDocument[]> {
  assertSafePathSegment(tenantId, "tenantId");
  const snap = await db().collection(`ragDocuments/${tenantId}/docs`).get();
  return snap.docs.map((d) => d.data() as StoredDocument);
}

export async function getFirestoreRagDocumentCount(tenantId: string): Promise<number> {
  assertSafePathSegment(tenantId, "tenantId");
  const snap = await db().collection(`ragDocuments/${tenantId}/docs`).count().get();
  return snap.data().count;
}

export async function getFirestoreRagChunkCount(tenantId: string): Promise<number> {
  assertSafePathSegment(tenantId, "tenantId");
  const snap = await db().collection(`ragChunks/${tenantId}/chunks`).count().get();
  return snap.data().count;
}

export async function getFirestoreRagChunks(tenantId: string): Promise<EmbeddedChunk[]> {
  assertSafePathSegment(tenantId, "tenantId");
  const chunks: EmbeddedChunk[] = [];
  let lastDoc: DocumentSnapshot | undefined;

  while (true) {
    let q = db()
      .collection(`ragChunks/${tenantId}/chunks`)
      .orderBy("__name__")
      .limit(config.chunkPageSize);

    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      chunks.push(doc.data() as EmbeddedChunk);
    }

    if (snap.size < config.chunkPageSize) break;
    lastDoc = snap.docs[snap.docs.length - 1];
  }

  return chunks;
}

export async function saveFirestoreRagArtifacts(
  tenantId: string,
  documents: ExtractedDocument[],
  chunks: EmbeddedChunk[]
): Promise<string> {
  assertSafePathSegment(tenantId, "tenantId");
  documents.forEach((document) => assertSafePathSegment(document.id, "documentId"));
  chunks.forEach((chunk) => assertSafePathSegment(chunk.id, "chunkId"));

  const firestore = db();
  const storedAt = new Date().toISOString();
  const [existingDocs, existingChunks] = await Promise.all([
    firestore.collection(`ragDocuments/${tenantId}/docs`).get(),
    firestore.collection(`ragChunks/${tenantId}/chunks`).get()
  ]);
  const documentIds = new Set(documents.map((document) => document.id));
  const chunkIds = new Set(chunks.map((chunk) => chunk.id));
  const writes = [
    ...documents.map((document) => ({
      ref: firestore.doc(`ragDocuments/${tenantId}/docs/${document.id}`),
      data: { ...document, tenantId, createdAt: storedAt } satisfies StoredDocument
    })),
    ...chunks.map((chunk) => ({
      ref: firestore.collection(`ragChunks/${tenantId}/chunks`).doc(chunk.id),
      data: { ...chunk, createdAt: storedAt }
    }))
  ];

  // Write first. If a later batch fails, the prior corpus remains available and
  // a retry converges; never delete the whole corpus before replacement exists.
  await commitSets(firestore, writes);
  await commitDeletes(firestore, [
    ...existingDocs.docs.filter((doc) => !documentIds.has(doc.id)).map((doc) => doc.ref),
    ...existingChunks.docs.filter((doc) => !chunkIds.has(doc.id)).map((doc) => doc.ref)
  ]);

  return storedAt;
}

export async function upsertFirestoreRagArtifacts(
  tenantId: string,
  documents: ExtractedDocument[],
  chunks: EmbeddedChunk[]
): Promise<string> {
  assertSafePathSegment(tenantId, "tenantId");
  documents.forEach((document) => assertSafePathSegment(document.id, "documentId"));
  chunks.forEach((chunk) => assertSafePathSegment(chunk.id, "chunkId"));

  const firestore = db();
  const storedAt = new Date().toISOString();
  const documentIds = documents.map((document) => document.id);
  const existingChunks = await Promise.all(
    documentIds.map((documentId) =>
      firestore
        .collection(`ragChunks/${tenantId}/chunks`)
        .where("documentId", "==", documentId)
        .get()
    )
  );
  const newChunkIds = new Set(chunks.map((chunk) => chunk.id));
  const writes = [
    ...documents.map((document) => ({
      ref: firestore.doc(`ragDocuments/${tenantId}/docs/${document.id}`),
      data: { ...document, tenantId, createdAt: storedAt } satisfies StoredDocument
    })),
    ...chunks.map((chunk) => ({
      ref: firestore.collection(`ragChunks/${tenantId}/chunks`).doc(chunk.id),
      data: { ...chunk, createdAt: storedAt }
    }))
  ];

  await commitSets(firestore, writes);
  await commitDeletes(
    firestore,
    existingChunks.flatMap((snapshot) =>
      snapshot.docs.filter((doc) => !newChunkIds.has(doc.id)).map((doc) => doc.ref)
    )
  );

  return storedAt;
}

export async function resetFirestoreRag(tenantId: string): Promise<void> {
  assertSafePathSegment(tenantId, "tenantId");
  const firestore = db();
  const [existingDocs, existingChunks] = await Promise.all([
    firestore.collection(`ragDocuments/${tenantId}/docs`).get(),
    firestore.collection(`ragChunks/${tenantId}/chunks`).get()
  ]);
  await commitDeletes(firestore, [
    ...existingDocs.docs.map((document) => document.ref),
    ...existingChunks.docs.map((document) => document.ref)
  ]);
}
