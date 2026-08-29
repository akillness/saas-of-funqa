import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  SCENE_MAX_SCENES_PER_TENANT,
  type SceneAnalysisEvidence,
  type SceneAnalysisProvenance,
  type SceneQaCandidate
} from "@funqa/contracts";
import { config } from "../config.js";
import { FunQAError } from "../errors.js";
import { db, storage } from "../firebase.js";

// ---------------------------------------------------------------------------
// Scene store: persists video-document scenes (frame image + caption +
// caption embedding). Mirrors the RAG store strategy:
//   - local JSON file store for development (.runtime/scene-store.json)
//   - Firestore for the deployed Firebase runtime (SCENE_STORE_PATH=firestore)
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
  qaCandidates?: SceneQaCandidate[];
  pairedEvidenceCount?: number;
  analysisProvenance?: SceneAnalysisProvenance;
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
  imagePath?: string;
  analysisEvidence?: SceneAnalysisEvidence;
  analysisProvenance?: SceneAnalysisProvenance;
  // One fused vector for the generated visual caption, optional paired FunQA
  // evidence, and the frame image. Legacy caption-only scenes have no
  // `embeddingKind` and are excluded from live multimodal ranking until reindexed.
  embedding: number[];
  embeddingKind?: "gemini-embedding-2-multimodal" | "deterministic-local";
  embeddingMode: "local" | "live";
  embeddingModel: string;
  createdAt: string;
};

type LocalSceneStore = {
  documents: StoredSceneDocument[];
  scenes: StoredScene[];
};

const useFirestore = config.sceneStorePath === "firestore";
const SAFE_PATH_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SAFE_IMAGE_DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

function assertSafePathSegment(value: string, label: string): void {
  if (!SAFE_PATH_SEGMENT.test(value)) {
    throw new Error(`${label} is not a safe Firestore path segment`);
  }
}

function sceneBucket() {
  if (!config.firebaseStorageBucket) {
    throw new Error("SCENE_STORAGE_BUCKET is required for the Firestore scene store");
  }
  return storage().bucket(config.firebaseStorageBucket);
}

function sceneImagePath(scene: StoredScene): string {
  const extension = scene.imageDataUrl.startsWith("data:image/png")
    ? "png"
    : scene.imageDataUrl.startsWith("data:image/webp")
      ? "webp"
      : "jpg";
  const version = scene.createdAt.replace(/\D/g, "");
  return `scene-frames/${scene.tenantId}/${scene.documentId}/${scene.id}-${version}-${randomUUID()}.${extension}`;
}

