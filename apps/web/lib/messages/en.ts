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
      games: "Games",
      movies: "Movies",
      videos: "Videos"
    },
    confidenceLabels: {
      high: "High",
      medium: "Medium",
      low: "Low"
    }
  },
  layout: {
    skipToContent: "Skip to main content",
    brandEyebrow: "AI 미디어 검색엔진",
    nav: {
      overview: "Home",
      search: "Search",
      ragLab: "RAG Lab",
      admin: "Admin",
      docs: "API Docs",
      login: "Login"
    }
  },
  home: {
    eyebrow: "AI Media Search",
    title: "Discover & Archive Games, Movies, and Media with AI",
    lede: "당신의 콘텐츠 취향을 AI가 기억합니다. Search, organize, and explore your games, movies, and media library with grounded AI retrieval.",
    primaryAction: "Start Searching",
    secondaryAction: "API Docs",
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
        href: "/search?source=games",
        label: "Games Discovery",
        kicker: "Games",
        text: "플레이한 게임, 플레이하고 싶은 게임을 AI로 관리. Track your played games and wishlist with AI-powered search.",
        cta: "Search Games"
      },
      {
        href: "/search?source=movies",
        label: "Movie Database",
        kicker: "Movies",
        text: "본 영화와 시청 목록을 스마트하게 검색. Discover films and manage your watch history with grounded AI.",
        cta: "Search Movies"
      },
      {
        href: "/search?source=videos",
        label: "Content Archive",
        kicker: "Videos",
        text: "미디어 콘텐츠를 저장하고 AI로 분석. Archive media content and surface insights with AI retrieval.",
        cta: "Search Videos"
      }
    ],
    processEyebrow: "AI Pipeline",
    processTitle: "Media content flows through AI-powered stages for accurate search and retrieval.",
    pipeline: [
      { label: "인덱싱", text: "media titles, metadata, and descriptions are ingested and normalized" },
      { label: "임베딩", text: "content is embedded with `gemini-embedding-2-preview` for semantic search" },
      { label: "검색", text: "semantic and lexical signals are fused for accurate media retrieval" },
      { label: "답변", text: "final responses cite specific media entries instead of generating freely" }
    ],
    whyEyebrow: "Why the UI changed",
    whyTitle: "Recent AI products converge on one main task surface plus one context rail.",
    whyBody:
      "Search borrows the cited-answer density of Perplexity, admin keeps the restrained hierarchy common in modern AI ops consoles, and docs stay code-first in the style of OpenAI and Gemini references.",
    whyChips: ["Sticky query composer", "Context inspector", "Quiet KPI deck", "Code-first docs rail"]
  },
  search: {
    eyebrow: "Media Search",
    title: "게임, 영화, 미디어를 AI로 검색하고 저장하세요",
    lede:
      "Find games, movies, and videos with AI-powered search. Get grounded answers with citations to the exact media entries that match your query.",
    composerLabel: "Search query",
    composerPlaceholder: "게임, 영화, 영상을 검색하세요...",
    submit: "Search",
    pending: "Searching…",
    shareableNote: "URL state stays shareable for review and replay.",
    suggestionsLabel: "Suggested searches",
    fallbackSuggestions: ["What's new in Minecraft 1.21?", "Christopher Nolan films ranked", "Best Netflix originals to watch now", "2024 GOTY winner and nominees", "Best soulslike games for beginners", "All-time Academy Award Best Picture winners", "Top YouTube tech review channels", "Open-world RPGs with the best story"],
    railTitle: "Category Filter",
    railBadge: "Live filters",
    sourceLabel: "Content type",
    sourceOptions: [
      { value: "all", label: "All" },
      { value: "games", label: "Games" },
      { value: "movies", label: "Movies" },
      { value: "videos", label: "Videos" }
    ],
    applyFilters: "Apply filters",
    recentSearches: "Recent: open world games, classic films, tech reviews.",
    filterChips: ["High rated", "Recent releases", "My library"],
    editorialKicker: "Editorial search desk · games, films, and creator media",
    contractEyebrow: "Search contract",
    contractTitle: "One deliberate query surface, one inspectable answer rail.",
    contractNotes: [
      "Keep the query box prominent, but let the shell breathe like an editorial desk.",
      "Consensus-backed and evidence-only answers must remain visibly different states.",
      "The supporting rail should clarify confidence and citations, not become dashboard clutter."
    ],
    resultsTitle: "Results",
    resultsSummaryEmpty: "Try a natural-language question to inspect grounded matches.",
    stateSummaryLabel: "Search desk summary",
    stateLabels: {
      activeDesk: "Active desk",
      outputMode: "Output mode",
      retrievalPath: "Retrieval path"
    },
    stateNotes: {
      filteredDesk: "Query is filtered through the selected archive desk.",
      allDesk: "Browse every desk from one search surface.",
      evidenceOnly: "Fallback stays visible when the answer gate does not open.",
      consensusBacked: "Allowed answers stay paired with a visible inspection rail.",
      pending: "The shell is ready before an answer contract is determined.",
      retrievalPath: "Transform, retrieval, rerank, and output contract stay legible instead of hidden."
    },
    outputModes: {
      evidenceOnly: "Evidence only",
      consensusBacked: "Consensus-backed",
      pending: "Awaiting result"
    },
    strictGroundingTitle: "Strict grounding",
    strictGroundingBody: "Consensus gate protects final answer output.",
    overviewEyebrow: "Search desk",
    pipelineAriaLabel: "Search pipeline",
    pipelineEyebrow: "Pipeline x-ray",
    pipelineTitle: "FunQA shows how the answer was allowed, not just what it said.",
    pipelineBody: "Search runs through transform, retrieval, rerank, and output contract checks.",
    optimizedIntentPrefix: "Optimized intent:",
    pipelineStepLabels: {
      queryTransform: "Query transform",
      retrieval: "Retrieval",
      rerank: "Rerank",
      outputContract: "Output contract"
    },
    inspectorSynced: "Inspector synced",
    groundedAnswer: "Grounded answer",
    evidenceOnlyTitle: "Evidence-only fallback",
    evidenceOnlyBadge: "Consensus not reached",
    evidenceOnlyBody:
      "FunQA found supporting evidence, but the answer gate stayed closed. Review the ranked evidence below while graph-backed consensus is still being wired into search.",
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
    bookmarkLabel: "Bookmark",
    liveFreshness: "live",
    fallbackResults: [
      {
        title: "Elden Ring",
        source: "games/elden-ring",
        category: "games",
        confidence: "high",
        freshness: "2024",
        snippet:
          "An action RPG set in the Lands Between. Fromsoft's most expansive open-world soulslike with rich lore and challenging combat.",
        citations: ["games/elden-ring#overview", "games/elden-ring#gameplay"]
      },
      {
        title: "Interstellar",
        source: "movies/interstellar",
        category: "movies",
        confidence: "high",
        freshness: "2014",
        snippet:
          "Christopher Nolan's sci-fi epic about a team of astronauts traveling through a wormhole near Saturn to find a new home for humanity.",
        citations: ["movies/interstellar#synopsis", "movies/interstellar#cast"]
      },
      {
        title: "Veritasium: How AI Works",
        source: "videos/veritasium-ai-explainer",
        category: "videos",
        confidence: "medium",
        freshness: "recent",
        snippet: "A deep-dive video explainer on neural networks, transformers, and modern AI architecture by Derek Muller.",
        citations: ["videos/veritasium-ai-explainer#summary", "videos/veritasium-ai-explainer#chapters"]
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
    traceLabel: "Execution trace",
    releaseGateEyebrow: "Consensus release gate",
    releaseGateTitle: "Latest release-gate report",
    releaseGateBody:
      "This panel reflects the latest frozen consensus-eval report so operators can judge launch readiness without leaving RAG Lab.",
    releaseGateSelectorLabel: "Release reports",
    latestReportBadge: "latest",
    unknownState: "unknown",
    noReasonCode: "none",
    releaseGateCasesTitle: "Release-gate case results",
    releaseGateArtifactsTitle: "Retained artifacts",
    releaseGateMetrics: {
      agreementRate: "Agreement rate",
      threshold: "Threshold",
      eligibleCases: "Eligible cases",
      failedCases: "Failed cases"
    },
    releaseGateDetails: {
      datasetVersion: "Dataset version",
      generatedAt: "Generated at",
      buildSha: "Build SHA",
      evaluationStatus: "Evaluation status",
      integrity: "Artifact integrity",
      replayability: "Replayability"
    },
    releaseGateColumns: {
      caseId: "Case ID",
      verdict: "Verdict",
      decision: "Decision",
      answerMode: "Answer mode",
      reason: "Primary reason"
    }
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
    ["POST", "/v1/search", "Return consensus-backed answers or evidence-only search results"],
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
  },
  featuredHero: {
    eyebrow: "AI Media Search Engine",
    title: "Discover Games, Movies & Media with AI",
    lede: "Your personal content universe. Search, save, and explore with grounded AI retrieval.",
    primaryAction: "Start Searching",
    trendingAction: "See What's Trending",
    statsChunks: "chunks indexed",
    statsModel: "embedding model"
  },
  contentRow: {
    seeAll: "See all",
    gamesLabel: "Games",
    moviesLabel: "Movies",
    videosLabel: "Videos",
    gamesSubtitle: "Top-rated & trending games",
    moviesSubtitle: "Critically acclaimed films",
    videosSubtitle: "Content creator highlights"
  },
  categoryTabs: {
    all: "All",
    games: "Games",
    movies: "Movies",
    videos: "Videos"
  },
    answerPanel: {
    toggleShow: "Show AI Analysis",
    toggleHide: "Hide AI Analysis",
    chunksAnalyzed: "chunks analyzed",
    confidenceScore: "Confidence",
    citationsLabel: "Sources"
  }
} as const;
