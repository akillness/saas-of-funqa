export const koMessages = {
  common: {
    appName: "funqa",
    localeLabel: "언어",
    localeNames: {
      en: "English",
      ko: "한국어"
    },
    themeLabel: "테마",
    themeModes: {
      light: "라이트",
      dark: "다크"
    },
    liveLabel: "실시간",
    sourceLabels: {
      games: "게임",
      movies: "영화",
      videos: "영상"
    },
    confidenceLabels: {
      high: "높음",
      medium: "보통",
      low: "낮음"
    }
  },
  layout: {
    skipToContent: "본문으로 건너뛰기",
    brandEyebrow: "AI 미디어 검색엔진",
    menuLabel: "메뉴",
    nav: {
      overview: "홈",
      search: "검색",
      ragLab: "RAG 랩",
      admin: "관리",
      docs: "API 문서",
      login: "로그인"
    }
  },
  home: {
    eyebrow: "AI 미디어 검색",
    title: "게임, 영화, 미디어를 AI로 검색하고 저장하세요",
    lede:
      "당신의 콘텐츠 취향을 AI가 기억합니다. 게임, 영화, 영상 콘텐츠를 AI 기반 검색으로 탐색하고 관리하세요.",
    primaryAction: "검색 시작",
    secondaryAction: "API 문서",
    embedLabel: "기본 호스팅 임베딩",
    verifiedLabel: "검증일 2026-04-13",
    embedNote:
      "Google의 최신 Gemini 임베딩 문서는 `gemini-embedding-2-preview`를 멀티모달 경로로 제시하며, smoke test는 결정론적 local hash 백엔드로 유지됩니다.",
    docsIndexed: "색인된 문서",
    chunksLive: "활성 청크",
    systemShapeLabel: "실시간 시스템 형태",
    systemShape: [
      "암호화된 provider key를 위한 서버 측 시크릿 경계",
      "검증 가능한 프로세스 단위로 분리된 모듈형 RAG 흐름",
      "App Hosting 롤아웃을 고려한 검색/관리/문서 셸"
    ],
    surfaces: [
      {
        href: "/search?source=games",
        label: "게임 탐색",
        kicker: "게임",
        text: "플레이한 게임, 플레이하고 싶은 게임을 AI로 관리하고 스마트하게 검색합니다.",
        cta: "게임 검색"
      },
      {
        href: "/search?source=movies",
        label: "영화 데이터베이스",
        kicker: "영화",
        text: "본 영화와 시청 목록을 스마트하게 검색하고 AI로 추천받습니다.",
        cta: "영화 검색"
      },
      {
        href: "/search?source=videos",
        label: "콘텐츠 아카이브",
        kicker: "영상",
        text: "미디어 콘텐츠를 저장하고 AI로 분석하여 원하는 영상을 빠르게 찾습니다.",
        cta: "영상 검색"
      }
    ],
    processEyebrow: "AI 파이프라인",
    processTitle: "미디어 콘텐츠가 AI 단계를 거쳐 정확한 검색 결과로 변환됩니다.",
    pipeline: [
      { label: "인덱싱", text: "게임, 영화, 영상의 메타데이터와 설명을 수집하고 정규화합니다" },
      { label: "임베딩", text: "`gemini-embedding-2-preview`로 콘텐츠를 임베딩해 의미 기반 검색을 지원합니다" },
      { label: "검색", text: "의미 유사성과 키워드 신호를 결합해 정확한 미디어 결과를 반환합니다" },
      { label: "답변", text: "최종 답변은 특정 미디어 항목에 인용을 연결해 근거를 유지합니다" }
    ],
    whyEyebrow: "UI가 바뀐 이유",
    whyTitle: "최근 AI 제품은 하나의 주 작업면과 하나의 컨텍스트 레일로 수렴하고 있습니다.",
    whyBody:
      "검색은 Perplexity의 인용된 답변 밀도를 참고하고, admin은 현대 AI 운영 콘솔의 절제된 위계를 유지하며, docs는 OpenAI와 Gemini 레퍼런스 같은 코드 우선 흐름을 따릅니다.",
    whyChips: ["고정 질의 컴포저", "컨텍스트 인스펙터", "조용한 KPI 덱", "코드 우선 문서 레일"],
    visitorPaths: [
      {
        href: "/search",
        eyebrow: "처음 방문했어요",
        title: "검색으로 바로 시작",
        body: "게임, 영화, 영상 질문 하나로 FunQA가 어떤 근거를 찾는지 빠르게 확인합니다."
      },
      {
        href: "/docs",
        eyebrow: "구조를 보고 싶어요",
        title: "API 문서와 계약 확인",
        body: "검색 결과가 어떤 데이터와 출력 계약을 따르는지 문서 흐름으로 점검합니다."
      },
      {
        href: "/rag-lab",
        eyebrow: "실험이 궁금해요",
        title: "RAG Lab에서 검증",
        body: "인덱싱, 임베딩, 검색, 답변 단계를 운영자 관점에서 확인합니다."
      }
    ]
  },
  search: {
    eyebrow: "미디어 검색",
    title: "게임, 영화, 미디어를 AI로 검색하고 저장하세요",
    lede:
      "AI 기반 검색으로 게임, 영화, 영상을 찾아보세요. 정확한 미디어 항목에 인용을 연결한 근거 있는 답변을 받을 수 있습니다.",
    composerLabel: "검색어",
    composerPlaceholder: "게임, 영화, 영상을 검색하세요...",
    submit: "검색",
    pending: "검색 중…",
    shareableNote: "URL 상태를 그대로 공유해 검토와 재현에 사용할 수 있습니다.",
    suggestionsLabel: "추천 검색어",
    fallbackSuggestions: ["마인크래프트 최신 업데이트 내용은?", "크리스토퍼 놀란 감독 영화 목록", "넷플릭스 오리지널 드라마 추천", "2024년 GOTY 수상작", "젤다의 전설 시리즈 순서는?", "역대 아카데미 작품상 수상작", "쇼츠 알고리즘 분석 채널 추천", "소울라이크 입문자 추천 게임"],
    railTitle: "카테고리 필터",
    railBadge: "실시간 필터",
    sourceLabel: "콘텐츠 유형",
    sourceOptions: [
      { value: "all", label: "전체" },
      { value: "games", label: "게임" },
      { value: "movies", label: "영화" },
      { value: "videos", label: "영상" }
    ],
    applyFilters: "필터 적용",
    recentSearches: "최근 검색: 오픈월드 게임, 명작 영화, 테크 리뷰",
    filterChips: ["높은 평점", "최신 출시", "내 라이브러리"],
    editorialKicker: "에디토리얼 검색 데스크 · 게임, 영화, 크리에이터 미디어",
    contractEyebrow: "검색 계약",
    contractTitle: "하나의 신중한 질의 면, 하나의 확인 가능한 답변 레일.",
    contractNotes: [
      "검색 입력은 전면에 두되, 셸은 에디토리얼 데스크처럼 여유 있게 유지합니다.",
      "합의 기반 답변과 증거 전용 상태는 계속 분명하게 구분되어야 합니다.",
      "보조 레일은 대시보드 소음이 아니라 신뢰도와 인용을 설명해야 합니다."
    ],
    resultsTitle: "결과",
    resultsSummaryEmpty: "근거 기반 매치를 확인하려면 자연어 질문으로 시작해 보세요.",
    stateSummaryLabel: "검색 데스크 요약",
    stateLabels: {
      activeDesk: "활성 데스크",
      outputMode: "출력 모드",
      retrievalPath: "검색 경로"
    },
    stateNotes: {
      filteredDesk: "질의는 선택한 아카이브 데스크를 기준으로 필터링됩니다.",
      allDesk: "하나의 검색 면에서 모든 데스크를 함께 탐색합니다.",
      evidenceOnly: "답변 게이트가 열리지 않아도 폴백 상태는 계속 보입니다.",
      consensusBacked: "허용된 답변은 계속 인스펙션 레일과 함께 표시됩니다.",
      pending: "아직 답변 계약이 정해지기 전의 준비 상태입니다.",
      retrievalPath: "질의 변환, 검색, 리랭크, 출력 계약이 숨지 않고 계속 드러납니다."
    },
    outputModes: {
      evidenceOnly: "증거 전용",
      consensusBacked: "합의 기반",
      pending: "결과 대기"
    },
    strictGroundingTitle: "엄격한 근거 모드",
    strictGroundingBody: "합의 게이트가 최종 답변 출력을 보호합니다.",
    overviewEyebrow: "검색 데스크",
    pipelineAriaLabel: "검색 파이프라인",
    pipelineEyebrow: "파이프라인 엑스레이",
    pipelineTitle: "FunQA는 답이 무엇인지보다 어떻게 허용됐는지를 보여줍니다.",
    pipelineBody: "검색은 질의 변환, 검색, 리랭크, 출력 계약 검사를 거쳐 실행됩니다.",
    optimizedIntentPrefix: "최적화된 의도:",
    pipelineStepLabels: {
      queryTransform: "질의 변환",
      retrieval: "검색",
      rerank: "리랭크",
      outputContract: "출력 계약"
    },
    inspectorSynced: "인스펙터 동기화",
    groundedAnswer: "근거 기반 답변",
    evidenceOnlyTitle: "증거 전용 폴백",
    evidenceOnlyBadge: "합의 미도달",
    evidenceOnlyBody:
      "FunQA가 관련 증거는 찾았지만 답변 게이트는 열리지 않았습니다. 검색 경로에 그래프 기반 합의가 연결되기 전까지는 아래의 정렬된 증거를 검토하세요.",
    chunksSearchedSuffix: "개 청크 검색",
    emptyTitle: "아직 강한 매치가 없습니다.",
    emptyBody:
      "더 넓은 저장소 질문으로 바꾸거나, 소스 유형을 전환하거나, 추가 콘텐츠를 ingest한 뒤 다시 시도해 보세요.",
    inspectorTitle: "인스펙터",
    inspectorPinned: "고정됨",
    inspectorHint: "결과를 선택하면 citation과 소스 메타데이터를 확인할 수 있습니다.",
    sourceField: "소스",
    confidenceField: "신뢰도",
    freshnessField: "신선도",
    citationsField: "인용",
    resultForSuffix: "개 결과",
    citationsSuffix: "개 인용",
    bookmarkLabel: "북마크",
    liveFreshness: "실시간",
    fallbackResults: [
      {
        title: "엘든 링",
        source: "games/elden-ring",
        category: "games",
        confidence: "high",
        freshness: "2024",
        snippet:
          "랜즈 비트윈을 배경으로 한 액션 RPG. 프롬소프트의 가장 방대한 오픈월드 소울라이크로 풍부한 세계관과 도전적인 전투를 제공합니다.",
        citations: ["games/elden-ring#overview", "games/elden-ring#gameplay"]
      },
      {
        title: "인터스텔라",
        source: "movies/interstellar",
        category: "movies",
        confidence: "high",
        freshness: "2014",
        snippet:
          "크리스토퍼 놀란 감독의 SF 서사시. 우주비행사 팀이 토성 근처 웜홀을 통해 인류의 새 보금자리를 찾아 떠나는 이야기입니다.",
        citations: ["movies/interstellar#synopsis", "movies/interstellar#cast"]
      },
      {
        title: "Veritasium: AI는 어떻게 작동하는가",
        source: "videos/veritasium-ai-explainer",
        category: "videos",
        confidence: "medium",
        freshness: "최근",
        snippet: "Derek Muller가 신경망, 트랜스포머, 현대 AI 아키텍처를 깊이 있게 설명하는 영상입니다.",
        citations: ["videos/veritasium-ai-explainer#summary", "videos/veritasium-ai-explainer#chapters"]
      }
    ]
  },
  ragLab: {
    eyebrow: "RAG 랩",
    title: "검색 파이프라인의 모든 단계를 일급 모듈처럼 점검합니다.",
    lede:
      "이 화면은 모듈형 파이프라인 구조를 그대로 반영해 query transform, retrieval, rerank, answer assembly를 제품 안에서 바로 비교할 수 있게 설계됐습니다.",
    queryLabel: "질의",
    queryPlaceholder: "provider key storage",
    transformLabel: "질의 변환",
    transformOptions: {
      none: "없음",
      "rewrite-local": "로컬 리라이트",
      "hyde-local": "로컬 HyDE",
      "hyde-genkit": "Genkit HyDE"
    },
    rerankLabel: "리랭크",
    rerankOptions: {
      none: "없음",
      rrf: "RRF만",
      heuristic: "휴리스틱 리랭크",
      "genkit-score": "Genkit 점수"
    },
    runInspection: "인스펙션 실행",
    stagesLabel: "RAG 단계",
    stages: {
      query: "질의",
      retrieve: "검색",
      rerank: "리랭크",
      answer: "응답",
      eval: "평가",
      trace: "트레이스"
    },
    currentStrategy: "현재 전략",
    preRerank: "리랭크 전",
    finalTopK: "최종 top-k",
    liveGenkit: "실시간 genkit",
    deterministicLocal: "결정적 로컬",
    latency: "지연",
    queryTransformTitle: "질의 변환",
    rawQuery: "원본 질의",
    mode: "모드",
    transformedQuery: "변환된 질의",
    hydePseudoDocument: "HyDE 가상 문서",
    retrieveTitle: "검색",
    retrieveColumns: {
      chunk: "청크",
      dense: "Dense",
      lexical: "Lexical",
      fused: "Fusion"
    },
    rerankTitle: "리랭크",
    rerankColumns: {
      chunk: "청크",
      rerank: "리랭크 점수",
      why: "이동 이유"
    },
    answerTitle: "응답",
    answerPreview: "응답 미리보기",
    answerCitations: "반환된 인용",
    evalTitle: "평가",
    evalScore: "로컬 groundedness 점수",
    evalNote: "더 강한 evaluator를 연결하기 전에 이 패널에서 전략 차이를 비교하세요.",
    traceTitle: "트레이스",
    traceLabel: "실행 트레이스",
    releaseGateEyebrow: "합의 출시 게이트",
    releaseGateTitle: "최신 출시 게이트 리포트",
    releaseGateBody:
      "이 패널은 최신 고정 consensus-eval 리포트를 반영해 운영자가 RAG Lab 안에서 바로 출시 준비 상태를 판단할 수 있게 합니다.",
    releaseGateSelectorLabel: "출시 리포트",
    latestReportBadge: "최신",
    unknownState: "알 수 없음",
    noReasonCode: "없음",
    releaseGateCasesTitle: "출시 게이트 케이스 결과",
    releaseGateArtifactsTitle: "보존 아티팩트",
    releaseGateMetrics: {
      agreementRate: "합의율",
      threshold: "임계값",
      eligibleCases: "대상 케이스",
      failedCases: "실패 케이스"
    },
    releaseGateDetails: {
      datasetVersion: "데이터셋 버전",
      generatedAt: "생성 시각",
      buildSha: "빌드 SHA",
      evaluationStatus: "평가 상태",
      integrity: "아티팩트 무결성",
      replayability: "재현 가능성"
    },
    releaseGateColumns: {
      caseId: "케이스 ID",
      verdict: "판정",
      decision: "결정",
      answerMode: "응답 모드",
      reason: "주요 사유"
    }
  },
  admin: {
    eyebrow: "관리",
    title: "콘솔을 폼 무덤으로 만들지 않고 ingest, 키, 사용자, 비용을 운영합니다.",
    lede:
      "콘솔은 설정이 아니라 신호를 먼저 보여줍니다. 우선순위 항목은 첫 화면에 두고, 드릴다운 데이터는 compact하게 유지해 운영자가 큐 압력과 모델 비용을 한 번에 볼 수 있게 합니다.",
    windowLabel: "기간",
    windows: ["24시간", "7일", "30일"],
    chips: ["롤아웃", "큐", "키", "사용량"],
    metrics: {
      successRate: "성공률",
      indexedDocs: "색인 문서",
      indexedChunks: "색인 청크",
      p95Latency: "P95 지연",
      runtimeHealthy: "런타임 정상",
      needsReview: "검토 필요",
      tenantsSuffix: "개 테넌트",
      updatedRecently: "최근 갱신됨",
      notIngestedYet: "아직 ingest 안 됨",
      todaySuffix: "오늘",
      previousWindowSuffix: "이전 구간 대비"
    },
    needsAttention: "주의 필요",
    operatorQueue: "운영 큐",
    attentionItems: {
      priority: "우선",
      queue: "큐",
      telemetry: "텔레메트리",
      keyGuard: "Provider key 회전 정책에는 아직 admin 전용 route guard가 강제되지 않았습니다.",
      queueSummaryPrefix: "현재 저장소에는",
      queueSummaryDocs: "개 문서와",
      queueSummaryChunks: "개 청크가 있습니다.",
      telemetryPrefix: "런타임은",
      telemetryUsers: "명의 활성 사용자와",
      telemetryEmbedding: "를 현재 임베딩 경로로 보고합니다."
    },
    queueTable: {
      area: "영역",
      signal: "신호",
      owner: "담당",
      rows: [
        ["Ingestion", "중단된 저장소 동기화 재시도", "Ops"],
        ["Users", "대기 중인 관리자 초대 검토", "Admin"],
        ["Usage", "검색 플로우 비용 스파이크 점검", "PM"],
        ["Deploy", "로컬 스모크 이후 App Hosting 롤아웃 상태 확인", "Platform"]
      ]
    }
  },
  docs: {
    title: "API 문서",
    navLabel: "API 섹션",
    notesTitle: "참고 노트",
    eyebrow: "공개 API 문서",
    heroTitle: "하나의 서버 경계에서 인증, 콘텐츠 ingest, 근거 기반 응답 검색을 처리합니다.",
    lede:
      "먼저 Google 인증 워크스페이스 접근을 시작하고, 그 다음 ingest, search, provider key 관리를 작업 중심 엔드포인트로 사용합니다.",
    sections: [
      { id: "overview", label: "개요", title: "개요" },
      { id: "auth", label: "인증", title: "인증" },
      { id: "quickstart", label: "빠른 시작", title: "빠른 시작" },
      { id: "endpoints", label: "엔드포인트", title: "엔드포인트" },
      { id: "errors", label: "오류", title: "오류" },
      { id: "limits", label: "제한", title: "속도 제한" }
    ],
    overviewBody:
      "API는 저장소 콘텐츠를 받아 보강하고, 암호화된 provider-key 메타데이터를 저장하며, citation이 포함된 검색 결과를 반환합니다.",
    authBody: "Google 인증 워크스페이스 세션을 사용합니다. 관리자 전용 라우트는 서버에서 보호돼야 합니다.",
    quickstartSteps: [
      "Google로 로그인하고 워크스페이스 토큰을 획득합니다.",
      "관리자 전용 암호화 키 엔드포인트를 통해 provider 자격 증명을 저장합니다.",
      "Ingest payload를 전송한 다음 URL 공유 가능한 query parameter로 검색합니다."
    ],
    endpointsTable: {
      method: "메서드",
      path: "경로",
      purpose: "목적",
      rows: [
        ["GET", "/v1/health", "런타임 상태와 임베딩 모델 선언 반환"],
        ["POST", "/v1/ingest", "추출과 색인을 위한 문서 수락"],
    ["POST", "/v1/search", "합의 기반 답변 또는 증거 전용 검색 결과 반환"],
        ["POST", "/v1/rag/inspect", "query-transform, retrieve, rerank, answer, eval 단계를 점검"],
        ["POST", "/v1/provider-keys/:provider", "provider 자격 증명을 암호화해 저장"],
        ["GET", "/v1/monitoring/summary", "관리자 대시보드용 사용량 요약 제공"],
        ["GET", "/v1/admin/rag/stats", "로컬 RAG 저장소의 문서/청크 수 점검"],
        ["POST", "/v1/admin/rag/reset", "스모크 테스트 전 로컬 검증 저장소 초기화"]
      ]
    },
    errorsBody: "검증 오류는 필드 단위 메시지를 반환합니다. 관리자 전용 실패는 누락된 역할이나 토큰을 설명해야 합니다.",
    limitsBody: "초기 제한은 tenant 인식 기반으로 서버 측에서 강제돼야 합니다. 최종 API 레퍼런스에는 재시도와 백오프를 문서화하세요.",
    notes: [
      { label: "인증", text: "워크스페이스 API에는 Google 세션이 필요합니다." },
      { label: "기본 모델", text: "`gemini-embedding-2-preview`" },
      { label: "배포", text: "웹은 App Hosting의 Next.js, API는 별도의 신뢰 경계에서 운영됩니다." }
    ]
  },
  login: {
    eyebrow: "인증",
    title: "Google로 로그인해 검색 워크스페이스와 운영 콘솔에 진입합니다.",
    lede:
      "최종 사용자는 저장된 검색과 citation을 보고, 관리자는 ingest 제어, 모델 키 설정, 사용량 텔레메트리도 함께 봅니다.",
    continueTitle: "Google로 계속",
    continueBody:
      "워크스페이스 로그인으로 저장된 검색, 근거 기반 citation, 관리자 제어, 감사 가능한 provider key 작업이 열립니다.",
    continueButton: "Google로 계속",
    continueNote: "다음 구현 단계는 Firebase Auth 연동입니다.",
    trustTitle: "신뢰 경계",
    trustItems: [
      "워크스페이스 정책에서 허용된 Google 계정이 필요합니다.",
      "관리자 권한은 로그인 후 서버 측에서 부여됩니다.",
      "Provider API key는 브라우저 저장소에 저장되지 않습니다."
    ]
  },
  featuredHero: {
    eyebrow: "AI 미디어 검색엔진",
    title: "게임, 영화, 미디어를 AI로 발견하세요",
    lede: "나만의 콘텐츠 유니버스. AI 기반 검색으로 저장하고 탐색하세요.",
    primaryAction: "검색 시작",
    trendingAction: "트렌딩 보기",
    statsChunks: "청크 인덱싱",
    statsModel: "임베딩 모델"
  },
  contentRow: {
    seeAll: "전체 보기",
    gamesLabel: "게임",
    moviesLabel: "영화",
    videosLabel: "영상",
    gamesSubtitle: "인기 & 트렌딩 게임",
    moviesSubtitle: "호평받는 영화",
    videosSubtitle: "크리에이터 하이라이트"
  },
  categoryTabs: {
    all: "전체",
    games: "게임",
    movies: "영화",
    videos: "영상"
  },
  answerPanel: {
    toggleShow: "AI 분석 보기",
    toggleHide: "AI 분석 숨기기",
    chunksAnalyzed: "청크 분석됨",
    confidenceScore: "신뢰도",
    citationsLabel: "출처"
  }
} as const;