function imageMimeType(imagePath: string): string {
  if (imagePath.endsWith(".png")) return "image/png";
  if (imagePath.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function uploadSceneImage(scene: StoredScene): Promise<string> {
  const match = SAFE_IMAGE_DATA_URL.exec(scene.imageDataUrl);
  if (!match) throw new Error(`scene ${scene.id} has an invalid image data URL`);
  const [, contentType, base64] = match;
  const imagePath = sceneImagePath(scene);
  await sceneBucket()
    .file(imagePath)
    .save(Buffer.from(base64, "base64"), {
      contentType,
      resumable: false,
      metadata: { cacheControl: "private, max-age=31536000, immutable" }
    });
  return imagePath;
}

async function deleteSceneImages(imagePaths: string[]): Promise<void> {
  await Promise.all(
    [...new Set(imagePaths)].map((imagePath) =>
      sceneBucket().file(imagePath).delete({ ignoreNotFound: true })
    )
  );
}

async function uploadSceneImages(scenes: StoredScene[]): Promise<string[]> {
  const uploads = await Promise.allSettled(scenes.map(uploadSceneImage));
  const failed = uploads.find((upload) => upload.status === "rejected");
  if (!failed) {
    return uploads.map((upload) => (upload as PromiseFulfilledResult<string>).value);
  }

  const uploadedPaths = uploads
    .filter((upload): upload is PromiseFulfilledResult<string> => upload.status === "fulfilled")
    .map((upload) => upload.value);
  await deleteSceneImages(uploadedPaths).catch(() => undefined);
  throw failed.reason;
}

function resolveLocalStorePath(): string {
  return path.resolve(config.sceneStorePath);
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
  } catch (error) {
    throw new Error(
      `Scene store at ${storePath} is unreadable; refusing to replace it with an empty index.`,
      { cause: error }
    );
  }
}

function writeLocalStore(store: LocalSceneStore): void {
  const storePath = resolveLocalStorePath();
  mkdirSync(path.dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(store, null, 2), "utf8");
  renameSync(temporaryPath, storePath);
}

export async function getSceneDocuments(tenantId: string): Promise<StoredSceneDocument[]> {
  assertSafePathSegment(tenantId, "tenantId");
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
  assertSafePathSegment(tenantId, "tenantId");
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
        "analysisEvidence",
        "analysisProvenance",
        "embedding",
        "embeddingKind",
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
  assertSafePathSegment(tenantId, "tenantId");
  sceneIds.forEach((id) => assertSafePathSegment(id, "sceneId"));
  if (sceneIds.length === 0) {
    return new Map();
  }

  if (useFirestore) {
    const firestore = db();
    const refs = sceneIds.map((id) => firestore.doc(`sceneFrames/${tenantId}/scenes/${id}`));
    const snaps = await firestore.getAll(...refs);
    const images = await Promise.all(
      snaps
        .filter((snap) => snap.exists)
        .map(async (snap) => {
          const scene = snap.data() as StoredScene;
          if (scene.imageDataUrl) return [snap.id, scene.imageDataUrl] as const;
          if (!scene.imagePath) return null;
          try {
            const [bytes] = await sceneBucket().file(scene.imagePath).download();
            return [
              snap.id,
              `data:${imageMimeType(scene.imagePath)};base64,${bytes.toString("base64")}`
            ] as const;
          } catch {
            console.warn("[scene-store] frame object missing", { sceneId: snap.id });
            return null;
          }
        })
    );
    return new Map(images.filter((image): image is readonly [string, string] => image !== null));
  }

  const wanted = new Set(sceneIds);
  return new Map(
    readLocalStore()
      .scenes.filter((scene) => scene.tenantId === tenantId && wanted.has(scene.id))
      .map((scene) => [scene.id, scene.imageDataUrl])
  );
}

export async function getSceneCount(tenantId: string): Promise<number> {
  assertSafePathSegment(tenantId, "tenantId");
  if (useFirestore) {
    const firestore = db();
    const tenant = await firestore.doc(`sceneTenants/${tenantId}`).get();
    const sceneCount = tenant.data()?.sceneCount;
    if (Number.isInteger(sceneCount) && sceneCount >= 0) return sceneCount as number;
    const snap = await firestore.collection(`sceneFrames/${tenantId}/scenes`).count().get();
    return snap.data().count;
  }

  return readLocalStore().scenes.filter((scene) => scene.tenantId === tenantId).length;
}

export async function upsertSceneDocument(
  document: StoredSceneDocument,
  scenes: StoredScene[]
): Promise<void> {
  assertSafePathSegment(document.tenantId, "tenantId");
  assertSafePathSegment(document.id, "documentId");
  scenes.forEach((scene) => assertSafePathSegment(scene.id, "sceneId"));
  if (useFirestore) {
    const firestore = db();
    const tenantRef = firestore.doc(`sceneTenants/${document.tenantId}`);
    const documentRef = firestore.doc(`sceneDocuments/${document.tenantId}/docs/${document.id}`);
    const documents = firestore.collection(`sceneDocuments/${document.tenantId}/docs`);
    const existingScenesQuery = firestore
      .collection(`sceneFrames/${document.tenantId}/scenes`)
      .where("documentId", "==", document.id);
    const imagePaths = await uploadSceneImages(scenes);
    const currentImagePaths = new Set(imagePaths);
    const currentSceneIds = new Set(scenes.map((scene) => scene.id));
    let staleImagePaths: string[] = [];

    try {
      await firestore.runTransaction(async (transaction) => {
        const tenant = await transaction.get(tenantRef);
        const existingDocument = await transaction.get(documentRef);
        const existingScenes = await transaction.get(existingScenesQuery);
        let storedCount = tenant.data()?.sceneCount;
        if (!Number.isInteger(storedCount) || storedCount < 0) {
          const existingDocuments = await transaction.get(documents);
          storedCount = existingDocuments.docs.reduce((total, entry) => {
            const count = Number(entry.data().sceneCount ?? 0);
            return total + (Number.isInteger(count) && count >= 0 ? count : 0);
          }, 0);
        }

        const rawReplacedCount = existingDocument.exists
          ? Number(existingDocument.data()?.sceneCount ?? existingScenes.size)
          : 0;
        const replacedCount =
          Number.isInteger(rawReplacedCount) && rawReplacedCount >= 0
            ? rawReplacedCount
            : existingScenes.size;
        const nextCount = Math.max(0, Number(storedCount) - replacedCount + scenes.length);
        if (nextCount > SCENE_MAX_SCENES_PER_TENANT) {
          throw new FunQAError(
            "invalid_request",
            `scene limit exceeded (max ${SCENE_MAX_SCENES_PER_TENANT}); nothing was stored`
          );
        }

        existingScenes.docs
          .filter((entry) => !currentSceneIds.has(entry.id))
          .forEach((entry) => transaction.delete(entry.ref));
        transaction.set(documentRef, document);
        scenes.forEach((scene, index) => {
          const { imageDataUrl: _imageDataUrl, ...metadata } = scene;
          transaction.set(firestore.doc(`sceneFrames/${document.tenantId}/scenes/${scene.id}`), {
            ...metadata,
            imagePath: imagePaths[index]
          });
        });
        transaction.set(tenantRef, {
          sceneCount: nextCount,
          updatedAt: document.createdAt
        });
        staleImagePaths = existingScenes.docs
          .map((entry) => (entry.data() as StoredScene).imagePath)
          .filter((imagePath): imagePath is string =>
            Boolean(imagePath && !currentImagePaths.has(imagePath))
          );
      });
    } catch (error) {
      await deleteSceneImages(imagePaths).catch(() => undefined);
      throw error;
    }

    if (staleImagePaths.length > 0) {
      await deleteSceneImages(staleImagePaths).catch((error) => {
        console.warn("[scene-store] stale frame cleanup failed", {
          count: staleImagePaths.length,
          message: error instanceof Error ? error.message : "unknown error"
        });
      });
    }
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
  assertSafePathSegment(tenantId, "tenantId");
  assertSafePathSegment(documentId, "documentId");
  if (useFirestore) {
    const firestore = db();
    const tenantRef = firestore.doc(`sceneTenants/${tenantId}`);
    const documentRef = firestore.doc(`sceneDocuments/${tenantId}/docs/${documentId}`);
    const documents = firestore.collection(`sceneDocuments/${tenantId}/docs`);
    const existingScenesQuery = firestore
      .collection(`sceneFrames/${tenantId}/scenes`)
      .where("documentId", "==", documentId);
    let imagePaths: string[] = [];
    let deletedScenes = 0;

    await firestore.runTransaction(async (transaction) => {
      const tenant = await transaction.get(tenantRef);
      const existingDocument = await transaction.get(documentRef);
      const existingScenes = await transaction.get(existingScenesQuery);
      let storedCount = tenant.data()?.sceneCount;
      if (!Number.isInteger(storedCount) || storedCount < 0) {
        const existingDocuments = await transaction.get(documents);
        storedCount = existingDocuments.docs.reduce((total, entry) => {
          const count = Number(entry.data().sceneCount ?? 0);
          return total + (Number.isInteger(count) && count >= 0 ? count : 0);
        }, 0);
      }

      const rawDocumentCount = Number(existingDocument.data()?.sceneCount ?? existingScenes.size);
      const documentCount =
        Number.isInteger(rawDocumentCount) && rawDocumentCount >= 0
          ? rawDocumentCount
          : existingScenes.size;
      const nextCount = Math.max(0, Number(storedCount) - documentCount);
      existingScenes.docs.forEach((entry) => transaction.delete(entry.ref));
      transaction.delete(documentRef);
      transaction.set(tenantRef, {
        sceneCount: nextCount,
        updatedAt: new Date().toISOString()
      });
      imagePaths = existingScenes.docs
        .map((entry) => (entry.data() as StoredScene).imagePath)
        .filter((imagePath): imagePath is string => Boolean(imagePath));
      deletedScenes = existingScenes.size;
    });

    if (imagePaths.length > 0) {
      await deleteSceneImages(imagePaths).catch((error) => {
        console.warn("[scene-store] deleted-document frame cleanup failed", {
          count: imagePaths.length,
          message: error instanceof Error ? error.message : "unknown error"
        });
      });
    }
    return deletedScenes;
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
