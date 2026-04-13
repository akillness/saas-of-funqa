const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4300";

async function main() {
  const response = await fetch(`${apiBaseUrl}/v1/ingest`, {
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
            "FunQA pricing policy keeps free search for up to one hundred source documents. Admin users can rotate provider keys from the admin console.",
          sourceUrl: "https://funqa.local/pricing"
        },
        {
          id: "security-boundary",
          text:
            "Provider keys are encrypted server-side with AES-GCM before persistence. The search workspace displays grounded answers with citations.",
          sourceUrl: "https://funqa.local/security"
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to seed demo RAG data: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
