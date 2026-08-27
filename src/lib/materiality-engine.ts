/**
 * PulseNews Contextual Materiality & Primary Source Escalation Engine
 * Scores events based on portfolio exposure, magnitude, and systemic relevance, and enforces escalation policies.
 */

import { MaterialityAssessment, PortfolioIntelligenceProfile, CanonicalIntelligenceEvent } from './types';

/**
 * Assesses contextual materiality for an event within a specific portfolio and domain profile
 */
export function assessEventMateriality(params: {
  event: CanonicalIntelligenceEvent;
  portfolioProfile: PortfolioIntelligenceProfile;
  isDirectPortfolioHolding: boolean;
}): MaterialityAssessment {
  const { event, portfolioProfile, isDirectPortfolioHolding } = params;
  const text = `${event.title} ${event.summary}`.toLowerCase();

  // Factors (0 - 100)
  let changeMagnitude = 50;
  let financialImpact = 50;
  let portfolioExposure = isDirectPortfolioHolding ? 95 : 40;
  let liquidityImpact = 50;
  let valuationImpact = 50;
  let strategicImportance = 60;
  let systemicRelevance = 50;
  let novelty = 70;
  let sourceConfidence = event.confidenceScore || 75;

  // Domain-specific metric weighting
  if (portfolioProfile.primaryDomain === 'private_credit') {
    if (text.includes('redemption') || text.includes('tender offer') || text.includes('repurchase')) {
      liquidityImpact = 90;
      changeMagnitude = 85;
    }
    if (text.includes('non-accrual') || text.includes('default') || text.includes('covenant')) {
      financialImpact = 85;
      valuationImpact = 80;
    }
    if (text.includes('nav') || text.includes('net asset value')) {
      valuationImpact = 85;
    }
  } else if (portfolioProfile.primaryDomain === 'tech_semiconductors') {
    if (text.includes('capex') || text.includes('hyperscaler') || text.includes('hbm') || text.includes('gpu')) {
      strategicImportance = 90;
      changeMagnitude = 85;
    }
    if (text.includes('export control') || text.includes('tariff') || text.includes('restriction')) {
      systemicRelevance = 85;
    }
  }

  // Calculate composite materiality score
  const weightedScore =
    changeMagnitude * 0.2 +
    financialImpact * 0.15 +
    portfolioExposure * 0.2 +
    liquidityImpact * 0.1 +
    valuationImpact * 0.1 +
    strategicImportance * 0.1 +
    systemicRelevance * 0.05 +
    novelty * 0.1;

  const materialityScore = Math.min(Math.round(weightedScore), 100);

  // Determine Risk Direction
  let riskDirection: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED' = 'NEUTRAL';
  if (text.includes('default') || text.includes('loss') || text.includes('deteriorat') || text.includes('pressure') || text.includes('gating')) {
    riskDirection = 'NEGATIVE';
  } else if (text.includes('growth') || text.includes('expansion') || text.includes('raised') || text.includes('upgraded') || text.includes('record')) {
    riskDirection = 'POSITIVE';
  }

  // Priority
  let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (materialityScore >= 85) priority = 'CRITICAL';
  else if (materialityScore >= 70) priority = 'HIGH';
  else if (materialityScore <= 40) priority = 'LOW';

  return {
    materialityScore,
    confidenceScore: sourceConfidence,
    riskDirection,
    reasoning: `Materiality evaluated at ${materialityScore}/100. Portfolio exposure: ${portfolioExposure}/100, Magnitude: ${changeMagnitude}/100.`,
    priority,
    factors: {
      changeMagnitude,
      financialImpact,
      portfolioExposure,
      liquidityImpact,
      valuationImpact,
      strategicImportance,
      systemicRelevance,
      novelty,
      sourceConfidence,
    },
  };
}

/**
 * Enforces Primary-Source Escalation Policy based on materiality:
 * - < 40: Secondary sources acceptable
 * - 40 - 70: Prefer independent confirmation
 * - 70 - 85: Seek primary source (SEC EDGAR / IR)
 * - 85+: Primary source + independent confirmation + adversarial challenge required
 */
export function getEscalationRequirement(materialityScore: number): {
  requirePrimarySource: boolean;
  requireIndependentConfirmation: boolean;
  requireAdversarialChallenge: boolean;
  policyLabel: string;
} {
  if (materialityScore >= 85) {
    return {
      requirePrimarySource: true,
      requireIndependentConfirmation: true,
      requireAdversarialChallenge: true,
      policyLabel: 'Level 4 Escalation: Primary Filing + Independent Confirmation + Adversarial QA Required',
    };
  }
  if (materialityScore >= 70) {
    return {
      requirePrimarySource: true,
      requireIndependentConfirmation: true,
      requireAdversarialChallenge: false,
      policyLabel: 'Level 3 Escalation: Primary Filing Required',
    };
  }
  if (materialityScore >= 40) {
    return {
      requirePrimarySource: false,
      requireIndependentConfirmation: true,
      requireAdversarialChallenge: false,
      policyLabel: 'Level 2 Escalation: Independent Confirmation Preferred',
    };
  }
  return {
    requirePrimarySource: false,
    requireIndependentConfirmation: false,
    requireAdversarialChallenge: false,
    policyLabel: 'Level 1 Baseline: Secondary Reporting Acceptable',
  };
}
