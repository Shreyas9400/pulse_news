/**
 * PulseNews Contradiction & Adversarial QA Challenge Engine
 * Hunts for evidence conflicts and executes adversarial challenge passes ("What could make this conclusion wrong?").
 */

import { EvidenceConflict, EvidenceItem, EpistemicClaim, CompetingHypothesis } from './types';

/**
 * Detects conflicts between new incoming evidence and previously established claims
 */
export function detectEvidenceConflicts(
  newEvidence: EvidenceItem,
  existingClaims: EpistemicClaim[],
  entityId: string
): EvidenceConflict[] {
  const conflicts: EvidenceConflict[] = [];
  const text = newEvidence.snippet.toLowerCase();

  for (const claim of existingClaims) {
    const claimLower = claim.statement.toLowerCase();

    // Check for numerical metric contradiction (e.g. 2.2% vs 3.2% or 14% vs 17%)
    const numMatchA = claimLower.match(/(\d+(?:\.\d+)?%)/);
    const numMatchB = text.match(/(\d+(?:\.\d+)?%)/);

    if (numMatchA && numMatchB && numMatchA[1] !== numMatchB[1]) {
      // Check if they are discussing the same metric keyword
      const metricKeywords = ['redemption', 'non-accrual', 'nav', 'margin', 'repurchase', 'yield'];
      const sharedKeyword = metricKeywords.find((k) => claimLower.includes(k) && text.includes(k));

      if (sharedKeyword) {
        conflicts.push({
          conflictId: `conf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
          entityId,
          claims: [
            { claimText: claim.statement, evidenceId: claim.supportingEvidenceIds[0] || 'PRIOR_CLAIM', sourceName: claim.provenance, publishedDate: claim.asOfDate || 'PREVIOUS' },
            { claimText: newEvidence.snippet, evidenceId: newEvidence.id, sourceName: newEvidence.sourceName, publishedDate: newEvidence.publishedAt },
          ],
          conflictType: 'VALUE',
          resolutionStatus: 'UNRESOLVED',
          resolutionExplanation: `Discrepancy detected on ${sharedKeyword}: ${numMatchA[1]} vs ${numMatchB[1]}. Evaluating whether difference stems from preliminary vs final data, differing reporting dates, or definition scope.`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Runs an Adversarial Challenge Pass on a preliminary analytical conclusion
 */
export function challengePreliminaryConclusion(params: {
  entityName: string;
  conclusion: string;
  supportingFacts: string[];
  refutingFacts?: string[];
  domain: string;
}): {
  passed: boolean;
  counterHypothesis: string;
  vulnerabilitiesIdentified: string[];
  robustnessScore: number;
  mitigationQuestions: string[];
} {
  const { entityName, conclusion, supportingFacts, domain } = params;
  const vulnerabilities: string[] = [];
  const mitigationQuestions: string[] = [];

  const lower = conclusion.toLowerCase();

  // Challenge 1: Single-source dependency or syndication risk
  if (supportingFacts.length < 2) {
    vulnerabilities.push('Single-source dependency: Conclusion relies on a single reporting channel without independent corroboration.');
    mitigationQuestions.push(`Can independent primary SEC filings or official company statements corroborate this report?`);
  }

  // Challenge 2: Survivorship or seasonal bias
  if (lower.includes('deteriorating') || lower.includes('elevated') || lower.includes('pressure')) {
    vulnerabilities.push('Potential cyclical/seasonal bias: Elevation in metric could represent standard calendar-year tender cycles or temporary timing mismatches.');
    mitigationQuestions.push(`Is this metric change seasonal compared against previous year quarterly baselines?`);
  }

  // Challenge 3: Offsetting positive catalysts
  if (lower.includes('liquidity') || lower.includes('redemption')) {
    vulnerabilities.push('Incomplete liquidity buffer analysis: Manager may hold undrawn credit facilities or asset sale capacity not reflected in headlines.');
    mitigationQuestions.push(`Has management expanded revolving credit facilities or liquidity coverage buffers?`);
  }

  const robustnessScore = Math.max(100 - vulnerabilities.length * 25, 40);
  const passed = robustnessScore >= 60;

  return {
    passed,
    counterHypothesis: `Alternative: Developments at ${entityName} reflect temporary operating adjustments rather than systemic distress.`,
    vulnerabilitiesIdentified: vulnerabilities,
    robustnessScore,
    mitigationQuestions,
  };
}
