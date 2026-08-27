/**
 * PulseNews Task Orchestrator & Information-Gain Priority Queue
 * Schedules atomic research tasks ranked by expected information gain and manages query diversification across 6 perspectives.
 */

import { ResearchTask, ResearchTaskType, CompetingHypothesis } from './types';

/**
 * Calculates priority score for a research task based on rational information-gain economics:
 * Priority = (ExpectedInfoGain * MaterialityEstimate * ProbabilityOfStateChange) / EstimatedCost
 */
export function calculateTaskPriority(params: {
  expectedInformationGain: number; // 0 - 100
  materialityEstimate: number;     // 0 - 100
  probabilityOfStateChange?: number; // 0 - 100 (default: 70)
  estimatedCost?: number;          // relative cost weight (default: 1)
  depth: number;
}): number {
  const p = params.probabilityOfStateChange || 70;
  const cost = Math.max(params.estimatedCost || 1, 0.5);
  const depthPenalty = Math.max(1, params.depth * 0.8);

  const rawScore = (params.expectedInformationGain * params.materialityEstimate * (p / 100)) / (cost * depthPenalty);
  return Math.min(Math.round(rawScore / 10), 100);
}

/**
 * Generates diversified search queries across 6 analytical perspectives
 */
export function generateDiversifiedQueries(params: {
  entityName: string;
  ticker?: string;
  topicOrQuestion: string;
  hypothesis?: string;
  domain: string;
  failedQueries?: string[];
}): Array<{ query: string; perspective: ResearchTask['perspective'] }> {
  const { entityName, ticker = '', topicOrQuestion, hypothesis, domain, failedQueries = [] } = params;
  const t = ticker ? ticker.toUpperCase() : entityName;

  const queries: Array<{ query: string; perspective: ResearchTask['perspective'] }> = [
    // 1. Entity Perspective
    {
      query: `${t} ${topicOrQuestion} latest updates disclosures`,
      perspective: 'ENTITY',
    },
    // 2. Primary Source Perspective
    {
      query: `site:sec.gov "${t}" ${topicOrQuestion.slice(0, 40)}`,
      perspective: 'PRIMARY_SOURCE',
    },
    // 3. Event Perspective
    {
      query: `"${entityName}" ${topicOrQuestion} Reuters Bloomberg WSJ`,
      perspective: 'EVENT',
    },
    // 4. Contrarian Perspective (Searching for refuting or stabilizing evidence)
    {
      query: `${t} ${topicOrQuestion} stable resilient liquidity adequate denied`,
      perspective: 'CONTRARIAN',
    },
    // 5. Comparable / Peer Perspective
    {
      query: `${domain.replace('_', ' ')} ${topicOrQuestion} industry peers comparison`,
      perspective: 'COMPARABLE',
    },
    // 6. Macro Perspective
    {
      query: `${domain.replace('_', ' ')} market trends rate impact ${topicOrQuestion.slice(0, 30)}`,
      perspective: 'MACRO',
    },
  ];

  // Filter out any queries that closely match previously failed patterns
  return queries.filter((q) => {
    return !failedQueries.some((fq) => fq.toLowerCase() === q.query.toLowerCase());
  });
}

/**
 * Creates an atomic research task
 */
export function createResearchTask(params: {
  runId: string;
  entityId: string;
  taskType: ResearchTaskType;
  question: string;
  targetHypothesisId?: string;
  perspective?: ResearchTask['perspective'];
  materialityEstimate: number;
  expectedInformationGain: number;
  depth?: number;
  parentTaskId?: string;
  branchId?: string;
}): ResearchTask {
  const depth = params.depth || 1;
  const priorityScore = calculateTaskPriority({
    expectedInformationGain: params.expectedInformationGain,
    materialityEstimate: params.materialityEstimate,
    depth,
  });

  return {
    taskId: `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    runId: params.runId,
    parentTaskId: params.parentTaskId,
    branchId: params.branchId,
    taskType: params.taskType,
    entityId: params.entityId,
    question: params.question,
    targetHypothesisId: params.targetHypothesisId,
    perspective: params.perspective || 'ENTITY',
    priorityScore,
    materialityEstimate: params.materialityEstimate,
    expectedInformationGain: params.expectedInformationGain,
    estimatedCost: 1,
    depth,
    status: 'QUEUED',
  };
}
