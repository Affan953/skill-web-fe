import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;

function getApp(): FirebaseApp {
  if (!app) {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getApp());
  }
  return authInstance;
}

// Named lazy-getter export: import { auth } from "@/lib/firebase"
// Initializes on first property access to avoid SSR module-evaluation errors.
const _authProxy = {} as Auth;
Object.defineProperty(_authProxy, "__proto__", {
  get() {
    return Object.getPrototypeOf(getFirebaseAuth());
  },
});
// Re-export via Proxy so every property/method is forwarded to the real Auth
export const auth: Auth = new Proxy(_authProxy, {
  get(_target, prop) {
    return (getFirebaseAuth() as unknown as Record<string | symbol, unknown>)[
      prop
    ];
  },
  set(_target, prop, value) {
    (getFirebaseAuth() as unknown as Record<string | symbol, unknown>)[prop] =
      value;
    return true;
  },
});
