import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** True once real Firebase config has been supplied via env vars. Lets the
 * app degrade gracefully (falling back to local-only storage) instead of
 * crashing when it's built without a Firebase project configured. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

// Firestore is the bulk of the Firebase SDK's weight, and it's only needed
// once someone is actually signed in. Loading it via a cached dynamic import
// (instead of a static one) keeps it out of the app's eager/preloaded bundle,
// so signed-out visitors only pay for `firebase/app` + `firebase/auth`.
let dbPromise: Promise<Firestore | null> | null = null;

export function getDb(): Promise<Firestore | null> {
  if (!app) return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = import('firebase/firestore').then(({ initializeFirestore, persistentLocalCache }) =>
      // Firestore's persistent local cache keeps recent reads available offline
      // and queues writes made while offline, syncing automatically once reconnected.
      initializeFirestore(app, { localCache: persistentLocalCache({}) }),
    );
  }
  return dbPromise;
}
