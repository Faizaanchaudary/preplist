import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let appInstance = null;
let authInstance = null;
let dbInstance = null;
let storageInstance = null;
let functionsInstance = null;

function ensureApp() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Add VITE_FIREBASE_* values to your .env file."
    );
  }

  if (!appInstance) {
    appInstance = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
  }

  return appInstance;
}

function createServiceProxy(getService) {
  return new Proxy(
    {},
    {
      get(_target, property) {
        const service = getService();
        const value = service[property];
        return typeof value === "function" ? value.bind(service) : value;
      },
    }
  );
}

export function getDb() {
  ensureApp();
  return dbInstance;
}

export function getStorageInstance() {
  ensureApp();
  return storageInstance;
}

export function getFunctionsInstance() {
  ensureApp();

  if (!functionsInstance) {
    functionsInstance = getFunctions(appInstance, "us-central1");
  }

  return functionsInstance;
}

export const auth = createServiceProxy(() => {
  ensureApp();
  return authInstance;
});

/** @deprecated Use getDb() for Firestore modular APIs (collection, doc, writeBatch). */
export const db = createServiceProxy(() => {
  ensureApp();
  return dbInstance;
});

export const storage = createServiceProxy(() => {
  ensureApp();
  return storageInstance;
});

export function getFirebaseApp() {
  return ensureApp();
}

export default getFirebaseApp;
