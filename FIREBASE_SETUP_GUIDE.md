# 🔗 How to Link Your Firebase Database (`pulsenews`) & Enable FCM Push Alerts

This guide shows you how to connect your existing Firebase project (`pulsenews`) to PulseNews in 3 quick steps.

---

## Step 1: Get Your Firebase Web App Config (for PWA & Client)

1. Open your [Firebase Console](https://console.firebase.google.com/).
2. Select your **`pulsenews`** project.
3. Click the **Settings Gear ⚙️** (top-left) -> **Project settings**.
4. Scroll down to **"Your apps"** -> Click the **Web `</>`** icon (or select your web app if already created).
5. Copy the configuration keys:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## Step 2: Generate Web Push Certificate (VAPID Key) for FCM

1. In Firebase Console, go to **Project settings** -> **Cloud Messaging** tab.
2. Under **Web configuration** -> **Web Push certificates**, click **Generate key pair**.
3. Copy the public key (this is your `NEXT_PUBLIC_FIREBASE_VAPID_KEY`).

---

## Step 3: Add to Vercel (or `.env.local` for Local Dev)

In your **Vercel Project Settings** -> **Environment Variables** (or in `.env.local` locally), add:

```env
# Client Keys (from Firebase Web App Config)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pulsenews.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pulsenews
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pulsenews.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNx...your_generated_vapid_key...

# (Optional) Server Admin SDK Key (For sending background push notifications via Vercel Cron / GitHub Actions)
FIREBASE_PROJECT_ID=pulsenews
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@pulsenews.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

> **Where to get Admin Private Key (Optional)**:
> In Firebase Console -> **Project settings** -> **Service accounts** tab -> Click **Generate new private key**.

---

## Step 4: Verify Firestore Database Permissions

1. In Firebase Console, open **Firestore Database** (or Realtime Database).
2. PulseNews automatically saves device push tokens in the collection `fcm_subscribers`.
3. In **Firestore Rules**, ensure read/write is allowed for subscriber registration:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /fcm_subscribers/{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 📱 How to Install the PWA on Your Phone
1. Open your deployed URL on mobile (Safari on iOS or Chrome on Android).
2. **On iOS (Safari)**: Tap **Share** 📤 -> Tap **"Add to Home Screen"** 📲.
3. **On Android (Chrome)**: Tap the 3-dots menu -> Tap **"Install app"** or **"Add to Home screen"**.
4. Tap the **Bell 🔔 icon** inside the app to enable real-time market push notifications!
