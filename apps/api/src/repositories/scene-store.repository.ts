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
  // Caption-derived embedding. Retrieval quality depends on the vision model
  // having produced a real caption; a template fallback carries no signal.
  embedding: number[];
  // Whether `embedding` is actually usable for retrieval. Stored explicitly
  // rather than inferred from vector length, because the two failure modes are
  // distinct and both must exclude the channel: a 64-dim local-hash fallback
  // (wrong space) AND a full-width embedding of a TEMPLATE caption (right space,
  // no signal — and worse than nothing, since template text still scores
  // 0.55-0.60 on lexical overlap and outranks correct image matches at 0.31-0.39).
  // Absent on scenes written before this field existed; treat absent as usable
  // so pre-existing data keeps its previous behavior.
  captionEmbeddingUsable?: boolean;
  // Frame image embedded DIRECTLY into the same vector space (multimodal
  // embedding models only). Independent of the vision/generate_content quota,
  // so it survives a caption outage — the failure mode that made every caption
  // in a document identical while embeddings still reported "live".
  // Null when live embedding is unavailable or the model is text-only.
  imageEmbedding?: number[] | null;
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

/** A scene with the base64 frame image omitted — everything scoring needs. */
export type ScoringScene = Omit<StoredScene, "imageDataUrl">;

/**
 * Scenes without `imageDataUrl`, for the scoring pass.
 *
 * Scoring never reads the image bytes, but they dominate a scene document.
 * Measured on a real 480x270 frame: 62.4KB per scene, of which imageDataUrl is
 * 20KB (32%). Loading them for every search meant a 400-scene tenant transferred
 * and JSON-parsed ~7.6 MiB of image data per query that scoring never touched —
 * on a 512MiB function, where V8 string/array overhead multiplies the raw bytes.
 * Adding the second (image) embedding vector made the total worse, so the
 * projection lands together with it.
 *
 * Images for the handful of results actually returned are fetched afterwards by
 * `getSceneImages`.
 */
export async function getScenesForScoring(tenantId: string): Promise<ScoringScene[]> {
  if (useFirestore) {
    const snap = await db()
      .collection(`sceneFrames/${tenantId}/scenes`)
      .select(
        "id",
        "tenantId",
        "documentId",
        "documentTitle",
        "timecodeSec",
        "caption",
        "captionModel",
        "embedding",
        "captionEmbeddingUsable",
        "imageEmbedding",
        "embeddingMode",
        "embeddingModel",
        "createdAt"
      )
      .get();
    return snap.docs.map((d) => d.data() as ScoringScene);
  }

  // The local JSON store has no projection; it already holds everything in
  // memory, so strip the field to keep both branches on the same contract.
  return readLocalStore()
    .scenes.filter((scene) => scene.tenantId === tenantId)
    .map(({ imageDataUrl: _imageDataUrl, ...rest }) => rest);
}

/** Frame images for specific scene ids — called only for the returned topK. */
export async function getSceneImages(
  tenantId: string,
  sceneIds: string[]
): Promise<Map<string, string>> {
  if (sceneIds.length === 0) {
    return new Map();
  }

  if (useFirestore) {
    const firestore = db();
    const refs = sceneIds.map((id) => firestore.doc(`sceneFrames/${tenantId}/scenes/${id}`));
    const snaps = await firestore.getAll(...refs);
    return new Map(
      snaps
        .filter((snap) => snap.exists)
        .map((snap) => [snap.id, (snap.data() as StoredScene).imageDataUrl])
    );
  }

  const wanted = new Set(sceneIds);
  return new Map(
    readLocalStore()
      .scenes.filter((scene) => scene.tenantId === tenantId && wanted.has(scene.id))
      .map((scene) => [scene.id, scene.imageDataUrl])
  );
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
