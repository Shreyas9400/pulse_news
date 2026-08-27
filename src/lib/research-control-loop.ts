/**
 * PulseNews Master Research Control Loop
 * Stateful decision loop orchestrating the dynamic research cycle across the Blackboard.
 */

import {
  ResearchBlackboard,
  ResearchTrace,
  CanonicalIntelligenceEvent,
  PortfolioIntelligenceProfile,
  DeltaStoryItem,
  QuietEntityReport,
} from './types';
import { createResearchBlackboard, exportResearchTrace } from './research-blackboard';
import { createResearchTask, generateDiversifiedQueries } from './task-orchestrator';
import { ResearchWorkers } from './research-workers';
import { evaluateResearchCompleteness } from './senior-researcher';
import { challengePreliminaryConclusion } from './adversarial-engine';
import { synthesizeCrossPortfolioPatterns } from './cross-entity-engine';
import { getEntityKnowledgeState, commitStateTransition, calculateKnowledgeDelta } from './knowledge-engine';
import { processEvidenceIntoEvent, getAllCanonicalEvents } from './event-engine';
import { assessEventMateriality, getEscalationRequirement } from './materiality-engine';
import { resolveCanonicalEntity } from './entity-resolver';
import { getPortfolioIntelligenceProfile } from './expertise-engine';

export interface ResearchRunResult {
  runId: string;
  portfolioId: string;
  trace: ResearchTrace;
  events: CanonicalIntelligenceEvent[];
  deltaStories: DeltaStoryItem[];
  quietEntities: QuietEntityReport[];
  synthesisSummary: string;
  completedAt: string;
}

