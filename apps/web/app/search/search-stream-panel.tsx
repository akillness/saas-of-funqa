"use client";

import type {
  GameLogClaim,
  GameLogEvidence,
  GameLogSearchOutcome,
  GameLogSearchRequest,
  GameLogSearchStage,
  GameLogSearchTerminal
} from "@funqa/contracts";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Messages } from "@/lib/i18n";
import type { GameLogSearchPhase } from "@/hooks/use-game-log-search";

type PatchDeskMessages = Messages["patchDesk"];

type SearchStreamPanelProps = {
  messages: PatchDeskMessages;
  phase: GameLogSearchPhase;
  stage: GameLogSearchStage | null;
  currentRequest: GameLogSearchRequest | null;
  evidence: GameLogEvidence[];
  terminal: GameLogSearchTerminal | null;
  onRecovery: (outcome: GameLogSearchOutcome | "stopped") => void;
};

type OutcomeCopy = {
  title: string;
  body: string;
  action: string;
};

type EvidenceCardProps = {
  evidence: GameLogEvidence;
  relation: "supports" | "contradicts" | "supersedes" | "context_only" | "untrusted_data";
  messages: PatchDeskMessages;
  selected: boolean;
  describedBy: string;
  tabIndex: number;
  onOpen: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  setRef: (element: HTMLElement | null) => void;
  onBackToClaim: (() => void) | null;
  hasCorrection: boolean;
};

const RELATION_MESSAGE_KEY = {
  supports: "relationSupports",
  contradicts: "relationContradicts",
  supersedes: "relationSupersedes",
  context_only: "relationContext",
  untrusted_data: "relationUntrusted"
} as const;

function fillTemplate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.replace(`{${key}}`, String(value)),
    template
  );
}

function outcomeCopy(
  outcome: GameLogSearchOutcome,
  messages: PatchDeskMessages,
  freshness: string | null
): OutcomeCopy {
  if (outcome === "supported") {
    return {
      title: messages.supportedTitle,
      body: messages.supportedBody,
      action: messages.inspectTraces
    };
  }
  if (outcome === "no_hits") {
    return { title: messages.noHitsTitle, body: messages.noHitsBody, action: messages.broadenScope };
  }
  if (outcome === "weak_support") {
    return { title: messages.weakTitle, body: messages.weakBody, action: messages.refineQuery };
  }
  if (outcome === "retrieval_unavailable") {
    return {
      title: messages.retrievalUnavailableTitle,
      body: messages.retrievalUnavailableBody,
      action: messages.retryRetrieval
    };
  }
  if (outcome === "synthesis_unavailable") {
    return {
      title: messages.synthesisUnavailableTitle,
      body: messages.synthesisUnavailableBody,
      action: messages.openRawEvidence
    };
  }
  return {
    title: messages.staleTitle,
    body: fillTemplate(messages.staleBody, {
      timestamp: freshness ?? messages.freshnessUnknown
    }),
    action: messages.refreshArchive
  };
}

function EvidenceCard({
  evidence,
  relation,
  messages,
  selected,
  describedBy,
  tabIndex,
  onOpen,
  onKeyDown,
  setRef,
  onBackToClaim,
  hasCorrection
}: EvidenceCardProps) {
  const relationText = messages[RELATION_MESSAGE_KEY[relation]];
  const eventTime = evidence.event_end_at
    ? `${evidence.event_start_at} — ${evidence.event_end_at}`
    : evidence.event_start_at;

  return (
    <article
      id={`evidence-${evidence.evidence_id}`}
      ref={setRef}
      className="patch-shard"
      data-selected={selected ? "true" : "false"}
      tabIndex={tabIndex}
      aria-describedby={describedBy}
      onClick={onOpen}
      onFocus={onOpen}
      onKeyDown={onKeyDown}
    >
      <header className="patch-shard-header">
        <div>
          <p className="patch-kicker">{messages.logShardLabel}</p>
          <h3>{evidence.evidence_id} · {evidence.source_label}</h3>
        </div>
        <span className="patch-score">{messages.rankLabel} {evidence.rank}</span>
      </header>
      <p id={describedBy} className="patch-relation">{messages.relationLabel}: {relationText}</p>
      {hasCorrection && evidence.evidence_id === "E004" ? (
        <p className="patch-safety-note">
          {fillTemplate(messages.superseded, { evidenceId: "E006" })}
        </p>
      ) : null}
      {evidence.trust_class === "untrusted_data" ? (
        <p className="patch-safety-note">{messages.untrusted}</p>
      ) : null}
      <blockquote className="patch-excerpt">
        <span className="patch-meta-label">{messages.excerptLabel}</span>
        {evidence.excerpt}
      </blockquote>
      <dl className="patch-provenance">
        <div><dt>{messages.sourceLabel}</dt><dd>{evidence.source_id}</dd></div>
        <div><dt>{messages.pathLabel}</dt><dd>{evidence.source_path}</dd></div>
        <div><dt>{messages.eventTimeLabel}</dt><dd>{eventTime}</dd></div>
        <div><dt>{messages.freshnessLabel}</dt><dd>{evidence.index_refreshed_at}</dd></div>
        <div><dt>{messages.scoreLabel}</dt><dd>{evidence.score.toFixed(4)}</dd></div>
        <div><dt>{messages.excerptBoundsLabel}</dt><dd>{evidence.excerpt_start}–{evidence.excerpt_end}</dd></div>
        <div><dt>{messages.queryIdLabel}</dt><dd>{evidence.query_id}</dd></div>
        <div><dt>{messages.correlationIdLabel}</dt><dd>{evidence.correlation_id}</dd></div>
        <div><dt>{messages.trustLabel}</dt><dd>{evidence.trust_class}</dd></div>
      </dl>
      {onBackToClaim ? (
        <button className="patch-text-button patch-back-to-claim" type="button" onClick={onBackToClaim}>
          {messages.backToClaim}
        </button>
      ) : null}
    </article>
  );
}

