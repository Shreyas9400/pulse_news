/**
 * Enterprise Credit Memory & AI Dossier Cache (Firestore Database 'pulsenews')
 * 
 * Provides:
 * 1. Long-term Historical Event Memory: Persists material credit events and rating shifts.
 * 2. 4-Hour AI Dossier Cache: Preserves Gemini Free-Tier Quotas (15 RPM / 1,500 RPD).
 */

import { getFirestoreDb } from './firebase';

export interface CreditMilestone {
  date: string;
  timestamp: number;
  title: string;
  materiality: 'HIGH' | 'MEDIUM' | 'LOW';
  impactSummary: string;
  spreadTrajectory?: 'TIGHTENING' | 'WIDENING' | 'STABLE';
}

export interface StoredDossierAnalysis {
  entity: string;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  relevanceScore: number;
  materiality: 'HIGH' | 'MEDIUM' | 'LOW';
  notify: boolean;
  notificationTitle?: string;
  notificationBody?: string;
  analytics: {
    liquidityRisk: 'LOW' | 'MODERATE' | 'ELEVATED';
    spreadTrajectory: 'TIGHTENING' | 'WIDENING' | 'STABLE';
    leverageWatch: string;
    refinancingRisk: 'LOW' | 'MODERATE' | 'HIGH';
  };
  executiveSummary: string;
  keyRiskWatchpoints: string[];
  creditCatalysts: string[];
  historicalMilestones: CreditMilestone[];
  synthesizedAt: string;
  expiresAt: number;
}

// In-Memory L1 Cache for immediate 0ms lookups
const l1DossierCache = new Map<string, StoredDossierAnalysis>();
const l1MemoryCache = new Map<string, CreditMilestone[]>();

/**
 * Loads recent historical credit memory milestones for an entity
 */
export async function getEntityHistoricalMemory(entity: string): Promise<CreditMilestone[]> {
  const cleanKey = entity.toUpperCase().trim();
  if (l1MemoryCache.has(cleanKey)) {
    return l1MemoryCache.get(cleanKey)!;
  }

  try {
    const firestore = await getFirestoreDb();
    if (!firestore) return [];

    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(firestore, 'entity_memory', cleanKey));

    if (snap.exists()) {
      const data = snap.data();
      const milestones = (data?.milestones || []) as CreditMilestone[];
      l1MemoryCache.set(cleanKey, milestones);
      return milestones;
    }
  } catch (e) {
    console.warn('[CreditMemory] Error loading history from Firestore:', e);
  }

  return [];
}

/**
 * Records a new material credit event milestone to Firestore memory
 */
export async function recordCreditMilestone(entity: string, milestone: Omit<CreditMilestone, 'timestamp'>) {
  const cleanKey = entity.toUpperCase().trim();
  const newEntry: CreditMilestone = {
    ...milestone,
    timestamp: Date.now(),
  };

  const existing = await getEntityHistoricalMemory(cleanKey);
  // Keep up to 10 most recent milestones
  const updated = [newEntry, ...existing.filter((m) => m.title !== newEntry.title)].slice(0, 10);
  l1MemoryCache.set(cleanKey, updated);

  try {
    const firestore = await getFirestoreDb();
    if (!firestore) return;

    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(
      doc(firestore, 'entity_memory', cleanKey),
      {
        entity: cleanKey,
        milestones: updated,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('[CreditMemory] Error saving milestone to Firestore:', e);
  }
}

/**
 * Checks for a valid, unexpired 4-hour cached AI dossier analysis in Firestore
 */
export async function getCachedDossier(entity: string): Promise<StoredDossierAnalysis | null> {
  const cleanKey = entity.toUpperCase().trim();
  const now = Date.now();

  // 1. Check L1 Memory Cache
  const l1 = l1DossierCache.get(cleanKey);
  if (l1 && l1.expiresAt > now) {
    return l1;
  }

  // 2. Check Firestore L2 Cache in 'pulsenews' database
  try {
    const firestore = await getFirestoreDb();
    if (firestore) {
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(firestore, 'ai_dossiers', cleanKey));

      if (snap.exists()) {
        const item = snap.data() as StoredDossierAnalysis;
        if (item && item.expiresAt > now) {
          l1DossierCache.set(cleanKey, item);
          return item;
        }
      }
    }
  } catch (e) {
    console.warn('[CreditMemory] Error reading cached dossier from Firestore:', e);
  }

  return null;
}

/**
 * Saves a newly synthesized AI dossier analysis to Firestore with 4-hour TTL
 */
export async function saveDossierCache(analysis: StoredDossierAnalysis, ttlHours = 4) {
  const cleanKey = analysis.entity.toUpperCase().trim();
  const expiresAt = Date.now() + ttlHours * 60 * 60 * 1000;
  const entry: StoredDossierAnalysis = {
    ...analysis,
    expiresAt,
  };

  l1DossierCache.set(cleanKey, entry);

  try {
    const firestore = await getFirestoreDb();
    if (firestore) {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(firestore, 'ai_dossiers', cleanKey), entry, { merge: true });
    }
  } catch (e) {
    console.warn('[CreditMemory] Error caching dossier in Firestore:', e);
  }
}
