import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { db } from "../firebase.js";

// ---------------------------------------------------------------------------
// Scene store: persists video-document scenes (frame image + caption +
// caption embedding). Mirrors the RAG store strategy:
//   - local JSON file store for development (.runtime/scene-store.json)
//   - Firestore for the deployed Firebase runtime (RAG_STORE_PATH=firestore)
// Firestore layout:
//   sceneDocuments/{tenantId}/docs/{documentId}
//   sceneFrames/{tenantId}/scenes/{sceneId}
// ---------------------------------------------------------------------------

export type StoredSceneDocument = {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  mimeType: string;
  durationSec?: number;
  sceneCount: number;
  createdAt: string;
};

export type StoredScene = {
  id: string;
  tenantId: string;
  documentId: string;
  documentTitle: string;
  timecodeSec: number;
  caption: string;
  captionModel: string;
  imageDataUrl: string;
  embedding: number[];
  embeddingMode: "local" | "live";
  embeddingModel: string;
  createdAt: string;
};

type LocalSceneStore = {
  documents: StoredSceneDocument[];
  scenes: StoredScene[];
};

const useFirestore = config.ragStorePath === "firestore";

function resolveLocalStorePath(): string {
  const configured = process.env.SCENE_STORE_PATH;
  if (configured) {
    return path.resolve(configured);
  }
  return path.join(config.runtimeRoot, ".runtime", "scene-store.json");
}

function readLocalStore(): LocalSceneStore {
  const storePath = resolveLocalStorePath();
  if (!existsSync(storePath)) {
    return { documents: [], scenes: [] };
  }
  try {
    const parsed = JSON.parse(readFileSync(storePath, "utf8")) as LocalSceneStore;
    return {
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
      scenes: Array.isArray(parsed.scenes) ? parsed.scenes : []
    };
  } catch {
    return { documents: [], scenes: [] };
  }
}

function writeLocalStore(store: LocalSceneStore): void {
  const storePath = resolveLocalStorePath();
  mkdirSync(path.dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function getSceneDocuments(tenantId: string): Promise<StoredSceneDocument[]> {
  if (useFirestore) {
    const snap = await db().collection(`sceneDocuments/${tenantId}/docs`).get();
    return snap.docs
      .map((d) => d.data() as StoredSceneDocument)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return readLocalStore()
    .documents.filter((doc) => doc.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getScenes(tenantId: string): Promise<StoredScene[]> {
  if (useFirestore) {
    const snap = await db().collection(`sceneFrames/${tenantId}/scenes`).get();
    return snap.docs.map((d) => d.data() as StoredScene);
  }

  return readLocalStore().scenes.filter((scene) => scene.tenantId === tenantId);
}

export async function getSceneCount(tenantId: string): Promise<number> {
  if (useFirestore) {
    const snap = await db().collection(`sceneFrames/${tenantId}/scenes`).count().get();
    return snap.data().count;
  }

  return readLocalStore().scenes.filter((scene) => scene.tenantId === tenantId).length;
}

export async function upsertSceneDocument(
  document: StoredSceneDocument,
  scenes: StoredScene[]
): Promise<void> {
  if (useFirestore) {
    const firestore = db();
    const existing = await firestore
      .collection(`sceneFrames/${document.tenantId}/scenes`)
      .where("documentId", "==", document.id)
      .get();

    const batch = firestore.batch();
    existing.docs.forEach((doc) => batch.delete(doc.ref));
    batch.set(firestore.doc(`sceneDocuments/${document.tenantId}/docs/${document.id}`), document);
    for (const scene of scenes) {
      batch.set(firestore.doc(`sceneFrames/${document.tenantId}/scenes/${scene.id}`), scene);
    }
    await batch.commit();
    return;
  }

  const store = readLocalStore();
  store.documents = store.documents.filter(
    (doc) => !(doc.tenantId === document.tenantId && doc.id === document.id)
  );
  store.scenes = store.scenes.filter(
    (scene) => !(scene.tenantId === document.tenantId && scene.documentId === document.id)
  );
  store.documents.push(document);
  store.scenes.push(...scenes);
  writeLocalStore(store);
}

export async function deleteSceneDocument(tenantId: string, documentId: string): Promise<number> {
  if (useFirestore) {
    const firestore = db();
    const existing = await firestore
      .collection(`sceneFrames/${tenantId}/scenes`)
      .where("documentId", "==", documentId)
      .get();

    const batch = firestore.batch();
    existing.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(firestore.doc(`sceneDocuments/${tenantId}/docs/${documentId}`));
    await batch.commit();
    return existing.size;
  }

  const store = readLocalStore();
  const before = store.scenes.length;
  store.documents = store.documents.filter(
    (doc) => !(doc.tenantId === tenantId && doc.id === documentId)
  );
  store.scenes = store.scenes.filter(
    (scene) => !(scene.tenantId === tenantId && scene.documentId === documentId)
  );
  writeLocalStore(store);
  return before - store.scenes.length;
}
