import assert from "node:assert/strict";

const baseUrl =
  process.env.FUNQA_FUNCTIONS_BASE_URL ?? "http://127.0.0.1:5001/saas-of-funqa/asia-northeast3/api";

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
  const resetResponse = await request("/v1/admin/rag/reset", {
    method: "POST",
    body: JSON.stringify({ tenantId: "demo" })
  });
  const resetFailure = resetResponse.status === 200 ? "" : await resetResponse.clone().text();
  assert.equal(
    resetResponse.status,
    200,
    `reset should succeed through the function endpoint${resetFailure ? `: ${resetFailure}` : ""}`
  );

  const ingestResponse = await request("/v1/ingest", {
    method: "POST",
    body: JSON.stringify({
      tenantId: "demo",
      documents: [
        {
          id: "pricing-policy",
          text: "FunQA pricing policy keeps free search for up to one hundred source documents. Admin users can rotate provider keys from the admin console."
        },
        {
          id: "firebase-runtime",
          text: "The Firebase Functions runtime stores demo RAG artifacts in Firestore so the serverless API remains stateful across requests."
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
  assert.equal(
    searchPayload.answerMode,
    "evidence-only",
    "search should expose evidence-only mode"
  );
  assert.equal(
    searchPayload.answer,
    null,
    "search should suppress synthesized prose until consensus passes"
  );
  assert.equal(
    searchPayload.consensus.reached,
    false,
    "consensus should remain closed in the scaffold"
  );
  assert.ok(searchPayload.citations.length > 0, "citations should be present");

  const inspectResponse = await request("/v1/rag/inspect", {
    method: "POST",
    body: JSON.stringify({
      tenantId: "demo",
      query: "How does the Firebase runtime keep state?"
    })
  });

  assert.equal(inspectResponse.status, 200, "rag inspect should succeed in Firestore mode");

  await request("/v1/scenes/documents/smoke-video?tenantId=demo", { method: "DELETE" });
  const sceneIngestResponse = await request("/v1/scenes/ingest", {
    method: "POST",
    body: JSON.stringify({
      tenantId: "demo",
      document: {
        id: "smoke-video",
        title: "Storage smoke video",
        mimeType: "video/mp4",
        durationSec: 2
      },
      frames: [
        {
          timecodeSec: 1,
          imageDataUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        }
      ]
    })
  });
  assert.equal(
    sceneIngestResponse.status,
    201,
    "scene ingest should write a private Storage frame"
  );

  const sceneListAfterIngest = await request("/v1/scenes/documents?tenantId=demo");
  assert.equal(sceneListAfterIngest.status, 200, "scene list should read the tenant counter");
  assert.equal(
    (await sceneListAfterIngest.json()).totalScenes,
    1,
    "transactional tenant counter should include the ingested frame"
  );

  const sceneSearchResponse = await request("/v1/scenes/search", {
    method: "POST",
    body: JSON.stringify({ tenantId: "demo", query: "storage smoke video", topK: 1 })
  });
  assert.equal(sceneSearchResponse.status, 200, "scene search should read the stored frame");
  const sceneSearchPayload = await sceneSearchResponse.json();
  assert.equal(sceneSearchPayload.results.length, 1, "the stored scene should be searchable");
  assert.match(sceneSearchPayload.results[0].imageDataUrl, /^data:image\/png;base64,/);

  const sceneDeleteResponse = await request("/v1/scenes/documents/smoke-video?tenantId=demo", {
    method: "DELETE"
  });
  assert.equal(
    sceneDeleteResponse.status,
    200,
    "scene delete should remove metadata and frame object"
  );
  const sceneListAfterDelete = await request("/v1/scenes/documents?tenantId=demo");
  assert.equal(
    (await sceneListAfterDelete.json()).totalScenes,
    0,
    "transactional tenant counter should decrement after deletion"
  );

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
  assert.equal(
    analysesPayload.summary.uploadedCount,
    1,
    "uploaded summary should reflect seeded status"
  );
  assert.equal(analysesPayload.analyses[0].analysisId, "analysis-1");

  const analysisDetailResponse = await request(
    "/v1/video-analyses/analysis-1?tenantId=creator-demo"
  );
  assert.equal(analysisDetailResponse.status, 200, "video analysis detail should succeed");
  const analysisDetailPayload = await analysisDetailResponse.json();
  assert.equal(analysisDetailPayload.analysis.filename, "creator-weekly.mp4");

  const latestGuideResponse = await request("/v1/monetization-guides/latest?tenantId=creator-demo");
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
  assert.equal(
    latestSourcesPayload.sources.length,
    1,
    "latest sources should include the seeded source"
  );
  assert.equal(
    latestSourcesPayload.priorGuideSourceInventories.length,
    1,
    "source inventories should include the seeded guide inventory"
  );

  const ragStatsResponse = await request("/v1/admin/rag/stats?tenantId=demo");
  assert.equal(ragStatsResponse.status, 200, "tenant RAG stats should succeed");
  const ragStatsPayload = await ragStatsResponse.json();
  assert.equal(
    ragStatsPayload.documentCount,
    2,
    "RAG stats must not count sceneDocuments/{tenant}/docs"
  );

  const healthResponse = await request("/v1/health");
  assert.equal(healthResponse.status, 200, "liveness should succeed through the function endpoint");
  const livenessPayload = await healthResponse.json();
  assert.deepEqual(
    Object.keys(livenessPayload).sort(),
    ["status", "timestamp"],
    "public liveness must not expose operational details"
  );

  const adminHealthResponse = await request("/v1/admin/health");
  assert.equal(adminHealthResponse.status, 200, "admin health should succeed");
  const healthPayload = await adminHealthResponse.json();
  assert.ok(
    healthPayload.rag.storePath === "firestore" ||
      healthPayload.rag.storePath.endsWith(".runtime/rag-store.json"),
    "admin health should expose a valid Firestore or local emulator store path"
  );
  assert.equal(healthPayload.rag.documentCount, null);

  // ── Monitoring Summary Test ──────────────────────────────────
  console.log("Running Monitoring Summary smoke test...");
  const monitoringResponse = await request("/v1/monitoring/summary");
  assert.equal(monitoringResponse.status, 200, "monitoring summary should succeed");
  const monitoringPayload = await monitoringResponse.json();
  assert.equal(typeof monitoringPayload.dailyCostUsd, "number", "dailyCostUsd must be a number");
  assert.ok(
    monitoringPayload.successRate === null || typeof monitoringPayload.successRate === "number",
    "successRate must be a number or null when no completed request exists"
  );
  assert.ok(
    monitoringPayload.p95LatencyMs === null || typeof monitoringPayload.p95LatencyMs === "number",
    "p95LatencyMs must be a number or null when no latency sample exists"
  );
  assert.equal(monitoringPayload.scope, "instance", "monitoring scope must be explicit");

  // ── Provider Keys Tests ─────────────────────────────────────────
  console.log("Running Provider Keys smoke tests...");
  const providerKeyPayload = {
    tenantId: "demo",
    label: "Demo Gemini Key",
    apiKey: "gemini-api-key-test-must-be-long-enough",
    notes: "Testing gemini key storage"
  };

  const createKeyResponse = await request("/v1/provider-keys/gemini", {
    method: "POST",
    body: JSON.stringify(providerKeyPayload)
  });
  assert.equal(createKeyResponse.status, 201, "POST provider-key should succeed");
  const createKeyResult = await createKeyResponse.json();
  assert.equal(createKeyResult.tenantId, "demo", "tenantId should match");
  assert.equal(createKeyResult.provider, "gemini", "provider should match");
  assert.equal(createKeyResult.label, "Demo Gemini Key", "label should match");
  assert.ok(createKeyResult.keyVersion, "keyVersion should be present");
  assert.ok(createKeyResult.storedAt, "storedAt should be present");

  const getKeyResponse = await request("/v1/provider-keys/gemini?tenantId=demo", {
    method: "GET"
  });
  assert.equal(getKeyResponse.status, 200, "GET provider-key should succeed");
  const getKeyResult = await getKeyResponse.json();
  assert.equal(getKeyResult.exists, true, "exists should be true");
  assert.equal(getKeyResult.provider, "gemini", "provider should match");

  const deleteKeyResponse = await request("/v1/provider-keys/gemini?tenantId=demo", {
    method: "DELETE"
  });
  assert.equal(deleteKeyResponse.status, 204, "DELETE provider-key should succeed");

  const getDeletedKeyResponse = await request("/v1/provider-keys/gemini?tenantId=demo", {
    method: "GET"
  });
  assert.equal(getDeletedKeyResponse.status, 404, "GET deleted provider-key should return 404");

  // ── LLM Wiki Entry Tests ───────────────────────────────────────
  console.log("Running LLM Wiki smoke tests...");
  const wikiEntryPayload = {
    id: "test-concept-1",
    type: "concept",
    title: "FunQA Consensus",
    content: "Consensus requires 90% or higher agreement among RAG source documents.",
    tags: ["consensus", "rag"],
    path: "knowledge/wiki/concepts/funqa-consensus.md",
    sourceFile: "knowledge/wiki/concepts/funqa-consensus.md",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "agent-smoke"
  };

  const createWikiResponse = await request("/v1/wiki", {
    method: "POST",
    body: JSON.stringify(wikiEntryPayload)
  });
  assert.equal(createWikiResponse.status, 201, "POST wiki entry should succeed");
  const createWikiResult = await createWikiResponse.json();
  assert.equal(createWikiResult.id, "test-concept-1", "id should match");
  assert.equal(createWikiResult.type, "concept", "type should match");
  assert.equal(createWikiResult.title, "FunQA Consensus", "title should match");

  const getWikiResponse = await request("/v1/wiki/concept/test-concept-1");
  assert.equal(getWikiResponse.status, 200, "GET wiki entry should succeed");
  const getWikiResult = await getWikiResponse.json();
  assert.equal(getWikiResult.id, "test-concept-1", "id should match in fetched wiki entry");
  assert.equal(
    getWikiResult.content,
    "Consensus requires 90% or higher agreement among RAG source documents.",
    "content should match"
  );

  const queryWikiResponse = await request("/v1/wiki/concept");
  assert.equal(queryWikiResponse.status, 200, "GET wiki entries by type should succeed");
  const queryWikiResult = await queryWikiResponse.json();
  assert.ok(Array.isArray(queryWikiResult), "query result should be an array");
  const foundEntry = queryWikiResult.find((e) => e.id === "test-concept-1");
  assert.ok(foundEntry, "seeded entry should be found in query list");

  const deleteWikiResponse = await request("/v1/wiki/concept/test-concept-1", {
    method: "DELETE"
  });
  assert.equal(deleteWikiResponse.status, 204, "DELETE wiki entry should succeed");

  const getDeletedWikiResponse = await request("/v1/wiki/concept/test-concept-1");
  assert.equal(getDeletedWikiResponse.status, 404, "GET deleted wiki entry should return 404");

  console.log(
    JSON.stringify(
      {
        baseUrl,
        ingest: ingestPayload,
        creatorBundle: creatorBundlePayload,
        analysesSummary: analysesPayload.summary,
        latestGuideVersion: latestGuidePayload.activeGuideVersion.guideVersion,
        searchTopResult: searchPayload.results[0],
        health: healthPayload.rag,
        monitoring: monitoringPayload,
        providerKeyCreated: createKeyResult,
        wikiEntryCreated: createWikiResult
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
