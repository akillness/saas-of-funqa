import Link from "next/link";
import { requireServerAdmin } from "@/lib/server-admin";
import { resolveLocale, withLocale } from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n-server";

type RagLabPageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function RagLabPage({ searchParams }: RagLabPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  await requireServerAdmin(locale, "/rag-lab");
  const isKo = locale === "ko";

  const copy = isKo
    ? {
        eyebrow: "RAG LAB · LIVE DATA ONLY",
        title: "빈 인덱스는 빈 결과로 남깁니다.",
        lede: "이 화면은 더 이상 가격 정책이나 보안 문서를 자동 주입하지 않습니다. 인증된 워크스페이스에 실제 문서가 있을 때만 RAG 검사를 실행합니다.",
        state: "데모 데이터 제거됨",
        body: "현재 공개 화면에서는 테넌트 문서나 과거 fixture 평가를 실제 운영 결과처럼 렌더링하지 않습니다. 영상 장면 분석은 인증된 Genkit 워크스페이스에서 바로 사용할 수 있습니다.",
        primary: "영상 QA 열기",
        secondary: "벡터 인덱스 열기",
        contract: "운영 계약",
        items: [
          "문서 0건이면 검색 결과도 0건입니다.",
          "RAG inspect API는 Firebase 인증 UID로 테넌트를 결정합니다.",
          "체크인된 평가 fixture는 라이브 릴리스 상태로 표시하지 않습니다."
        ]
      }
    : {
        eyebrow: "RAG LAB · LIVE DATA ONLY",
        title: "An empty index stays empty.",
        lede: "This surface no longer injects pricing or security documents. RAG inspection runs only when an authenticated workspace has real documents.",
        state: "Demo data removed",
        body: "The public page no longer presents tenant documents or historical fixture evaluations as live operations. Uploaded video analysis remains available in the authenticated Genkit workspace.",
        primary: "Open video QA",
        secondary: "Open vector index",
        contract: "Runtime contract",
        items: [
          "Zero documents means zero retrieved results.",
          "The RAG inspect API derives tenant ownership from Firebase auth UID.",
          "Checked-in evaluation fixtures are never shown as current release state."
        ]
      };

  return (
    <>
      <div className="vqa-rag-empty">
        <header className="vqa-header">
          <div>
            <p className="vqa-eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p className="vqa-lede">{copy.lede}</p>
          </div>
          <div className="vqa-boundary-note">
            <span className="vqa-boundary-icon" aria-hidden="true">
              ◇
            </span>
            <p>{copy.state}</p>
          </div>
        </header>

        <section className="vqa-rag-empty-grid">
          <article className="vqa-admin-panel">
            <h2>{copy.state}</h2>
            <p>{copy.body}</p>
            <div className="vqa-tool-actions">
              <Link className="primary-button" href={withLocale("/scene-search", locale)}>
                {copy.primary}
              </Link>
              <Link className="secondary-button" href={withLocale("/vector-index", locale)}>
                {copy.secondary}
              </Link>
            </div>
          </article>
          <article className="vqa-admin-panel">
            <h2>{copy.contract}</h2>
            <ol>
              {copy.items.map((item, index) => (
                <li key={item}>
                  <span>0{index + 1}</span>
                  <p>{item}</p>
                </li>
              ))}
            </ol>
          </article>
        </section>
      </div>
    </>
  );
}
