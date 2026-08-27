/**
 * PulseNews Specialized Research Workers
 * Implements specialized research strategies executing against the ResearchTools facade and updating the ResearchBlackboard.
 */

import { ResearchTools } from './research-tools';
import { ResearchTask, ResearchBlackboard, EpistemicClaim, EvidenceItem, CompetingHypothesis } from './types';
import { addEvidenceToBlackboard, upsertHypothesis } from './research-blackboard';
import { detectEvidenceConflicts } from './adversarial-engine';
import { resolveCanonicalEntity } from './entity-resolver';

export class ResearchWorkers {
  /**
   * Executes a single atomic research task against the blackboard
   */
  public static async executeTask(
    task: ResearchTask,
    board: ResearchBlackboard
  ): Promise<{
    evidenceCollected: EvidenceItem[];
    newClaims: EpistemicClaim[];
    openGaps: string[];
  }> {
    task.status = 'RUNNING';
    board.budget.queriesExecuted += 1;
    board.budget.depthReached = Math.max(board.budget.depthReached, task.depth);

    const canonical = resolveCanonicalEntity(task.entityId);
    let evidenceCollected: EvidenceItem[] = [];

    // Route by task type
    switch (task.taskType) {
      case 'PRIMARY_SOURCE':
        evidenceCollected = await ResearchTools.fetchPrimarySEC(canonical.primaryTicker || task.entityId);
        break;

      case 'FINANCIAL':
      case 'CREDIT':
      case 'MARKET':
      case 'ALTERNATIVE_SIGNAL':
      case 'CONTRADICTION':
      case 'HYPOTHESIS_TEST':
      case 'DISCOVERY':
      default:
        evidenceCollected = await ResearchTools.searchWeb({
          query: task.question,
          entityId: task.entityId,
          maxResults: 6,
        });
        break;
    }

    const newClaims: EpistemicClaim[] = [];
    const openGaps: string[] = [];

    // Ingest evidence into blackboard
    for (const ev of evidenceCollected) {
      addEvidenceToBlackboard(board, ev);

      // Extract Epistemic Claim
      const claim: EpistemicClaim = {
        id: `claim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
        entityId: task.entityId,
        type: ev.evidenceType === 'PRIMARY_FACT' ? 'OBSERVED_FACT' : 'SUPPORTED_INFERENCE',
        statement: ev.snippet.slice(0, 220),
        supportingEvidenceIds: [ev.id],
        confidence: ev.authorityScore,
        provenance: `${ev.sourceName} (${ev.publisher})`,
      };
      newClaims.push(claim);
      board.epistemicFacts.push(claim);

      // Check for conflicts against existing claims
      const conflicts = detectEvidenceConflicts(ev, board.epistemicFacts, task.entityId);
      for (const c of conflicts) {
        board.evidenceConflicts.push(c);
      }
    }

    // Update targeted hypothesis if applicable
    if (task.targetHypothesisId) {
      const hyp = board.hypotheses.find((h) => h.id === task.targetHypothesisId);
      if (hyp) {
        if (evidenceCollected.length > 0) {
          hyp.evidenceFor.push(...evidenceCollected.map((e) => e.id));
          hyp.status = 'SUPPORTED';
          hyp.confidence = Math.min(hyp.confidence + 15, 95);
        } else {
          hyp.status = 'WEAKENED';
        }
      }
    }

    task.status = 'COMPLETED';
    board.completedTasks.push(task);

    return {
      evidenceCollected,
      newClaims,
      openGaps,
    };
  }
}
