/**
 * Enterprise Credit Memory & AI Dossier Cache (Firestore Database 'pulsenews' + LocalStorage Fallback)
 * 
 * Provides:
 * 1. Long-term Historical Event Memory: Persists material credit events and rating shifts.
 * 2. 4-Hour AI Dossier Cache: Preserves Gemini Free-Tier Quotas (15 RPM / 1,500 RPD).
 * 3. Graceful LocalStorage Fallback: 100% resilient if Firestore permissions are pending.
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

  // 1. L1 Memory
  if (l1MemoryCache.has(cleanKey)) {
    return l1MemoryCache.get(cleanKey)!;
  }

  // 2. LocalStorage Cache
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`pulse_mem_${cleanKey}`);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          l1MemoryCache.set(cleanKey, parsed);
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Firestore Database 'pulsenews'
  try {
    const firestore = await getFirestoreDb();
    if (firestore) {
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(firestore, 'entity_memory', cleanKey));

      if (snap.exists()) {
        const data = snap.data();
        const milestones = (data?.milestones || []) as CreditMilestone[];
        l1MemoryCache.set(cleanKey, milestones);
        return milestones;
      }
    }
  } catch {}

  return [];
}

/**
 * Records a new material credit event milestone to Firestore memory & LocalStorage
 */
export async function recordCreditMilestone(entity: string, milestone: Omit<CreditMilestone, 'timestamp'>) {
  const cleanKey = entity.toUpperCase().trim();
  const newEntry: CreditMilestone = {
    ...milestone,
    timestamp: Date.now(),
  };

  const existing = await getEntityHistoricalMemory(cleanKey);
  const updated = [newEntry, ...existing.filter((m) => m.title !== newEntry.title)].slice(0, 10);
  l1MemoryCache.set(cleanKey, updated);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`pulse_mem_${cleanKey}`, JSON.stringify(updated));
    } catch {}
  }

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
  } catch {}
}

/**
 * Checks for a valid, unexpired 4-hour cached AI dossier analysis
 */
export async function getCachedDossier(entity: string): Promise<StoredDossierAnalysis | null> {
  const cleanKey = entity.toUpperCase().trim();
  const now = Date.now();

  // 1. L1 Memory Cache
  const l1 = l1DossierCache.get(cleanKey);
  if (l1 && l1.expiresAt > now) {
    return l1;
  }

  // 2. LocalStorage Fallback
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`pulse_ai_${cleanKey}`);
      if (local) {
        const parsed = JSON.parse(local) as StoredDossierAnalysis;
        if (parsed && parsed.expiresAt > now) {
          l1DossierCache.set(cleanKey, parsed);
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Firestore L2 Cache
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
  } catch {}

  return null;
}

/**
 * Saves newly synthesized AI dossier analysis to Firestore + LocalStorage with 4-hour TTL
 */
export async function saveDossierCache(analysis: StoredDossierAnalysis, ttlHours = 4) {
  const cleanKey = analysis.entity.toUpperCase().trim();
  const expiresAt = Date.now() + ttlHours * 60 * 60 * 1000;
  const entry: StoredDossierAnalysis = {
    ...analysis,
    expiresAt,
  };

  l1DossierCache.set(cleanKey, entry);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`pulse_ai_${cleanKey}`, JSON.stringify(entry));
    } catch {}
  }

  try {
    const firestore = await getFirestoreDb();
    if (firestore) {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(firestore, 'ai_dossiers', cleanKey), entry, { merge: true });
    }
  } catch {}
}
