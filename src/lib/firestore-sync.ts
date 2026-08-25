/**
 * Firebase Firestore Cloud Sync for Portfolio & Custom Metadata
 * Graceful cloud persistence with auto-fallback to localStorage.
 */

let isFirestoreAvailable: boolean | null = null;

/**
 * Checks if Firestore is available and initialized in the Firebase project.
 * If not provisioned, gracefully falls back without console spam.
 */
async function getDb() {
  if (typeof window === 'undefined') return null;
  if (isFirestoreAvailable === false) return null;

  try {
    const { getFirebaseApp } = await import('./firebase');
    const app = await getFirebaseApp();
    if (!app) {
      isFirestoreAvailable = false;
      return null;
    }

    const { getFirestore } = await import('firebase/firestore');
    const db = getFirestore(app);
    return db;
  } catch {
    isFirestoreAvailable = false;
    return null;
  }
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
 * Syncs portfolio and metadata to Firestore (if provisioned)
 */
export async function syncPortfolioToFirebase(data: {
  portfolio: string[];
  customMetadata?: any;
  savedArticles?: any[];
}): Promise<boolean> {
  if (typeof window === 'undefined' || isFirestoreAvailable === false) return false;

  try {
    const firestore = await getDb();
    if (!firestore) return false;

    const { doc, setDoc } = await import('firebase/firestore');
    const deviceId = getDeviceId();
    const docRef = doc(firestore, 'pulsenews_portfolios', deviceId);

    await setDoc(
      docRef,
      {
        portfolio: data.portfolio,
        customMetadata: data.customMetadata || null,
        savedArticlesCount: data.savedArticles?.length || 0,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    isFirestoreAvailable = true;
    return true;
  } catch {
    // If Firestore database '(default)' does not exist in Firebase console, mark unavailable to prevent retry loops
    isFirestoreAvailable = false;
    return false;
  }
}

/**
 * Loads cloud portfolio from Firestore (if provisioned)
 */
export async function loadPortfolioFromFirebase(): Promise<{
  portfolio?: string[];
  customMetadata?: any;
} | null> {
  if (typeof window === 'undefined' || isFirestoreAvailable === false) return null;

  try {
    const firestore = await getDb();
    if (!firestore) return null;

    const { doc, getDoc } = await import('firebase/firestore');
    const deviceId = getDeviceId();
    const docRef = doc(firestore, 'pulsenews_portfolios', deviceId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      isFirestoreAvailable = true;
      return snap.data() as any;
    }
    return null;
  } catch {
    isFirestoreAvailable = false;
    return null;
  }
}
