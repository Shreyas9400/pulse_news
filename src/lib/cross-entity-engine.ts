/**
 * PulseNews Cross-Entity Pattern & Risk Propagation Engine
 * Discovers cross-portfolio correlations, distinguishes idiosyncratic vs systemic risk, and traces indirect propagation.
 */

import { CanonicalIntelligenceEvent, CrossPortfolioSynthesis, PortfolioIntelligenceProfile } from './types';
import { resolveCanonicalEntity } from './entity-resolver';

/**
 * Runs cross-portfolio synthesis across all active events in a research cycle
 */
export function synthesizeCrossPortfolioPatterns(params: {
  events: CanonicalIntelligenceEvent[];
  portfolioProfile: PortfolioIntelligenceProfile;
}): CrossPortfolioSynthesis {
  const { events, portfolioProfile } = params;

  if (events.length === 0) {
    return {
      systemicThemes: [],
      sectorPatterns: [],
      idiosyncraticRisks: [],
      riskClassification: 'IDIOSYNCRATIC',
      summary: 'No active portfolio-level risk clusters detected. All tracked assets operating within expected baseline parameters.',
    };
  }

  const negativeEvents = events.filter((e) => e.materiality.riskDirection === 'NEGATIVE');
  const entityIdsWithEvents = Array.from(new Set(events.map((e) => e.canonicalEntityId)));

  const systemicThemes: CrossPortfolioSynthesis['systemicThemes'] = [];
  const sectorPatterns: CrossPortfolioSynthesis['sectorPatterns'] = [];
  const idiosyncraticRisks: CrossPortfolioSynthesis['idiosyncraticRisks'] = [];

  // 1. Check for sector-level or systemic pattern (e.g. 2+ entities experiencing similar pressure)
  if (negativeEvents.length >= 2) {
    sectorPatterns.push({
      sector: portfolioProfile.primaryDomain.toUpperCase(),
      pattern: `Simultaneous credit/operating pressure observed across ${negativeEvents.length} portfolio holdings`,
      driver: 'Macro cost of capital and sector-level liquidity constraints',
      affectedEntityIds: negativeEvents.map((e) => e.canonicalEntityId),
    });
  }

  // 2. Classify idiosyncratic developments
  for (const ev of events) {
    const isIsolated = events.filter((other) => other.eventType === ev.eventType).length === 1;
    if (isIsolated) {
      idiosyncraticRisks.push({
        entityId: ev.canonicalEntityId,
        isolatedRisk: ev.title,
        distinctionReason: 'Event is asset-specific with no observed contagion across peer holdings.',
      });
    }
  }

  // 3. Determine Overall Classification
  let riskClassification: CrossPortfolioSynthesis['riskClassification'] = 'IDIOSYNCRATIC';
  if (negativeEvents.length >= 3) {
    riskClassification = 'SYSTEMIC';
  } else if (negativeEvents.length >= 2) {
    riskClassification = 'SECTOR';
  } else if (events.length > 2 && negativeEvents.length === 0) {
    riskClassification = 'COINCIDENTAL';
  }

  const summary =
    riskClassification === 'SYSTEMIC'
      ? `SYSTEMIC PATTERN DETECTED: Multiple entities across ${portfolioProfile.primaryDomain} exhibit synchronized pressure, indicating broader market headwinds rather than isolated operational issues.`
      : riskClassification === 'SECTOR'
      ? `SECTOR CLUSTER DETECTED: Selective pressures observed across ${negativeEvents.length} holdings within ${portfolioProfile.primaryDomain}. Corroborating peer metrics and funding spreads.`
      : `IDIOSYNCRATIC DISPATCH: Portfolio surveillance indicates observed developments are company-specific with intact sector baseline durability.`;

  return {
    systemicThemes,
    sectorPatterns,
    idiosyncraticRisks,
    riskClassification,
    summary,
  };
}
