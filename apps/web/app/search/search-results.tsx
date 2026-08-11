"use client";

import type {
  GameLogSearchHealthStatus,
  GameLogSearchOutcome,
  GameLogSearchScope,
  GameLogSearchScopeDelta
} from "@funqa/contracts";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { createScopeDelta, useGameLogSearch } from "@/hooks/use-game-log-search";
import type { Locale, Messages } from "@/lib/i18n";

import { SearchStreamPanel } from "@/app/search/search-stream-panel";

type PatchDeskMessages = Messages["patchDesk"];

type SearchResultsProps = {
  locale: Locale;
  initialQuery: string;
  messages: PatchDeskMessages;
};

type EditableScope = {
  projects: string;
  entities: string;
  sources: string;
  timeFrom: string;
  timeTo: string;
  indexSnapshotId: string;
};

function describeScopeDelta(delta: GameLogSearchScopeDelta, messages: PatchDeskMessages): string[] {
  if (!delta.changed) {
    return [];
  }
  return [
    delta.entity_added.length ? `${messages.entityAdded}: ${delta.entity_added.join(", ")}` : null,
    delta.entity_removed.length ? `${messages.entityRemoved}: ${delta.entity_removed.join(", ")}` : null,
    delta.sources_added.length ? `${messages.sourcesAdded}: ${delta.sources_added.join(", ")}` : null,
    delta.sources_removed.length ? `${messages.sourcesRemoved}: ${delta.sources_removed.join(", ")}` : null,
    delta.time_from_changed ? messages.timeFromChanged : null,
    delta.time_to_changed ? messages.timeToChanged : null
  ].filter((item): item is string => Boolean(item));
}

function outcomeLabel(outcome: GameLogSearchOutcome, messages: PatchDeskMessages): string {
  if (outcome === "supported") return messages.supportedTitle;
  if (outcome === "no_hits") return messages.noHitsTitle;
  if (outcome === "weak_support") return messages.weakTitle;
  if (outcome === "retrieval_unavailable") return messages.retrievalUnavailableTitle;
  if (outcome === "synthesis_unavailable") return messages.synthesisUnavailableTitle;
  return messages.staleTitle;
}

function healthStateLabel(status: GameLogSearchHealthStatus, messages: PatchDeskMessages): string {
  if (status === "ready") return messages.readyState;
  if (status === "checking") return messages.checkingState;
  return messages.offlineState;
}

