'use client';

import React, { useMemo } from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';
import {
  DailyBriefing,
  CanonicalIntelligenceEvent,
  DeltaStoryItem,
  QuietEntityReport,
  PortfolioIntelligenceProfile,
  EpistemicClaim,
} from '@/lib/types';
import { getTickerMeta } from '@/lib/stock-aliases';
import {
  RiskState,
  riskStateFromMateriality,
  riskStateFromDeltaStory,
  computePortfolioRiskPicture,
  confidenceLabel,
  materialityScoreLabel,
  materialityPriorityLabel,
  riskStateForSymbol,
  humanizeEntityTokens,
  humanizeEntityId,
} from '@/lib/risk-presentation';

export type ChangeItem = {
  id: string;
  entityLabel: string;
  headline: string;
  whatChanged: string;
  whyItMatters: string;
  changeFrom?: string;
  changeTo?: string;
  confidenceText: string;
  materialityText: string;
  riskState: RiskState;
  nextTrigger?: string;
  kind: 'event' | 'delta';
  raw: CanonicalIntelligenceEvent | DeltaStoryItem;
};

interface IntelligenceBriefingProps {
  briefing: DailyBriefing | null;
  canonicalEvents: CanonicalIntelligenceEvent[];
  portfolioProfile: PortfolioIntelligenceProfile | null;
  portfolioSymbols: string[];
  isResearching: boolean;
  onRefreshAnalysis: () => void;
  onOpenChangeDetail: (item: ChangeItem) => void;
  onOpenEntityDossier: (symbol: string) => void;
  onOpenResearchTrace: () => void;
  onOpenPortfolioProfile: () => void;
  onOpenManagePortfolio: () => void;
}

function eventToChangeItem(event: CanonicalIntelligenceEvent): ChangeItem {
  const riskState = riskStateFromMateriality(event.materiality);
  const rawNextTrigger =
    event.openQuestions && event.openQuestions.length > 0
      ? event.openQuestions[0]
      : event.adversarialCheck?.counterHypothesis || undefined;
  const nextTrigger = rawNextTrigger ? humanizeEntityTokens(rawNextTrigger) : undefined;

  return {
    id: event.eventId,
    entityLabel: humanizeEntityId(event.canonicalEntityId),
    headline: humanizeEntityTokens(event.title),
    whatChanged: humanizeEntityTokens(event.summary),
    whyItMatters: humanizeEntityTokens(event.implications?.[0] || event.materiality.reasoning),
    changeFrom: event.changeInView?.priorAssessment,
    changeTo: event.changeInView?.newAssessment,
    confidenceText: confidenceLabel(event.confidenceScore),
    materialityText: materialityPriorityLabel(event.materiality.priority),
    riskState,
    nextTrigger,
    kind: 'event',
    raw: event,
  };
}

function deltaToChangeItem(story: DeltaStoryItem): ChangeItem {
  const riskState = riskStateFromDeltaStory(story);
  const whatChanged = humanizeEntityTokens(story.whatChanged);
  return {
    id: story.id,
    entityLabel: humanizeEntityTokens(story.entityName),
    headline: whatChanged.length > 90 ? whatChanged.slice(0, 87) + '...' : whatChanged,
    whatChanged,
    whyItMatters: humanizeEntityTokens(story.whyItMatters || story.portfolioImpact),
    confidenceText: confidenceLabel(story.confidenceScore),
    materialityText: materialityScoreLabel(story.materialityScore),
    riskState,
    nextTrigger: story.whatWouldChangeOurView ? humanizeEntityTokens(story.whatWouldChangeOurView) : undefined,
    kind: 'delta',
    raw: story,
  };
}

function toneColor(tone: RiskState['tone']): string {
  if (tone === 'red') return '#f43f5e';
  if (tone === 'amber') return '#d4af37';
  if (tone === 'green') return '#10b981';
  return '#626f84';
}

/** Pulls up to two not-yet-confirmed emerging-signal facts out of the active event set. */
function extractEarlySignals(events: CanonicalIntelligenceEvent[]): EpistemicClaim[] {
  const seen = new Set<string>();
  const signals: EpistemicClaim[] = [];
  for (const event of events) {
    for (const fact of event.facts || []) {
      if (fact.type === 'EMERGING_SIGNAL' || fact.type === 'HYPOTHESIS') {
        const key = fact.statement.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          signals.push(fact);
        }
      }
    }
  }
  return signals.slice(0, 2);
}

