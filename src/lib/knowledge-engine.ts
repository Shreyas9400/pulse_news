/**
 * PulseNews 4-Layer Memory & Versioned Knowledge State Engine
 * Persists durable structured states in Firestore (with L1/LocalStorage fallback) and audits versioned state transitions.
 */

import { getFirestoreDb } from './firebase';
import { EntityKnowledgeState, StateTransition, CanonicalIntelligenceEvent } from './types';
import { resolveCanonicalEntity } from './entity-resolver';

// L1 In-Memory Knowledge Cache
const L1_KNOWLEDGE_CACHE = new Map<string, EntityKnowledgeState>();

/**
 * Loads the current versioned knowledge state for an entity
 */
export async function getEntityKnowledgeState(entityIdOrSymbol: string): Promise<EntityKnowledgeState> {
  const canonical = resolveCanonicalEntity(entityIdOrSymbol);
  const key = canonical.id;

  // 1. Check L1 Memory
  if (L1_KNOWLEDGE_CACHE.has(key)) {
    return L1_KNOWLEDGE_CACHE.get(key)!;
  }

  // 2. Check LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`pulse_kstate_${key}`);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && parsed.version) {
          L1_KNOWLEDGE_CACHE.set(key, parsed);
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Check Firestore
  try {
    const firestore = await getFirestoreDb();
    if (firestore) {
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(firestore, 'knowledge_states', key));
      if (snap.exists()) {
        const data = snap.data() as EntityKnowledgeState;
        L1_KNOWLEDGE_CACHE.set(key, data);
        return data;
      }
    }
  } catch (e) {
    console.warn('[KnowledgeEngine] Firestore state fetch fallback:', e);
  }

  // 4. Default Initial Knowledge Baseline
  const defaultState: EntityKnowledgeState = {
    entityId: key,
    version: 1,
    lastUpdated: new Date().toISOString(),
    currentBeliefs: {
      statusSummary: `${canonical.canonicalName} operational surveillance active.`,
      operationalHealth: 'STABLE',
      keyMetrics: {},
      activeRisks: ['Macro interest rate sensitivity', 'Periodic liquidity surveillance'],
      activeCatalysts: ['Operating cash flow generation'],
      monitoringQuestions: [`Track quarterly financial disclosures and covenant headroom.`],
    },
    historicalTransitions: [],
    openHypotheses: [],
  };

  L1_KNOWLEDGE_CACHE.set(key, defaultState);
  return defaultState;
}

/**
 * Commits an audited versioned state transition (e.g. version N -> N+1)
 */
export async function commitStateTransition(params: {
  entityId: string;
  triggerEvent: CanonicalIntelligenceEvent;
  newState: Partial<EntityKnowledgeState['currentBeliefs']>;
  reasoning: string;
}): Promise<EntityKnowledgeState> {
  const current = await getEntityKnowledgeState(params.entityId);
  const nextVersion = current.version + 1;

  const transition: StateTransition = {
    timestamp: new Date().toISOString(),
    fromState: current.currentBeliefs.operationalHealth,
    toState: params.newState.operationalHealth || current.currentBeliefs.operationalHealth,
    triggerEventId: params.triggerEvent.eventId,
    reasoning: params.reasoning,
    version: nextVersion,
  };

  const updated: EntityKnowledgeState = {
    ...current,
    version: nextVersion,
    lastUpdated: new Date().toISOString(),
    lastResearchRunId: params.triggerEvent.portfolioIds[0] || 'RUN_MANUAL',
    currentBeliefs: {
      ...current.currentBeliefs,
      ...params.newState,
    },
    historicalTransitions: [transition, ...current.historicalTransitions].slice(0, 15),
  };

  // Update L1
  L1_KNOWLEDGE_CACHE.set(current.entityId, updated);

  // Update LocalStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`pulse_kstate_${current.entityId}`, JSON.stringify(updated));
    } catch {}
  }

  // Update Firestore
  try {
    const firestore = await getFirestoreDb();
    if (firestore) {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(firestore, 'knowledge_states', current.entityId), updated, { merge: true });
    }
  } catch (e) {
    console.warn('[KnowledgeEngine] Firestore state commit fallback:', e);
  }

  return updated;
}

/**
 * Compares incoming event metrics against existing KnowledgeState to formulate an explicit delta
 */
export function calculateKnowledgeDelta(
  state: EntityKnowledgeState,
  event: CanonicalIntelligenceEvent
): {
  hasDelta: boolean;
  deltaSummary: string;
  noveltyScore: number;
} {
  const facts = event.facts.map((f) => f.statement).join(' ');
  const metrics = event.metrics;

  if (metrics.length > 0) {
    const changes: string[] = [];
    for (const m of metrics) {
      if (m.previousValue && m.previousValue !== m.currentValue) {
        changes.push(`${m.metricName} shifted from ${m.previousValue} to ${m.currentValue}`);
      } else {
        changes.push(`${m.metricName} reported at ${m.currentValue}`);
      }
    }
    return {
      hasDelta: true,
      deltaSummary: changes.join('; '),
      noveltyScore: 90,
    };
  }

  // Check qualitative similarity against current belief
  const isSimilar = state.currentBeliefs.statusSummary.toLowerCase().includes(event.title.toLowerCase());
  if (isSimilar) {
    return {
      hasDelta: false,
      deltaSummary: 'Corroborating previous known state.',
      noveltyScore: 20,
    };
  }

  return {
    hasDelta: true,
    deltaSummary: `New development observed: ${event.title}`,
    noveltyScore: 75,
  };
}
