import assert from "node:assert/strict";
import { once } from "node:events";
import { AddressInfo } from "node:net";
import { createServer } from "../apps/api/src/server.js";

async function main() {
  const app = createServer();
  const server = app.listen(0);
  await once(server, "listening");

  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fetch(`${baseUrl}/v1/admin/rag/reset`, {
      method: "POST"
    });

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
            text:
              "FunQA pricing policy keeps free search for up to one hundred source documents. Admin users can rotate provider keys from the admin console."
          },
          {
            id: "ingestion-guide",
            text:
              "The ingestion pipeline normalizes repository documents, extracts keywords, chunks long passages, embeds the chunks, and stores them for retrieval."
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
    assert.ok(
      searchPayload.answer.toLowerCase().includes("provider keys") ||
        searchPayload.answer.toLowerCase().includes("admin"),
      "answer should mention the matched policy"
    );
    assert.ok(searchPayload.citations.length > 0, "citations should be attached");

    const healthResponse = await fetch(`${baseUrl}/v1/health`);
    const healthPayload = await healthResponse.json();
    assert.equal(healthPayload.rag.documentCount, 2, "health should reflect rag store stats");

    console.log("RAG smoke test passed");
    console.log(
      JSON.stringify(
        {
          ingest: ingestPayload,
          searchTopResult: searchPayload.results[0],
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

