import Link from "next/link";
import { fetchHealthSummary } from "../lib/funqa-api";
import { getDictionary, resolveLocale, withLocale } from "../lib/i18n";
import { getRequestLocale } from "../lib/i18n-server";

type HomePageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  const t = getDictionary(locale);
  const health = await fetchHealthSummary();
  const isKo = locale === "ko";

  const copy = isKo
    ? {
        eyebrow: "FUNQA · VIDEO QUALITY ANALYSIS",
        headline: "영상에서 발견하고, 근거로 QA하세요.",
        lede: "영상 한 편을 넣으면 QA 시나리오, 장면 관찰, 타임코드 근거와 결과 지표를 하나의 검색 워크스페이스에서 검토할 수 있습니다.",
        primary: "영상 분석 시작",
        secondary: "게임 로그 검색",
        trust: "원본 영상은 브라우저에 유지 · 선택 프레임만 전송",
        sample: "샘플 분석",
        sampleTitle: "Dungeon run · build 42",
        finding: "보상 팝업 종료 후 입력 포커스가 복구되지 않음",
        scenarios: "QA 시나리오",
        analysis: "영상 분석",
        evidence: "타임코드 근거",
        score: "FunQA Score",
        passed: "통과",
        coverage: "커버리지",
        confidence: "근거 신뢰도",
        whyEyebrow: "분석 흐름",
        whyTitle: "전체 영상보다, 검증해야 할 순간을 먼저 보여줍니다.",
        steps: [
          { number: "01", title: "영상 선택", body: "브라우저에서 프레임을 추출하고 원본 파일은 로컬에 유지합니다." },
          { number: "02", title: "장면 검색", body: "텍스트 또는 영상 프레임으로 관련 구간을 찾아 타임코드에 연결합니다." },
          { number: "03", title: "QA 검토", body: "시나리오·관찰·근거를 비교하고 지원되는 지표만 한눈에 확인합니다." }
        ],
        capabilityEyebrow: "검증 가능한 출력",
        capabilityTitle: "예쁜 점수보다 실제 근거를 먼저 설계했습니다.",
        capabilities: [
          { label: "QA 시나리오", title: "실패 우선 테이블", body: "Passed, Failed, Blocked를 텍스트와 기호로 구분하고 첫 실패를 상단에 둡니다." },
          { label: "영상 분석", title: "플레이어와 결과 동기화", body: "시나리오 행과 프레임 마커를 선택하면 같은 타임코드 맥락을 유지합니다." },
          { label: "FunQA 지표", title: "샘플과 실측을 분리", body: "라이브 결과에서는 API가 실제로 반환한 장면 수, 상대 강도, 지연, 제외 장면만 표시합니다." }
        ],
        live: "서비스",
        ready: "검색 준비됨",
        limited: "상태 확인 중"
      }
    : {
        eyebrow: "FUNQA · VIDEO QUALITY ANALYSIS",
        headline: "Find it in video. QA it with evidence.",
        lede: "Add one video and review QA scenarios, scene observations, timestamp evidence, and result signals in a single search workspace.",
        primary: "Start video analysis",
        secondary: "Search game logs",
        trust: "Raw video stays in-browser · only selected frames are sent",
        sample: "Sample analysis",
        sampleTitle: "Dungeon run · build 42",
        finding: "Gameplay input did not recover after the reward dialog closed",
        scenarios: "QA scenarios",
        analysis: "Video analysis",
        evidence: "Timestamp evidence",
        score: "FunQA Score",
        passed: "Passed",
        coverage: "Coverage",
        confidence: "Evidence confidence",
        whyEyebrow: "Analysis flow",
        whyTitle: "See the moment that needs verification, not the whole recording.",
        steps: [
          { number: "01", title: "Choose video", body: "Frames are extracted in the browser while the source file stays local." },
          { number: "02", title: "Search scenes", body: "Use text or video frames to find relevant moments and bind them to timestamps." },
          { number: "03", title: "Review QA", body: "Compare scenarios, observations, evidence, and only the metrics the system supports." }
        ],
        capabilityEyebrow: "Verifiable output",
        capabilityTitle: "Evidence comes before decorative scores.",
        capabilities: [
          { label: "QA scenarios", title: "Failure-first table", body: "Passed, Failed, and Blocked use words and symbols, with the first failure promoted." },
          { label: "Video analysis", title: "Player-result sync", body: "Scenario rows and frame markers retain the same timestamp context." },
          { label: "FunQA signals", title: "Sample and live stay separate", body: "Live views show only API-observed scene count, relative strength, latency, and excluded scenes." }
        ],
        live: "Service",
        ready: "Search ready",
        limited: "Checking status"
      };

  const serviceReady = health?.status === "ok";

  return (
    <div className="vqa-home">
      <section className="vqa-home-hero">
        <div className="vqa-home-copy">
          <p className="vqa-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.headline}</h1>
          <p className="vqa-home-lede">{copy.lede}</p>
          <div className="vqa-home-actions">
            <Link className="vqa-home-primary" href={withLocale("/scene-search", locale)}>
              {copy.primary}<span aria-hidden="true">→</span>
            </Link>
            <Link className="vqa-home-secondary" href={withLocale("/search", locale)}>
              {copy.secondary}
            </Link>
          </div>
          <div className="vqa-home-trust">
            <span aria-hidden="true">◇</span>
            <span>{copy.trust}</span>
          </div>
        </div>

        <div className="vqa-home-product" aria-label={copy.sample}>
          <div className="vqa-home-product-bar">
            <span>{copy.sample}</span>
            <span>{copy.sampleTitle}</span>
            <span className={serviceReady ? "vqa-home-live vqa-home-live--ready" : "vqa-home-live"}>
              <i aria-hidden="true" /> {copy.live} · {serviceReady ? copy.ready : copy.limited}
            </span>
          </div>
          <div className="vqa-home-product-body">
            <div className="vqa-home-video">
              <img alt="" src="/assets/hero-bg.png" />
              <div className="vqa-home-video-time">00:48 / 01:36</div>
              <div className="vqa-home-video-marker" aria-hidden="true" />
            </div>
            <div className="vqa-home-score">
              <span>{copy.score}</span>
              <strong>76<small>/100</small></strong>
              <div className="vqa-home-metrics">
                <span><b>3/5</b>{copy.passed}</span>
                <span><b>80%</b>{copy.coverage}</span>
                <span><b>93%</b>{copy.confidence}</span>
              </div>
              <p>{copy.finding}</p>
            </div>
          </div>
          <div className="vqa-home-tabs">
            <span className="vqa-home-tab--active">{copy.scenarios}</span>
            <span>{copy.analysis}</span>
            <span>{copy.evidence}</span>
          </div>
          <div className="vqa-home-row">
            <span className="vqa-home-fail">!</span>
            <span><small>QA-04 · 00:48</small><strong>{copy.finding}</strong></span>
            <span>94%</span>
          </div>
        </div>
      </section>

      <section className="vqa-home-flow" aria-labelledby="vqa-home-flow-title">
        <div className="vqa-home-section-heading">
          <p className="vqa-eyebrow">{copy.whyEyebrow}</p>
          <h2 id="vqa-home-flow-title">{copy.whyTitle}</h2>
        </div>
        <ol>
          {copy.steps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <div><h3>{step.title}</h3><p>{step.body}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="vqa-home-capabilities" aria-labelledby="vqa-home-capabilities-title">
        <div className="vqa-home-section-heading">
          <p className="vqa-eyebrow">{copy.capabilityEyebrow}</p>
          <h2 id="vqa-home-capabilities-title">{copy.capabilityTitle}</h2>
        </div>
        <div className="vqa-home-capability-grid">
          {copy.capabilities.map((capability, index) => (
            <article key={capability.title}>
              <span>0{index + 1} · {capability.label}</span>
              <h3>{capability.title}</h3>
              <p>{capability.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
