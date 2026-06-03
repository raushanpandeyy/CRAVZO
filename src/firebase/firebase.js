// Firebase loaded dynamically — stays out of vendor-core bundle.
// Only initializes when notification permission is requested.
//
// Root cause of "installations-internal is not available":
// firebase/messaging internally depends on firebase/installations being
// registered in Firebase's DI container BEFORE getMessaging() is called.
// When using dynamic imports, the order of side-effect registration is
// non-deterministic unless all three modules are imported together.
//
// Fix: import firebase/app + firebase/installations + firebase/messaging
// in a single Promise.all() so the DI container is fully populated.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

// Singletons
let _messaging = null;
let _initPromise = null;

export const getFirebaseMessaging = async () => {
  if (_messaging) return _messaging;
  if (!hasFirebaseConfig) return null;

  // Deduplicate concurrent calls — only initialize once
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      // All three MUST be imported together in one microtask batch.
      // firebase/installations registers the "installations-internal" service
      // as a module-level side effect. If it hasn't run before getMessaging()
      // is called, Firebase throws "installations-internal is not available".
      const [
        { initializeApp, getApps, getApp },
        , // firebase/installations — imported only for its side effects
        { getMessaging, isSupported },
      ] = await Promise.all([
        import("firebase/app"),
        import("firebase/installations"),
        import("firebase/messaging"),
      ]);

      if (!(await isSupported())) {
        _initPromise = null;
        return null;
      }

      // Reuse existing app in React StrictMode (double invoke)
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      _messaging = getMessaging(app);
      return _messaging;
    } catch (err) {
      _initPromise = null; // Allow retry on next call
      console.warn("Firebase messaging init failed:", err.message);
      return null;
    }
  })();

  return _initPromise;
};

export const getFirebasePublicConfig = () => ({
  ...firebaseConfig,
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
});
