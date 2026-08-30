export const koMessages = {
  common: {
    localeLabel: "언어",
    localeNames: {
      en: "English",
      ko: "한국어"
    }
  },
  layout: {
    skipToContent: "본문으로 건너뛰기",
    brandEyebrow: "AI 미디어 검색엔진",
    nav: {
      overview: "홈",
      sceneLab: "영상 QA",
      vectorIndex: "벡터 인덱스",
      corpus: "게임 코퍼스",
      ragLab: "RAG 랩",
      admin: "관리",
      docs: "API 문서",
      login: "로그인"
    }
  },
  vectorIndex: {
    eyebrow: "FUNQA · VECTOR INDEX",
    title: "영상과 FunQA 근거 데이터를 페어링해 인덱싱합니다.",
    lede: "서로 맞는 영상과 FunQA 분석 JSON을 고르면 브라우저가 근거 타임코드의 프레임을 추출하고, 서버가 이미지·캡션·분석 근거를 하나의 Gemini Embedding 2 벡터로 저장합니다.",
    boundary:
      "원본 영상 파일은 업로드되지 않습니다. 서버로 가는 것은 추출된 프레임 이미지와 메타데이터뿐입니다.",
    storeTitle: "저장소 현황",
    documents: "인덱싱된 영상",
    scenes: "저장된 장면",
    capacity: "테넌트 용량",
    embeddingMode: "임베딩 모드",
    modeUnknown: "인덱싱 후 확인",
    uploadTitle: "1 · 영상 올리기",
    uploadHint: "MP4 · WebM · MOV · 브라우저가 재생할 수 있는 형식",
    chooseFile: "영상 선택",
    replaceFile: "영상 교체",
    dropHere: "여기에 영상을 놓으세요",
    noFile: "선택된 영상 없음",
    analysisTitle: "2 · FunQA 분석 페어링",
    analysisHint:
      "이 영상에서 생성된 JSON을 선택하세요. 파일명과 영상 길이를 검증한 뒤에만 인덱싱합니다.",
    chooseAnalysis: "분석 JSON 선택",
    replaceAnalysis: "분석 JSON 교체",
    analysisRequired: "일치하는 FunQA 분석 JSON이 필요합니다.",
    analysisReady: "분석 페어링 완료",
    extracting: "프레임 추출 중…",
    framesReady: "개 프레임 준비됨",
    indexTitle: "3 · 페어 장면 인덱싱",
    submit: "벡터로 저장",
    submitting: "캡션 생성 + 임베딩 중…",
    loginRequired: "장면 인덱싱은 비용 보호를 위해 로그인이 필요합니다.",
    successTitle: "벡터 저장 완료",
    contractTitle: "장면 하나당 저장되는 것",
    contractItems: [
      "프레임 이미지와 정확한 근거 타임코드",
      "비전 모델이 독립적으로 생성한 장면 캡션",
      "페어링된 FunQA 분석 근거와 출처",
      "이미지·캡션·근거를 합친 Gemini Embedding 2 벡터 하나",
      "임베딩 모델·차원(다른 공간은 검색에서 제외됨)"
    ],
    storageNote:
      "저장 위치는 배포 환경에 따라 Firestore(sceneFrames/{tenant}/scenes) 또는 로컬 JSON 스토어입니다. 외부 벡터 DB를 따로 두지 않고 유사도는 서버에서 계산합니다.",
    libraryTitle: "인덱싱된 영상",
    libraryEmpty: "아직 저장된 영상이 없습니다.",
    refresh: "새로고침",
    columnTitle: "제목",
    columnScenes: "장면",
    columnDuration: "길이",
    columnCreated: "저장일",
    searchCta: "영상 QA에서 검색하기 →",
    capacityNote: "테넌트당 최대 {max}장면",
    frameCountLabel: "추출 프레임",
    titleLabel: "문서 제목",
    titlePlaceholder: "예: 던전 탐험 플레이 하이라이트",
    descriptionLabel: "설명 (선택)",
    descriptionPlaceholder: "검색에 도움이 될 맥락",
    capacityFull: "저장소가 가득 찼습니다. 기존 장면을 정리한 뒤 다시 시도하세요."
  },
  sceneLab: {
    eyebrow: "영상 QA 분석 워크스페이스",
    title: "영상 QA 분석",
    lede: "영상 프레임, 장면 캡션, 검색 근거와 처리 지표를 타임코드 중심의 분석 흐름으로 검토합니다.",
    ingest: {
      // 2단계: 등록은 로그인 게이트 + 비용 보호가 걸려 있어, 검색과 결과 아래로 내렸다.
      title: "2 · 영상 문서 등록",
      // 기본 접힘 — 비로그인 방문자는 이 패널을 아예 사용할 수 없다.
      panelSummary: "영상 문서 등록하기 (로그인 필요)",
      videoLabel: "영상 파일",
      videoHint: "mp4 · webm · mov 등 브라우저가 재생 가능한 영상",
      titleLabel: "문서 제목",
      titlePlaceholder: "예: 던전 탐험 플레이 하이라이트",
      descriptionLabel: "설명 (선택)",
      descriptionPlaceholder: "장면 검색에 도움이 될 맥락을 적어주세요",
      frameCountLabel: "추출 프레임",
      extracting: "프레임 추출 중…",
      framesReady: "개 프레임 준비됨",
      submit: "장면 인덱싱",
      submitting: "캡션 생성 + 임베딩 중…",
      loginRequired: "장면 등록은 로그인이 필요합니다 (비용 보호).",
      successTitle: "인덱싱 완료",
      captionsTitle: "생성된 장면 캡션",
      errorGeneric: "인덱싱에 실패했습니다. 잠시 후 다시 시도해주세요.",
      errorUnavailable:
        "임베딩 제공자가 일시적으로 응답하지 않습니다. 저장된 내용은 없습니다 — 잠시 후 다시 시도해주세요.",
      errorUnavailableRetry:
        "임베딩 제공자가 일시적으로 응답하지 않습니다. 저장된 내용은 없습니다 — 약 {seconds}초 후 다시 시도해주세요."
    },
    search: {
      // 검색이 1단계다. 등록은 로그인 전용이라 비로그인 방문자는 검색만 쓸 수 있고,
      // 서수 라벨이 렌더 순서와 어긋나면 시간 역전으로 읽힌다.
      title: "1 · 장면 검색",
      queryLabel: "텍스트 쿼리",
      queryPlaceholder: "예: 보라색 배경의 전투 장면",
      videoLabel: "영상 쿼리 (선택)",
      videoHint: "짧은 클립을 올리면 대표 프레임으로 유사 장면을 찾습니다",
      clearVideo: "영상 쿼리 제거",
      submit: "검색",
      searching: "검색 중…",
      needInput: "텍스트나 영상 중 하나는 입력해주세요.",
      modeText: "텍스트",
      modeVideo: "영상",
      modeHybrid: "하이브리드",
      resultsTitle: "유사 장면 결과",
      // 기존에 한 문장으로 뭉쳐 있던 세 상태를 구분한다.
      // (a) 아직 검색하지 않음 — 알릴 결과가 없다.
      idleHint: "검색을 실행하면 유사 장면이 표시됩니다.",
      // (b) 인덱스 자체가 비어 있음 — 쿼리는 정상이고 비교할 대상이 없다.
      // 모바일에서 등록 패널이 한참 아래에 있으므로 페이지 내 앵커를 함께 준다.
      emptyIndex: "아직 인덱싱된 장면이 없어 비교할 대상이 없습니다.",
      emptyIndexCta: "“영상 문서 등록”으로 이동 →",
      // (c) 장면은 있지만 매칭되지 않음. 무엇을 보냈는지 보이도록 쿼리를 에코한다.
      noMatchEcho: "“{query}”와 일치하는 장면이 없습니다.",
      noMatch: "이 쿼리와 일치하는 장면이 없습니다.",
      queryCaptionsTitle: "쿼리 프레임 해석",
      similarity: "유사도",
      // 결과 개수가 바뀔 때 스크린리더에 알린다. 기존에는 알림이 아예 없었다.
      resultsCount: "{count}개의 유사 장면을 찾았습니다.",
      resultsCountOne: "1개의 유사 장면을 찾았습니다.",
      // 1위 카드가 "#1"과 confidence 배지로 같은 정보를 두 번 말하던 것을 정리한다.
      bestMatch: "가장 근접",
      // 서버가 절대 하한(0.45)을 적용하므로 1위도 "low"일 수 있다.
      // 그 경우 "가장 근접"만 보여주면 좋은 매칭처럼 읽힌다.
      bestMatchWeak: "가장 근접 — 약한 매칭",
      rankLabel: "{rank}위",
      confidenceHigh: "신뢰도 높음",
      confidenceMedium: "신뢰도 보통",
      confidenceLow: "약함",
      weakTopNote: "가장 근접한 장면조차 신뢰 기준선 아래입니다. 관련 없는 결과로 보세요.",
      // 다른 임베딩 공간에 인덱싱된 장면은 이 쿼리와 비교 자체가 불가능하다.
      // "그냥 안 맞음"과 "인덱스가 낡음"을 구분해준다.
      unscoreableNotice:
        "다른 모델로 임베딩되어 순위에서 제외된 장면이 {count}개 있습니다. 재인덱싱이 필요합니다.",
      unscoreableNoticeOne:
        "다른 모델로 임베딩되어 순위에서 제외된 장면이 1개 있습니다. 재인덱싱이 필요합니다.",
      // 바는 1위 대비 상대 강도를 나타낸다. 원시 코사인 중 쿼리 모드 간
      // 비교가 가능한 부분은 이것뿐이다.
      matchBarLabel: "1위 대비 매칭 강도",
      // 원시 수치는 카드 전면에서 빼고 운영자용으로 남겨둔다.
      rawScoreSummary: "원시 점수",
      rawScoreLabel: "코사인 유사도",
      rawRelativeLabel: "1위 대비",
      // 의도적으로 수치를 넣지 않는다. 초안에 "0.47–0.62 대 0.87"을 적었으나
      // 하루 만에 틀린 값이 됐다. 범위는 신호별로 다르고, 0.87은 쿼리 프레임이
      // 인덱싱된 프레임과 바이트 단위로 동일한 경우여서 아무것도 측정하지 않았다.
      // 점수 범위 하드코딩은 이 페이지가 이미 겪은 모델명 하드코딩과 같은 함정이다.
      rawScoreNote:
        "이 결과 목록 안에서만 비교할 수 있는 값입니다. 어떤 신호가 매칭됐는지에 따라 달라지므로 쿼리가 바뀌면 같은 값도 다른 의미가 됩니다. 수치보다 순위와 신뢰도를 보세요.",
      captionExpand: "캡션 전체 보기",
      captionCollapse: "접기",
      errorGeneric: "검색에 실패했습니다. 잠시 후 다시 시도해주세요.",
      // API의 503: 임베딩 제공자 장애로 결과가 무의미해진 상태.
      // 재시도하면 되므로 일반 실패와 구분한다.
      errorUnavailable:
        "임베딩 제공자가 일시적으로 응답하지 않아 결과가 무의미합니다. 잠시 후 다시 시도해주세요.",
      errorUnavailableRetry:
        "임베딩 제공자가 일시적으로 응답하지 않습니다. 약 {seconds}초 후 다시 시도해주세요.",
      retryNow: "검색 다시 시도"
    },
    library: {
      title: "등록된 영상 문서",
      empty: "아직 등록된 영상 문서가 없습니다.",
      scenes: "장면",
      refresh: "새로고침"
    },
    meta: {
      embeddingModel: "임베딩 모델",
      captionModel: "캡션 모델",
      queryMode: "쿼리 모드",
      totalScenes: "전체 장면",
      took: "소요",
      // 응답이 실제 모델을 보고할 때까지 헤더 칩에 표시된다.
      // 의도적으로 모델명을 쓰지 않는다 — 기존에 하드코딩된 모델명이
      // 배포된 백엔드와 어긋나 있었다.
      embeddingModelUnknown: "임베딩 모델: 확인 중",
      captionModelUnknown: "캡션 모델: 확인 중"
    }
  },
  admin: {
    eyebrow: "관리",
    title: "실시간 런타임 관측",
    lede: "배포 API, Genkit 장면 런타임, 영구 저장소가 실제로 보고한 값만 확인합니다."
  },
  docs: {
    title: "API 문서",
    navLabel: "API 섹션",
    notesTitle: "참고 노트",
    eyebrow: "관리자 API 참고 문서",
    heroTitle: "인증하고, 업로드 영상을 색인하고, 근거가 있는 장면을 검색합니다.",
    lede: "Firebase 사용자가 워크스페이스 경계를 소유합니다. Genkit이 업로드 프레임을 캡션하고, 임베딩으로 색인하며, 모든 장면 작업에 런타임 출처를 반환합니다.",
    sections: [
      { id: "overview", label: "개요", title: "개요" },
      { id: "auth", label: "인증", title: "인증" },
      { id: "quickstart", label: "빠른 시작", title: "빠른 시작" },
      { id: "endpoints", label: "엔드포인트", title: "엔드포인트" },
      { id: "errors", label: "오류", title: "오류" },
      { id: "limits", label: "제한", title: "속도 제한" }
    ],
    overviewBody:
      "장면 API는 샘플링한 영상 프레임을 받고, Genkit으로 캡션과 QA 검토 후보를 생성하며, 같은 임베딩 공간에 저장한 뒤 operation ID가 포함된 근거를 반환합니다.",
    authBody:
      "Firebase ID 토큰을 전송합니다. 장면 검색은 관리자 운영 공유 코퍼스를 읽고, 인덱싱·운영 API는 관리자 역할을 추가로 요구합니다.",
    quickstartSteps: [
      "Google로 로그인하고 Firebase ID 토큰을 획득합니다.",
      "관리자는 영상·분석 근거를 페어링하고 대표 JPEG 프레임을 /v1/scenes/ingest로 전송합니다.",
      "모든 로그인 사용자는 검증된 공유 코퍼스를 텍스트, 질의 프레임 또는 두 입력의 조합으로 검색합니다."
    ],
    endpointsTable: {
      method: "메서드",
      path: "경로",
      purpose: "목적",
      rows: [
        ["GET", "/v1/health", "최소 공개 생존 상태"],
        ["GET", "/v1/admin/health", "관리자: 런타임, 모델, 임베딩 차원, 저장소 상태"],
        ["POST", "/v1/scenes/ingest", "관리자: 페어링된 영상 프레임을 캡션하고 색인"],
        ["POST", "/v1/scenes/search", "텍스트, 프레임 또는 하이브리드 질의로 장면 검색"],
        ["GET", "/v1/scenes/documents", "관리자: 공유 코퍼스 문서 목록"],
        ["DELETE", "/v1/scenes/documents/:documentId", "관리자: 공유 코퍼스 문서 삭제"],
        ["GET", "/v1/monitoring/summary", "관리자: 인스턴스 범위 요청 관측값 조회"],
        ["POST", "/v1/rag/inspect", "관리자: 인증된 검색 파이프라인 점검"]
      ]
    },
    errorsBody:
      "검증 오류는 필드 단위 메시지를 반환합니다. 인증 누락은 401/403, Genkit 생성 장애는 템플릿 근거를 저장하지 않고 503을 반환합니다.",
    limitsBody:
      "관리자 전용 장면 색인은 요청당 최대 16개 프레임과 5MB JSON 본문 제한을 적용하며 공유 코퍼스에 서버 속도 제한을 적용합니다.",
    notes: [
      {
        label: "인증",
        text: "장면 검색은 로그인, 코퍼스 쓰기와 운영 API는 관리자 역할이 필요합니다."
      },
      { label: "근거 경계", text: "QA 후보는 검토 질문이며 생성된 pass/fail 판정이 아닙니다." },
      { label: "관측성", text: "응답과 Cloud Logging이 같은 operationId를 공유합니다." }
    ]
  },
  login: {
    eyebrow: "인증",
    title: "Google로 로그인해 검색 워크스페이스와 운영 콘솔에 진입합니다.",
    lede: "최종 사용자는 저장된 검색과 citation을 보고, 관리자는 ingest 제어, 모델 키 설정, 사용량 텔레메트리도 함께 봅니다.",
    continueTitle: "Google로 계속",
    continueBody:
      "워크스페이스 로그인으로 저장된 검색, 근거 기반 citation, 관리자 제어, 감사 가능한 provider key 작업이 열립니다.",
    continueButton: "Google로 계속",
    continueNote:
      "Firebase Auth가 검색 접근을 검증하고 서버가 코퍼스 변경을 관리자에게만 허용합니다.",
    trustTitle: "신뢰 경계",
    trustItems: [
      "워크스페이스 정책에서 허용된 Google 계정이 필요합니다.",
      "관리자 권한은 로그인 후 서버 측에서 부여됩니다.",
      "Provider API key는 브라우저 저장소에 저장되지 않습니다."
    ]
  }
} as const;
