"use client";

import {
  GameLogSearchHealthSchema,
  GameLogSearchRequestSchema,
  GameLogSearchScopeDeltaSchema,
  GameLogSearchScopeSchema,
  GameLogSearchTerminalSchema,
  type GameLogSearchCancelAck,
  type GameLogEvidence,
  type GameLogSearchFrame,
  type GameLogSearchHealth,
  type GameLogSearchOutcome,
  type GameLogSearchRequest,
  type GameLogSearchRunStatus,
  type GameLogSearchScope,
  type GameLogSearchScopeDelta,
  type GameLogSearchStage,
  type GameLogSearchTerminal
} from "@funqa/contracts";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  cancelGameLogSearch,
  createUuidV7,
  getGameLogSearchHealth,
  streamGameLogSearch
} from "@/lib/game-log-search-client";

export type GameLogSearchPhase = "idle" | "loading" | "stopping" | "stopped" | "completed";

const INITIAL_HEALTH_CHECKED_AT = "1970-01-01T00:00:00.000Z";

export type GameLogSearchDispatchRecord = {
  query_id: string;
  parent_query_id: string | null;
  correlation_id: string;
  query_text: string;
  run_status: GameLogSearchRunStatus;
  outcome: GameLogSearchOutcome | null;
  scope_delta: GameLogSearchScopeDelta;
  started_at: string;
};

