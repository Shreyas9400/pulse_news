/**
 * PulseNews Active Research Blackboard
 * Represents the mutable shared workspace for a live recursive research run.
 */

import {
  ResearchBlackboard,
  EpistemicClaim,
  CompetingHypothesis,
  EvidenceItem,
  SourceLineageNode,
  EvidenceConflict,
  ResearchTask,
  StateTransition,
  ResearchTrace,
} from './types';

/**
 * Initializes a new Research Blackboard for an active investigation run
 */
export function createResearchBlackboard(params: {
  runId: string;
  portfolioId: string;
  primaryDomain: string;
  maxDepth?: number;
  maxQueries?: number;
  timeBudgetMs?: number;
}): ResearchBlackboard {
  return {
    runId: params.runId,
    portfolioId: params.portfolioId,
    primaryDomain: params.primaryDomain,
    status: 'INITIALIZING',
    budget: {
      maxDepth: params.maxDepth || 3,
      depthReached: 0,
      maxQueries: params.maxQueries || 30,
      queriesExecuted: 0,
      maxLLMCalls: 20,
      llmCallsCount: 0,
      tokensUsed: 0,
      timeBudgetMs: params.timeBudgetMs || 30000,
      elapsedMs: 0,
    },
    epistemicFacts: [],
    hypotheses: [],
    evidenceItems: new Map<string, EvidenceItem>(),
    sourceLineageGraph: new Map<string, SourceLineageNode>(),
    evidenceConflicts: [],
    taskQueue: [],
    completedTasks: [],
    activeKnowledgeGaps: [],
    candidateStateTransitions: [],
    whyIncluded: [],
    whyExcluded: [],
    failedQueryPatterns: [],
    conclusions: [],
  };
}

/**
 * Adds an evidence item to the blackboard and updates the source lineage graph
 */
export function addEvidenceToBlackboard(board: ResearchBlackboard, evidence: EvidenceItem) {
  board.evidenceItems.set(evidence.id, evidence);

  // Update lineage graph
  const root = evidence.originalPublisher || evidence.publisher;
  const existingNode = board.sourceLineageGraph.get(root) || {
    sourceId: root,
    url: evidence.sourceUrl,
    publisher: root,
    syndicatedTo: [],
    referencedBy: [],
    independenceScore: evidence.independenceScore,
  };

  if (evidence.publisher !== root && !existingNode.syndicatedTo.includes(evidence.publisher)) {
    existingNode.syndicatedTo.push(evidence.publisher);
  }
  board.sourceLineageGraph.set(root, existingNode);
}

/**
 * Adds or updates a competing hypothesis on the blackboard
 */
export function upsertHypothesis(
  board: ResearchBlackboard,
  hypothesis: Omit<CompetingHypothesis, 'id'> & { id?: string }
): CompetingHypothesis {
  const id = hypothesis.id || `hyp_${Date.now().toString(36)}_${board.hypotheses.length + 1}`;
  const existing = board.hypotheses.find((h) => h.id === id);

  if (existing) {
    existing.status = hypothesis.status;
    existing.evidenceFor = Array.from(new Set([...existing.evidenceFor, ...hypothesis.evidenceFor]));
    existing.evidenceAgainst = Array.from(new Set([...existing.evidenceAgainst, ...hypothesis.evidenceAgainst]));
    existing.confidence = hypothesis.confidence;
    return existing;
  }

  const newHyp: CompetingHypothesis = {
    id,
    statement: hypothesis.statement,
    competingWith: hypothesis.competingWith || [],
    status: hypothesis.status,
    evidenceFor: hypothesis.evidenceFor,
    evidenceAgainst: hypothesis.evidenceAgainst,
    confidence: hypothesis.confidence,
    testTasksCreated: hypothesis.testTasksCreated || [],
  };

  board.hypotheses.push(newHyp);
  return newHyp;
}

/**
 * Serializes the blackboard state into a full observable ResearchTrace
 */
export function exportResearchTrace(board: ResearchBlackboard, startedAt: string): ResearchTrace {
  return {
    runId: board.runId,
    portfolioId: board.portfolioId,
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: board.budget.elapsedMs,
    status: board.status === 'CONVERGING' || board.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
    budget: board.budget,
    iterations: [
      {
        iteration: 1,
        branchName: 'Primary Discovery & Verification',
        hypothesesTested: board.hypotheses.map((h) => h.statement),
        queries: board.completedTasks.map((t) => t.question),
        sourcesRetrieved: board.evidenceItems.size,
        sourcesRejected: board.whyExcluded.map((w) => ({ url: w.itemTitle, reason: w.reason })),
        evidenceExtracted: board.epistemicFacts.map((f) => f.statement),
        knowledgeGapsIdentified: {
          known: board.epistemicFacts.map((f) => f.statement),
          unknown: board.activeKnowledgeGaps,
          contradictions: board.evidenceConflicts.map((c) => c.conflictType),
          openQuestions: board.activeKnowledgeGaps,
        },
        stoppingConditionMet: board.status === 'COMPLETED' ? 'Knowledge converged & hypotheses verified' : undefined,
      },
    ],
    adversarialCheckResults: {
      challengedConclusions: board.conclusions,
      identifiedWeaknesses: board.evidenceConflicts.map((c) => c.conflictType),
      finalValidationPassed: board.status === 'COMPLETED',
    },
    whyIncluded: board.whyIncluded,
    whyExcluded: board.whyExcluded,
    conclusions: board.conclusions,
    blackboardSummary: {
      factsCount: board.epistemicFacts.length,
      hypothesesCount: board.hypotheses.length,
      conflictsCount: board.evidenceConflicts.length,
      evidenceCount: board.evidenceItems.size,
    },
  };
}
