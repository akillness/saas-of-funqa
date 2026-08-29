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
        eyebrow: "FUNQA · LIVE VIDEO QA",
        headline: "업로드한 영상만, 근거로 QA하세요.",
        lede: "원본 영상은 브라우저에 두고 선택 프레임만 Genkit으로 분석합니다. 캡션, QA 검토 후보, 검색 근거와 실행 이력을 한 화면에서 확인할 수 있습니다.",
        primary: "영상 분석 시작",
        secondary: "실제 게임 코퍼스",
        trust: "인증된 사용자별 저장소 · 실패한 캡션은 저장하지 않음",
        runtime: "실시간 처리 경로",
        ready: "Genkit 준비됨",
        limited: "Genkit 확인 필요",
        empty: "아직 분석 결과가 없습니다. 영상을 선택하면 실제 응답만 이 영역에 표시됩니다.",
        caption: "비전 캡션",
        embedding: "장면 임베딩",
        storage: "저장소",
        execution: "실행 모드",
        candidates: "QA 검토 후보",
        evidence: "장면 검색",
        trace: "작업 ID·실행 모드·모델·지연을 요청마다 구조화 로그로 남깁니다.",
        whyEyebrow: "실제 분석 흐름",
        whyTitle: "목업 대신 업로드한 영상의 관찰값만 보여줍니다.",
        steps: [
          {
            number: "01",
            title: "브라우저 프레임 추출",
            body: "원본 파일은 로컬에 두고 실제 영상 길이와 선택 프레임만 준비합니다."
          },
          {
            number: "02",
            title: "Genkit 분석",
            body: "Gemini가 프레임을 캡션하고 근거에 연결된 QA 검토 후보와 검색 벡터를 만듭니다."
          },
          {
            number: "03",
            title: "격리 저장·검색",
            body: "Firebase 인증 UID로 저장소를 분리하고 같은 사용자 데이터만 검색합니다."
          }
        ],
        capabilityEyebrow: "검증 가능한 출력",
        capabilityTitle: "자동 판정보다 근거와 실행 경계를 먼저 설계했습니다.",
        capabilities: [
          {
            label: "QA 후보",
            title: "판정 없는 검토 목록",
            body: "Genkit이 관찰 프레임에 연결한 확인 항목만 만들고 pass/fail이나 가짜 신뢰도는 생성하지 않습니다."
          },
          {
            label: "영상 분석",
            title: "플레이어와 근거 동기화",
            body: "캡션, 검색 결과, 프레임 마커가 같은 실제 타임코드를 공유합니다."
          },
          {
            label: "관측성",
            title: "작업별 실행 출처",
            body: "응답과 Cloud Logging에 operation ID, live Genkit 여부, 모델, 지연, 실패 코드를 기록합니다."
          }
        ]
      }
    : {
        eyebrow: "FUNQA · LIVE VIDEO QA",
        headline: "QA only what you upload, with evidence.",
        lede: "Keep the source video in the browser and send selected frames to Genkit. Review captions, grounded QA candidates, search evidence, and execution provenance in one workspace.",
        primary: "Start video analysis",
        secondary: "Browse the real game corpus",
        trust: "Per-user authenticated storage · failed captions are never stored",
        runtime: "Live processing path",
        ready: "Genkit ready",
        limited: "Genkit needs attention",
        empty:
          "There is no analysis yet. This area shows only real responses after you choose a video.",
        caption: "Vision caption",
        embedding: "Scene embedding",
        storage: "Storage",
        execution: "Execution mode",
        candidates: "QA review candidates",
        evidence: "Scene search",
        trace:
          "Every request records an operation ID, execution mode, model, latency, and outcome as a structured log.",
        whyEyebrow: "Live analysis flow",
        whyTitle: "Show only observed values from uploaded video, never mock results.",
        steps: [
          {
            number: "01",
            title: "Extract frames in-browser",
            body: "The source file stays local while the browser captures real duration and selected frames."
          },
          {
            number: "02",
            title: "Analyze with Genkit",
            body: "Gemini captions frames and creates grounded QA review candidates plus search vectors."
          },
          {
            number: "03",
            title: "Store and search in isolation",
            body: "Firebase auth binds storage to the user UID so only that workspace can be searched."
          }
        ],
        capabilityEyebrow: "Verifiable output",
        capabilityTitle: "Evidence and execution boundaries come before automatic verdicts.",
        capabilities: [
          {
            label: "QA candidates",
            title: "Review list without verdicts",
            body: "Genkit proposes checks tied to observed frames without inventing pass/fail states or confidence scores."
          },
          {
            label: "Video analysis",
            title: "Player-evidence sync",
            body: "Captions, search results, and frame markers share the same real timestamps."
          },
          {
            label: "Observability",
            title: "Per-operation provenance",
            body: "Responses and Cloud Logging record operation ID, live Genkit mode, model, latency, and failure code."
          }
        ]
      };

  const serviceReady = health?.scene.status === "ready";

  return (
    <div className="vqa-home">
      <section className="vqa-home-hero">
        <div className="vqa-home-copy">
          <p className="vqa-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.headline}</h1>
          <p className="vqa-home-lede">{copy.lede}</p>
          <div className="vqa-home-actions">
            <Link className="vqa-home-primary" href={withLocale("/scene-search", locale)}>
              {copy.primary}
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="vqa-home-secondary" href={withLocale("/corpus", locale)}>
              {copy.secondary}
            </Link>
          </div>
          <div className="vqa-home-trust">
            <span aria-hidden="true">◇</span>
            <span>{copy.trust}</span>
          </div>
        </div>

        <div className="vqa-home-product" aria-label={copy.runtime}>
          <div className="vqa-home-product-bar">
            <span>{copy.runtime}</span>
            <span>{health?.scene.captionModel ?? "—"}</span>
            <span className={serviceReady ? "vqa-home-live vqa-home-live--ready" : "vqa-home-live"}>
              <i aria-hidden="true" /> {serviceReady ? copy.ready : copy.limited}
            </span>
          </div>
          <div className="vqa-home-product-body">
            <div className="vqa-home-video vqa-home-runtime">
              <dl>
                <div>
                  <dt>{copy.caption}</dt>
                  <dd>{health?.scene.captionModel ?? "—"}</dd>
                </div>
                <div>
                  <dt>{copy.embedding}</dt>
                  <dd>{health?.scene.embeddingModel ?? "—"}</dd>
                </div>
                <div>
                  <dt>{copy.storage}</dt>
                  <dd>{health?.scene.storePath ?? "—"}</dd>
                </div>
              </dl>
            </div>
            <div className="vqa-home-score">
              <span>{copy.execution}</span>
              <strong>{health?.scene.executionMode ?? "—"}</strong>
              <p>{copy.empty}</p>
            </div>
          </div>
          <div className="vqa-home-tabs">
            <span className="vqa-home-tab--active">{copy.caption}</span>
            <span>{copy.candidates}</span>
            <span>{copy.evidence}</span>
          </div>
          <div className="vqa-home-row">
            <span className="vqa-home-live vqa-home-live--ready" aria-hidden="true">
              ◇
            </span>
            <span>
              <small>scene_operation</small>
              <strong>{copy.trace}</strong>
            </span>
            <span>
              {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString(locale) : "—"}
            </span>
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
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
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
              <span>
                0{index + 1} · {capability.label}
              </span>
              <h3>{capability.title}</h3>
              <p>{capability.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
