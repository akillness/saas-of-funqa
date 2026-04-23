import assert from "node:assert/strict";

const baseUrl =
  process.env.FUNQA_FUNCTIONS_BASE_URL ??
  "http://127.0.0.1:5001/saas-of-funqa/asia-northeast3/api";

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  return response;
}

async function main() {
  const resetResponse = await request("/v1/admin/rag/reset", { method: "POST" });
  assert.equal(resetResponse.status, 200, "reset should succeed through the function endpoint");

  const ingestResponse = await request("/v1/ingest", {
    method: "POST",
    body: JSON.stringify({
      tenantId: "demo",
      documents: [
        {
          id: "pricing-policy",
          text:
            "FunQA pricing policy keeps free search for up to one hundred source documents. Admin users can rotate provider keys from the admin console."
        },
        {
          id: "firebase-runtime",
          text:
            "The Firebase Functions runtime stores demo RAG artifacts in Firestore so the serverless API remains stateful across requests."
        }
      ]
    })
  });

  assert.equal(ingestResponse.status, 202, "ingest should succeed through the function endpoint");
  const ingestPayload = await ingestResponse.json();
  assert.equal(ingestPayload.documentCount, 2, "two documents should be stored");

  const searchResponse = await request("/v1/search", {
    method: "POST",
    body: JSON.stringify({
      tenantId: "demo",
      query: "Where are Firebase runtime documents stored?",
      topK: 3
    })
  });

  assert.equal(searchResponse.status, 200, "search should succeed through the function endpoint");
  const searchPayload = await searchResponse.json();
  assert.equal(searchPayload.answerMode, "evidence-only", "search should expose evidence-only mode");
  assert.equal(searchPayload.answer, null, "search should suppress synthesized prose until consensus passes");
  assert.equal(searchPayload.consensus.reached, false, "consensus should remain closed in the scaffold");
  assert.ok(searchPayload.citations.length > 0, "citations should be present");

  const inspectResponse = await request("/v1/rag/inspect", {
    method: "POST",
    body: JSON.stringify({
      tenantId: "demo",
      query: "How does the Firebase runtime keep state?"
    })
  });

  assert.equal(inspectResponse.status, 200, "rag inspect should succeed in Firestore mode");

  const creatorBundleResponse = await request("/v1/creator-ingest-bundle", {
    method: "POST",
    body: JSON.stringify({
      tenantId: "creator-demo",
      analysisRecord: {
        tenantId: "creator-demo",
        analysisId: "analysis-1",
        filename: "creator-weekly.mp4",
        status: "processed",
        youtubeStatus: "uploaded",
        createdAt: "2026-04-23T00:00:00.000Z",
        updatedAt: "2026-04-23T00:05:00.000Z"
      },
      monetizationSource: {
        tenantId: "creator-demo",
        sourceId: "source-1",
        canonicalSourceId: "canon-1",
        url: "https://example.com/creator-monetization",
        title: "Creator monetization update",
        publisher: "FunQA Research",
        sourceKind: "news",
        fetchedAt: "2026-04-23T00:10:00.000Z",
        publishedAt: "2026-04-22T09:00:00.000Z",
        fullText: "Platforms are increasing support for affiliate and subscription bundles.",
        excerpt: "Affiliate and subscription bundles are expanding.",
        dedupeHash: "hash-source-1",
        tags: ["affiliate", "subscriptions"]
      },
      original: {
        tenantId: "creator-demo",
        originalId: "original-1",
        parentSourceId: "source-1",
        sourceUrl: "https://example.com/creator-monetization",
        mimeType: "text/html",
        body: "<article>Creator monetization update</article>",
        bodySha256: "sha256-original-1",
        fetchedAt: "2026-04-23T00:10:00.000Z"
      },
      guide: {
        tenantId: "creator-demo",
        guideId: "guide-weekly",
        version: "guide-v1",
        slug: "creator-monetization-weekly",
        title: "Creator monetization weekly guide",
        weekKey: "2026-W17",
        status: "published",
        publishedAt: "2026-04-23T00:20:00.000Z",
        updatedAt: "2026-04-23T00:25:00.000Z",
        sourceIds: ["source-1"],
        sourceCount: 1,
        citationCount: 1,
        body: "Weekly creator monetization synthesis",
        sections: [
          {
            id: "summary",
            title: "Summary",
            summary: "Subscriptions and affiliate bundles are increasing.",
            citations: [
              {
                sourceId: "source-1",
                title: "Creator monetization update",
                url: "https://example.com/creator-monetization",
                publisher: "FunQA Research",
                sourceKind: "news"
              }
            ]
          }
        ]
      },
      activeGuideVersion: {
        tenantId: "creator-demo",
        guideId: "guide-weekly",
        guideVersion: "guide-v1",
        slug: "creator-monetization-weekly",
        title: "Creator monetization weekly guide",
        weekKey: "2026-W17",
        status: "published",
        activatedAt: "2026-04-23T00:30:00.000Z",
        updatedAt: "2026-04-23T00:30:00.000Z"
      },
      sourceInventory: {
        tenantId: "creator-demo",
        inventoryId: "inventory-1",
        guideId: "guide-weekly",
        guideWeekKey: "2026-W17",
        guideVersionDraft: "guide-v1",
        recordedAt: "2026-04-23T00:31:00.000Z",
        sourceCount: 1,
        sourceIdentifiers: [
          {
            sourceId: "source-1",
            canonicalSourceId: "canon-1",
            url: "https://example.com/creator-monetization"
          }
        ]
      },
      searchDocuments: [
        {
          id: "creator-doc-1",
          text: "Creator monetization sources feed the weekly synthesis workflow."
        }
      ]
    })
  });

  assert.equal(
    creatorBundleResponse.status,
    202,
    "creator ingest bundle should succeed through the function endpoint"
  );
  const creatorBundlePayload = await creatorBundleResponse.json();
  assert.equal(creatorBundlePayload.tenantId, "creator-demo");
  assert.equal(creatorBundlePayload.persisted.analysis, true);
  assert.equal(creatorBundlePayload.persisted.source, true);
  assert.equal(creatorBundlePayload.persisted.original, true);
  assert.equal(creatorBundlePayload.persisted.guide, true);
  assert.equal(creatorBundlePayload.persisted.activeVersion, true);
  assert.equal(creatorBundlePayload.persisted.sourceInventory, true);
  assert.equal(creatorBundlePayload.searchDocumentsAccepted, 1);

  const analysesResponse = await request("/v1/video-analyses?tenantId=creator-demo&limit=10");
  assert.equal(analysesResponse.status, 200, "video analyses listing should succeed");
  const analysesPayload = await analysesResponse.json();
  assert.equal(analysesPayload.totalCount, 1, "video analyses should include the seeded record");
  assert.equal(analysesPayload.summary.uploadedCount, 1, "uploaded summary should reflect seeded status");
  assert.equal(analysesPayload.analyses[0].analysisId, "analysis-1");

  const analysisDetailResponse = await request(
    "/v1/video-analyses/analysis-1?tenantId=creator-demo"
  );
  assert.equal(analysisDetailResponse.status, 200, "video analysis detail should succeed");
  const analysisDetailPayload = await analysisDetailResponse.json();
  assert.equal(analysisDetailPayload.analysis.filename, "creator-weekly.mp4");

  const latestGuideResponse = await request(
    "/v1/monetization-guides/latest?tenantId=creator-demo"
  );
  assert.equal(latestGuideResponse.status, 200, "latest monetization guide should succeed");
  const latestGuidePayload = await latestGuideResponse.json();
  assert.equal(latestGuidePayload.latestPublishedGuide.version, "guide-v1");
  assert.equal(latestGuidePayload.activeGuideVersion.guideVersion, "guide-v1");

  const latestSourcesResponse = await request("/v1/monetization-sources/latest", {
    method: "POST",
    body: JSON.stringify({
      tenantId: "creator-demo",
      weekKey: "2026-W17"
    })
  });
  assert.equal(latestSourcesResponse.status, 200, "latest monetization sources should succeed");
  const latestSourcesPayload = await latestSourcesResponse.json();
  assert.equal(latestSourcesPayload.sources.length, 1, "latest sources should include the seeded source");
  assert.equal(
    latestSourcesPayload.priorGuideSourceInventories.length,
    1,
    "source inventories should include the seeded guide inventory"
  );

  const healthResponse = await request("/v1/health");
  assert.equal(healthResponse.status, 200, "health should succeed through the function endpoint");
  const healthPayload = await healthResponse.json();
  assert.ok(
    healthPayload.rag.storePath === "firestore" ||
      healthPayload.rag.storePath.endsWith(".runtime/rag-store.json"),
    "functions runtime should expose a valid Firestore or local emulator store path"
  );
  assert.ok(
    healthPayload.rag.documentCount >= 2,
    "health should reflect persisted Firestore-backed documents"
  );

  console.log(
    JSON.stringify(
      {
        baseUrl,
        ingest: ingestPayload,
        creatorBundle: creatorBundlePayload,
        analysesSummary: analysesPayload.summary,
        latestGuideVersion: latestGuidePayload.activeGuideVersion.guideVersion,
        searchTopResult: searchPayload.results[0],
        health: healthPayload.rag
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
