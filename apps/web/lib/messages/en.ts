export const enMessages = {
  common: {
    appName: "funqa",
    localeLabel: "Language",
    localeNames: {
      en: "English",
      ko: "한국어"
    },
    themeLabel: "Theme",
    themeModes: {
      light: "Light",
      dark: "Dark"
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
    brandEyebrow: "AI media search engine",
    menuLabel: "Menu",
    nav: {
      overview: "Home",
      search: "Search",
      sceneLab: "Scene Search",
      ragLab: "RAG Lab",
      ralph: "Ralph",
      admin: "Admin",
      docs: "API Docs",
      login: "Login"
    }
  },
  sceneLab: {
    eyebrow: "Video-document multimodal RAG",
    title: "Scene Search",
    lede:
      "Upload a video-bearing document: the browser extracts frames, a Gemini vision model captions each scene, and gemini-embedding-2 stores them as searchable vectors. Query with text or video and get matching scene images back.",
    ingest: {
      title: "1 · Register video document",
      videoLabel: "Video file",
      videoHint: "Any browser-playable video (mp4 · webm · mov)",
      titleLabel: "Document title",
      titlePlaceholder: "e.g. Dungeon crawl playthrough highlights",
      descriptionLabel: "Description (optional)",
      descriptionPlaceholder: "Context that helps scene retrieval",
      frameCountLabel: "Frames to extract",
      extracting: "Extracting frames…",
      framesReady: "frames ready",
      submit: "Index scenes",
      submitting: "Captioning + embedding…",
      loginRequired: "Scene ingest requires login (cost protection).",
      successTitle: "Ingest complete",
      captionsTitle: "Generated scene captions",
      errorGeneric: "Ingest failed. Please retry in a moment."
    },
    search: {
      title: "2 · Search scenes",
      queryLabel: "Text query",
      queryPlaceholder: "e.g. combat scene with purple background",
      videoLabel: "Video query (optional)",
      videoHint: "Upload a short clip to find similar scenes by its key frames",
      clearVideo: "Remove video query",
      submit: "Search",
      searching: "Searching…",
      needInput: "Provide a text query or a query video.",
      modeText: "text",
      modeVideo: "video",
      modeHybrid: "hybrid",
      resultsTitle: "Similar scene results",
      emptyResults: "No scenes indexed yet. Register a video document first.",
      noMatch: "No matching scenes found.",
      queryCaptionsTitle: "Query frame interpretation",
      similarity: "similarity",
      errorGeneric: "Search failed. Please retry in a moment."
    },
    library: {
      title: "Registered video documents",
      empty: "No video documents registered yet.",
      scenes: "scenes",
      refresh: "Refresh"
    },
    meta: {
      embeddingModel: "Embedding model",
      captionModel: "Caption model",
      queryMode: "Query mode",
      totalScenes: "Total scenes",
      took: "Took"
    }
  },
  home: {
    eyebrow: "All-Knowledge AI Search",
    title: "Search Every Knowledge Surface with Grounded AI",
    lede: "FunQA turns documents, games, films, videos, citations, and graph evidence into one inspectable AI search engine.",
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
        text: "Track games you have played and games you want to try with AI-powered search.",
        cta: "Search Games"
      },
      {
        href: "/search?source=movies",
        label: "Movie Database",
        kicker: "Movies",
        text: "Discover films and manage your watch history with grounded AI retrieval.",
        cta: "Search Movies"
      },
      {
        href: "/search?source=videos",
        label: "Content Archive",
        kicker: "Videos",
        text: "Archive creator media and surface relevant clips, summaries, and insights with AI retrieval.",
        cta: "Search Videos"
      }
    ],
    processEyebrow: "AI Pipeline",
    processTitle: "Media content flows through AI-powered stages for accurate search and retrieval.",
    pipeline: [
      { label: "Index", text: "media titles, metadata, and descriptions are ingested and normalized" },
      { label: "Embed", text: "content is embedded with `gemini-embedding-2-preview` for semantic search" },
      { label: "Retrieve", text: "semantic and lexical signals are fused for accurate media retrieval" },
      { label: "Answer", text: "final responses cite specific media entries instead of generating freely" }
    ],
    whyEyebrow: "Why the UI changed",
    whyTitle: "Recent AI products converge on one main task surface plus one context rail.",
    whyBody:
      "Search borrows the cited-answer density of Perplexity, admin keeps the restrained hierarchy common in modern AI ops consoles, and docs stay code-first in the style of OpenAI and Gemini references.",
    whyChips: ["Sticky query composer", "Context inspector", "Quiet KPI deck", "Code-first docs rail"],
    visitorPaths: [
      {
        href: "/search",
        eyebrow: "First visit",
        title: "Start with search",
        body: "Ask one question across documents, media, and evidence graphs to see what FunQA can prove."
      },
      {
        href: "/docs",
        eyebrow: "Study the contract",
        title: "Read API docs",
        body: "Inspect the data and response contract behind grounded search results."
      },
      {
        href: "/rag-lab",
        eyebrow: "Open the lab",
        title: "Verify in RAG Lab",
        body: "Review indexing, embedding, retrieval, reranking, and answer assembly as an operator."
      }
    ]
  },
  search: {
    eyebrow: "Media Search",
    title: "Search and save games, movies, and media with AI",
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
    stream: {
      streaming: "Streaming search…",
      error: "Stream error",
      liveAnswer: "Live answer",
      topChunks: "Top chunks",
      citations: "Citations",
      stages: {
        retrieving: "Retrieving relevant chunks…",
        reranking: "Re-ranking results…",
        generating: "Generating answer…"
      }
    },
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
  patchDesk: {
    eyebrow: "Game-log evidence desk",
    title: "The Patch Desk",
    lede: "Ask what changed, trace every claim to the logs, and carry verified context into your next question.",
    starterP42: "What changed about Scout dash cooldown in P42, and why?",
    starterIncident184: "What caused Incident 184 and what fixed it?",
    starterNewest: "Summarize the newest Scout playtest.",
    queryLabel: "Query the game logs",
    queryPlaceholder: "Ask about a patch, playtest, incident, or decision…",
    search: "Search logs",
    shortcut: "Press / to focus",
    scopeLabel: "Scope",
    entityLabel: "Project or entity",
    timeLabel: "Time range",
    sourcesLabel: "Log sources",
    noScopeDelta: "No scope changes",
    changedPrefix: "Changed:",
    notSet: "Not set",
    showAllScope: "Show all scope",
    serviceChecking: "Checking local evidence service…",
    serviceReady: "Local evidence service ready",
    retrievalOffline: "Local retrieval offline",
    synthesisOffline: "Local synthesis offline",
    serviceCheckingDetail: "The Patch Desk is verifying retrieval and synthesis.",
    serviceReadyDetail: "CocoIndex retrieval and local synthesis are available.",
    serviceReadyGenkit: "Genkit evidence service ready",
    serviceReadyGenkitDetail: "Embedded-corpus retrieval and Genkit · Gemini synthesis are available.",
    retrievalOfflineDetail: "The Archive cannot be searched right now.",
    synthesisOfflineDetail: "Retrieved log shards remain available.",
    retryConnection: "Retry connection",
    dispatchStarted: "Dispatch started",
    searching: "Searching indexed logs…",
    ranking: "Log shards found. Ranking evidence…",
    synthesizing: "Building a finding from {count} log shards…",
    stop: "Stop search",
    stopped: "Search stopped. Retrieved evidence is preserved.",
    supportedTitle: "Finding supported",
    supportedBody: "Every material claim below traces to the indexed logs.",
    inspectTraces: "Inspect claim traces",
    noHitsTitle: "No matching log shards",
    noHitsBody: "No indexed log evidence matched this scope.",
    weakTitle: "Evidence found; finding withheld",
    weakBody: "Log shards were found, but they do not support a reliable finding.",
    retrievalUnavailableTitle: "Archive search unavailable",
    retrievalUnavailableBody: "The local retrieval path could not search indexed logs.",
    synthesisUnavailableTitle: "Finding unavailable; evidence preserved",
    synthesisUnavailableBody: "Log shards are available, but the local model could not build a finding.",
    staleTitle: "Archive may be behind",
    staleBody: "Results may omit logs newer than {timestamp}.",
    ageWarning: "Archive refresh is 24 hours old or older.",
    broadenScope: "Broaden scope",
    refineQuery: "Refine query",
    retryRetrieval: "Retry retrieval",
    openRawEvidence: "Open raw evidence",
    refreshArchive: "Refresh archive",
    claimsLabel: "Claims",
    traceRailLabel: "Claim traces",
    logShardLabel: "Log shard",
    freshnessLabel: "Archive refreshed",
    superseded: "Superseded by {evidenceId}",
    untrusted: "Untrusted log text — data, not instruction",
    sourceLabel: "Source log",
    eventTimeLabel: "Event time",
    rankLabel: "Rank",
    scoreLabel: "Retrieval score",
    excerptBoundsLabel: "Excerpt range",
    queryIdLabel: "Query ID",
    correlationIdLabel: "Correlation ID",
    relationLabel: "Claim relation",
    relationSupports: "Supports",
    relationContradicts: "Contradicts",
    relationSupersedes: "Supersedes",
    relationContext: "Context only",
    relationUntrusted: "Untrusted data",
    followUpLabel: "Ask a follow-up",
    parentQueryLabel: "Continues from",
    dispatchTrail: "Dispatch trail",
    reviseQuery: "Revise query",
    saveCard: "Save evidence card",
    copyEvidence: "Copy evidence link",
    acknowledge: "Acknowledge boundary note",
    dispatchDetails: "Dispatch details",
    backToClaim: "Back to claim",
    inspectBeforeSave: "Inspect a claim trace before saving.",
    inspectBeforeCopy: "Open a log shard before copying its evidence link.",
    readBeforeAcknowledge: "Read the boundary reason before acknowledging it.",
    inspectBoundaryReason: "Inspect boundary reason",
    serviceLampLabel: "Service Lamp",
    archiveLabel: "Archive",
    modelLabel: "Model",
    indexLabel: "Index",
    readyState: "Ready",
    checkingState: "Checking",
    offlineState: "Offline",
    checkedAtLabel: "Checked",
    ownerLabel: "Owner",
    retrievalOwner: "Retrieval",
    synthesisOwner: "Synthesis",
    noFailureOwner: "No failure owner",
    activeOwner: "Active owner",
    projectLabel: "Project",
    projectPlaceholder: "Project IDs, comma separated",
    entityPlaceholder: "Entity IDs, comma separated",
    sourcePlaceholder: "Source IDs, comma separated",
    timeFromLabel: "From",
    timeToLabel: "Through",
    snapshotLabel: "Index snapshot",
    allProjects: "All projects",
    allEntities: "All entities",
    allSources: "All indexed logs",
    scopeFrozen: "Scope is frozen when a Dispatch starts.",
    findingLabel: "Finding",
    boundaryNoteLabel: "Boundary Note",
    reasonLabel: "Reason code",
    stageLabel: "Dispatch stage",
    stopping: "Stopping search…",
    initialTitle: "Open a Dispatch",
    initialBody: "Choose a starter Query or ask the Archive about a recorded game change.",
    searchNeedsService: "Search becomes available when both local retrieval and synthesis are ready.",
    evidenceEmpty: "No log shards are available for this Dispatch.",
    rawEvidenceLabel: "Raw evidence",
    linkedEvidenceLabel: "Linked log shards",
    excerptLabel: "Excerpt",
    pathLabel: "Source path",
    trustLabel: "Trust class",
    indexSnapshotLabel: "Snapshot",
    coverageLabel: "Coverage through",
    evidenceSetLabel: "Evidence set",
    modelProfileLabel: "Model profile",
    quantizationLabel: "Quantization",
    contextTokensLabel: "Context limit",
    inputTokensLabel: "Evidence input tokens",
    outputTokensLabel: "Output tokens",
    truncationLabel: "Truncation",
    unknownValue: "Unknown",
    dispatchCurrent: "Current Dispatch",
    dispatchAccepted: "Accepted",
    dispatchRunning: "Running",
    dispatchCompleted: "Completed",
    dispatchCancelled: "Cancelled",
    noDispatches: "No Dispatches yet.",
    revisionPlaceholder: "Keep the Query or ask a narrower follow-up…",
    parentScopeLabel: "Inherited Scope",
    scopeDeltaLabel: "Scope delta",
    entityAdded: "Entities added",
    entityRemoved: "Entities removed",
    sourcesAdded: "Sources added",
    sourcesRemoved: "Sources removed",
    timeFromChanged: "Start time changed",
    timeToChanged: "End time changed",
    cardSaved: "Evidence card saved.",
    linkCopied: "Evidence link copied.",
    boundaryAcknowledged: "Boundary Note acknowledged.",
    rewardStatusLabel: "Resolve status",
    freshnessUnknown: "Refresh time unavailable",
    claimSelectedLabel: "Selected Claim",
    selectedShardLabel: "Selected log shard",
    retrying: "Checking the Archive again…",
    engineLabel: "Engine",
    engineGenkit: "Genkit · Gemini cloud",
    engineLocal: "Local VM engine",
    engineUnknown: "Engine unknown"
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
    traceDetails: {
      normalizeDocs: "Normalize docs",
      extractDocs: "Extract docs",
      chunks: "Chunks",
      topDocument: "Top document",
      none: "none"
    },
    analyticsMetrics: {
      title: "Game Video Analytics",
      cragConfidence: "CRAG Confidence",
      searchAccuracy: "Search Accuracy",
      cacheHitRate: "Cache Hit Rate",
      processingLatency: "Processing Latency",
      lede: "AI search pipeline · game video verification console"
    },
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
  ralph: {
    eyebrow: "Ralph completion loop",
    title: "Run work against a frozen seed until the evidence says it is done.",
    lede:
      "Ralph turns implementation work into a verified loop: clarify the contract, execute the smallest useful change, inspect the evidence, correct drift, and keep moving until acceptance criteria pass.",
    primaryAction: "Inspect in RAG Lab",
    secondaryAction: "Read API docs",
    statusCard: {
      eyebrow: "Operating posture",
      title: "Spec-first loop status",
      metrics: [
        { label: "Contract", value: "Seeded", text: "Work starts from explicit goal, constraints, and acceptance criteria." },
        { label: "Gate", value: "Verify", text: "Build, typecheck, smoke, and browser evidence precede completion claims." },
        { label: "Drift", value: "Tracked", text: "Failures feed the next pass instead of being hidden in chat history." }
      ]
    },
    loopEyebrow: "Execution model",
    loopTitle: "The page-level contract for ooo ralph",
    loopLede:
      "Each card is a durable checkpoint. The loop remains visible so product, engineering, and QA can agree on what changed and why.",
    loopSteps: [
      {
        label: "Interview",
        title: "Reduce ambiguity",
        body: "Turn vague requests into a bounded goal, constraints, and explicit non-goals.",
        signal: "Ready when the remaining ambiguity is small enough to freeze."
      },
      {
        label: "Seed",
        title: "Freeze the contract",
        body: "Capture the accepted goal and acceptance criteria before implementation starts.",
        signal: "The seed is immutable; follow-up changes become a new seed."
      },
      {
        label: "Execute",
        title: "Make the smallest useful change",
        body: "Apply focused edits that satisfy the seed without broad refactors or hidden scope creep.",
        signal: "Every code path touched has a reason tied to the contract."
      },
      {
        label: "Evaluate",
        title: "Verify before claiming done",
        body: "Run mechanical checks and inspect the user-facing behavior before closing the loop.",
        signal: "Evidence matters more than confidence."
      },
      {
        label: "Evolve",
        title: "Correct drift and repeat",
        body: "When checks fail, keep the evidence and adjust the next pass until the acceptance criteria hold.",
        signal: "Failures are recorded as data for the next iteration."
      }
    ],
    guardrailsEyebrow: "Guardrails",
    guardrailsTitle: "What Ralph will not skip",
    guardrails: [
      "No implementation without a bounded contract.",
      "No completion claim without verification evidence.",
      "No silent rewrite of the seed mid-run.",
      "No deployment before build-critical checks pass."
    ],
    evidenceEyebrow: "Evidence rail",
    evidenceTitle: "Artifacts Ralph keeps inspectable",
    evidenceColumns: {
      artifact: "Artifact",
      purpose: "Purpose",
      state: "State"
    },
    evidenceRows: [
      { artifact: "seed.yaml", purpose: "Immutable work contract", state: "Required" },
      { artifact: "README update", purpose: "User-facing operating note", state: "Required for this change" },
      { artifact: "typecheck/build logs", purpose: "Mechanical verification", state: "Required" },
      { artifact: "browser evidence", purpose: "Page-level behavior check", state: "Required" },
      { artifact: "wiki report", purpose: "Durable project memory", state: "Filed after completion" }
    ],
    handoffEyebrow: "Handoff",
    handoffTitle: "Use Ralph when a task must keep going",
    handoffBody:
      "Ralph is the right lane when a request should not stop at a proposal. It keeps implementation, evidence, and deployment work tied to the same acceptance criteria.",
    handoffAction: "Search Ralph context",
    handoffQuery: "Ralph completion loop"
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
