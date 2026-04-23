import type {
  CreatorActiveGuideVersion,
  CreatorAnalysisRecord,
  CreatorGuideRecord,
  CreatorGuideSourceInventory,
  CreatorIngestBundleRequest,
  CreatorIngestBundleResponse,
  CreatorMonetizationSource,
  CreatorOriginalRecord,
  CreatorAnalysisSummary,
} from "@funqa/contracts";
import { db } from "../firebase.js";
import { ingestAdditionalDocuments } from "../services/rag.service.js";

const ACTIVE_GUIDE_DOC_ID = "active";

function analysisCollection(tenantId: string) {
  return db().collection(`creatorVideoAnalyses/${tenantId}/records`);
}

function monetizationSourceCollection(tenantId: string) {
  return db().collection(`creatorMonetizationSources/${tenantId}/sources`);
}

function originalCollection(tenantId: string) {
  return db().collection(`creatorMonetizationSources/${tenantId}/originals`);
}

function guideVersionCollection(tenantId: string) {
  return db().collection(`creatorGuides/${tenantId}/versions`);
}

function guideMetaCollection(tenantId: string) {
  return db().collection(`creatorGuides/${tenantId}/meta`);
}

function sourceInventoryCollection(tenantId: string) {
  return db().collection(`creatorGuides/${tenantId}/sourceInventories`);
}

function buildAnalysisSummary(records: CreatorAnalysisRecord[]): CreatorAnalysisSummary {
  const summary: CreatorAnalysisSummary = {
    totalCount: records.length,
    uploadedCount: 0,
    failedCount: 0,
    pendingCount: 0,
  };

  for (const record of records) {
    const youtubeStatus = typeof record.youtubeStatus === "string"
      ? record.youtubeStatus
      : "pending";

    if (youtubeStatus === "uploaded") {
      summary.uploadedCount += 1;
    } else if (youtubeStatus === "failed") {
      summary.failedCount += 1;
    } else {
      summary.pendingCount += 1;
    }
  }

  return summary;
}

export async function saveCreatorIngestBundle(
  input: CreatorIngestBundleRequest
): Promise<CreatorIngestBundleResponse> {
  const firestore = db();
  const batch = firestore.batch();
  const tenantId = input.tenantId;
  const persisted: CreatorIngestBundleResponse["persisted"] = {
    analysis: false,
    source: false,
    original: false,
    searchDocument: false,
    guide: false,
    guideVersion: false,
    guideLineage: false,
    activeVersion: false,
    sourceInventory: false,
  };
  let searchDocumentsAccepted = 0;

  if (input.analysisRecord) {
    const record: CreatorAnalysisRecord = {
      ...input.analysisRecord,
      tenantId,
      analysisId: input.analysisRecord.analysisId,
      id:
        typeof input.analysisRecord.id === "string" &&
        input.analysisRecord.id.length > 0
          ? input.analysisRecord.id
          : input.analysisRecord.analysisId,
    };

    batch.set(analysisCollection(tenantId).doc(record.analysisId), record, {
      merge: true,
    });
    persisted.analysis = true;
  }

  if (input.monetizationSource) {
    const record: CreatorMonetizationSource = {
      ...input.monetizationSource,
      tenantId,
    };
    batch.set(
      monetizationSourceCollection(tenantId).doc(record.sourceId),
      record,
      { merge: true }
    );
    persisted.source = true;
  }

  if (input.original) {
    const record: CreatorOriginalRecord = {
      ...input.original,
      tenantId,
    };
    batch.set(originalCollection(tenantId).doc(record.originalId), record, {
      merge: true,
    });
    persisted.original = true;
  }

  if (input.guide) {
    const record: CreatorGuideRecord = {
      ...input.guide,
      tenantId,
    };
    batch.set(guideVersionCollection(tenantId).doc(record.version), record, {
      merge: true,
    });
    persisted.guide = true;
    persisted.guideVersion = true;
    persisted.guideLineage = true;
  }

  if (input.activeGuideVersion) {
    const record: CreatorActiveGuideVersion = {
      ...input.activeGuideVersion,
      tenantId,
    };
    batch.set(guideMetaCollection(tenantId).doc(ACTIVE_GUIDE_DOC_ID), record, {
      merge: true,
    });
    persisted.activeVersion = true;
  }

  if (input.sourceInventory) {
    const record: CreatorGuideSourceInventory = {
      ...input.sourceInventory,
      tenantId,
    };
    batch.set(sourceInventoryCollection(tenantId).doc(record.inventoryId), record, {
      merge: true,
    });
    persisted.sourceInventory = true;
  }

  await batch.commit();

  if ((input.searchDocuments?.length ?? 0) > 0) {
    const ingestResult = await ingestAdditionalDocuments({
      tenantId,
      documents: input.searchDocuments ?? [],
    });
    searchDocumentsAccepted = ingestResult.accepted;
    persisted.searchDocument = ingestResult.accepted > 0;
  }

  return {
    tenantId,
    persisted,
    searchDocumentsAccepted,
  };
}

