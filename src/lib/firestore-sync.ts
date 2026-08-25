/**
 * Firebase Firestore Cloud Sync for Portfolio & Custom Metadata
 * Keeps your watchlist, custom aliases, and bookmarks synced to your pulsenews Firebase database.
 */

import { getFirestore, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import { getFirebaseApp } from './firebase';

let db: Firestore | null = null;

async function getDb(): Promise<Firestore | null> {
  if (db) return db;
  const app = await getFirebaseApp();
  if (!app) return null;
  db = getFirestore(app);
  return db;
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let deviceId = localStorage.getItem('pulse_device_sync_id');
  if (!deviceId) {
    deviceId = 'usr_' + Math.random().toString(36).slice(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem('pulse_device_sync_id', deviceId);
  }
  return deviceId;
}

/**
 * Syncs portfolio, custom aliases, and custom sectors to Firebase Firestore
 */
export async function syncPortfolioToFirebase(data: {
  portfolio: string[];
  customMetadata?: any;
  savedArticles?: any[];
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const firestore = await getDb();
    if (!firestore) return false;

    const deviceId = getDeviceId();
    const docRef = doc(firestore, 'pulsenews_portfolios', deviceId);

    await setDoc(
      docRef,
      {
        portfolio: data.portfolio,
        customMetadata: data.customMetadata || null,
        savedArticlesCount: data.savedArticles?.length || 0,
        updatedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
      { merge: true }
    );

    return true;
  } catch (e) {
    console.warn('[FirestoreSync] Cloud sync skipped (offline or credentials pending):', e);
    return false;
  }
}

/**
 * Loads cloud portfolio from Firebase Firestore
 */
export async function loadPortfolioFromFirebase(): Promise<{
  portfolio?: string[];
  customMetadata?: any;
} | null> {
  if (typeof window === 'undefined') return null;

  try {
    const firestore = await getDb();
    if (!firestore) return null;

    const deviceId = getDeviceId();
    const docRef = doc(firestore, 'pulsenews_portfolios', deviceId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as any;
    }
    return null;
  } catch (e) {
    console.warn('[FirestoreSync] Could not fetch cloud portfolio:', e);
    return null;
  }
}
