import Link from "next/link";
import { fetchHealthSummary } from "../lib/funqa-api";

const surfaces = [
  {
    href: "/search",
    label: "Search Workspace",
    kicker: "Perplexity-style retrieval",
    text: "Sticky query composer, visible source controls, and an always-on inspector for grounded answers."
  },
  {
    href: "/admin",
    label: "Operator Console",
    kicker: "Quiet but dense ops UI",
    text: "Live health, queue pressure, rollout visibility, and key management without collapsing into a settings dump."
  },
  {
    href: "/docs",
    label: "API Docs",
    kicker: "Code-first reference",
    text: "Quickstart, endpoint tables, and rollout-aware guidance in a docs shell tuned for repeated lookup."
  }
];

const pipeline = [
  { label: "Normalize", text: "raw repo content is cleaned into one canonical document envelope" },
  { label: "Extract", text: "grounded facts and entities are pulled forward for enrichment" },
  { label: "Chunk", text: "dense retrieval units stay small enough to inspect and cite" },
  { label: "Embed", text: "default hosted path is `gemini-embedding-001` with adapter boundaries intact" },
  { label: "Retrieve", text: "result ranking blends semantic proximity with provenance clarity" },
  { label: "Answer", text: "final responses stay tied to citations instead of free-floating generation" }
];

export default async function HomePage() {
  const health = await fetchHealthSummary();

  return (
    <div className="stack-xl">
      <section className="spotlight">
        <div className="spotlight-copy">
          <p className="eyebrow">Ralph Seed Active</p>
          <h1>One premium workspace for grounded search, operator control, and AI delivery.</h1>
          <p className="lede">
            funqa treats search, admin, and docs as modes of the same product. The interface keeps
            one dominant task surface, one secondary context rail, and enough density to feel like
            a real tool instead of a landing page.
          </p>
          <div className="spotlight-actions">
            <Link className="primary-button" href="/search">
              Open Search Workspace
            </Link>
            <Link className="secondary-button" href="/docs">
              Review API Surface
            </Link>
          </div>
        </div>
        <div className="spotlight-stack">
          <article className="panel panel-hero">
            <div className="results-header">
              <div>
                <p className="metric-label">Default hosted embedding</p>
                <p className="metric-value">{health?.embeddingModel ?? "gemini-embedding-001:local-hash"}</p>
              </div>
              <span className="pill pill-bright">Verified 2026-04-13</span>
            </div>
            <p className="microcopy">
              Google&apos;s current hosted embeddings docs point to `gemini-embedding-001`, so Gemma 2
              remains an adapter boundary rather than the default production path.
            </p>
            <div className="check-grid">
              <span className="check-chip">{health?.rag.documentCount ?? 0} docs indexed</span>
              <span className="check-chip">{health?.rag.chunkCount ?? 0} chunks live</span>
            </div>
          </article>
          <article className="panel signal-panel">
            <p className="metric-label">Live system shape</p>
            <ul className="signal-list">
              <li>Server-side secret boundary with encrypted provider keys</li>
              <li>Modular RAG flow split into testable process units</li>
              <li>Search/admin/docs shells prepared for App Hosting rollout</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="mode-grid" aria-label="Primary surfaces">
        {surfaces.map((surface) => (
          <article className="panel mode-card" key={surface.href}>
            <p className="eyebrow">{surface.kicker}</p>
            <h2>{surface.label}</h2>
            <p>{surface.text}</p>
            <Link className="action-link" href={surface.href}>
              Enter {surface.label}
            </Link>
          </article>
        ))}
      </section>

      <section className="workspace-band">
        <article className="panel panel-dark">
          <p className="eyebrow">Process Modules</p>
          <h2>RAG is broken into the smallest verifiable steps that still make product sense.</h2>
          <div className="timeline-grid">
            {pipeline.map((step) => (
              <article className="timeline-card" key={step.label}>
                <h3>{step.label}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">Why the UI changed</p>
          <h2>Recent AI products converge on one main task surface plus one context rail.</h2>
          <p>
            Search borrows the cited-answer density of Perplexity, admin keeps the restrained
            hierarchy common in modern AI ops consoles, and docs stay code-first in the style of
            OpenAI and Gemini references.
          </p>
          <div className="check-grid">
            <span className="check-chip">Sticky query composer</span>
            <span className="check-chip">Context inspector</span>
            <span className="check-chip">Quiet KPI deck</span>
            <span className="check-chip">Code-first docs rail</span>
          </div>
        </article>
      </section>
    </div>
  );
}