export async function getCreatorAnalysisRecord(
  tenantId: string,
  analysisId: string
): Promise<CreatorAnalysisRecord | null> {
  const snap = await analysisCollection(tenantId).doc(analysisId).get();
  return snap.exists ? (snap.data() as CreatorAnalysisRecord) : null;
}

export async function listCreatorAnalysisRecords(input: {
  tenantId: string;
  limit: number;
}): Promise<{
  tenantId: string;
  totalCount: number;
  summary: CreatorAnalysisSummary;
  analyses: CreatorAnalysisRecord[];
}> {
  const [orderedSnap, allSnap] = await Promise.all([
    analysisCollection(input.tenantId)
      .orderBy("createdAt", "desc")
      .limit(input.limit)
      .get(),
    analysisCollection(input.tenantId).get(),
  ]);

  const analyses = orderedSnap.docs.map((doc) => doc.data() as CreatorAnalysisRecord);
  const allRecords = allSnap.docs.map((doc) => doc.data() as CreatorAnalysisRecord);

  return {
    tenantId: input.tenantId,
    totalCount: allRecords.length,
    summary: buildAnalysisSummary(allRecords),
    analyses,
  };
}

export async function getLatestPublishedGuide(tenantId: string): Promise<{
  tenantId: string;
  latestPublishedGuide: CreatorGuideRecord | null;
  activeGuideVersion: CreatorActiveGuideVersion | null;
}> {
  const activeSnap = await guideMetaCollection(tenantId).doc(ACTIVE_GUIDE_DOC_ID).get();

  if (!activeSnap.exists) {
    return {
      tenantId,
      latestPublishedGuide: null,
      activeGuideVersion: null,
    };
  }

  const activeGuideVersion = activeSnap.data() as CreatorActiveGuideVersion;
  const guideSnap = await guideVersionCollection(tenantId)
    .doc(activeGuideVersion.guideVersion)
    .get();

  return {
    tenantId,
    latestPublishedGuide: guideSnap.exists
      ? (guideSnap.data() as CreatorGuideRecord)
      : null,
    activeGuideVersion,
  };
}

export async function listLatestMonetizationSources(tenantId: string): Promise<{
  tenantId: string;
  sources: CreatorMonetizationSource[];
  priorGuideSourceInventories: CreatorGuideSourceInventory[];
}> {
  const [sourcesSnap, inventorySnap] = await Promise.all([
    monetizationSourceCollection(tenantId)
      .orderBy("fetchedAt", "desc")
      .limit(500)
      .get(),
    sourceInventoryCollection(tenantId)
      .orderBy("recordedAt", "desc")
      .limit(100)
      .get(),
  ]);

  return {
    tenantId,
    sources: sourcesSnap.docs.map((doc) => doc.data() as CreatorMonetizationSource),
    priorGuideSourceInventories: inventorySnap.docs.map(
      (doc) => doc.data() as CreatorGuideSourceInventory
    ),
  };
}
