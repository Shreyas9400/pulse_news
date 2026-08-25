import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK using service account or environment variables
function getAdminApp(): App | null {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pulsenews';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return null;
}

// In-memory fallback token store if Firestore credentials not provided yet
const inMemorySubscribers = new Set<string>();

/**
 * Register a new device token for push notifications
 */
export async function saveFCMToken(token: string, metadata?: any): Promise<boolean> {
  inMemorySubscribers.add(token);

  const adminApp = getAdminApp();
  if (adminApp) {
    try {
      const db = getFirestore(adminApp);
      await db.collection('fcm_subscribers').doc(token).set({
        token,
        updatedAt: FieldValue.serverTimestamp(),
        metadata: metadata || {},
      }, { merge: true });
      return true;
    } catch (e) {
      console.warn('[FirebaseAdmin] Failed to save token to Firestore:', e);
    }
  }

  return true;
}

/**
 * Send FCM push notification to all subscribed devices
 */
export async function sendPushNotification(payload: {
  title: string;
  body: string;
  url?: string;
  symbol?: string;
}): Promise<{ successCount: number; failureCount: number }> {
  const adminApp = getAdminApp();
  if (!adminApp) {
    console.log('[FirebaseAdmin] Push notification simulated (Admin SDK not initialized):', payload);
    return { successCount: inMemorySubscribers.size, failureCount: 0 };
  }

  try {
    const db = getFirestore(adminApp);
    const snapshot = await db.collection('fcm_subscribers').get();
    const tokens: string[] = [];

    snapshot.forEach(doc => {
      if (doc.id) tokens.push(doc.id);
    });

    inMemorySubscribers.forEach(t => {
      if (!tokens.includes(t)) tokens.push(t);
    });

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    const messaging = getMessaging(adminApp);
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        url: payload.url || '/',
        symbol: payload.symbol || '',
      },
      webpush: {
        fcmOptions: {
          link: payload.url || '/',
        },
      },
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('[FirebaseAdmin] Failed to send multicast push:', error);
    return { successCount: 0, failureCount: 1 };
  }
}
