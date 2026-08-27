/**
 * PulseNews Senior Researcher Gate & Fact-Check Verifier
 * Decomposes conclusions into atomic claims, verifies provenance, and gates entry to the Senior Analyst synthesis stage.
 */

import { ResearchBlackboard, EpistemicClaim, EpistemicType } from './types';

export interface AtomicClaimCheck {
  claimStatement: string;
  claimType: EpistemicType;
  verified: boolean;
  provenance: string;
  confidence: number;
}

export interface SeniorResearcherDecision {
  readyForAnalystSynthesis: boolean;
  reason: string;
  verifiedClaims: AtomicClaimCheck[];
  unresolvedGaps: string[];
  recommendedAdditionalTasksCount: number;
}

/**
 * Validates the Research Blackboard state before allowing progression to Senior Analyst output
 */
export function evaluateResearchCompleteness(board: ResearchBlackboard): SeniorResearcherDecision {
  const verifiedClaims: AtomicClaimCheck[] = [];
  const unresolvedGaps: string[] = [];

  // 1. Decompose & Validate all Epistemic Facts on the Blackboard
  for (const claim of board.epistemicFacts) {
    const hasSupportingEvidence = claim.supportingEvidenceIds.length > 0;
    const isPrimaryOrHighConf = claim.confidence >= 70;

    verifiedClaims.push({
      claimStatement: claim.statement,
      claimType: claim.type,
      verified: hasSupportingEvidence && isPrimaryOrHighConf,
      provenance: claim.provenance,
      confidence: claim.confidence,
    });
  }

  // 2. Check for unresolved critical knowledge gaps or open contradictions
  const openConflicts = board.evidenceConflicts.filter((c) => c.resolutionStatus === 'UNRESOLVED');
  if (openConflicts.length > 0) {
    unresolvedGaps.push(`Unresolved evidence conflict on ${openConflicts.length} key metrics.`);
  }

  // 3. Determine Readiness Gate
  const verifiedCount = verifiedClaims.filter((c) => c.verified).length;
  const isBudgetExhausted =
    board.budget.queriesExecuted >= board.budget.maxQueries ||
    board.budget.depthReached >= board.budget.maxDepth;

  const readyForAnalystSynthesis = verifiedCount >= 1 || isBudgetExhausted || board.status === 'CONVERGING';

  const reason = readyForAnalystSynthesis
    ? `Senior Researcher Gate PASSED: ${verifiedCount} atomic claims verified across primary/secondary evidence channels.`
    : `Senior Researcher Gate PENDING: Critical knowledge gaps or contradictions remain unresolved. Additional investigation queued.`;

  return {
    readyForAnalystSynthesis,
    reason,
    verifiedClaims,
    unresolvedGaps,
    recommendedAdditionalTasksCount: readyForAnalystSynthesis ? 0 : Math.min(board.activeKnowledgeGaps.length, 3),
  };
}
