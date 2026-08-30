import { HealthResponseSchema, RagStatsResponseSchema } from "@funqa/contracts";
import type { z } from "zod";

export type HealthSummary = z.infer<typeof HealthResponseSchema>;

const defaultApiBaseUrl = "http://127.0.0.1:4300";

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

export async function fetchHealthSummary(idToken: string) {
  return requestJson("/v1/admin/health", HealthResponseSchema, {
    headers: { Authorization: `Bearer ${idToken}` }
  });
}

export async function fetchRagStats(idToken: string) {
  return requestJson("/v1/admin/rag/stats", RagStatsResponseSchema, {
    headers: { Authorization: `Bearer ${idToken}` }
  });
}
