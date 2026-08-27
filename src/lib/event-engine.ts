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
 * Extracts quantitative metric deltas from evidence text
 */
export function extractMetricDeltas(text: string): MetricDelta[] {
  const deltas: MetricDelta[] = [];

  // Match redemption / repurchase percentages
  const redemptionMatch = text.match(/redemption[s]?\s*(?:of|requests|demand)?\s*(?:reached|rose to|at|were)?\s*(\d+(?:\.\d+)?%)/i);
  if (redemptionMatch) {
    deltas.push({
      metricName: 'Redemption Demand',
      currentValue: redemptionMatch[1],
      unit: '%',
    });
  }

  // Match repurchase capacity percentages
  const repurchaseMatch = text.match(/repurchase[s]?\s*(?:capped at|capacity|limit)?\s*(\d+(?:\.\d+)?%)/i);
  if (repurchaseMatch) {
    deltas.push({
      metricName: 'Repurchase Capacity',
      currentValue: repurchaseMatch[1],
      unit: '%',
    });
  }

  // Match non-accrual percentages
  const nonAccrualMatch = text.match(/non-accrual[s]?\s*(?:rate|at|of)?\s*(\d+(?:\.\d+)?%)/i);
  if (nonAccrualMatch) {
    deltas.push({
      metricName: 'Non-Accrual Rate',
      currentValue: nonAccrualMatch[1],
      unit: '%',
    });
  }

  // Match NAV figures
  const navMatch = text.match(/NAV\s*(?:of|per share|at)?\s*\$?(\d+(?:\.\d+)?)/i);
  if (navMatch) {
    deltas.push({
      metricName: 'Net Asset Value',
      currentValue: `$${navMatch[1]}`,
      unit: 'USD',
    });
  }

  return deltas;
}

/**
 * Evaluates candidate evidence and either attaches it to an ongoing canonical event or creates a new canonical event
 */
export function processEvidenceIntoEvent(
  evidence: EvidenceItem,
  entityId: string,
  portfolioId: string
): { event: CanonicalIntelligenceEvent; isNewEvent: boolean; isNewSource: boolean } {
  const canonicalEntity = resolveCanonicalEntity(entityId);
  const clusterKey = generateEventClusterKey(canonicalEntity.id, evidence.sourceName, evidence.snippet);
  
  const existingEvent = L1_EVENT_STORE.get(clusterKey);
  const extractedMetrics = extractMetricDeltas(evidence.snippet);

  // 1. If an existing event exists within the same cluster
  if (existingEvent) {
    const isNewSource = !existingEvent.evidenceIds.includes(evidence.id);
    if (isNewSource) {
      existingEvent.evidenceIds.push(evidence.id);
      existingEvent.lastEvidenceAt = evidence.publishedAt;
    }

    // Check if new metrics represent an incremental delta (e.g. 17% -> 19%)
    let hasMetricDelta = false;
    for (const m of extractedMetrics) {
      const existingMetric = existingEvent.metrics.find((em) => em.metricName === m.metricName);
      if (existingMetric) {
        if (existingMetric.currentValue !== m.currentValue) {
          existingMetric.previousValue = existingMetric.currentValue;
          existingMetric.currentValue = m.currentValue;
          hasMetricDelta = true;
        }
      } else {
        existingEvent.metrics.push(m);
        hasMetricDelta = true;
      }
    }

    if (hasMetricDelta) {
      existingEvent.lifecycleState = 'EVIDENCE_ACCUMULATING';
      existingEvent.summary += ` [Updated: ${evidence.snippet.slice(0, 100)}]`;
    }

    return { event: existingEvent, isNewEvent: false, isNewSource };
  }

  // 2. Otherwise create a brand new Canonical Intelligence Event
  const eventId = `evt_${canonicalEntity.id.toLowerCase()}_${Date.now().toString(36)}`;
  
  const initialFact: EpistemicClaim = {
    id: `claim_${Date.now()}_1`,
    entityId: canonicalEntity.id,
    type: evidence.evidenceType === 'PRIMARY_FACT' ? 'OBSERVED_FACT' : 'SUPPORTED_INFERENCE',
    statement: evidence.snippet.slice(0, 200),
    supportingEvidenceIds: [evidence.id],
    confidence: evidence.authorityScore,
    provenance: `${evidence.sourceName} (${evidence.publisher})`,
  };

  const defaultMateriality: MaterialityAssessment = {
    materialityScore: evidence.authorityScore > 80 ? 78 : 55,
    confidenceScore: evidence.authorityScore,
    riskDirection: evidence.snippet.toLowerCase().includes('default') || evidence.snippet.toLowerCase().includes('pressure') ? 'NEGATIVE' : 'NEUTRAL',
    reasoning: `Initial event observation discovered via ${evidence.publisher}.`,
    priority: evidence.authorityScore > 80 ? 'HIGH' : 'MEDIUM',
    factors: {
      changeMagnitude: 70,
      financialImpact: 65,
      portfolioExposure: 80,
      liquidityImpact: 60,
      valuationImpact: 60,
      strategicImportance: 75,
      systemicRelevance: 50,
      novelty: 90,
      sourceConfidence: evidence.authorityScore,
    },
  };

  const newEvent: CanonicalIntelligenceEvent = {
    eventId,
    canonicalEntityId: canonicalEntity.id,
    portfolioIds: [portfolioId],
    eventType: clusterKey.split('__')[1]?.toUpperCase() || 'GENERAL_UPDATE',
    title: `${canonicalEntity.canonicalName}: ${evidence.sourceName}`,
    summary: evidence.snippet,
    lifecycleState: 'DETECTED',
    firstSeenAt: evidence.publishedAt,
    lastEvidenceAt: evidence.publishedAt,
    eventDate: evidence.publishedAt,
    facts: [initialFact],
    metrics: extractedMetrics,
    evidenceIds: [evidence.id],
    materiality: defaultMateriality,
    confidenceScore: evidence.authorityScore,
    implications: [`Assessing potential portfolio implications on ${canonicalEntity.canonicalName}.`],
    openQuestions: [`What are the full operational and financial implications of this development?`],
    relatedEventIds: [],
  };

  L1_EVENT_STORE.set(clusterKey, newEvent);
  return { event: newEvent, isNewEvent: true, isNewSource: true };
}

/**
 * Retrieves all canonical events currently held in memory
 */
export function getAllCanonicalEvents(): CanonicalIntelligenceEvent[] {
  return Array.from(L1_EVENT_STORE.values());
}
