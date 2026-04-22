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

  const healthResponse = await request("/v1/health");
  assert.equal(healthResponse.status, 200, "health should succeed through the function endpoint");
  const healthPayload = await healthResponse.json();
  assert.ok(
    healthPayload.rag.storePath === "firestore" ||
      healthPayload.rag.storePath.endsWith(".runtime/rag-store.json"),
    "functions runtime should expose a valid Firestore or local emulator store path"
  );
  assert.equal(healthPayload.rag.documentCount, 2, "health should reflect Firestore-backed documents");

  console.log(
    JSON.stringify(
      {
        baseUrl,
        ingest: ingestPayload,
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