export function SearchStreamPanel({
  messages,
  phase,
  stage,
  currentRequest,
  evidence,
  terminal,
  onRecovery
}: SearchStreamPanelProps) {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [openedEvidenceIds, setOpenedEvidenceIds] = useState<string[]>([]);
  const [rewardStatus, setRewardStatus] = useState<string | null>(null);
  const [hasReadBoundary, setHasReadBoundary] = useState(false);
  const claimRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shardRefs = useRef<Array<HTMLElement | null>>([]);

  const claims = terminal?.finding?.claims ?? [];
  const selectedClaim = claims.find((claim) => claim.claim_id === selectedClaimId) ?? claims[0] ?? null;
  const orderedClaims = useMemo(() => {
    if (!selectedClaim) {
      return [];
    }
    return [selectedClaim, ...claims.filter((claim) => claim.claim_id !== selectedClaim.claim_id)];
  }, [claims, selectedClaim]);
  const selectedLinks = terminal?.finding?.claim_evidence_links.filter(
    (link) => link.claim_id === selectedClaim?.claim_id
  ) ?? [];
  const traceEvidence = selectedClaim
    ? selectedLinks
        .map((link) => evidence.find((item) => item.evidence_id === link.evidence_id))
        .filter((item): item is GameLogEvidence => Boolean(item))
    : evidence;
  const hasCorrection = evidence.some((item) => item.evidence_id === "E006");

  useEffect(() => {
    const firstClaim = terminal?.finding?.claims[0]?.claim_id ?? null;
    setSelectedClaimId(firstClaim);
    setSelectedEvidenceId(null);
    setOpenedEvidenceIds([]);
    setRewardStatus(null);
    setHasReadBoundary(false);
  }, [terminal?.query_id]);

  const selectClaim = (claim: GameLogClaim, moveToShard: boolean) => {
    setSelectedClaimId(claim.claim_id);
    setSelectedEvidenceId(null);
    if (moveToShard && window.matchMedia("(max-width: 767px)").matches) {
      window.setTimeout(() => shardRefs.current[0]?.focus(), 0);
    }
  };

  const moveClaimFocus = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? orderedClaims.length - 1
          : event.key === "ArrowDown"
            ? (index + 1) % orderedClaims.length
            : (index - 1 + orderedClaims.length) % orderedClaims.length;
    claimRefs.current[nextIndex]?.focus();
  };

  const moveShardFocus = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? traceEvidence.length - 1
          : event.key === "ArrowDown"
            ? (index + 1) % traceEvidence.length
            : (index - 1 + traceEvidence.length) % traceEvidence.length;
    shardRefs.current[nextIndex]?.focus();
  };

  const openEvidence = (evidenceId: string) => {
    setSelectedEvidenceId(evidenceId);
    setOpenedEvidenceIds((current) =>
      current.includes(evidenceId) ? current : [...current, evidenceId]
    );
    setHasReadBoundary(true);
  };

  const saveEvidenceCard = () => {
    if (!terminal || openedEvidenceIds.length === 0) {
      return;
    }
    const storageKey = "funqa.patch-desk.evidence-cards";
    const stored = localStorage.getItem(storageKey);
    const cards = stored ? (JSON.parse(stored) as unknown[]) : [];
    localStorage.setItem(storageKey, JSON.stringify([{ saved_at: new Date().toISOString(), terminal }, ...cards]));
    setRewardStatus(messages.cardSaved);
  };

  const copyEvidenceLink = async () => {
    if (!terminal || openedEvidenceIds.length === 0) {
      return;
    }
    const target = new URL(window.location.href);
    target.searchParams.set("q", terminal.query_text);
    target.searchParams.set("query_id", terminal.query_id);
    target.hash = `evidence-${openedEvidenceIds[0]}`;
    await navigator.clipboard.writeText(target.toString());
    setRewardStatus(messages.linkCopied);
  };

  const liveCopy =
    phase === "loading"
      ? stage === "retrieving"
        ? messages.searching
        : stage === "ranking"
          ? messages.ranking
          : stage === "synthesizing"
            ? fillTemplate(messages.synthesizing, { count: evidence.length })
            : messages.dispatchStarted
      : phase === "stopping"
        ? messages.stopping
        : phase === "stopped"
          ? messages.stopped
          : terminal
            ? outcomeCopy(terminal.outcome, messages, terminal.index_coverage_through ?? terminal.index_refreshed_at).title
            : "";

  const owner = terminal
    ? terminal.failure_owner === "retrieval"
      ? messages.retrievalOwner
      : terminal.failure_owner === "synthesis"
        ? messages.synthesisOwner
        : messages.noFailureOwner
    : stage === "synthesizing"
      ? messages.synthesisOwner
      : messages.retrievalOwner;

  if (phase === "idle" && !terminal) {
    return (
      <section className="patch-outcome patch-outcome--idle" aria-labelledby="patch-initial-title">
        <p className="patch-kicker">{messages.findingLabel}</p>
        <h2 id="patch-initial-title">{messages.initialTitle}</h2>
        <p>{messages.initialBody}</p>
      </section>
    );
  }

  if (phase === "loading" || phase === "stopping") {
    const currentStep = stage === "ranking" ? 2 : stage === "synthesizing" ? 3 : 1;
    return (
      <section className="patch-outcome" aria-labelledby="patch-loading-title">
        <p className="patch-sr-only" aria-live="polite" aria-atomic="true">{liveCopy}</p>
        <div className="patch-outcome-heading">
          <div>
            <p className="patch-kicker">{messages.activeOwner}: {owner}</p>
            <h2 id="patch-loading-title">{phase === "stopping" ? messages.stopping : messages.dispatchStarted}</h2>
          </div>
          <span className="patch-status-shape" data-tone="loading">{messages.dispatchRunning}</span>
        </div>
        <ol className="patch-stage-track" aria-label={messages.stageLabel}>
          <li aria-current={currentStep === 1 ? "step" : undefined} data-complete={currentStep > 1}>{messages.searching}</li>
          <li aria-current={currentStep === 2 ? "step" : undefined} data-complete={currentStep > 2}>{messages.ranking}</li>
          <li aria-current={currentStep === 3 ? "step" : undefined}>{fillTemplate(messages.synthesizing, { count: evidence.length })}</li>
        </ol>
        {evidence.length > 0 ? (
          <div className="patch-loading-evidence">
            <p className="patch-kicker">{messages.rawEvidenceLabel} · {evidence.length}</p>
            <ul>{evidence.map((item) => <li key={item.evidence_id}>{item.evidence_id} · {item.source_label}</li>)}</ul>
          </div>
        ) : null}
      </section>
    );
  }

  if (phase === "stopped") {
    return (
      <section className="patch-workspace" aria-labelledby="patch-stopped-title">
        <p className="patch-sr-only" aria-live="polite" aria-atomic="true">{messages.stopped}</p>
        <div className="patch-outcome patch-outcome--stopped">
          <p className="patch-kicker">{messages.activeOwner}: {owner}</p>
          <h2 id="patch-stopped-title">{messages.stopped}</h2>
          <button className="patch-primary-button" type="button" onClick={() => onRecovery("stopped")}>
            {messages.reviseQuery}
          </button>
        </div>
        {evidence.length > 0 ? (
          <aside className="patch-trace-rail" aria-labelledby="patch-stopped-evidence-title">
            <h3 id="patch-stopped-evidence-title">{messages.rawEvidenceLabel}</h3>
            {evidence.map((item, index) => (
              <EvidenceCard
                key={item.evidence_id}
                evidence={item}
                relation={item.trust_class === "untrusted_data" ? "untrusted_data" : "context_only"}
                messages={messages}
                selected={selectedEvidenceId === item.evidence_id}
                describedBy={`stopped-relation-${item.evidence_id}`}
                tabIndex={selectedEvidenceId ? (selectedEvidenceId === item.evidence_id ? 0 : -1) : (index === 0 ? 0 : -1)}
                onOpen={() => openEvidence(item.evidence_id)}
                onKeyDown={(event) => moveShardFocus(event, index)}
                setRef={(element) => { shardRefs.current[index] = element; }}
                onBackToClaim={null}
                hasCorrection={hasCorrection}
              />
            ))}
          </aside>
        ) : null}
      </section>
    );
  }

  if (!terminal || !currentRequest) {
    return null;
  }

  const copy = outcomeCopy(
    terminal.outcome,
    messages,
    terminal.index_coverage_through ?? terminal.index_refreshed_at
  );
  const isSupported = terminal.outcome === "supported";
  const tone = terminal.outcome === "supported" ? "ok" : terminal.outcome === "retrieval_unavailable" ? "danger" : "warn";
  const terminalRole =
    terminal.outcome === "retrieval_unavailable" || terminal.outcome === "synthesis_unavailable"
      ? "alert"
      : "status";

  return (
    <section className="patch-workspace" data-outcome={terminal.outcome} aria-labelledby="patch-outcome-title">
      <p className="patch-sr-only" aria-live="polite" aria-atomic="true">{liveCopy}</p>
      <div className="patch-outcome" role={terminalRole}>
        <div className="patch-outcome-heading">
          <div>
            <p className="patch-kicker">{isSupported ? messages.findingLabel : messages.boundaryNoteLabel}</p>
            <h2 id="patch-outcome-title" tabIndex={-1}>{copy.title}</h2>
          </div>
          <span className="patch-status-shape" data-tone={tone}>{messages.ownerLabel}: {owner}</span>
        </div>
        <p className="patch-outcome-body">{copy.body}</p>
        {terminal.finding ? <p className="patch-finding-summary">{terminal.finding.summary}</p> : null}
        {terminal.outcome === "stale_index" ? (
          <p className="patch-freshness-stamp">{messages.ageWarning}</p>
        ) : null}
        {terminal.boundary_reason_code ? (
          <>
            <p className="patch-boundary-reason" id="patch-boundary-reason">
              <span>{messages.reasonLabel}</span> {terminal.boundary_reason_code}
            </p>
            <button
              className="patch-text-button"
              type="button"
              aria-describedby="patch-boundary-reason"
              onClick={() => setHasReadBoundary(true)}
            >
              {messages.inspectBoundaryReason}
            </button>
          </>
        ) : null}
        {terminal.index_refreshed_at ? (
          <p className="patch-freshness-stamp">{messages.freshnessLabel} · {terminal.index_refreshed_at}</p>
        ) : null}
      </div>

      {selectedClaim ? (
        <div className="patch-active-claim" id={`claim-${selectedClaim.claim_id}`}>
          <p className="patch-kicker">{messages.claimSelectedLabel}</p>
          <h3>{selectedClaim.claim_id}</h3>
          <p>{selectedClaim.text}</p>
          <p className="patch-linked-ids">
            {messages.linkedEvidenceLabel}: {selectedLinks.map((link) => link.evidence_id).join(", ")}
          </p>
        </div>
      ) : null}

      {orderedClaims.length > 0 ? (
        <div className="patch-claims" aria-labelledby="patch-claims-title">
          <h3 id="patch-claims-title">{messages.claimsLabel}</h3>
          <ol>
            {orderedClaims.map((claim, index) => {
              const links = terminal.finding?.claim_evidence_links.filter((link) => link.claim_id === claim.claim_id) ?? [];
              const active = claim.claim_id === selectedClaim?.claim_id;
              return (
                <li key={claim.claim_id}>
                  <button
                    ref={(element) => { claimRefs.current[index] = element; }}
                    className="patch-claim-button"
                    type="button"
                    data-selected={active ? "true" : "false"}
                    tabIndex={active ? 0 : -1}
                    aria-pressed={active}
                    onClick={() => selectClaim(claim, true)}
                    onKeyDown={(event) => moveClaimFocus(event, index)}
                  >
                    <span>{claim.claim_id}</span>
                    <strong>{claim.text}</strong>
                    <small>{messages.linkedEvidenceLabel}: {links.map((link) => link.evidence_id).join(", ")}</small>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      <aside className="patch-trace-rail" aria-labelledby="patch-trace-title">
        <div className="patch-rail-heading">
          <p className="patch-kicker">{messages.traceRailLabel}</p>
          <h3 id="patch-trace-title">{selectedClaim?.claim_id ?? messages.rawEvidenceLabel}</h3>
        </div>
        {traceEvidence.length > 0 ? traceEvidence.map((item, index) => {
          const relation = selectedLinks.find((link) => link.evidence_id === item.evidence_id)?.relation
            ?? (item.trust_class === "untrusted_data" ? "untrusted_data" : "context_only");
          return (
            <EvidenceCard
              key={item.evidence_id}
              evidence={item}
              relation={relation}
              messages={messages}
              selected={selectedEvidenceId === item.evidence_id}
              describedBy={`relation-${selectedClaim?.claim_id ?? "raw"}-${item.evidence_id}`}
              tabIndex={selectedEvidenceId ? (selectedEvidenceId === item.evidence_id ? 0 : -1) : (index === 0 ? 0 : -1)}
              onOpen={() => openEvidence(item.evidence_id)}
              onKeyDown={(event) => moveShardFocus(event, index)}
              setRef={(element) => { shardRefs.current[index] = element; }}
              onBackToClaim={selectedClaim ? () => claimRefs.current[0]?.focus() : null}
              hasCorrection={hasCorrection}
            />
          );
        }) : (
          <div className="patch-empty-rail">
            <p>{messages.evidenceEmpty}</p>
            <p>{messages.snapshotLabel}: {terminal.index_snapshot_id}</p>
            <p>{messages.freshnessLabel}: {terminal.index_refreshed_at ?? messages.freshnessUnknown}</p>
          </div>
        )}
      </aside>

      <div className="patch-recovery-action">
        <button className="patch-primary-button" type="button" onClick={() => onRecovery(terminal.outcome)}>
          {copy.action}
        </button>
      </div>

      <div className="patch-reward-actions" role="group" aria-label={messages.rewardStatusLabel}>
        {isSupported ? (
          <>
            <button
              type="button"
              className="patch-secondary-button"
              disabled={openedEvidenceIds.length === 0}
              title={openedEvidenceIds.length === 0 ? messages.inspectBeforeSave : undefined}
              onClick={saveEvidenceCard}
            >
              {messages.saveCard}
            </button>
            <button
              type="button"
              className="patch-secondary-button"
              disabled={openedEvidenceIds.length === 0}
              title={openedEvidenceIds.length === 0 ? messages.inspectBeforeCopy : undefined}
              onClick={() => { void copyEvidenceLink(); }}
            >
              {messages.copyEvidence}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="patch-secondary-button"
            disabled={!hasReadBoundary}
            title={!hasReadBoundary ? messages.readBeforeAcknowledge : undefined}
            onClick={() => setRewardStatus(messages.boundaryAcknowledged)}
          >
            {messages.acknowledge}
          </button>
        )}
        {rewardStatus ? <p className="patch-reward-status" role="status">{rewardStatus}</p> : null}
      </div>

      <details className="patch-dispatch-details">
        <summary>{messages.dispatchDetails}</summary>
        <dl className="patch-provenance">
          <div><dt>{messages.queryIdLabel}</dt><dd>{terminal.query_id}</dd></div>
          <div><dt>{messages.correlationIdLabel}</dt><dd>{terminal.correlation_id}</dd></div>
          <div><dt>{messages.parentQueryLabel}</dt><dd>{terminal.parent_query_id ?? messages.notSet}</dd></div>
          <div><dt>{messages.indexSnapshotLabel}</dt><dd>{terminal.index_snapshot_id}</dd></div>
          <div><dt>{messages.coverageLabel}</dt><dd>{terminal.index_coverage_through ?? messages.unknownValue}</dd></div>
          <div><dt>{messages.evidenceSetLabel}</dt><dd>{terminal.retrieved_evidence_set_hash ?? messages.unknownValue}</dd></div>
          <div><dt>{messages.modelProfileLabel}</dt><dd>{terminal.model_profile_id ?? messages.unknownValue}</dd></div>
          <div><dt>{messages.quantizationLabel}</dt><dd>{terminal.model_quantization ?? messages.unknownValue}</dd></div>
          <div><dt>{messages.contextTokensLabel}</dt><dd>{terminal.context_limit_tokens ?? messages.unknownValue}</dd></div>
          <div><dt>{messages.inputTokensLabel}</dt><dd>{terminal.evidence_input_tokens ?? messages.unknownValue}</dd></div>
          <div><dt>{messages.outputTokensLabel}</dt><dd>{terminal.output_tokens ?? messages.unknownValue}</dd></div>
          <div><dt>{messages.truncationLabel}</dt><dd>{terminal.truncation_reason ?? messages.notSet}</dd></div>
        </dl>
      </details>
    </section>
  );
}
