export const enMessages = {
  common: {
    appName: "funqa",
    localeLabel: "Language",
    localeNames: {
      en: "English",
      ko: "한국어"
    },
    liveLabel: "live",
    sourceLabels: {
      docs: "Docs",
      wiki: "Wiki",
      policy: "Policy"
    },
    confidenceLabels: {
      high: "High",
      medium: "Medium",
      low: "Low"
    }
  },
  layout: {
    skipToContent: "Skip to main content",
    brandEyebrow: "Grounded AI Workspace",
    nav: {
      overview: "Overview",
      search: "Search",
      ragLab: "RAG Lab",
      admin: "Admin",
      docs: "API Docs",
      login: "Login"
    }
  },
  home: {
    eyebrow: "Ralph Seed Active",
    title: "One premium workspace for grounded search, operator control, and AI delivery.",
    lede:
      "funqa treats search, admin, and docs as modes of the same product. The interface keeps one dominant task surface, one secondary context rail, and enough density to feel like a real tool instead of a landing page.",
    primaryAction: "Open Search Workspace",
    secondaryAction: "Review API Surface",
    embedLabel: "Default hosted embedding",
    verifiedLabel: "Verified 2026-04-13",
    embedNote:
      "Google's latest Gemini embeddings docs expose `gemini-embedding-2-preview` as the multimodal path, while smoke tests stay on the deterministic local hash backend.",
    docsIndexed: "docs indexed",
    chunksLive: "chunks live",
    systemShapeLabel: "Live system shape",
    systemShape: [
      "Server-side secret boundary with encrypted provider keys",
      "Modular RAG flow split into testable process units",
      "Search/admin/docs shells prepared for App Hosting rollout"
    ],
    surfaces: [
      {
        href: "/search",
        label: "Search Workspace",
        kicker: "Perplexity-style retrieval",
        text: "Sticky query composer, visible source controls, and an always-on inspector for grounded answers.",
        cta: "Enter Search Workspace"
      },
      {
        href: "/admin",
        label: "Operator Console",
        kicker: "Quiet but dense ops UI",
        text: "Live health, queue pressure, rollout visibility, and key management without collapsing into a settings dump.",
        cta: "Enter Operator Console"
      },
      {
        href: "/docs",
        label: "API Docs",
        kicker: "Code-first reference",
        text: "Quickstart, endpoint tables, and rollout-aware guidance in a docs shell tuned for repeated lookup.",
        cta: "Enter API Docs"
      }
    ],
    processEyebrow: "Process Modules",
    processTitle: "RAG is broken into the smallest verifiable steps that still make product sense.",
    pipeline: [
      { label: "Normalize", text: "raw repo content is cleaned into one canonical document envelope" },
      { label: "Extract", text: "grounded facts and entities are pulled forward for enrichment" },
      { label: "Chunk", text: "dense retrieval units stay small enough to inspect and cite" },
      { label: "Embed", text: "default live path is `gemini-embedding-2-preview` with configurable output dimensionality" },
      { label: "Retrieve", text: "result ranking blends semantic proximity with provenance clarity" },
      { label: "Answer", text: "final responses stay tied to citations instead of free-floating generation" }
    ],
    whyEyebrow: "Why the UI changed",
    whyTitle: "Recent AI products converge on one main task surface plus one context rail.",
    whyBody:
      "Search borrows the cited-answer density of Perplexity, admin keeps the restrained hierarchy common in modern AI ops consoles, and docs stay code-first in the style of OpenAI and Gemini references.",
    whyChips: ["Sticky query composer", "Context inspector", "Quiet KPI deck", "Code-first docs rail"]
  },
  search: {
    eyebrow: "Search",
    title: "Ask once, refine in place, and keep provenance visible the whole time.",
    lede:
      "The search workspace is shaped like a real retrieval tool: prompt rail, source filters, dense results, and a citation inspector that never forces a context switch.",
    composerLabel: "Search query",
    composerPlaceholder: "Which policy explains encrypted provider key storage?",
    submit: "Run Search",
    pending: "Searching…",
    shareableNote: "URL state stays shareable for review and replay.",
    suggestionsLabel: "Suggested prompts",
    fallbackSuggestions: ["rotation policy", "embedding default", "admin alerts"],
    railTitle: "Source rail",
    railBadge: "Live filters",
    sourceLabel: "Source type",
    sourceOptions: [
      { value: "all", label: "All sources" },
      { value: "docs", label: "Docs" },
      { value: "wiki", label: "Wiki" },
      { value: "policy", label: "Policy" }
    ],
    applyFilters: "Apply filters",
    recentSearches: "Recent searches: onboarding policy, key rotation, admin alerts.",
    filterChips: ["Grounded only", "Fresh sources", "High confidence"],
    resultsTitle: "Results",
    resultsSummaryEmpty: "Try a natural-language question to inspect grounded matches.",
    inspectorSynced: "Inspector synced",
    groundedAnswer: "Grounded answer",
    chunksSearchedSuffix: "chunks searched",
    emptyTitle: "No strong matches yet.",
    emptyBody:
      "Try a broader repository question, switch source type, or ingest additional content before retrying.",
    inspectorTitle: "Inspector",
    inspectorPinned: "Pinned",
    inspectorHint: "Select a result to inspect citations and source metadata.",
    sourceField: "Source",
    confidenceField: "Confidence",
    freshnessField: "Freshness",
    citationsField: "Citations",
    resultForSuffix: "result(s) for",
    citationsSuffix: "citations",
    liveFreshness: "live",
    fallbackResults: [
      {
        title: "Quarterly roadmap source note",
        source: "docs/roadmap-q2.md",
        category: "docs",
        confidence: "high",
        freshness: "2d",
        snippet:
          "Roadmap priorities are grouped by ingestion reliability, admin visibility, and user-facing search clarity.",
        citations: ["roadmap-q2.md#top-priorities", "system-architecture.md#surface-plan"]
      },
      {
        title: "Provider key rotation policy",
        source: "docs/architecture/security-secrets.md",
        category: "policy",
        confidence: "high",
        freshness: "today",
        snippet:
          "Provider keys are encrypted server-side with AES-GCM and versioned for future KMS rotation.",
        citations: ["security-secrets.md#encryption-boundary", "provider-keys.route.ts#save"]
      },
      {
        title: "Embedding model decision log",
        source: "knowledge/wiki/sources/gemini-embeddings.md",
        category: "wiki",
        confidence: "medium",
        freshness: "today",
        snippet: "Hosted default remains Gemini embeddings while Gemma-family adapters stay pluggable.",
        citations: ["gemini-embeddings.md#verified-default", "seed.yaml#assumptions"]
      }
    ]
  },
  ragLab: {
    eyebrow: "RAG Lab",
    title: "Inspect every retrieval step as a first-class module.",
    lede:
      "This view is designed to match the modular pipeline directly so query transforms, retrieval, reranking, and answer assembly can be compared without leaving the product.",
    queryLabel: "Query",
    queryPlaceholder: "provider key storage",
    transformLabel: "Query transform",
    transformOptions: {
      none: "None",
      "rewrite-local": "Rewrite local",
      "hyde-local": "HyDE local",
      "hyde-genkit": "HyDE via Genkit"
    },
    rerankLabel: "Rerank",
    rerankOptions: {
      none: "None",
      rrf: "RRF only",
      heuristic: "Heuristic rerank",
      "genkit-score": "Genkit score"
    },
    runInspection: "Run Inspection",
    stagesLabel: "RAG stages",
    stages: {
      query: "Query",
      retrieve: "Retrieve",
      rerank: "Rerank",
      answer: "Answer",
      eval: "Eval",
      trace: "Trace"
    },
    currentStrategy: "Current strategy",
    preRerank: "pre-rerank",
    finalTopK: "final top-k",
    liveGenkit: "live genkit",
    deterministicLocal: "deterministic local",
    latency: "latency",
    queryTransformTitle: "Query transform",
    rawQuery: "Raw query",
    mode: "Mode",
    transformedQuery: "Transformed query",
    hydePseudoDocument: "HyDE pseudo document",
    retrieveTitle: "Retrieve",
    retrieveColumns: {
      chunk: "Chunk",
      dense: "Dense",
      lexical: "Lexical",
      fused: "Fused"
    },
    rerankTitle: "Rerank",
    rerankColumns: {
      chunk: "Chunk",
      rerank: "Rerank score",
      why: "Why it moved"
    },
    answerTitle: "Answer",
    answerPreview: "Answer preview",
    answerCitations: "Returned citations",
    evalTitle: "Eval",
    evalScore: "Local groundedness score",
    evalNote: "Use this pane to compare strategy changes before wiring a stronger evaluator.",
    traceTitle: "Trace",
    traceLabel: "Execution trace"
  },
  admin: {
    eyebrow: "Admin",
    title: "Operate ingestion, keys, users, and spend without turning the console into a form graveyard.",
    lede:
      "The console leads with signals, not configuration. Priority items stay above the fold, drill-down data stays compact, and operators can see queue pressure and model cost in one glance.",
    windowLabel: "Window",
    windows: ["24h", "7d", "30d"],
    chips: ["rollouts", "queues", "keys", "usage"],
    metrics: {
      successRate: "Success Rate",
      indexedDocs: "Indexed Docs",
      indexedChunks: "Indexed Chunks",
      p95Latency: "P95 Latency",
      runtimeHealthy: "runtime healthy",
      needsReview: "needs review",
      tenantsSuffix: "tenants",
      updatedRecently: "updated recently",
      notIngestedYet: "not ingested yet",
      todaySuffix: "today",
      previousWindowSuffix: "vs previous window"
    },
    needsAttention: "Needs Attention",
    operatorQueue: "Operator Queue",
    attentionItems: {
      priority: "Priority",
      queue: "Queue",
      telemetry: "Telemetry",
      keyGuard: "Provider key rotation policy still needs an enforced admin-only route guard.",
      queueSummaryPrefix: "Current store has",
      queueSummaryDocs: "documents and",
      queueSummaryChunks: "chunks.",
      telemetryPrefix: "Runtime reports",
      telemetryUsers: "active users and",
      telemetryEmbedding: "as the current embedding path."
    },
    queueTable: {
      area: "Area",
      signal: "Signal",
      owner: "Owner",
      rows: [
        ["Ingestion", "Retry stalled repository sync", "Ops"],
        ["Users", "Review pending admin invite", "Admin"],
        ["Usage", "Inspect cost spike on search flow", "PM"],
        ["Deploy", "Verify App Hosting rollout health after local smoke", "Platform"]
      ]
    }
  },
  docs: {
    title: "API Docs",
    navLabel: "API sections",
    notesTitle: "Reference Notes",
    eyebrow: "Public API Docs",
    heroTitle: "Authenticate, ingest content, and retrieve grounded answers from one server boundary.",
    lede:
      "Start with Google-authenticated workspace access, then use task-first endpoints for ingest, search, and provider-key administration.",
    sections: [
      { id: "overview", label: "Overview", title: "Overview" },
      { id: "auth", label: "Auth", title: "Auth" },
      { id: "quickstart", label: "Quickstart", title: "Quickstart" },
      { id: "endpoints", label: "Endpoints", title: "Endpoints" },
      { id: "errors", label: "Errors", title: "Errors" },
      { id: "limits", label: "Limits", title: "Rate Limits" }
    ],
    overviewBody:
      "The API accepts repository content, enriches it, stores encrypted provider-key metadata, and returns search results with citations.",
    authBody: "Use Google-authenticated workspace sessions. Admin-only routes must be server-guarded.",
    quickstartSteps: [
      "Sign in with Google and obtain a workspace token.",
      "Save provider credentials through the admin-only encrypted key endpoint.",
      "Post ingest payloads, then search with URL-shareable query parameters."
    ],
    endpointsTable: {
      method: "Method",
      path: "Path",
      purpose: "Purpose",
      rows: [
        ["GET", "/v1/health", "Runtime health and embedding-model declaration"],
        ["POST", "/v1/ingest", "Accept documents for extraction and indexing"],
        ["POST", "/v1/search", "Return answer candidates with citations"],
        ["POST", "/v1/rag/inspect", "Inspect query-transform, retrieve, rerank, answer, and eval steps"],
        ["POST", "/v1/provider-keys/:provider", "Encrypt and store provider credentials"],
        ["GET", "/v1/monitoring/summary", "Provide admin dashboard usage aggregates"],
        ["GET", "/v1/admin/rag/stats", "Inspect local RAG store document and chunk counts"],
        ["POST", "/v1/admin/rag/reset", "Reset the local verification store before smoke tests"]
      ]
    },
    errorsBody:
      "Validation errors return field-level messages. Admin-only failures must explain the missing role or token.",
    limitsBody:
      "Initial limits should be tenant-aware and enforced server-side. Document retries and backoff in the final API reference.",
    notes: [
      { label: "Auth", text: "Google session required for workspace APIs." },
      { label: "Default model", text: "`gemini-embedding-2-preview`" },
      { label: "Deployment", text: "Next.js web on App Hosting, API on a separate trusted boundary." }
    ]
  },
  login: {
    eyebrow: "Authentication",
    title: "Sign in with Google to enter the search workspace and operator console.",
    lede:
      "End users see saved search and citations. Admins also get ingestion controls, model-key settings, and usage telemetry.",
    continueTitle: "Continue with Google",
    continueBody:
      "Workspace login unlocks saved searches, grounded citations, admin controls, and audit-aware provider key actions.",
    continueButton: "Continue With Google",
    continueNote: "Firebase Auth wiring is the next implementation step.",
    trustTitle: "Trust boundary",
    trustItems: [
      "You need a Google account allowed by workspace policy.",
      "Admin privileges are assigned server-side after sign-in.",
      "No provider API key is ever stored in browser storage."
    ]
  }
} as const;