function normalized(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

export function createScopeDelta(
  inheritedScope: GameLogSearchScope | null,
  childScope: GameLogSearchScope
): GameLogSearchScopeDelta {
  if (!inheritedScope) {
    return GameLogSearchScopeDeltaSchema.parse({
      changed: false,
      entity_added: [],
      entity_removed: [],
      time_from_changed: false,
      time_from_before: null,
      time_from_after: null,
      time_to_changed: false,
      time_to_before: null,
      time_to_after: null,
      sources_added: [],
      sources_removed: []
    });
  }

  const beforeEntities = normalized(inheritedScope.entity_ids);
  const afterEntities = normalized(childScope.entity_ids);
  const beforeSources = normalized(inheritedScope.source_ids);
  const afterSources = normalized(childScope.source_ids);
  const entityAdded = afterEntities.filter((value) => !beforeEntities.includes(value));
  const entityRemoved = beforeEntities.filter((value) => !afterEntities.includes(value));
  const sourcesAdded = afterSources.filter((value) => !beforeSources.includes(value));
  const sourcesRemoved = beforeSources.filter((value) => !afterSources.includes(value));
  const timeFromChanged = inheritedScope.time_from !== childScope.time_from;
  const timeToChanged = inheritedScope.time_to !== childScope.time_to;

  return GameLogSearchScopeDeltaSchema.parse({
    changed:
      entityAdded.length > 0 ||
      entityRemoved.length > 0 ||
      sourcesAdded.length > 0 ||
      sourcesRemoved.length > 0 ||
      timeFromChanged ||
      timeToChanged,
    entity_added: entityAdded,
    entity_removed: entityRemoved,
    time_from_changed: timeFromChanged,
    time_from_before: inheritedScope.time_from,
    time_from_after: childScope.time_from,
    time_to_changed: timeToChanged,
    time_to_before: inheritedScope.time_to,
    time_to_after: childScope.time_to,
    sources_added: sourcesAdded,
    sources_removed: sourcesRemoved
  });
}

export function useGameLogSearch(workspaceId = "patch-desk", topK = 5) {
  const [sessionId] = useState(() => createUuidV7());
  const [health, setHealth] = useState<GameLogSearchHealth>(() =>
    GameLogSearchHealthSchema.parse({
      schema_version: "game-log-search.v1",
      overall: "checking",
      proxy: { status: "checking", checked_at: INITIAL_HEALTH_CHECKED_AT, reason_code: null },
      retrieval: { status: "checking", checked_at: INITIAL_HEALTH_CHECKED_AT, reason_code: null },
      synthesis: { status: "checking", checked_at: INITIAL_HEALTH_CHECKED_AT, reason_code: null },
      index_snapshot_id: null,
      index_refreshed_at: null,
      index_coverage_through: null,
      model_profile_id: null,
      build_id: "web-proxy"
    })
  );
  const [phase, setPhase] = useState<GameLogSearchPhase>("idle");
  const [stage, setStage] = useState<GameLogSearchStage | null>(null);
  const [currentRequest, setCurrentRequest] = useState<GameLogSearchRequest | null>(null);
  const [evidence, setEvidence] = useState<GameLogEvidence[]>([]);
  const [terminal, setTerminal] = useState<GameLogSearchTerminal | null>(null);
  const [cancelAcknowledgement, setCancelAcknowledgement] = useState<GameLogSearchCancelAck | null>(null);
  const [dispatches, setDispatches] = useState<GameLogSearchDispatchRecord[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const activeRequestRef = useRef<GameLogSearchRequest | null>(null);
  const evidenceRef = useRef<GameLogEvidence[]>([]);
  const evidenceSetHashRef = useRef<string | null>(null);
  const lastStageRef = useRef<GameLogSearchStage | null>(null);
  const cancelRequestedRef = useRef(false);

  const refreshHealth = useCallback(async () => {
    setHealth((current) => ({
      ...current,
      overall: "checking",
      retrieval: { ...current.retrieval, status: "checking", reason_code: null },
      synthesis: { ...current.synthesis, status: "checking", reason_code: null }
    }));
    try {
      setHealth(await getGameLogSearchHealth());
    } catch {
      const checkedAt = new Date().toISOString();
      setHealth(
        GameLogSearchHealthSchema.parse({
          schema_version: "game-log-search.v1",
          overall: "offline",
          proxy: { status: "offline", checked_at: checkedAt, reason_code: "connection_refused" },
          retrieval: { status: "offline", checked_at: checkedAt, reason_code: "connection_refused" },
          synthesis: { status: "offline", checked_at: checkedAt, reason_code: "connection_refused" },
          index_snapshot_id: null,
          index_refreshed_at: null,
          index_coverage_through: null,
          model_profile_id: null,
          build_id: "web-proxy"
        })
      );
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
    return () => controllerRef.current?.abort("component_unmounted");
  }, [refreshHealth]);

  const recordFrame = useCallback((frame: GameLogSearchFrame, request: GameLogSearchRequest) => {
    if (frame.frame_type === "dispatch_accepted") {
      setDispatches((current) =>
        [
          {
            query_id: request.query_id,
            parent_query_id: request.parent_query_id,
            correlation_id: request.correlation_id,
            query_text: request.query_text,
            run_status: frame.run_status,
            outcome: null,
            scope_delta: request.scope_delta,
            started_at: frame.accepted_at
          },
          ...current.filter((item) => item.query_id !== request.query_id)
        ].slice(0, 5)
      );
      return;
    }

    if (frame.frame_type === "stage") {
      lastStageRef.current = frame.stage;
      setStage(frame.stage);
      setDispatches((current) =>
        current.map((item) =>
          item.query_id === request.query_id ? { ...item, run_status: frame.run_status } : item
        )
      );
      return;
    }

    if (frame.frame_type === "evidence_snapshot") {
      evidenceRef.current = [...frame.evidence];
      evidenceSetHashRef.current = frame.retrieved_evidence_set_hash;
      setEvidence(frame.evidence);
      return;
    }

    if (frame.frame_type === "terminal") {
      const retainsForwardedEvidence =
        frame.outcome === "retrieval_unavailable" &&
        frame.evidence.length === 0 &&
        evidenceRef.current.length > 0;
      if (!retainsForwardedEvidence) {
        evidenceRef.current = [...frame.evidence];
        evidenceSetHashRef.current = frame.retrieved_evidence_set_hash;
      }
      setEvidence(retainsForwardedEvidence ? evidenceRef.current : frame.evidence);
      setTerminal(frame);
      setStage(null);
      setPhase("completed");
      setDispatches((current) => {
        const completed = {
          query_id: request.query_id,
          parent_query_id: request.parent_query_id,
          correlation_id: request.correlation_id,
          query_text: request.query_text,
          run_status: frame.run_status,
          outcome: frame.outcome,
          scope_delta: request.scope_delta,
          started_at: current.find((item) => item.query_id === request.query_id)?.started_at ?? new Date().toISOString()
        } satisfies GameLogSearchDispatchRecord;
        return [completed, ...current.filter((item) => item.query_id !== request.query_id)].slice(0, 5);
      });
      return;
    }

    evidenceRef.current = [...frame.evidence];
    setEvidence(frame.evidence);
    setStage(null);
    setTerminal(null);
    setPhase("stopped");
    setDispatches((current) =>
      current.map((item) =>
        item.query_id === request.query_id
          ? { ...item, run_status: "cancelled", outcome: null }
          : item
      )
    );
  }, []);

  const start = useCallback(
    async (
      queryText: string,
      requestedScope: GameLogSearchScope,
      lineage?: { parent_query_id: string; inherited_scope: GameLogSearchScope }
    ): Promise<GameLogSearchRequest | null> => {
      if (controllerRef.current) {
        return null;
      }

      const scope = GameLogSearchScopeSchema.parse({
        ...requestedScope,
        project_ids: normalized(requestedScope.project_ids),
        entity_ids: normalized(requestedScope.entity_ids),
        source_ids: normalized(requestedScope.source_ids)
      });
      const inheritedScope = lineage?.inherited_scope ?? null;
      const request = GameLogSearchRequestSchema.parse({
        schema_version: "game-log-search.v1",
        session_id: sessionId,
        workspace_id: workspaceId,
        query_id: createUuidV7(),
        parent_query_id: lineage?.parent_query_id ?? null,
        correlation_id: createUuidV7(),
        query_text: queryText.trim(),
        scope,
        inherited_scope: inheritedScope,
        scope_delta: createScopeDelta(inheritedScope, scope),
        top_k: topK
      });
      const controller = new AbortController();
      controllerRef.current = controller;
      activeRequestRef.current = request;
      cancelRequestedRef.current = false;
      evidenceRef.current = [];
      evidenceSetHashRef.current = null;
      lastStageRef.current = null;
      setCurrentRequest(request);
      setEvidence([]);
      setTerminal(null);
      setCancelAcknowledgement(null);
      setStage(null);
      setPhase("loading");

      try {
        for await (const frame of streamGameLogSearch(request, controller.signal)) {
          recordFrame(frame, request);
        }
      } catch (error) {
        if (!cancelRequestedRef.current && !(error instanceof DOMException && error.name === "AbortError")) {
          const retained = evidenceRef.current;
          const retainedHash = evidenceSetHashRef.current;
          const synthesisFailed =
            lastStageRef.current === "synthesizing" &&
            retained.length > 0 &&
            retainedHash !== null;
          const ownedTerminal = GameLogSearchTerminalSchema.parse({
            schema_version: "game-log-search.v1",
            frame_type: "terminal",
            run_status: "completed",
            outcome: synthesisFailed ? "synthesis_unavailable" : "retrieval_unavailable",
            failure_owner: synthesisFailed ? "synthesis" : "retrieval",
            confidence: "none",
            query_id: request.query_id,
            parent_query_id: request.parent_query_id,
            correlation_id: request.correlation_id,
            query_text: request.query_text,
            scope: request.scope,
            scope_delta: request.scope_delta,
            index_snapshot_id: request.scope.index_snapshot_id,
            index_refreshed_at: retained[0]?.index_refreshed_at ?? null,
            index_coverage_through: null,
            retrieved_evidence_set_hash: synthesisFailed ? retainedHash : null,
            evidence: synthesisFailed ? retained : [],
            finding: null,
            boundary_reason_code: synthesisFailed ? "synthesis_timeout" : "connection_refused",
            recovery_action: synthesisFailed ? "open_raw_evidence" : "retry_retrieval",
            model_profile_id: null,
            model_quantization: null,
            context_limit_tokens: null,
            evidence_input_tokens: null,
            output_tokens: null,
            truncation_reason: null
          });
          recordFrame(ownedTerminal, request);
        }
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          activeRequestRef.current = null;
        }
      }
      return request;
    },
    [recordFrame, sessionId, topK, workspaceId]
  );

  const revise = useCallback(
    async (queryText: string, scope: GameLogSearchScope): Promise<GameLogSearchRequest | null> => {
      if (!currentRequest) {
        return start(queryText, scope);
      }
      return start(queryText, scope, {
        parent_query_id: currentRequest.query_id,
        inherited_scope: currentRequest.scope
      });
    },
    [currentRequest, start]
  );

  const cancel = useCallback(async (): Promise<GameLogSearchCancelAck | null> => {
    const request = activeRequestRef.current;
    const controller = controllerRef.current;
    if (!request || !controller) {
      return null;
    }

    cancelRequestedRef.current = true;
    setPhase("stopping");
    let acknowledgement: GameLogSearchCancelAck | null = null;
    try {
      acknowledgement = await cancelGameLogSearch(request.query_id, request.correlation_id);
      setCancelAcknowledgement(acknowledgement);
    } catch {
      setCancelAcknowledgement(null);
    } finally {
      controller.abort("user_cancelled");
      setTerminal(null);
      setStage(null);
      setPhase("stopped");
      setDispatches((current) => {
        const existing = current.find((item) => item.query_id === request.query_id);
        const cancelled = {
          query_id: request.query_id,
          parent_query_id: request.parent_query_id,
          correlation_id: request.correlation_id,
          query_text: request.query_text,
          run_status: "cancelled",
          outcome: null,
          scope_delta: request.scope_delta,
          started_at: existing?.started_at ?? new Date().toISOString()
        } satisfies GameLogSearchDispatchRecord;
        return [cancelled, ...current.filter((item) => item.query_id !== request.query_id)].slice(0, 5);
      });
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        activeRequestRef.current = null;
      }
    }
    return acknowledgement;
  }, []);

  return {
    health,
    refreshHealth,
    phase,
    stage,
    currentRequest,
    evidence,
    terminal,
    cancelAcknowledgement,
    dispatches,
    start,
    revise,
    cancel,
    isRunning: phase === "loading" || phase === "stopping"
  };
}
