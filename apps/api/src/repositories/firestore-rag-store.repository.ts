import type { EmbeddedChunk, ExtractedDocument } from "@funqa/ai";
import type { StoredDocument } from "@funqa/db";
import { db } from "../firebase.js";

export async function getFirestoreRagDocuments(tenantId: string): Promise<StoredDocument[]> {
  const snap = await db().collection(`ragDocuments/${tenantId}/docs`).get();
  return snap.docs.map((d) => d.data() as StoredDocument);
}

export async function getFirestoreRagChunkCount(tenantId: string): Promise<number> {
  const snap = await db().collection(`ragChunks/${tenantId}/chunks`).count().get();
  return snap.data().count;
}

export async function getFirestoreRagChunks(tenantId: string): Promise<EmbeddedChunk[]> {
  const snap = await db().collection(`ragChunks/${tenantId}/chunks`).get();
  return snap.docs.map((d) => d.data() as EmbeddedChunk);
}

export async function saveFirestoreRagArtifacts(
  tenantId: string,
  documents: ExtractedDocument[],
  chunks: EmbeddedChunk[]
): Promise<string> {
  const firestore = db();
  const storedAt = new Date().toISOString();

  const [existingDocs, existingChunks] = await Promise.all([
    firestore.collection(`ragDocuments/${tenantId}/docs`).get(),
    firestore.collection(`ragChunks/${tenantId}/chunks`).get()
  ]);

  const deleteBatch = firestore.batch();
  existingDocs.docs.forEach((d) => deleteBatch.delete(d.ref));
  existingChunks.docs.forEach((d) => deleteBatch.delete(d.ref));
  await deleteBatch.commit();

  const writeBatch = firestore.batch();
  for (const doc of documents) {
    const storedDoc: StoredDocument = { ...doc, tenantId, createdAt: storedAt };
    writeBatch.set(firestore.doc(`ragDocuments/${tenantId}/docs/${doc.id}`), storedDoc);
  }
  for (const chunk of chunks) {
    writeBatch.set(
      firestore.collection(`ragChunks/${tenantId}/chunks`).doc(chunk.id),
      { ...chunk, createdAt: storedAt }
    );
  }
  await writeBatch.commit();

  return storedAt;
}

export async function upsertFirestoreRagArtifacts(
  tenantId: string,
  documents: ExtractedDocument[],
  chunks: EmbeddedChunk[]
): Promise<string> {
  const firestore = db();
  const storedAt = new Date().toISOString();
  const documentIds = documents.map((document) => document.id);

  const [existingDocs, existingChunks] = await Promise.all([
    Promise.all(
      documentIds.map((documentId) =>
        firestore.doc(`ragDocuments/${tenantId}/docs/${documentId}`).get()
      )
    ),
    Promise.all(
      documentIds.map((documentId) =>
        firestore
          .collection(`ragChunks/${tenantId}/chunks`)
          .where("documentId", "==", documentId)
          .get()
      )
    )
  ]);

  const deleteBatch = firestore.batch();
  existingDocs.forEach((snap) => {
    if (snap.exists) {
      deleteBatch.delete(snap.ref);
    }
  });
  existingChunks.forEach((snap) => {
    snap.docs.forEach((doc) => deleteBatch.delete(doc.ref));
  });
  await deleteBatch.commit();

  const writeBatch = firestore.batch();
  for (const doc of documents) {
    const storedDoc: StoredDocument = { ...doc, tenantId, createdAt: storedAt };
    writeBatch.set(firestore.doc(`ragDocuments/${tenantId}/docs/${doc.id}`), storedDoc);
  }
  for (const chunk of chunks) {
    writeBatch.set(
      firestore.collection(`ragChunks/${tenantId}/chunks`).doc(chunk.id),
      { ...chunk, createdAt: storedAt }
    );
  }
  await writeBatch.commit();

  return storedAt;
}

export async function resetFirestoreRag(tenantId: string): Promise<void> {
  const firestore = db();
  const [existingDocs, existingChunks] = await Promise.all([
    firestore.collection(`ragDocuments/${tenantId}/docs`).get(),
    firestore.collection(`ragChunks/${tenantId}/chunks`).get()
  ]);
  const batch = firestore.batch();
  existingDocs.docs.forEach((d) => batch.delete(d.ref));
  existingChunks.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
