import "server-only";

import { GameLogSearchUpstreamHealthSchema } from "@funqa/contracts";

import {
  FIRST_BYTE_TIMEOUT_MS,
  createProxyHealth,
  createUnavailableHealth,
  getGameLogSearchServiceUrl
} from "@/app/api/game-log-search/_shared";
import {
  createGenkitHealth,
  resolveGameLogSearchEngine
} from "@/app/api/game-log-search/_genkit-engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (resolveGameLogSearchEngine() === "genkit") {
    return Response.json(createGenkitHealth(), {
      status: 200,
      headers: { "cache-control": "no-store" }
    });
  }

  const upstreamUrl = getGameLogSearchServiceUrl("/health");
  if (!upstreamUrl) {
    return Response.json(createUnavailableHealth("service_url_unconfigured"), {
      status: 200,
      headers: { "cache-control": "no-store" }
    });
  }

  const controller = new AbortController();
  const abortUpstream = () => controller.abort(request.signal.reason);
  request.signal.addEventListener("abort", abortUpstream, { once: true });
  if (request.signal.aborted) {
    abortUpstream();
  }
  const timeout = setTimeout(() => controller.abort("connection_timeout"), FIRST_BYTE_TIMEOUT_MS);

  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal
    });

    if (!response.ok) {
      return Response.json(createUnavailableHealth("retrieval_503"), {
        status: 200,
        headers: { "cache-control": "no-store" }
      });
    }

    const upstream = GameLogSearchUpstreamHealthSchema.parse(await response.json());
    return Response.json(createProxyHealth(upstream), {
      status: 200,
      headers: { "cache-control": "no-store" }
    });
  } catch (error) {
    const reason = controller.signal.reason === "connection_timeout" ? "connection_timeout" : "connection_refused";
    return Response.json(createUnavailableHealth(reason), {
      status: 200,
      headers: { "cache-control": "no-store" }
    });
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abortUpstream);
  }
}
