import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// Cached dynamic config
let dynamicConfig: any = null;

function isValidApiKey(key?: string): boolean {
  if (!key) return false;
  const clean = key.trim().replace(/^["']|["']$/g, '');
  return clean.length >= 8 && !clean.toLowerCase().includes('placeholder') && !clean.toLowerCase().includes('your_');
}

export async function getClientFirebaseConfig() {
  if (dynamicConfig) return dynamicConfig;

  // 1. First check if bundled via NEXT_PUBLIC_ or direct env
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY) {
    dynamicConfig = {
      apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pulsenews.firebaseapp.com',
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pulsenews',
      databaseId: process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'pulsenews',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'pulsenews.appspot.com',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      vapidKey: process.env.FIREBASE_VAPID_KEY || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    };
    return dynamicConfig;
  }

  // 2. Load dynamically from serverless /api/firebase-config endpoint (supports FIREBASE_API_KEY without NEXT_PUBLIC_)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/firebase-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config && isValidApiKey(data.config.apiKey)) {
          dynamicConfig = data.config;
          return dynamicConfig;
        }
      }
    } catch (e) {
      // Silent fail
    }
  }

  return null;
}

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (typeof window === 'undefined') return null;

  const config = await getClientFirebaseConfig();
  if (!config || !isValidApiKey(config.apiKey)) return null;

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    return app;
  } catch (e) {
    return null;
  }
}

export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  try {
    const config = await getClientFirebaseConfig();
    if (!config || !isValidApiKey(config.apiKey)) {
      console.info('[Firebase FCM] Push notifications require FIREBASE_API_KEY configured in environment variables.');
      return null;
    }

    const appInstance = await getFirebaseApp();
    if (!appInstance) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    messaging = getMessaging(appInstance);
    const vapidKey = config.vapidKey || process.env.FIREBASE_VAPID_KEY || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey && vapidKey.length > 20 ? vapidKey : undefined,
    });

    if (token) {
      // Send token to serverless backend to subscribe device
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userAgent: navigator.userAgent }),
      });
      return token;
    }
  } catch (error: any) {
    console.warn('[Firebase FCM] Token request status:', error.message || error);
    throw error;
  }
  return null;
}

export async function listenForFCMForegroundMessages(callback: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {};
  try {
    const appInstance = await getFirebaseApp();
    if (!appInstance) return () => {};

    const msgInstance = getMessaging(appInstance);
    return onMessage(msgInstance, (payload) => {
      callback(payload);
    });
  } catch (e) {
    return () => {};
  }
}

// Named Firestore Database Initializer ('pulsenews')
let firestoreDb: any = null;

export async function getFirestoreDb(): Promise<any> {
  if (typeof window === 'undefined') return null;

  try {
    const appInstance = await getFirebaseApp();
    if (!appInstance) return null;

    if (!firestoreDb) {
      const { getFirestore } = await import('firebase/firestore');
      firestoreDb = getFirestore(appInstance, 'pulsenews');
    }
    return firestoreDb;
  } catch (e) {
    return null;
  }
}
