/**
 * PulseNews Asynchronous Research Job Runner
 * Manages durable execution, background job triggers, and trace persistence.
 */

import { ResearchControlLoop, ResearchRunResult } from './research-control-loop';
import { getFirestoreDb } from './firebase';
import { ResearchTrace } from './types';

// In-Memory Run Cache for instant client retrieval
const ACTIVE_RUNS = new Map<string, ResearchRunResult>();

export class ResearchJobs {
  /**
   * Spawns or executes an asynchronous research job for a portfolio
   */
  public static async triggerPortfolioResearch(
    portfolioId: string,
    entities: string[],
    customQuestions?: string[],
    preferredModel?: string
  ): Promise<ResearchRunResult> {
    const result = await ResearchControlLoop.executeResearchCycle({
      portfolioId,
      entities,
      maxDepth: 3,
      maxQueries: 25,
      customQuestions,
      preferredModel,
    });

    ACTIVE_RUNS.set(result.runId, result);
    ACTIVE_RUNS.set(`latest_${portfolioId}`, result);

    // Persist to Firestore if available
    try {
      const firestore = await getFirestoreDb();
      if (firestore) {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(firestore, 'research_runs', result.runId), {
          ...result,
          savedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('[ResearchJobs] Firestore trace save fallback:', e);
    }

    return result;
  }

  /**
   * Retrieves the latest research run result for a portfolio or specific run ID
   */
  public static async getLatestRunResult(portfolioIdOrRunId: string): Promise<ResearchRunResult | null> {
    if (ACTIVE_RUNS.has(portfolioIdOrRunId)) {
      return ACTIVE_RUNS.get(portfolioIdOrRunId)!;
    }
    if (ACTIVE_RUNS.has(`latest_${portfolioIdOrRunId}`)) {
      return ACTIVE_RUNS.get(`latest_${portfolioIdOrRunId}`)!;
    }

    // Check Firestore
    try {
      const firestore = await getFirestoreDb();
      if (firestore) {
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(firestore, 'research_runs', portfolioIdOrRunId));
        if (snap.exists()) {
          const data = snap.data() as ResearchRunResult;
          ACTIVE_RUNS.set(portfolioIdOrRunId, data);
          return data;
        }
      }
    } catch {}

    return null;
  }
}
