import assert from "node:assert/strict";
import { once } from "node:events";
import { AddressInfo } from "node:net";

async function main() {
  process.env.RAG_LIVE_EMBEDDINGS = "0";
  const { createServer } = await import("../apps/api/src/server.js");
  const app = createServer();
  const server = app.listen(0);
  await once(server, "listening");

  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const allowedPreflight = await fetch(`${baseUrl}/v1/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3132",
        "Access-Control-Request-Method": "GET"
      }
    });
    assert.equal(allowedPreflight.status, 204, "configured origins should pass CORS preflight");
    assert.equal(
      allowedPreflight.headers.get("access-control-allow-origin"),
      "http://localhost:3132"
    );
    const blockedPreflight = await fetch(`${baseUrl}/v1/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://untrusted.example",
        "Access-Control-Request-Method": "GET"
      }
    });
    assert.equal(blockedPreflight.status, 403, "unknown origins should fail CORS preflight");
    assert.equal(blockedPreflight.headers.get("access-control-allow-origin"), null);

    const resetResponse = await fetch(`${baseUrl}/v1/admin/rag/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: "demo" })
    });
    assert.equal(resetResponse.status, 200, "reset should succeed");

    const ingestResponse = await fetch(`${baseUrl}/v1/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tenantId: "demo",
        documents: [
          {
            id: "pricing-policy",
            text: "FunQA pricing policy keeps free search for up to one hundred source documents. Admin users can rotate provider keys from the admin console."
          },
          {
            id: "ingestion-guide",
            text: "The ingestion pipeline normalizes repository documents, extracts keywords, chunks long passages, embeds the chunks, and stores them for retrieval."
          }
        ]
      })
    });

    assert.equal(ingestResponse.status, 202, "ingest should accept documents");
    const ingestPayload = await ingestResponse.json();
    assert.equal(ingestPayload.documentCount, 2, "two documents should be stored");
    assert.ok(ingestPayload.chunkCount >= 2, "chunks should be created");

    const searchResponse = await fetch(`${baseUrl}/v1/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tenantId: "demo",
        query: "How do admins rotate provider keys?",
        topK: 3
      })
    });

    assert.equal(searchResponse.status, 200, "search should succeed");
    const searchPayload = await searchResponse.json();
    assert.equal(searchPayload.totalDocuments, 2, "stored documents should be visible");
    assert.ok(searchPayload.results.length > 0, "search should return ranked results");

    // Under low-confidence local mock embedding environment, Dynamic Consensus should safely remain closed
    assert.equal(
      searchPayload.consensus.reached,
      false,
      "consensus should safely remain closed on low-confidence local mock evidence"
    );
    assert.equal(
      searchPayload.answerMode,
      "evidence-only",
      "search should expose evidence-only mode"
    );
    assert.equal(
      searchPayload.answer,
      null,
      "search should suppress synthesized answer under low-confidence evidence"
    );

    assert.equal(
      searchPayload.retrievalMode,
      "graph-core",
      "search should report graph-core retrieval intent"
    );
    assert.equal(
      searchPayload.consensus.reason,
      "insufficient-confidence",
      "search should report insufficient-confidence status"
    );
    assert.ok(searchPayload.citations.length > 0, "citations should be attached");

    // Validate custom rerankMode "genkit-score" integration
    const genkitRerankSearchResponse = await fetch(`${baseUrl}/v1/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tenantId: "demo",
        query: "How do admins rotate provider keys?",
        topK: 3,
        rerankMode: "genkit-score"
      })
    });

    assert.equal(
      genkitRerankSearchResponse.status,
      200,
      "search with genkit-score rerankMode should succeed"
    );
    const genkitRerankPayload = await genkitRerankSearchResponse.json();
    assert.equal(
      genkitRerankPayload.consensus.reached,
      false,
      "consensus should remain closed on genkit-score low-confidence evidence"
    );
    assert.equal(
      genkitRerankPayload.consensus.reason,
      "insufficient-confidence",
      "genkit-score search should report insufficient-confidence status"
    );
    assert.ok(
      genkitRerankPayload.results.length > 0,
      "genkit-score search should return ranked results"
    );

    const statsResponse = await fetch(`${baseUrl}/v1/admin/rag/stats?tenantId=demo`);
    const statsPayload = await statsResponse.json();
    assert.equal(
      statsPayload.documentCount,
      2,
      "tenant-scoped admin stats should reflect the store"
    );

    const healthResponse = await fetch(`${baseUrl}/v1/health`);
    const healthPayload = await healthResponse.json();
    assert.equal(healthResponse.status, 200, "cheap public health should stay available");
    assert.deepEqual(
      Object.keys(healthPayload).sort(),
      ["status", "timestamp"],
      "public liveness must not expose operational details"
    );

    const adminHealthResponse = await fetch(`${baseUrl}/v1/admin/health`);
    const adminHealthPayload = await adminHealthResponse.json();
    assert.equal(adminHealthResponse.status, 200);
    assert.equal(adminHealthPayload.rag.documentCount, null);

    console.log("RAG smoke test passed");
    console.log(
      JSON.stringify(
        {
          ingest: ingestPayload,
          searchTopResult: searchPayload.results[0],
          answerMode: searchPayload.answerMode,
          citations: searchPayload.citations.length
        },
        null,
        2
      )
    );
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
