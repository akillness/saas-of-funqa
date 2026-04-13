const sections = [
  "overview",
  "auth",
  "quickstart",
  "endpoints",
  "errors",
  "limits"
];

export default function DocsPage() {
  return (
    <div className="docs-layout">
      <aside className="panel docs-nav">
        <h2>API Docs</h2>
        <nav aria-label="API sections">
          <ul className="bullet-list compact-list">
            {sections.map((section) => (
              <li key={section}>
                <a href={`#${section}`}>{section}</a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <article className="panel docs-article">
        <header className="stack-sm">
          <p className="eyebrow">Public API Docs</p>
          <h1>Authenticate, ingest content, and retrieve grounded answers from one server boundary.</h1>
          <p className="lede">
            Start with Google-authenticated workspace access, then use task-first endpoints for
            ingest, search, and provider-key administration.
          </p>
          <pre className="code-block">
            <code>{`curl -X POST https://api.example.com/v1/ingest \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"tenantId":"demo","documents":[{"id":"repo-1","text":"Hello RAG"}]}'`}</code>
          </pre>
        </header>

        <section id="overview" className="stack-sm">
          <h2>Overview</h2>
          <p>
            The API accepts repository content, enriches it, stores encrypted provider-key
            metadata, and returns search results with citations.
          </p>
        </section>

        <section id="auth" className="stack-sm">
          <h2>Auth</h2>
          <p>Use Google-authenticated workspace sessions. Admin-only routes must be server-guarded.</p>
        </section>

        <section id="quickstart" className="stack-sm">
          <h2>Quickstart</h2>
          <ol className="bullet-list ordered-list">
            <li>Sign in with Google and obtain a workspace token.</li>
            <li>Save provider credentials through the admin-only encrypted key endpoint.</li>
            <li>Post ingest payloads, then search with URL-shareable query parameters.</li>
          </ol>
        </section>

        <section id="endpoints" className="stack-sm">
          <h2>Endpoints</h2>
          <table className="data-table">
            <caption className="sr-only">Endpoint reference</caption>
            <thead>
              <tr>
                <th scope="col">Method</th>
                <th scope="col">Path</th>
                <th scope="col">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>GET</td>
                <td>/v1/health</td>
                <td>Runtime health and embedding-model declaration</td>
              </tr>
              <tr>
                <td>POST</td>
                <td>/v1/ingest</td>
                <td>Accept documents for extraction and indexing</td>
              </tr>
              <tr>
                <td>POST</td>
                <td>/v1/search</td>
                <td>Return answer candidates with citations</td>
              </tr>
              <tr>
                <td>POST</td>
                <td>/v1/rag/inspect</td>
                <td>Inspect query-transform, retrieve, rerank, answer, and eval steps</td>
              </tr>
              <tr>
                <td>POST</td>
                <td>/v1/provider-keys/:provider</td>
                <td>Encrypt and store provider credentials</td>
              </tr>
              <tr>
                <td>GET</td>
                <td>/v1/monitoring/summary</td>
                <td>Provide admin dashboard usage aggregates</td>
              </tr>
              <tr>
                <td>GET</td>
                <td>/v1/admin/rag/stats</td>
                <td>Inspect local RAG store document and chunk counts</td>
              </tr>
              <tr>
                <td>POST</td>
                <td>/v1/admin/rag/reset</td>
                <td>Reset the local verification store before smoke tests</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="errors" className="stack-sm">
          <h2>Errors</h2>
          <p>Validation errors return field-level messages. Admin-only failures must explain the missing role or token.</p>
        </section>

        <section id="limits" className="stack-sm">
          <h2>Rate Limits</h2>
          <p>Initial limits should be tenant-aware and enforced server-side. Document retries and backoff in the final API reference.</p>
        </section>
      </article>

      <aside className="panel docs-nav">
        <h2>Reference Notes</h2>
        <div className="stack-sm">
          <div>
            <p className="metric-label">Auth</p>
            <p className="microcopy">Google session required for workspace APIs.</p>
          </div>
          <div>
            <p className="metric-label">Default model</p>
            <p className="microcopy">`gemini-embedding-001`</p>
          </div>
          <div>
            <p className="metric-label">Deployment</p>
            <p className="microcopy">Next.js web on App Hosting, API on a separate trusted boundary.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
