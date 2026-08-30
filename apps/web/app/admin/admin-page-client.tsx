"use client";

import { MonitoringSummarySchema, type MonitoringSummary } from "@funqa/contracts";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { getFunqaApiBaseUrl, type HealthSummary } from "@/lib/funqa-api";
import type { Locale, Messages } from "@/lib/i18n";
import { AdminRagStats } from "./admin-rag-stats";

type AdminPageClientProps = {
  health: HealthSummary | null;
  locale: Locale;
  t: Messages["admin"];
};

export function AdminPageClient({ health, locale, t }: AdminPageClientProps) {
  const { user, isAdmin } = useAuth();
  const [monitoring, setMonitoring] = useState<MonitoringSummary | null>(null);
  const isKo = locale === "ko";

  useEffect(() => {
    if (!user || !isAdmin) return;
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`${getFunqaApiBaseUrl()}/v1/monitoring/summary`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${await user.getIdToken()}` }
        });
        if (!response.ok || !active) return;
        const parsed = MonitoringSummarySchema.safeParse(await response.json());
        if (parsed.success && active) setMonitoring(parsed.data);
      } catch {
        // Keep unavailable state explicit when monitoring cannot be read.
      }
    })();
    return () => {
      active = false;
    };
  }, [isAdmin, user]);

  const copy = isKo
    ? {
        observed: "관측된 값만 표시",
        unavailable: "확인 불가",
        noObservations: "관측 없음",
        successRate: "성공률",
        p95: "P95 지연",
        requests: "현재 인스턴스 요청",
        sceneRuntime: "장면 Genkit 런타임",
        execution: "실행 모드",
        caption: "캡션 모델",
        embedding: "임베딩 모델",
        dimension: "벡터 차원",
        store: "장면 저장소",
        ragStore: "RAG 저장소",
        ragDocuments: "RAG 문서",
        ragChunks: "RAG 청크",
        telemetryBoundary: "모니터링 경계",
        telemetryBody:
          "이 숫자는 현재 Functions 인스턴스가 시작된 뒤 관측한 요청만 집계합니다. 장면 업로드와 검색은 별도로 구조화된 scene_operation 로그를 Cloud Logging에 남깁니다.",
        generated: "생성 시각",
        healthChecked: "상태 확인 시각",
        runtimeReady: "준비됨",
        runtimeDegraded: "점검 필요"
      }
    : {
        observed: "Observed values only",
        unavailable: "Unavailable",
        noObservations: "No observations",
        successRate: "Success rate",
        p95: "P95 latency",
        requests: "Current-instance requests",
        sceneRuntime: "Scene Genkit runtime",
        execution: "Execution mode",
        caption: "Caption model",
        embedding: "Embedding model",
        dimension: "Vector dimension",
        store: "Scene store",
        ragStore: "RAG store",
        ragDocuments: "RAG documents",
        ragChunks: "RAG chunks",
        telemetryBoundary: "Monitoring boundary",
        telemetryBody:
          "These numbers cover only requests observed since the current Functions instance started. Scene ingest and search also emit structured scene_operation events to Cloud Logging.",
        generated: "Generated at",
        healthChecked: "Health checked",
        runtimeReady: "Ready",
        runtimeDegraded: "Needs attention"
      };

  const metrics = [
    {
      label: copy.successRate,
      value:
        monitoring?.successRate === null || monitoring?.successRate === undefined
          ? copy.noObservations
          : `${(monitoring.successRate * 100).toFixed(1)}%`,
      ok: monitoring?.successRate !== null && monitoring?.successRate !== undefined
    },
    {
      label: copy.p95,
      value:
        monitoring?.p95LatencyMs === null || monitoring?.p95LatencyMs === undefined
          ? copy.noObservations
          : `${monitoring.p95LatencyMs}ms`,
      ok: monitoring?.p95LatencyMs !== null && monitoring?.p95LatencyMs !== undefined
    },
    {
      label: copy.requests,
      value: monitoring ? String(monitoring.totalRequestsDay) : copy.unavailable,
      ok: Boolean(monitoring)
    },
    {
      label: copy.sceneRuntime,
      value: health
        ? health.scene.status === "ready"
          ? copy.runtimeReady
          : copy.runtimeDegraded
        : copy.unavailable,
      ok: health?.scene.status === "ready"
    }
  ];

  const runtimeRows = [
    [copy.execution, health?.scene.executionMode],
    [copy.caption, health?.scene.captionModel],
    [copy.embedding, health?.scene.embeddingModel],
    [copy.dimension, health ? String(health.scene.embeddingDimension) : null],
    [copy.store, health?.scene.storePath],
    [copy.ragStore, health?.rag.storePath]
  ];

  return (
    <>
      <div className="vqa-admin-live">
        <header className="vqa-header">
          <div>
            <p className="vqa-eyebrow">{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p className="vqa-lede">{t.lede}</p>
          </div>
          <div className="vqa-boundary-note">
            <span className="vqa-boundary-icon" aria-hidden="true">
              ◇
            </span>
            <p>{copy.observed}</p>
          </div>
        </header>

        <section aria-label={copy.observed} className="vqa-admin-metrics">
          {metrics.map((metric) => (
            <article className="vqa-admin-metric" key={metric.label}>
              <span
                className={metric.ok ? "vqa-admin-signal vqa-admin-signal--ok" : "vqa-admin-signal"}
                aria-hidden="true"
              />
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <section className="vqa-admin-grid">
          <article className="vqa-admin-panel">
            <h2>{copy.sceneRuntime}</h2>
            <dl>
              {runtimeRows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value ?? copy.unavailable}</dd>
                </div>
              ))}
              <AdminRagStats
                documentLabel={copy.ragDocuments}
                chunkLabel={copy.ragChunks}
                unavailable={copy.unavailable}
              />
            </dl>
            <p className="vqa-admin-timestamp">
              {copy.healthChecked}:{" "}
              {health?.timestamp
                ? new Date(health.timestamp).toLocaleString(locale)
                : copy.unavailable}
            </p>
          </article>

          <article className="vqa-admin-panel">
            <h2>{copy.telemetryBoundary}</h2>
            <p>{copy.telemetryBody}</p>
            <dl>
              <div>
                <dt>scope</dt>
                <dd>{monitoring?.scope ?? copy.unavailable}</dd>
              </div>
              <div>
                <dt>{copy.generated}</dt>
                <dd>
                  {monitoring?.generatedAt
                    ? new Date(monitoring.generatedAt).toLocaleString(locale)
                    : copy.unavailable}
                </dd>
              </div>
              <div>
                <dt>scene log event</dt>
                <dd>
                  <code>scene_operation</code>
                </dd>
              </div>
            </dl>
          </article>
        </section>
      </div>
    </>
  );
}
