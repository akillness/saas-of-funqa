export const enMessages = {
  common: {
    localeLabel: "Language",
    localeNames: {
      en: "English",
      ko: "한국어"
    }
  },
  layout: {
    skipToContent: "Skip to main content",
    brandEyebrow: "AI media search engine",
    nav: {
      overview: "Home",
      sceneLab: "Video QA",
      vectorIndex: "Vector index",
      corpus: "Game corpus",
      ragLab: "RAG Lab",
      admin: "Admin",
      docs: "API Docs",
      login: "Login"
    }
  },
  vectorIndex: {
    eyebrow: "FUNQA · VECTOR INDEX",
    title: "Pair a video with FunQA evidence and index it.",
    lede: "Add the matching video and FunQA analysis JSON. The browser extracts evidence-aligned frames and the server stores one fused Gemini Embedding 2 vector per visual-caption-data pair.",
    boundary:
      "The source video file is never uploaded. Only the extracted frame images and their metadata are sent to the server.",
    storeTitle: "Store status",
    documents: "Indexed videos",
    scenes: "Stored scenes",
    capacity: "Tenant capacity",
    embeddingMode: "Embedding mode",
    modeUnknown: "Known after indexing",
    uploadTitle: "1 · Add a video",
    uploadHint: "MP4 · WebM · MOV · any browser-playable format",
    chooseFile: "Choose video",
    replaceFile: "Replace video",
    dropHere: "Drop a video here",
    noFile: "No video selected",
    analysisTitle: "2 · Match the FunQA analysis",
    analysisHint:
      "Choose the JSON generated for this exact video. Filename and duration are verified before indexing.",
    chooseAnalysis: "Choose analysis JSON",
    replaceAnalysis: "Replace analysis JSON",
    analysisRequired: "A matching FunQA analysis JSON is required.",
    analysisReady: "analysis paired",
    extracting: "Extracting frames…",
    framesReady: "frames ready",
    indexTitle: "3 · Index paired scenes",
    submit: "Store as vectors",
    submitting: "Captioning + embedding…",
    loginRequired: "Scene indexing requires login for cost protection.",
    successTitle: "Stored in the vector index",
    contractTitle: "What one scene stores",
    contractItems: [
      "Frame image and exact evidence timecode",
      "Independent scene caption from the vision model",
      "Paired FunQA evidence and source provenance",
      "One fused Gemini Embedding 2 vector for image, caption, and evidence",
      "Embedding model and dimension (other spaces are excluded from search)"
    ],
    storageNote:
      "Depending on the deployment this is Firestore (sceneFrames/{tenant}/scenes) or a local JSON store. There is no separate vector database; similarity is computed on the server.",
    libraryTitle: "Indexed videos",
    libraryEmpty: "Nothing has been indexed yet.",
    refresh: "Refresh",
    columnTitle: "Title",
    columnScenes: "Scenes",
    columnDuration: "Duration",
    columnCreated: "Stored",
    searchCta: "Search it in Video QA →",
    capacityNote: "Up to {max} scenes per tenant",
    frameCountLabel: "Frames to extract",
    titleLabel: "Document title",
    titlePlaceholder: "e.g. Dungeon crawl playthrough highlights",
    descriptionLabel: "Description (optional)",
    descriptionPlaceholder: "Context that helps retrieval",
    capacityFull: "The store is close to full. Clear existing scenes before indexing more."
  },
  sceneLab: {
    eyebrow: "Video QA analysis workspace",
    title: "Video QA analysis",
    lede: "Review video frames, scene captions, search evidence, and measured processing signals in one timestamp-led analysis flow.",
    ingest: {
      // Step 2: ingest is login-gated and cost-protected, so it now sits below
      // search and results rather than occupying the primary top-left slot.
      title: "2 · Register video document",
      // Collapsed by default — an anonymous visitor cannot use this panel at all.
      panelSummary: "Register a video document (login required)",
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
      errorGeneric: "Ingest failed. Please retry in a moment.",
      errorUnavailable:
        "The embedding provider is temporarily unavailable. Nothing was stored — retry shortly.",
      errorUnavailableRetry:
        "The embedding provider is temporarily unavailable. Nothing was stored — retry in about {seconds}s."
    },
    search: {
      // Search is step 1 now: ingest is login-gated and cost-protected, so an
      // anonymous visitor can only ever use search. Ordinals must match the
      // rendered order or they read as time-reversed.
      title: "1 · Search scenes",
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
      // Three distinct states that previously collapsed into one sentence.
      // (a) nothing searched yet — no verdict to report.
      idleHint: "Run a search to see matching scenes.",
      // (b) the index itself is empty — the query was fine, there is nothing to
      // match against. Paired with an in-page anchor because the ingest panel
      // sits far below on mobile.
      emptyIndex: "No scenes are indexed yet, so there is nothing to match against.",
      emptyIndexCta: "Go to “Register video document” →",
      // (c) the index has scenes but none matched. Echo the query so the user can
      // see what was actually sent.
      noMatchEcho: "No scenes matched “{query}”.",
      noMatch: "No scenes matched this query.",
      queryCaptionsTitle: "Query frame interpretation",
      similarity: "similarity",
      // Announced to screen readers when the result count changes; the visual
      // result grid alone fired no notification at all.
      resultsCount: "{count} matching scenes found.",
      resultsCountOne: "1 matching scene found.",
      // Rank labelling. The top card previously carried both "#1" and a
      // confidence badge 12px apart, encoding the same bit twice.
      bestMatch: "Best match",
      // The server now applies an absolute floor (0.45), so rank 1 can be "low".
      // Saying only "Best match" there would imply a good match.
      bestMatchWeak: "Closest match — weak",
      rankLabel: "#{rank}",
      confidenceHigh: "high confidence",
      confidenceMedium: "medium confidence",
      confidenceLow: "weak",
      weakTopNote:
        "Even the closest scene scored below the reliability floor — treat these as unrelated.",
      // Scenes indexed in a different embedding space cannot be ranked against
      // this query at all. Distinguishes a stale index from "nothing matched".
      unscoreableNotice:
        "{count} indexed scenes were skipped: they were embedded with a different model and need re-indexing.",
      unscoreableNoticeOne:
        "1 indexed scene was skipped: it was embedded with a different model and needs re-indexing.",
      // The bar encodes rank strength relative to the top hit, which is the only
      // part of the raw cosine that is comparable across query modes.
      matchBarLabel: "Match strength relative to the top result",
      // Raw numbers stay available for operators, off the card face.
      rawScoreSummary: "Raw score",
      rawScoreLabel: "Cosine similarity",
      rawRelativeLabel: "Relative to top",
      // Deliberately number-free. An earlier draft cited "0.47-0.62 vs 0.87",
      // which was already wrong within a day: the ranges are per-signal, and the
      // 0.87 figure came from a query frame byte-identical to an indexed frame,
      // so it measured nothing. Hardcoded score ranges are the same staleness
      // trap as the hardcoded model name this page already had.
      rawScoreNote:
        "Comparable only within this result list. The same value means different things from one query to the next, because it depends on which signal matched — use the ranking and confidence, not the number.",
      captionExpand: "Show full caption",
      captionCollapse: "Show less",
      errorGeneric: "Search failed. Please retry in a moment.",
      // 503 from the API: the embedding provider is down, so results would be
      // meaningless. Distinct from a generic failure because retrying works.
      errorUnavailable:
        "The embedding provider is temporarily unavailable, so results would be meaningless. Retry shortly.",
      errorUnavailableRetry:
        "The embedding provider is temporarily unavailable. Retry in about {seconds}s.",
      retryNow: "Retry search"
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
      took: "Took",
      // Shown in the header chips until a response reports the real model.
      // Deliberately not a model name: the chips used to hardcode one and drifted
      // out of sync with the deployed backend.
      embeddingModelUnknown: "embedding model: pending",
      captionModelUnknown: "caption model: pending"
    }
  },
  admin: {
    eyebrow: "Admin",
    title: "Live runtime observations",
    lede: "Inspect only values reported by the deployed API, Genkit scene runtime, and persistent stores."
  },
  docs: {
    title: "API Docs",
    navLabel: "API sections",
    notesTitle: "Reference Notes",
    eyebrow: "Admin API Reference",
    heroTitle: "Authenticate, index uploaded video, and retrieve grounded scene evidence.",
    lede: "Firebase identity owns the workspace boundary. Genkit captions uploaded frames, embeddings index them, and every scene operation returns runtime provenance.",
    sections: [
      { id: "overview", label: "Overview", title: "Overview" },
      { id: "auth", label: "Auth", title: "Auth" },
      { id: "quickstart", label: "Quickstart", title: "Quickstart" },
      { id: "endpoints", label: "Endpoints", title: "Endpoints" },
      { id: "errors", label: "Errors", title: "Errors" },
      { id: "limits", label: "Limits", title: "Rate Limits" }
    ],
    overviewBody:
      "The scene API accepts sampled video frames, generates captions and QA review candidates through Genkit, stores same-space embeddings, and returns evidence with operation IDs.",
    authBody:
      "Send a Firebase ID token. Read-only scene search uses the fixed admin-managed corpus; ingest and operational endpoints additionally require an admin role.",
    quickstartSteps: [
      "Sign in with Google and obtain a Firebase ID token.",
      "As an admin, sample representative JPEG frames and post paired video-analysis evidence to /v1/scenes/ingest.",
      "As any signed-in user, search the reviewed shared corpus by text, query frames, or both."
    ],
    endpointsTable: {
      method: "Method",
      path: "Path",
      purpose: "Purpose",
      rows: [
        ["GET", "/v1/health", "Minimal public liveness status"],
        ["GET", "/v1/admin/health", "Admin: runtime, model, embedding dimension, and store status"],
        ["POST", "/v1/scenes/ingest", "Admin: caption and index paired video-analysis frames"],
        ["POST", "/v1/scenes/search", "Search indexed scenes with text, frames, or a hybrid query"],
        ["GET", "/v1/scenes/documents", "Admin: list shared corpus documents"],
        [
          "DELETE",
          "/v1/scenes/documents/:documentId",
          "Admin: delete an indexed shared corpus document"
        ],
        ["GET", "/v1/monitoring/summary", "Admin: read instance-scoped request observations"],
        ["POST", "/v1/rag/inspect", "Admin: inspect the authenticated retrieval pipeline"]
      ]
    },
    errorsBody:
      "Validation errors return field-level messages. Missing authentication returns 401/403. Genkit generation outages return 503 without storing template evidence.",
    limitsBody:
      "Admin-only scene ingestion accepts up to 16 frames per request under the 5 MB JSON body limit. Server-side rate limits apply to the shared corpus.",
    notes: [
      {
        label: "Auth",
        text: "Scene search requires sign-in; corpus writes and operations additionally require admin."
      },
      {
        label: "Grounding",
        text: "QA candidates are review prompts, never generated pass/fail verdicts."
      },
      { label: "Telemetry", text: "Responses and Cloud Logging share the same operationId." }
    ]
  },
  login: {
    eyebrow: "Authentication",
    title: "Sign in with Google to enter the search workspace and operator console.",
    lede: "End users see saved search and citations. Admins also get ingestion controls, model-key settings, and usage telemetry.",
    continueTitle: "Continue with Google",
    continueBody:
      "Workspace login unlocks saved searches, grounded citations, admin controls, and audit-aware provider key actions.",
    continueButton: "Continue With Google",
    continueNote:
      "Firebase Auth verifies search access; the server keeps corpus mutation admin-only.",
    trustTitle: "Trust boundary",
    trustItems: [
      "You need a Google account allowed by workspace policy.",
      "Admin privileges are assigned server-side after sign-in.",
      "No provider API key is ever stored in browser storage."
    ]
  }
} as const;
