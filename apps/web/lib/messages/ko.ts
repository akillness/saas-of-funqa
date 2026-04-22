export const koMessages = {
  common: {
    appName: "funqa",
    localeLabel: "언어",
    localeNames: {
      en: "English",
      ko: "한국어"
    },
    liveLabel: "실시간",
    sourceLabels: {
      docs: "문서",
      wiki: "위키",
      policy: "정책"
    },
    confidenceLabels: {
      high: "높음",
      medium: "보통",
      low: "낮음"
    }
  },
  layout: {
    skipToContent: "본문으로 건너뛰기",
    brandEyebrow: "근거 기반 AI 워크스페이스",
    nav: {
      overview: "개요",
      search: "검색",
      ragLab: "RAG 랩",
      admin: "관리",
      docs: "API 문서",
      login: "로그인"
    }
  },
  home: {
    eyebrow: "Ralph Seed 활성",
    title: "근거 기반 검색, 운영 제어, AI 전달을 하나의 프리미엄 워크스페이스로 묶습니다.",
    lede:
      "funqa는 검색, 관리자 화면, 문서를 하나의 제품 모드로 다룹니다. 인터페이스는 하나의 핵심 작업면과 하나의 보조 컨텍스트 레일을 유지해 랜딩 페이지가 아니라 실제 도구처럼 느껴지도록 밀도를 맞춥니다.",
    primaryAction: "검색 워크스페이스 열기",
    secondaryAction: "API 표면 검토",
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
        href: "/search",
        label: "검색 워크스페이스",
        kicker: "Perplexity 스타일 검색",
        text: "고정된 질의 컴포저, 눈에 보이는 소스 제어, 근거 기반 답변을 위한 상시 inspector를 제공합니다.",
        cta: "검색 워크스페이스로 이동"
      },
      {
        href: "/admin",
        label: "운영 콘솔",
        kicker: "조용하지만 밀도 높은 운영 UI",
        text: "상태, 큐 압력, 롤아웃 가시성, 키 관리를 설정 덤프처럼 보이지 않게 정리합니다.",
        cta: "운영 콘솔로 이동"
      },
      {
        href: "/docs",
        label: "API 문서",
        kicker: "코드 우선 레퍼런스",
        text: "반복 조회에 맞춘 문서 셸 안에 빠른 시작, 엔드포인트 표, 롤아웃 인식 가이드를 둡니다.",
        cta: "API 문서로 이동"
      }
    ],
    processEyebrow: "프로세스 모듈",
    processTitle: "RAG를 제품적으로 의미가 유지되는 가장 작은 검증 단위까지 분해했습니다.",
    pipeline: [
      { label: "정규화", text: "원시 저장소 콘텐츠를 하나의 표준 문서 엔벌로프로 정리합니다" },
      { label: "추출", text: "근거가 있는 사실과 엔티티를 앞으로 끌어와 보강합니다" },
      { label: "청킹", text: "조사와 인용이 가능한 크기로 dense retrieval 단위를 유지합니다" },
      { label: "임베딩", text: "기본 live 경로는 `gemini-embedding-2-preview`이며 출력 차원은 조정 가능합니다" },
      { label: "검색", text: "결과 순위는 의미 유사성과 provenance 선명도를 함께 반영합니다" },
      { label: "응답", text: "최종 답변은 떠다니는 생성이 아니라 인용과 연결된 상태를 유지합니다" }
    ],
    whyEyebrow: "UI가 바뀐 이유",
    whyTitle: "최근 AI 제품은 하나의 주 작업면과 하나의 컨텍스트 레일로 수렴하고 있습니다.",
    whyBody:
      "검색은 Perplexity의 인용된 답변 밀도를 참고하고, admin은 현대 AI 운영 콘솔의 절제된 위계를 유지하며, docs는 OpenAI와 Gemini 레퍼런스 같은 코드 우선 흐름을 따릅니다.",
    whyChips: ["고정 질의 컴포저", "컨텍스트 인스펙터", "조용한 KPI 덱", "코드 우선 문서 레일"]
  },
  search: {
    eyebrow: "검색",
    title: "한 번 묻고, 그 자리에서 다듬고, 끝까지 provenance를 보이게 유지합니다.",
    lede:
      "검색 워크스페이스는 실제 검색 도구처럼 구성됩니다. 프롬프트 레일, 소스 필터, 밀도 있는 결과, 컨텍스트 전환이 필요 없는 citation inspector를 함께 둡니다.",
    composerLabel: "검색 질의",
    composerPlaceholder: "암호화된 provider key 저장을 설명하는 정책은 무엇인가요?",
    submit: "검색 실행",
    pending: "검색 중…",
    shareableNote: "URL 상태를 그대로 공유해 검토와 재현에 사용할 수 있습니다.",
    suggestionsLabel: "추천 프롬프트",
    fallbackSuggestions: ["키 회전 정책", "기본 임베딩", "관리자 알림"],
    railTitle: "소스 레일",
    railBadge: "실시간 필터",
    sourceLabel: "소스 유형",
    sourceOptions: [
      { value: "all", label: "전체 소스" },
      { value: "docs", label: "문서" },
      { value: "wiki", label: "위키" },
      { value: "policy", label: "정책" }
    ],
    applyFilters: "필터 적용",
    recentSearches: "최근 검색: 온보딩 정책, 키 회전, 관리자 알림",
    filterChips: ["근거 있는 결과만", "최신 소스", "높은 신뢰도"],
    resultsTitle: "결과",
    resultsSummaryEmpty: "근거 기반 매치를 확인하려면 자연어 질문으로 시작해 보세요.",
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
    liveFreshness: "실시간",
    fallbackResults: [
      {
        title: "분기 로드맵 소스 노트",
        source: "docs/roadmap-q2.md",
        category: "docs",
        confidence: "high",
        freshness: "2일 전",
        snippet: "로드맵 우선순위는 ingest 신뢰성, 관리자 가시성, 사용자 검색 명확성 기준으로 묶입니다.",
        citations: ["roadmap-q2.md#top-priorities", "system-architecture.md#surface-plan"]
      },
      {
        title: "Provider key 회전 정책",
        source: "docs/architecture/security-secrets.md",
        category: "policy",
        confidence: "high",
        freshness: "오늘",
        snippet: "Provider key는 서버 측에서 AES-GCM으로 암호화되고 향후 KMS 회전을 위해 버전 관리됩니다.",
        citations: ["security-secrets.md#encryption-boundary", "provider-keys.route.ts#save"]
      },
      {
        title: "임베딩 모델 결정 로그",
        source: "knowledge/wiki/sources/gemini-embeddings.md",
        category: "wiki",
        confidence: "medium",
        freshness: "오늘",
        snippet: "기본 호스팅 경로는 Gemini 임베딩을 유지하고, Gemma 계열 어댑터는 플러그형으로 남겨 둡니다.",
        citations: ["gemini-embeddings.md#verified-default", "seed.yaml#assumptions"]
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
    releaseGateTitle: "최신 출시 게이트 베이스라인",
    releaseGateBody:
      "이 패널은 최신 고정 consensus-eval 리포트를 반영해 운영자가 RAG Lab 안에서 바로 출시 준비 상태를 판단할 수 있게 합니다.",
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
  }
} as const;