function csvValues(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function toWireTime(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

function buildScope(editable: EditableScope): GameLogSearchScope {
  return {
    project_ids: csvValues(editable.projects),
    entity_ids: csvValues(editable.entities),
    time_from: toWireTime(editable.timeFrom),
    time_to: toWireTime(editable.timeTo),
    source_ids: csvValues(editable.sources),
    index_snapshot_id: editable.indexSnapshotId
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.isContentEditable || target.matches("input, textarea, select");
}

export function SearchResults({ locale, initialQuery, messages }: SearchResultsProps) {
  const search = useGameLogSearch();
  const [query, setQuery] = useState(initialQuery);
  const [revisionQuery, setRevisionQuery] = useState(initialQuery);
  const [scope, setScope] = useState<EditableScope>({
    projects: "",
    entities: "",
    sources: "",
    timeFrom: "",
    timeTo: "",
    indexSnapshotId: "sim-index-v1"
  });
  const [composerNote, setComposerNote] = useState<string | null>(null);
  const queryRef = useRef<HTMLInputElement | null>(null);
  const revisionRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (search.health.index_snapshot_id && !search.isRunning) {
      setScope((current) => ({
        ...current,
        indexSnapshotId: search.health.index_snapshot_id ?? current.indexSnapshotId
      }));
    }
  }, [search.health.index_snapshot_id, search.isRunning]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isEditableTarget(event.target)) {
        event.preventDefault();
        queryRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (search.phase === "stopped") {
      revisionRef.current?.focus();
    }
  }, [search.phase]);

  useEffect(() => {
    if (search.currentRequest) {
      setRevisionQuery(search.currentRequest.query_text);
    }
  }, [search.currentRequest]);

  const wireScope = useMemo(() => buildScope(scope), [scope]);
  const healthView = useMemo(() => {
    if (search.health.overall === "checking") {
      return {
        label: messages.serviceChecking,
        detail: messages.serviceCheckingDetail,
        tone: "checking"
      };
    }
    if (search.health.retrieval.status !== "ready") {
      return {
        label: messages.retrievalOffline,
        detail: messages.retrievalOfflineDetail,
        tone: "offline"
      };
    }
    if (search.health.synthesis.status !== "ready") {
      return {
        label: messages.synthesisOffline,
        detail: messages.synthesisOfflineDetail,
        tone: "offline"
      };
    }
    return {
      label: messages.serviceReady,
      detail: messages.serviceReadyDetail,
      tone: "ready"
    };
  }, [messages, search.health]);

  const indexHealthStatus: GameLogSearchHealthStatus =
    search.health.overall === "checking"
      ? "checking"
      : search.health.retrieval.status === "ready" && search.health.index_snapshot_id
        ? "ready"
        : "offline";
  const canRetryRetrieval =
    search.health.overall === "offline" && search.health.retrieval.status !== "ready";
  const canOpenRawEvidence =
    search.health.overall === "offline" &&
    search.health.retrieval.status === "ready" &&
    search.health.synthesis.status !== "ready" &&
    search.evidence.length > 0;

  const submitQuery = async (queryText: string) => {
    if (search.health.overall !== "ready" || queryText.trim().length < 3 || search.isRunning) {
      return;
    }
    setComposerNote(null);
    if (search.currentRequest) {
      await search.revise(queryText, wireScope);
    } else {
      await search.start(queryText, wireScope);
    }
  };

  const stopSearch = async () => {
    await search.cancel();
    revisionRef.current?.focus();
  };

  const handleRecovery = async (outcome: GameLogSearchOutcome | "stopped") => {
    if (outcome === "supported") {
      document.querySelector<HTMLButtonElement>(".patch-claim-button[data-selected='true']")?.focus();
      return;
    }
    if (outcome === "synthesis_unavailable") {
      document.querySelector<HTMLElement>(".patch-shard")?.focus();
      return;
    }
    if (outcome === "retrieval_unavailable" || outcome === "stale_index") {
      setComposerNote(messages.retrying);
      await search.refreshHealth();
    }
    revisionRef.current?.focus();
  };

  const dispatchStatus = (status: string) => {
    if (status === "accepted") return messages.dispatchAccepted;
    if (status === "running") return messages.dispatchRunning;
    if (status === "cancelled") return messages.dispatchCancelled;
    return messages.dispatchCompleted;
  };

  const pendingScopeDelta = search.currentRequest
    ? createScopeDelta(search.currentRequest.scope, wireScope)
    : null;
  const scopeDeltaItems = pendingScopeDelta
    ? describeScopeDelta(pendingScopeDelta, messages)
    : [];

  return (
    <main className="patch-desk" lang={locale}>
      <div className="patch-desk-inner">
        <header className="patch-desk-header">
          <div className="patch-desk-intro">
            <p className="patch-kicker">{messages.eyebrow}</p>
            <h1>{messages.title}</h1>
            <p className="patch-desk-lede">{messages.lede}</p>
            <div className="patch-starters" aria-label={messages.queryLabel}>
              {[messages.starterP42, messages.starterIncident184, messages.starterNewest].map((starter) => (
                <button key={starter} type="button" onClick={() => { setQuery(starter); queryRef.current?.focus(); }}>
                  {starter}
                </button>
              ))}
            </div>
          </div>
          <div className="patch-header-rail">
            <Image
              className="patch-ledger-plate"
              src="/game-log-search/patch-ledger-plate-1600x900.webp"
              width={280}
              height={158}
              sizes="(max-width: 767px) 0px, (max-width: 1179px) 220px, 280px"
              alt=""
              aria-hidden="true"
              priority
            />
            <section className="patch-service-lamp" data-tone={healthView.tone} aria-labelledby="patch-service-title">
              <p className="patch-kicker">{messages.serviceLampLabel}</p>
              <h2 id="patch-service-title"><span aria-hidden="true" />{healthView.label}</h2>
              <p>{healthView.detail}</p>
              <dl className="patch-service-grid">
                <div>
                  <dt>{messages.archiveLabel}</dt>
                  <dd data-tone={search.health.retrieval.status}>
                    {healthStateLabel(search.health.retrieval.status, messages)}
                  </dd>
                </div>
                <div>
                  <dt>{messages.modelLabel}</dt>
                  <dd data-tone={search.health.synthesis.status}>
                    {healthStateLabel(search.health.synthesis.status, messages)}
                  </dd>
                </div>
                <div>
                  <dt>{messages.indexLabel}</dt>
                  <dd data-tone={indexHealthStatus}>{healthStateLabel(indexHealthStatus, messages)}</dd>
                </div>
              </dl>
              <p className="patch-protocol-line">
                {messages.checkedAtLabel}:{" "}
                {search.health.overall === "checking"
                  ? messages.checkingState
                  : search.health.retrieval.checked_at}
              </p>
              {canRetryRetrieval ? (
                <button type="button" className="patch-text-button" onClick={() => { void search.refreshHealth(); }}>
                  {messages.retryConnection}
                </button>
              ) : null}
              {canOpenRawEvidence ? (
                <button
                  type="button"
                  className="patch-text-button"
                  onClick={() => document.querySelector<HTMLElement>(".patch-shard")?.focus()}
                >
                  {messages.openRawEvidence}
                </button>
              ) : null}
            </section>
          </div>
        </header>

        <form
          className="patch-composer"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            if (search.isRunning) {
              void stopSearch();
            } else {
              void submitQuery(query);
            }
          }}
        >
          <div className="patch-query-field">
            <label htmlFor="patch-query">{messages.queryLabel}</label>
            <input
              id="patch-query"
              ref={queryRef}
              value={query}
              minLength={3}
              maxLength={2000}
              autoComplete="off"
              placeholder={messages.queryPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <fieldset className="patch-scope-bar" disabled={search.isRunning}>
            <legend>{messages.scopeLabel}</legend>
            <p className="patch-scope-hint">{messages.scopeFrozen}</p>
            <div className="patch-scope-controls">
              <label>
                <span>{messages.projectLabel}</span>
                <input
                  value={scope.projects}
                  disabled={Boolean(search.currentRequest)}
                  placeholder={messages.projectPlaceholder}
                  onChange={(event) => setScope((current) => ({ ...current, projects: event.target.value }))}
                />
              </label>
              <label>
                <span>{messages.entityLabel}</span>
                <input
                  value={scope.entities}
                  placeholder={messages.entityPlaceholder}
                  onChange={(event) => setScope((current) => ({ ...current, entities: event.target.value }))}
                />
              </label>
              <label>
                <span>{messages.sourcesLabel}</span>
                <input
                  value={scope.sources}
                  placeholder={messages.sourcePlaceholder}
                  onChange={(event) => setScope((current) => ({ ...current, sources: event.target.value }))}
                />
              </label>
              <label>
                <span>{messages.timeFromLabel}</span>
                <input
                  type="datetime-local"
                  value={scope.timeFrom}
                  onChange={(event) => setScope((current) => ({ ...current, timeFrom: event.target.value }))}
                />
              </label>
              <label>
                <span>{messages.timeToLabel}</span>
                <input
                  type="datetime-local"
                  value={scope.timeTo}
                  onChange={(event) => setScope((current) => ({ ...current, timeTo: event.target.value }))}
                />
              </label>
              <label>
                <span>{messages.snapshotLabel}</span>
                <input value={scope.indexSnapshotId} readOnly />
              </label>
            </div>
            <div className="patch-scope-chips" aria-label={messages.scopeLabel}>
              <span>{messages.projectLabel}: {wireScope.project_ids.join(", ") || messages.allProjects}</span>
              <span>{messages.entityLabel}: {wireScope.entity_ids.join(", ") || messages.allEntities}</span>
              <span>{messages.timeLabel}: {wireScope.time_from ?? messages.notSet} — {wireScope.time_to ?? messages.notSet}</span>
              <span>{messages.sourcesLabel}: {wireScope.source_ids.join(", ") || messages.allSources}</span>
              <span>{messages.snapshotLabel}: {wireScope.index_snapshot_id}</span>
              <span>{messages.freshnessLabel}: {search.health.index_refreshed_at ?? messages.freshnessUnknown}</span>
            </div>
          </fieldset>

          <div className="patch-composer-actions">
            <button
              className={search.isRunning ? "patch-stop-button" : "patch-primary-button"}
              type="submit"
              disabled={!search.isRunning && (search.health.overall !== "ready" || query.trim().length < 3)}
            >
              {search.isRunning ? messages.stop : messages.search}
            </button>
            <span>{messages.shortcut}</span>
            {search.health.overall !== "ready" ? <small>{messages.searchNeedsService}</small> : null}
            {composerNote ? <small role="status">{composerNote}</small> : null}
          </div>
        </form>

        <SearchStreamPanel
          messages={messages}
          phase={search.phase}
          stage={search.stage}
          currentRequest={search.currentRequest}
          evidence={search.evidence}
          terminal={search.terminal}
          onRecovery={(outcome) => { void handleRecovery(outcome); }}
        />

        {search.currentRequest && (search.phase === "completed" || search.phase === "stopped") ? (
          <section className="patch-revision" aria-labelledby="patch-revision-title">
            <p className="patch-kicker">{messages.followUpLabel}</p>
            <h2 id="patch-revision-title">{messages.reviseQuery}</h2>
            <div className="patch-lineage">
              <p><span>{messages.parentQueryLabel}</span> {search.currentRequest.query_id}</p>
              <p><span>{messages.parentScopeLabel}</span> {search.currentRequest.scope.index_snapshot_id}</p>
              <div>
                <span>{messages.scopeDeltaLabel}</span>
                {scopeDeltaItems.length ? <ul>{scopeDeltaItems.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{messages.noScopeDelta}</p>}
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitQuery(revisionQuery);
              }}
            >
              <label htmlFor="patch-revision-query">{messages.followUpLabel}</label>
              <div className="patch-revision-row">
                <input
                  id="patch-revision-query"
                  ref={revisionRef}
                  value={revisionQuery}
                  minLength={3}
                  maxLength={2000}
                  placeholder={messages.revisionPlaceholder}
                  onChange={(event) => setRevisionQuery(event.target.value)}
                />
                <button
                  className="patch-primary-button"
                  type="submit"
                  disabled={search.health.overall !== "ready" || revisionQuery.trim().length < 3}
                >
                  {messages.reviseQuery}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <nav className="patch-dispatch-trail" aria-labelledby="patch-dispatch-trail-title">
          <p className="patch-kicker">{messages.dispatchCurrent}</p>
          <h2 id="patch-dispatch-trail-title">{messages.dispatchTrail}</h2>
          {search.dispatches.length ? (
            <ol>
              {search.dispatches.map((dispatch, index) => (
                <li key={dispatch.query_id} aria-current={index === 0 ? "true" : undefined}>
                  <div>
                    <strong>{dispatch.query_text}</strong>
                    <span>{dispatchStatus(dispatch.run_status)}{dispatch.outcome ? ` · ${outcomeLabel(dispatch.outcome, messages)}` : ""}</span>
                  </div>
                  <code>{dispatch.query_id}</code>
                  <small>{messages.parentQueryLabel}: {dispatch.parent_query_id ?? messages.notSet}</small>
                  <small>
                    {messages.scopeDeltaLabel}: {describeScopeDelta(dispatch.scope_delta, messages).join("; ") || messages.noScopeDelta}
                  </small>
                </li>
              ))}
            </ol>
          ) : <p>{messages.noDispatches}</p>}
        </nav>
      </div>
    </main>
  );
}
