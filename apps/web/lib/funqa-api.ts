import {
  HealthResponseSchema,
  MonitoringSummarySchema,
  RagInspectResponseSchema,
  RagStatsResponseSchema,
  SearchResponseSchema
} from "./funqa-contracts";
import type { z } from "zod";

type SearchResponse = z.infer<typeof SearchResponseSchema>;

const defaultApiBaseUrl = "http://127.0.0.1:4300";
export const defaultTenantId = "demo";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl;
}

async function requestJson<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return schema.parse(payload);
  } catch {
    return null;
  }
}

export function getFunqaApiBaseUrl() {
  return getApiBaseUrl();
}

export async function fetchHealthSummary() {
  return requestJson("/v1/health", HealthResponseSchema);
}

export async function fetchMonitoringSummary() {
  return requestJson("/v1/monitoring/summary", MonitoringSummarySchema);
}

export async function fetchRagStats() {
  return requestJson("/v1/admin/rag/stats", RagStatsResponseSchema);
}

export async function searchWorkspace(query: string, tenantId = defaultTenantId, topK = 5) {
  if (query.trim().length < 3) {
    return null;
  }

  return requestJson<SearchResponse>("/v1/search", SearchResponseSchema, {
    method: "POST",
    body: JSON.stringify({
      tenantId,
      query,
      topK
    })
  });
}

export async function inspectRagPipeline(input: {
  query: string;
  tenantId?: string;
  topK?: number;
  preRerankK?: number;
  queryTransformMode?: "none" | "rewrite-local" | "hyde-local" | "hyde-genkit";
  rerankMode?: "none" | "rrf" | "heuristic" | "genkit-score";
}) {
  return requestJson("/v1/rag/inspect", RagInspectResponseSchema, {
    method: "POST",
    body: JSON.stringify({
      tenantId: input.tenantId ?? defaultTenantId,
      query: input.query,
      topK: input.topK ?? 5,
      preRerankK: input.preRerankK ?? 8,
      queryTransformMode: input.queryTransformMode ?? "rewrite-local",
      rerankMode: input.rerankMode ?? "heuristic"
    })
  });
}
