import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// Cached dynamic config
let dynamicConfig: any = null;

export async function getClientFirebaseConfig() {
  if (dynamicConfig) return dynamicConfig;

  // 1. First check if bundled via NEXT_PUBLIC_ or direct env
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    dynamicConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pulsenews.firebaseapp.com',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pulsenews',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'pulsenews.appspot.com',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    };
    return dynamicConfig;
  }

  // 2. If environment variables were set without NEXT_PUBLIC_ prefix, load dynamically from /api/firebase-config
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/firebase-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config && data.config.apiKey) {
          dynamicConfig = data.config;
          return dynamicConfig;
        }
      }
    } catch (e) {
      console.warn('[Firebase] Could not fetch server config:', e);
    }
  }

  return null;
}

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (typeof window === 'undefined') return null;

  const config = await getClientFirebaseConfig();
  if (!config || !config.apiKey) return null;

  if (!getApps().length) {
    app = initializeApp(config);
  } else {
    app = getApp();
  }
  return app;
}

export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications are not supported in this browser environment.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission was not granted.');
      return null;
    }

    const appInstance = await getFirebaseApp();
    const config = await getClientFirebaseConfig();

    if (!appInstance || !config) {
      console.warn('Firebase configuration is missing or invalid.');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    messaging = getMessaging(appInstance);
    const vapidKey = config.vapidKey || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey || undefined,
    });

    if (token) {
      // Send token to our serverless backend to subscribe device
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userAgent: navigator.userAgent }),
      });
      return token;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
  return null;
}

export async function listenForFCMForegroundMessages(callback: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {};
  const appInstance = await getFirebaseApp();
  if (!appInstance) return () => {};

  try {
    messaging = getMessaging(appInstance);
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch {
    return () => {};
  }
}
