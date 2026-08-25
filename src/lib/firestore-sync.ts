/**
 * Firebase Firestore Cloud Sync for Named Database 'pulsenews'
 * Seamlessly backs up and synchronizes your tracked portfolio, CIK mappings,
 * custom aliases, and sectors to your 'pulsenews' Firebase Firestore database.
 */

import { getFirestoreDb } from './firebase';

const PRIMARY_PORTFOLIO_DOC = 'primary_portfolio';

/**
 * Syncs portfolio and metadata to the 'pulsenews' Firestore database
 */
export async function syncPortfolioToFirebase(data: {
  portfolio: string[];
  customMetadata?: any;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const firestore = await getFirestoreDb();
    if (!firestore) return false;

    const { doc, setDoc } = await import('firebase/firestore');
    const docRef = doc(firestore, 'pulsenews_portfolios', PRIMARY_PORTFOLIO_DOC);

    await setDoc(
      docRef,
      {
        portfolio: data.portfolio,
        customMetadata: data.customMetadata || null,
        updatedAt: new Date().toISOString(),
        clientTimestamp: Date.now(),
      },
      { merge: true }
    );

    console.log('[Firestore] Synced portfolio to "pulsenews" database:', data.portfolio);
    return true;
  } catch (err) {
    console.warn('[Firestore] Sync to "pulsenews" database failed (offline/permission):', err);
    return false;
  }
}

/**
 * Loads cloud portfolio from the 'pulsenews' Firestore database
 */
export async function loadPortfolioFromFirebase(): Promise<{
  portfolio?: string[];
  customMetadata?: any;
} | null> {
  if (typeof window === 'undefined') return null;

  try {
    const firestore = await getFirestoreDb();
    if (!firestore) return null;

    const { doc, getDoc } = await import('firebase/firestore');
    const docRef = doc(firestore, 'pulsenews_portfolios', PRIMARY_PORTFOLIO_DOC);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      console.log('[Firestore] Loaded cloud portfolio from "pulsenews" database:', data.portfolio);
      return data as any;
    }
    return null;
  } catch (err) {
    console.warn('[Firestore] Could not load from "pulsenews" database:', err);
    return null;
  }
}
