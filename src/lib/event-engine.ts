/**
 * PulseNews Event-Centric Intelligence Engine
 * Transforms incoming evidence into canonical events, detects event vs source novelty, and tracks lifecycle states.
 */

import {
  CanonicalIntelligenceEvent,
  EvidenceItem,
  EpistemicClaim,
  MetricDelta,
  MaterialityAssessment,
  EventLifecycleState,
} from './types';
import { resolveCanonicalEntity } from './entity-resolver';
import { AnalyzedEvent, materialityFromAnalysis } from './analysis-engine';

// In-memory canonical event store (L1 cache)
const L1_EVENT_STORE = new Map<string, CanonicalIntelligenceEvent>();

/**
 * Generates a deduplication clustering key for an event based on entity, topic, and core metrics
 */
export function generateEventClusterKey(entityId: string, title: string, text: string): string {
  const cleanEntity = entityId.toUpperCase().trim();
  const normalized = `${title} ${text}`.toLowerCase();

  // Extract core keywords
  let topic = 'general';
  if (normalized.includes('redemption') || normalized.includes('tender offer') || normalized.includes('repurchase')) {
    topic = 'redemption_liquidity';
  } else if (normalized.includes('non-accrual') || normalized.includes('default') || normalized.includes('covenant')) {
    topic = 'credit_deterioration';
  } else if (normalized.includes('nav') || normalized.includes('net asset value') || normalized.includes('fair value')) {
    topic = 'valuation_nav';
  } else if (normalized.includes('capex') || normalized.includes('gpu') || normalized.includes('hyperscaler') || normalized.includes('semiconductor')) {
    topic = 'tech_capex_demand';
  } else if (normalized.includes('earnings') || normalized.includes('revenue') || normalized.includes('guidance')) {
    topic = 'earnings_performance';
  } else if (normalized.includes('rate') || normalized.includes('yield') || normalized.includes('fed') || normalized.includes('treasury')) {
    topic = 'macro_rate_spread';
  }

  return `${cleanEntity}__${topic}`;
}

/**
 * Builds (or merges into) a canonical event from a fully analyzed development.
 *
 * This is the production path: every user-visible field comes from the analysis
 * engine's reasoning over evidence, never from raw scraped text or a template.
 */
export function buildEventFromAnalysis(
  analysis: AnalyzedEvent,
  entityId: string,
  portfolioId: string
): { event: CanonicalIntelligenceEvent; isNewEvent: boolean } {
  const canonicalEntity = resolveCanonicalEntity(entityId);
  const clusterKey = generateEventClusterKey(canonicalEntity.id, analysis.headline, analysis.whatChanged);
  const existingEvent = L1_EVENT_STORE.get(clusterKey);

  const latestPublishedAt =
    analysis.sources
      .map((s) => s.publishedAt)
      .sort()
      .reverse()[0] || new Date().toISOString();

  // Merge into an ongoing event: accumulate sources and roll metrics forward as deltas
  if (existingEvent) {
    for (const src of analysis.sources) {
      if (!existingEvent.sources.some((s) => s.url === src.url)) {
        existingEvent.sources.push(src);
      }
    }

    let hasMetricDelta = false;
    for (const m of analysis.metrics) {
      const existingMetric = existingEvent.metrics.find((em) => em.metricName === m.metricName);
      if (existingMetric) {
        if (String(existingMetric.currentValue) !== String(m.currentValue)) {
          existingMetric.previousValue = existingMetric.currentValue;
          existingMetric.currentValue = m.currentValue;
          hasMetricDelta = true;
        }
      } else {
        existingEvent.metrics.push(m);
        hasMetricDelta = true;
      }
    }

    // A materially stronger read supersedes the prior summary
    if (analysis.materialityScore > existingEvent.materiality.materialityScore) {
      existingEvent.title = analysis.headline;
      existingEvent.summary = analysis.whatChanged;
      existingEvent.materiality = materialityFromAnalysis(analysis);
      existingEvent.confidenceScore = analysis.confidenceScore;
      existingEvent.implications = [analysis.whyItMatters];
      existingEvent.openQuestions = analysis.openQuestions;
      existingEvent.nextTrigger = analysis.nextTrigger;
    }

    existingEvent.lastEvidenceAt = latestPublishedAt;
    existingEvent.lifecycleState = hasMetricDelta ? 'EVIDENCE_ACCUMULATING' : existingEvent.lifecycleState;

    return { event: existingEvent, isNewEvent: false };
  }

  const eventId = `evt_${canonicalEntity.id.toLowerCase()}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 5)}`;

  const facts: EpistemicClaim[] = analysis.factsEstablished.map((statement, i) => ({
    id: `claim_${eventId}_${i}`,
    entityId: canonicalEntity.id,
    type: analysis.sources.some((s) => s.tier === 'TIER_1_PRIMARY') ? 'OBSERVED_FACT' : 'SUPPORTED_INFERENCE',
    statement,
    supportingEvidenceIds: [],
    confidence: analysis.confidenceScore,
    provenance: analysis.sources.map((s) => s.publisher).join(', ') || 'Analysed evidence',
  }));

  const newEvent: CanonicalIntelligenceEvent = {
    eventId,
    canonicalEntityId: canonicalEntity.id,
    portfolioIds: [portfolioId],
    eventType: clusterKey.split('__')[1]?.toUpperCase() || 'GENERAL_UPDATE',
    title: analysis.headline,
    summary: analysis.whatChanged,
    sources: analysis.sources,
    nextTrigger: analysis.nextTrigger,
    lifecycleState: 'VALIDATED',
    firstSeenAt: latestPublishedAt,
    lastEvidenceAt: latestPublishedAt,
    eventDate: latestPublishedAt,
    facts,
    metrics: analysis.metrics,
    evidenceIds: [],
    materiality: materialityFromAnalysis(analysis),
    confidenceScore: analysis.confidenceScore,
    implications: [analysis.whyItMatters],
    openQuestions: analysis.openQuestions,
    relatedEventIds: [],
    changeInView:
      analysis.priorAssessment && analysis.newAssessment
        ? {
            priorAssessment: analysis.priorAssessment,
            newAssessment: analysis.newAssessment,
            magnitude: analysis.materialityScore >= 75 ? 'HIGH' : analysis.materialityScore >= 45 ? 'MEDIUM' : 'LOW',
            triggerEventIds: [eventId],
            rationale: analysis.reasoning,
          }
        : undefined,
  };

  L1_EVENT_STORE.set(clusterKey, newEvent);
  return { event: newEvent, isNewEvent: true };
}

/**
 * Retrieves all canonical events currently held in memory
 */
export function getAllCanonicalEvents(): CanonicalIntelligenceEvent[] {
  return Array.from(L1_EVENT_STORE.values());
}
