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
      ralph: "Ralph",
      admin: "관리",
      docs: "API 문서",
      login: "로그인"
    }
  },
  home: {
    eyebrow: "게임·영화·미디어 AI 검색",
    title: "게임, 영화, 미디어를 AI로 정확하게 검색하세요",
    lede:
      "FunQA는 게임, 영화, 영상 콘텐츠를 AI로 검색하고 출처가 분명한 답변을 제공하는 통합 검색엔진입니다.",
    primaryAction: "검색 시작",
    secondaryAction: "API 문서",
    embedLabel: "기본 호스팅 임베딩",
    verifiedLabel: "검증일 2026-04-13",
    embedNote:
      "Google의 최신 Gemini 임베딩 문서는 `gemini-embedding-2-preview`를 멀티모달 경로로 제시하며, smoke test는 결정론적 local hash 백엔드로 유지됩니다.",
    docsIndexed: "색인된 문서",
    chunksLive: "활성 청크",
    systemShapeLabel: "실시간 시스템 현황",
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
    whyEyebrow: "디자인 원칙",
    whyTitle: "최신 AI 제품은 핵심 작업 화면과 컨텍스트 패널, 이 두 가지로 수렴하고 있습니다.",
    whyBody:
      "검색은 인용 중심의 답변을, 관리자 화면은 운영 신호를 우선에 두며, 문서는 코드 중심 흐름을 따릅니다.",
    whyChips: ["고정 질의 컴포저", "컨텍스트 인스펙터", "조용한 KPI 덱", "코드 우선 문서 레일"],
    visitorPaths: [
      {
        href: "/search",
        eyebrow: "처음 방문했어요",
        title: "검색으로 바로 시작",
        body: "문서, 미디어, 근거 그래프를 가로지르는 질문 하나로 FunQA가 무엇을 증명할 수 있는지 확인합니다."
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
    contractTitle: "질문 하나, 검증 가능한 답변 하나.",
    contractNotes: [
      "검색 입력을 화면 중앙에 두고, 불필요한 요소는 최소화합니다.",
      "AI 합의 답변과 증거 기반 결과를 명확히 구분합니다.",
      "보조 패널은 신뢰도와 출처 정보를 간결하게 보여줍니다."
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
      filteredDesk: "선택한 카테고리 기준으로 검색 결과를 필터링합니다.",
      allDesk: "게임, 영화, 영상을 한 번에 검색합니다.",
      evidenceOnly: "AI 답변이 없어도 관련 검색 결과는 계속 표시됩니다.",
      consensusBacked: "검증된 AI 답변은 출처 패널과 함께 표시됩니다.",
      pending: "검색 결과를 불러오는 중입니다.",
      retrievalPath: "질의 변환부터 검색, 재순위, 결과 출력까지 전 과정을 확인할 수 있습니다."
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
    pipelineTitle: "FunQA는 답변의 내용뿐 아니라 그 근거와 과정을 함께 보여줍니다.",
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
      "관련 자료는 찾았지만 AI 답변 기준에는 도달하지 못했습니다. 아래 검색 결과를 직접 확인해 보세요.",
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
    stream: {
      streaming: "실시간 검색 중…",
      error: "스트림 오류",
      liveAnswer: "실시간 답변",
      topChunks: "주요 청크",
      citations: "출처 인용",
      stages: {
        retrieving: "관련 청크 검색 중…",
        reranking: "결과 재순위화 중…",
        generating: "답변 생성 중…"
      }
    },
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
    title: "검색 파이프라인의 각 단계를 직접 점검하고 비교합니다.",
    lede:
      "질의 변환, 검색, 재순위, 답변 조립 과정을 제품 안에서 단계별로 비교하고 분석할 수 있습니다.",
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
    traceDetails: {
      normalizeDocs: "문서 정규화",
      extractDocs: "문서 추출",
      chunks: "청크",
      topDocument: "최상위 문서",
      none: "없음"
    },
    analyticsMetrics: {
      title: "게임 비디오 분석 지표",
      cragConfidence: "CRAG 신뢰도",
      searchAccuracy: "검색 정확도",
      cacheHitRate: "캐시 히트율",
      processingLatency: "처리 지연",
      lede: "AI 검색 파이프라인 분석 · 게임 비디오 검증 콘솔"
    },
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
  ralph: {
    eyebrow: "Ralph 완성 루프",
    title: "고정된 seed에 맞춰 증거가 완료를 말할 때까지 작업을 반복합니다.",
    lede:
      "Ralph는 구현 작업을 검증 루프로 바꿉니다. 계약을 명확히 하고, 가장 작은 유효 변경을 실행하고, 증거를 확인하고, drift를 바로잡으며 acceptance criteria가 통과할 때까지 계속 진행합니다.",
    primaryAction: "RAG 랩에서 점검",
    secondaryAction: "API 문서 보기",
    statusCard: {
      eyebrow: "운영 상태",
      title: "Spec-first 루프 상태",
      metrics: [
        { label: "계약", value: "Seeded", text: "작업은 명시된 목표, 제약, acceptance criteria에서 시작합니다." },
        { label: "게이트", value: "Verify", text: "빌드, 타입 검사, 스모크, 브라우저 증거가 완료 주장보다 먼저입니다." },
        { label: "Drift", value: "Tracked", text: "실패는 숨기지 않고 다음 반복의 입력으로 남깁니다." }
      ]
    },
    loopEyebrow: "실행 모델",
    loopTitle: "ooo ralph를 위한 페이지 수준 계약",
    loopLede:
      "각 카드는 재사용 가능한 체크포인트입니다. 제품, 엔지니어링, QA가 무엇이 왜 바뀌었는지 같은 기준으로 확인할 수 있게 루프를 화면에 드러냅니다.",
    loopSteps: [
      {
        label: "Interview",
        title: "모호성 줄이기",
        body: "막연한 요청을 제한된 목표, 제약, 명시적 non-goal로 정리합니다.",
        signal: "남은 모호성이 seed로 고정해도 될 만큼 작아지면 준비 완료입니다."
      },
      {
        label: "Seed",
        title: "계약 고정",
        body: "구현 전에 합의된 목표와 acceptance criteria를 기록합니다.",
        signal: "seed는 불변이며 후속 변경은 새 seed로 남깁니다."
      },
      {
        label: "Execute",
        title: "가장 작은 유효 변경 실행",
        body: "넓은 리팩터나 숨은 범위 확장 없이 seed를 만족하는 집중 변경을 적용합니다.",
        signal: "건드린 모든 코드 경로는 계약과 연결된 이유가 있어야 합니다."
      },
      {
        label: "Evaluate",
        title: "완료 전에 검증",
        body: "루프를 닫기 전에 기계적 검사와 사용자 관점 동작을 확인합니다.",
        signal: "확신보다 증거가 우선입니다."
      },
      {
        label: "Evolve",
        title: "Drift를 수정하고 반복",
        body: "검사가 실패하면 증거를 보존하고 acceptance criteria가 유지될 때까지 다음 반복을 조정합니다.",
        signal: "실패는 다음 반복을 위한 데이터로 기록됩니다."
      }
    ],
    guardrailsEyebrow: "가드레일",
    guardrailsTitle: "Ralph가 건너뛰지 않는 것",
    guardrails: [
      "제한된 계약 없는 구현 금지.",
      "검증 증거 없는 완료 주장 금지.",
      "실행 중 seed 조용한 재작성 금지.",
      "빌드 핵심 검증 전 배포 금지."
    ],
    evidenceEyebrow: "증거 레일",
    evidenceTitle: "Ralph가 검사 가능하게 남기는 산출물",
    evidenceColumns: {
      artifact: "산출물",
      purpose: "목적",
      state: "상태"
    },
    evidenceRows: [
      { artifact: "seed.yaml", purpose: "불변 작업 계약", state: "필수" },
      { artifact: "README update", purpose: "사용자 대상 운영 노트", state: "이번 변경 필수" },
      { artifact: "typecheck/build logs", purpose: "기계적 검증", state: "필수" },
      { artifact: "browser evidence", purpose: "페이지 동작 확인", state: "필수" },
      { artifact: "wiki report", purpose: "지속 프로젝트 메모리", state: "완료 후 기록" }
    ],
    handoffEyebrow: "핸드오프",
    handoffTitle: "끝까지 가야 하는 작업에 Ralph를 사용합니다",
    handoffBody:
      "Ralph는 제안에서 멈추면 안 되는 요청에 맞는 실행 레인입니다. 구현, 증거, 배포 작업을 같은 acceptance criteria에 묶어 둡니다.",
    handoffAction: "Ralph 맥락 검색",
    handoffQuery: "Ralph 완성 루프"
  },
  admin: {
    eyebrow: "관리",
    title: "ingest, 키 관리, 사용자, 비용을 한눈에 확인하고 운영합니다.",
    lede:
      "설정보다 운영 신호를 먼저 보여주는 콘솔입니다. 우선순위 항목을 첫 화면에 배치하고, 큐 상태와 모델 비용을 한눈에 파악할 수 있습니다.",
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
      keyGuard: "Provider 키 교체 정책에 관리자 전용 접근 제한이 아직 적용되지 않았습니다.",
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