export default function IntelligenceBriefing({
  briefing,
  canonicalEvents,
  portfolioProfile,
  portfolioSymbols,
  isResearching,
  onRefreshAnalysis,
  onOpenChangeDetail,
  onOpenEntityDossier,
  onOpenResearchTrace,
  onOpenPortfolioProfile,
  onOpenManagePortfolio,
}: IntelligenceBriefingProps) {
  const quietEntities: QuietEntityReport[] = briefing?.quietEntities || [];
  const crossSynthesis = briefing?.crossEntitySynthesis || null;

  // "What Changed" — prefer richly-structured canonical events, fall back to delta stories
  const changeItems: ChangeItem[] = useMemo(() => {
    if (canonicalEvents && canonicalEvents.length > 0) {
      return [...canonicalEvents]
        .sort((a, b) => b.materiality.materialityScore - a.materiality.materialityScore)
        .slice(0, 5)
        .map(eventToChangeItem);
    }
    if (briefing?.deltaStories && briefing.deltaStories.length > 0) {
      return [...briefing.deltaStories]
        .sort((a, b) => b.materialityScore - a.materialityScore)
        .slice(0, 5)
        .map(deltaToChangeItem);
    }
    return [];
  }, [canonicalEvents, briefing]);

  const riskPicture = useMemo(
    () => computePortfolioRiskPicture(canonicalEvents, crossSynthesis),
    [canonicalEvents, crossSynthesis]
  );

  const earlySignals = useMemo(() => extractEarlySignals(canonicalEvents), [canonicalEvents]);

  const domainLabel = (portfolioProfile?.primaryDomain || briefing?.portfolioDomain || 'PORTFOLIO').replace(/_/g, ' ').toUpperCase();

  // Analyst bottom line (zone B) — the single most important sentence
  const rawAnalystLine = crossSynthesis?.summary || briefing?.overview || null;
  const analystLine = rawAnalystLine ? humanizeEntityTokens(rawAnalystLine) : null;

  // Concluding bottom line (zone F) — fuller cross-entity synthesis
  const rawBottomLine = briefing?.overview && briefing.overview !== rawAnalystLine ? briefing.overview : briefing?.marketMood || null;
  const bottomLine = rawBottomLine ? humanizeEntityTokens(rawBottomLine) : null;

  const stableCount = quietEntities.length;
  const materialCount = changeItems.length;
  const signalCount = earlySignals.length;

  // Portfolio Pulse: per-symbol compact risk chips
  const pulseEntries = useMemo(
    () =>
      portfolioSymbols.map((symbol) => ({
        symbol,
        name: getTickerMeta(symbol)?.name || symbol,
        state: riskStateForSymbol(symbol, canonicalEvents, quietEntities),
      })),
    [portfolioSymbols, canonicalEvents, quietEntities]
  );

  const hasAnyAnalysis = changeItems.length > 0 || quietEntities.length > 0;

  return (
    <section className="ib-wrap" aria-label="Portfolio Intelligence Briefing">
      {/* Zone A: Portfolio State */}
      <div className="ib-state-row">
        <span className="ib-domain-label">{domainLabel}</span>
        <span className="ib-live-pill">
          <span className="ib-live-dot" />
          LIVE
        </span>
      </div>

      <div className="ib-risk-headline">
        <span className={`ib-risk-label tone-${riskPicture.tone}`}>Risk picture: {riskPicture.label}</span>
        <span className={`ib-risk-arrow tone-${riskPicture.tone}`}>{riskPicture.arrow}</span>
      </div>

      {/* Zone B: Analyst Bottom Line */}
      {isResearching && !hasAnyAnalysis ? (
        <p className="ib-analyst-line" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Running senior analyst review across your portfolio...
        </p>
      ) : analystLine ? (
        <p className="ib-analyst-line">{analystLine}</p>
      ) : null}

      <div className="ib-counts-row" style={{ marginTop: 8 }}>
        {materialCount} material change{materialCount === 1 ? '' : 's'}
        {signalCount > 0 && (
          <>
            <span className="dot-sep">·</span>
            {signalCount} emerging signal{signalCount === 1 ? '' : 's'}
          </>
        )}
        {stableCount > 0 && (
          <>
            <span className="dot-sep">·</span>
            {stableCount} stable
          </>
        )}
      </div>

      <hr className="ib-rule" />

      {/* Zone C: What Changed */}
      <div className="ib-section-title">What Changed</div>
      {changeItems.length === 0 ? (
        <p className="ib-empty-state">
          {isResearching
            ? 'Senior analyst review in progress — checking for material developments...'
            : 'No material incremental developments since the previous research cycle.'}
        </p>
      ) : (
        <div className="ib-change-list">
          {changeItems.map((item) => (
            <div key={item.id} className="ib-change-item" onClick={() => onOpenChangeDetail(item)}>
              <span className="ib-change-dot" style={{ background: toneColor(item.riskState.tone) }} />
              <div className="ib-change-body">
                <div className="ib-change-top-row">
                  <span className="ib-change-entity">{item.entityLabel}</span>
                </div>
                <div className="ib-change-headline">{item.headline}</div>
                <p className="ib-change-desc">{item.whatChanged}</p>

                {item.changeFrom && item.changeTo && (
                  <div className={`ib-change-view-row tone-${item.riskState.tone}`}>
                    <span className="ib-change-view-label">View:</span>
                    <span>{item.changeFrom} → {item.changeTo}</span>
                  </div>
                )}

                <p className="ib-change-why">
                  <strong>Why it matters: </strong>
                  {item.whyItMatters}
                </p>

                <div className="ib-change-footer">
                  <span className={`tone-${item.riskState.tone}`}>{item.confidenceText}</span>
                  <span className="dot-sep">·</span>
                  <span style={{ color: 'var(--text-muted)' }}>{item.materialityText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone D: Portfolio Pulse */}
      {pulseEntries.length > 0 && (
        <>
          <hr className="ib-rule" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="ib-section-title">Portfolio Pulse</div>
            <button className="ib-link-btn" onClick={onOpenManagePortfolio} style={{ marginBottom: 12 }}>
              Manage
            </button>
          </div>
          <div className="ib-pulse-strip">
            {pulseEntries.map(({ symbol, state }) => (
              <button key={symbol} className="ib-pulse-chip" onClick={() => onOpenEntityDossier(symbol)}>
                <span className="ib-pulse-symbol">{symbol}</span>
                <span className={`ib-pulse-state tone-${state.tone}`}>
                  {state.label} {state.arrow}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Quiet assets — visually minor */}
      {quietEntities.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {quietEntities.map((q) => (
            <div key={q.entityId} className="ib-quiet-row">
              <span className="ib-quiet-symbol">{humanizeEntityTokens(q.entityName)}</span>
              <span className="ib-quiet-meta">
                Stable · No material change
                {q.activeWatchpoints?.length > 0 && ` · Monitoring: ${humanizeEntityTokens(q.activeWatchpoints[0])}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Zone E: Early Signals */}
      {earlySignals.length > 0 && (
        <>
          <hr className="ib-rule" />
          <div className="ib-section-title">Early Signals</div>
          {earlySignals.map((signal) => (
            <div key={signal.id} className="ib-signal-box" style={{ marginBottom: 8 }}>
              {humanizeEntityTokens(signal.statement)}
              <div className="ib-signal-meta">
                <span>Status: Emerging</span>
                <span>Confidence: {signal.confidence >= 60 ? 'Medium' : 'Low'}</span>
                <span>Not yet sufficient to change portfolio risk</span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Zone F: Bottom Line */}
      {bottomLine && (
        <>
          <hr className="ib-rule" />
          <div className="ib-section-title">Bottom Line</div>
          <p className="ib-bottomline">{bottomLine}</p>
        </>
      )}

      <hr className="ib-rule" />

      {/* Progressive disclosure links */}
      <div className="ib-links-row">
        <button className="ib-link-btn" onClick={onOpenPortfolioProfile}>
          Intelligence Profile <ArrowRight size={13} />
        </button>
        {canonicalEvents.length > 0 && (
          <button className="ib-link-btn" onClick={onOpenResearchTrace}>
            Research Trace <ArrowRight size={13} />
          </button>
        )}
        <button className="ib-refresh-btn" onClick={onRefreshAnalysis} disabled={isResearching}>
          <RefreshCw size={12} style={{ animation: isResearching ? 'spin 1s linear infinite' : 'none' }} />
          {isResearching ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>
    </section>
  );
}