export class ResearchControlLoop {
  /**
   * Executes a full stateful research cycle for a user portfolio
   */
  public static async executeResearchCycle(params: {
    portfolioId: string;
    entities: string[];
    maxDepth?: number;
    maxQueries?: number;
  }): Promise<ResearchRunResult> {
    const startedAt = new Date().toISOString();
    const runId = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const startTimeMs = Date.now();

    // 1. Ingest/Generate 3-Level Dynamic Expertise Profile
    const profile = await getPortfolioIntelligenceProfile(params.portfolioId, params.entities);

    // 2. Initialize Research Blackboard
    const board = createResearchBlackboard({
      runId,
      portfolioId: params.portfolioId,
      primaryDomain: profile.primaryDomain,
      maxDepth: params.maxDepth || 3,
      maxQueries: params.maxQueries || 25,
    });
    board.status = 'ACTIVE';

    // 3. Queue Initial Discovery Tasks for all portfolio holdings
    for (const entityId of params.entities) {
      const canonical = resolveCanonicalEntity(entityId);
      const initialQueries = generateDiversifiedQueries({
        entityName: canonical.canonicalName,
        ticker: canonical.primaryTicker,
        topicOrQuestion: profile.level1DomainKnowledge.slice(0, 50),
        domain: profile.primaryDomain,
      });

      for (const q of initialQueries.slice(0, 2)) {
        const task = createResearchTask({
          runId,
          entityId: canonical.id,
          taskType: q.perspective === 'PRIMARY_SOURCE' ? 'PRIMARY_SOURCE' : 'DISCOVERY',
          question: q.query,
          perspective: q.perspective,
          materialityEstimate: 75,
          expectedInformationGain: 85,
          depth: 1,
        });
        board.taskQueue.push(task);
      }
    }

    // 4. Decision Control Loop: Execute tasks ranked by Information Gain
    const extractedEvents: CanonicalIntelligenceEvent[] = [];
    const deltaStories: DeltaStoryItem[] = [];
    const quietEntities: QuietEntityReport[] = [];

    while (board.taskQueue.length > 0 && board.budget.queriesExecuted < board.budget.maxQueries) {
      // Sort by priorityScore (Information Gain economics)
      board.taskQueue.sort((a, b) => b.priorityScore - a.priorityScore);
      const activeTask = board.taskQueue.shift()!;

      // Execute worker
      const executionResult = await ResearchWorkers.executeTask(activeTask, board);

      // Process new evidence into Canonical Events
      for (const ev of executionResult.evidenceCollected) {
        const { event, isNewEvent, isNewSource } = processEvidenceIntoEvent(ev, activeTask.entityId, params.portfolioId);
        
        // Assess contextual materiality
        event.materiality = assessEventMateriality({
          event,
          portfolioProfile: profile,
          isDirectPortfolioHolding: true,
        });

        if (!extractedEvents.some((e) => e.eventId === event.eventId)) {
          extractedEvents.push(event);
        }

        // Primary Escalation Check: If materiality >= 70 and not yet verified by primary source, queue primary task
        const escalation = getEscalationRequirement(event.materiality.materialityScore);
        if (escalation.requirePrimarySource && activeTask.taskType !== 'PRIMARY_SOURCE' && activeTask.depth < board.budget.maxDepth) {
          const primaryTask = createResearchTask({
            runId,
            entityId: activeTask.entityId,
            taskType: 'PRIMARY_SOURCE',
            question: `SEC EDGAR regulatory filing verification for ${activeTask.entityId}`,
            perspective: 'PRIMARY_SOURCE',
            materialityEstimate: event.materiality.materialityScore,
            expectedInformationGain: 90,
            depth: activeTask.depth + 1,
            parentTaskId: activeTask.taskId,
          });
          board.taskQueue.push(primaryTask);
        }
      }

      // Check stopping condition
      board.budget.elapsedMs = Date.now() - startTimeMs;
      if (board.budget.elapsedMs > board.budget.timeBudgetMs) {
        board.status = 'CONVERGING';
        break;
      }
    }

    // 5. Senior Researcher Gate & Fact Verification
    const gateDecision = evaluateResearchCompleteness(board);

    // 6. Evaluate Knowledge Incrementality & "No Material Change" per monitored entity
    for (const entityId of params.entities) {
      const canonical = resolveCanonicalEntity(entityId);
      const kState = await getEntityKnowledgeState(canonical.id);
      const entityEvents = extractedEvents.filter((e) => e.canonicalEntityId === canonical.id);

      if (entityEvents.length > 0) {
        const primaryEvent = entityEvents[0];
        const delta = calculateKnowledgeDelta(kState, primaryEvent);

        if (delta.hasDelta && primaryEvent.materiality.materialityScore >= 50) {
          // Adversarial QA challenge on material conclusions
          const challenge = challengePreliminaryConclusion({
            entityName: canonical.canonicalName,
            conclusion: primaryEvent.summary,
            supportingFacts: primaryEvent.facts.map((f) => f.statement),
            domain: profile.primaryDomain,
          });
          primaryEvent.adversarialCheck = challenge;

          // Commit Audited State Transition (vN -> vN+1)
          await commitStateTransition({
            entityId: canonical.id,
            triggerEvent: primaryEvent,
            newState: {
              statusSummary: primaryEvent.summary.slice(0, 180),
              operationalHealth: primaryEvent.materiality.riskDirection === 'NEGATIVE' ? 'WATCH' : 'STABLE',
            },
            reasoning: `${delta.deltaSummary} (Materiality: ${primaryEvent.materiality.materialityScore}/100)`,
          });

          deltaStories.push({
            id: `story_${primaryEvent.eventId}`,
            title: primaryEvent.title,
            entityId: canonical.id,
            entityName: canonical.canonicalName,
            whatChanged: delta.deltaSummary,
            whyItMatters: primaryEvent.summary,
            portfolioImpact: primaryEvent.implications[0] || 'Continuous operational surveillance active.',
            confidenceScore: primaryEvent.confidenceScore,
            materialityScore: primaryEvent.materiality.materialityScore,
            riskDirection: primaryEvent.materiality.riskDirection,
            facts: primaryEvent.facts,
            inferences: primaryEvent.implications,
            whatWouldChangeOurView: challenge.mitigationQuestions[0] || 'Receipt of audited interim regulatory filings.',
            primarySourcesCount: primaryEvent.evidenceIds.length,
            totalSourcesCount: primaryEvent.evidenceIds.length,
            researchRunId: runId,
          });

          board.whyIncluded.push({
            eventId: primaryEvent.eventId,
            reason: delta.deltaSummary,
            materiality: primaryEvent.materiality.materialityScore,
          });
        } else {
          // Event was low novelty or unconfirmed
          quietEntities.push({
            entityId: canonical.id,
            entityName: canonical.canonicalName,
            status: 'NO_MATERIAL_CHANGE',
            lastKnownState: kState.currentBeliefs.statusSummary,
            activeWatchpoints: kState.currentBeliefs.activeRisks,
            lastAssessedAt: new Date().toISOString(),
          });

          board.whyExcluded.push({
            itemTitle: `${canonical.canonicalName} periodic observation`,
            reason: 'LOW_MATERIALITY',
            score: primaryEvent.materiality.materialityScore,
          });
        }
      } else {
        // No new events detected: Clean "No Material Change"
        quietEntities.push({
          entityId: canonical.id,
          entityName: canonical.canonicalName,
          status: 'NO_MATERIAL_CHANGE',
          lastKnownState: kState.currentBeliefs.statusSummary,
          activeWatchpoints: kState.currentBeliefs.activeRisks,
          lastAssessedAt: new Date().toISOString(),
        });
      }
    }

    // 7. Cross-Portfolio Synthesis & Risk Classification
    const crossSynthesis = synthesizeCrossPortfolioPatterns({
      events: extractedEvents,
      portfolioProfile: profile,
    });

    board.status = 'COMPLETED';
    board.budget.elapsedMs = Date.now() - startTimeMs;

    const trace = exportResearchTrace(board, startedAt);

    return {
      runId,
      portfolioId: params.portfolioId,
      trace,
      events: extractedEvents.slice(0, 10),
      deltaStories: deltaStories.slice(0, 5), // Signal over volume: Max 5 major developments
      quietEntities,
      synthesisSummary: crossSynthesis.summary,
      completedAt: new Date().toISOString(),
    };
  }
}
