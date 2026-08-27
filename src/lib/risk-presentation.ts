/**
 * PulseNews Risk Presentation Helpers
 * Pure UI-layer derivation of analyst-facing risk states from existing canonical
 * event / delta-story / quiet-entity data. Does not touch the research engine —
 * it only decides how to *label and color* what the backend already produced.
 */

import { CanonicalIntelligenceEvent, DeltaStoryItem, QuietEntityReport, CrossPortfolioSynthesis, MaterialityAssessment } from './types';

export type RiskTone = 'red' | 'amber' | 'green' | 'gray';

export interface RiskState {
  label: string;
  tone: RiskTone;
  arrow: '↑' | '↓' | '→';
}

const RISK_DIRECTION_FALLBACK: RiskState = { label: 'MONITORING', tone: 'gray', arrow: '→' };

/** Maps a materiality assessment (risk direction + priority) into a named analyst risk state. */
export function riskStateFromMateriality(materiality: MaterialityAssessment): RiskState {
  const { riskDirection, priority } = materiality;

  if (riskDirection === 'POSITIVE') return { label: 'IMPROVING', tone: 'green', arrow: '↓' };
  if (riskDirection === 'NEUTRAL') return { label: 'STABLE', tone: 'gray', arrow: '→' };
  if (riskDirection === 'MIXED') return { label: 'WATCH', tone: 'amber', arrow: '↑' };

  // NEGATIVE
  if (priority === 'CRITICAL') return { label: 'STRESSED', tone: 'red', arrow: '↑' };
  if (priority === 'HIGH') return { label: 'HIGH', tone: 'red', arrow: '↑' };
  if (priority === 'MEDIUM') return { label: 'ELEVATED', tone: 'amber', arrow: '↑' };
  return { label: 'WATCH', tone: 'amber', arrow: '↑' };
}

/** Maps a delta story (which carries riskDirection + a numeric materiality score) into a risk state. */
export function riskStateFromDeltaStory(story: DeltaStoryItem): RiskState {
  const pseudoPriority: MaterialityAssessment['priority'] =
    story.materialityScore >= 85 ? 'CRITICAL' : story.materialityScore >= 65 ? 'HIGH' : story.materialityScore >= 40 ? 'MEDIUM' : 'LOW';
  return riskStateFromMateriality({
    riskDirection: story.riskDirection,
    priority: pseudoPriority,
  } as MaterialityAssessment);
}

/** Overall portfolio-level risk picture, derived from the set of active canonical events. */
export function computePortfolioRiskPicture(
  events: CanonicalIntelligenceEvent[],
  crossSynthesis?: CrossPortfolioSynthesis | null
): RiskState {
  if (!events || events.length === 0) return { label: 'STABLE', tone: 'green', arrow: '→' };

  const negativeEvents = events.filter((e) => e.materiality.riskDirection === 'NEGATIVE');
  const severeCount = negativeEvents.filter((e) => e.materiality.priority === 'CRITICAL' || e.materiality.priority === 'HIGH').length;

  if (crossSynthesis?.riskClassification === 'SYSTEMIC' || severeCount >= 2) {
    return { label: 'HIGH', tone: 'red', arrow: '↑' };
  }
  if (negativeEvents.length >= 1) {
    return { label: 'ELEVATED', tone: 'amber', arrow: '↑' };
  }
  return { label: 'STABLE', tone: 'green', arrow: '→' };
}

/** Confidence label from a 0-100 confidence score, in analyst language rather than raw numbers. */
export function confidenceLabel(confidence: number): string {
  if (confidence >= 85) return 'CONFIRMED';
  if (confidence >= 60) return 'LIKELY';
  return 'PRELIMINARY';
}

/** Materiality label from a 0-100 materiality score. */
export function materialityScoreLabel(score: number): string {
  if (score >= 75) return 'HIGH MATERIALITY';
  if (score >= 45) return 'MEDIUM MATERIALITY';
  return 'LOW MATERIALITY';
}

/** Materiality label directly from a MaterialityAssessment priority. */
export function materialityPriorityLabel(priority: MaterialityAssessment['priority']): string {
  if (priority === 'CRITICAL' || priority === 'HIGH') return 'HIGH MATERIALITY';
  if (priority === 'MEDIUM') return 'MEDIUM MATERIALITY';
  return 'LOW MATERIALITY';
}

/**
 * Resolves the best-matching canonical event or quiet-entity report for a given
 * portfolio symbol, using the "ENT_<SYMBOL>" convention produced by the entity
 * resolver, with a permissive fallback to substring matching on id/name/title.
 */
export function matchEntityForSymbol(
  symbol: string,
  events: CanonicalIntelligenceEvent[],
  quietEntities: QuietEntityReport[]
): { event: CanonicalIntelligenceEvent | null; quiet: QuietEntityReport | null } {
  const upperSym = symbol.toUpperCase();
  const exactEntId = `ENT_${upperSym}`;

  const matchingEvents = (events || []).filter((e) => {
    const entId = (e.canonicalEntityId || '').toUpperCase();
    return entId === exactEntId || entId.includes(upperSym) || e.title.toUpperCase().includes(upperSym);
  });

  const bestEvent =
    matchingEvents.length > 0
      ? matchingEvents.sort((a, b) => b.materiality.materialityScore - a.materiality.materialityScore)[0]
      : null;

  const quiet =
    (quietEntities || []).find((q) => {
      const entId = (q.entityId || '').toUpperCase();
      return entId === exactEntId || entId.includes(upperSym) || (q.entityName || '').toUpperCase().includes(upperSym);
    }) || null;

  return { event: bestEvent, quiet };
}

/**
 * Strips internal "ENT_..." canonical-entity-id tokens out of backend-generated
 * display text (titles, summaries), replacing them with a human-readable label.
 * Presentation-only — never touches the underlying research/event data.
 */
const HTML_ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
};

export function humanizeEntityTokens(text: string): string {
  if (!text) return text;
  const withoutEntityIds = text.replace(/\b(?:ENT_)+([A-Z0-9_]+)\b/g, (_match, rest: string) => rest.replace(/_/g, ' '));
  return withoutEntityIds
    .replace(/&nbsp;|&amp;|&quot;|&#39;|&apos;|&lt;|&gt;/g, (m) => HTML_ENTITY_MAP[m])
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Strips repeated "ENT_" prefixes from a canonical entity id and spaces out the remainder. */
export function humanizeEntityId(entityId: string): string {
  return entityId.replace(/^(?:ENT_)+/, '').replace(/_/g, ' ');
}

export function riskStateForSymbol(
  symbol: string,
  events: CanonicalIntelligenceEvent[],
  quietEntities: QuietEntityReport[]
): RiskState {
  const { event, quiet } = matchEntityForSymbol(symbol, events, quietEntities);
  if (event) return riskStateFromMateriality(event.materiality);
  if (quiet) return { label: 'STABLE', tone: 'green', arrow: '→' };
  return RISK_DIRECTION_FALLBACK;
}
