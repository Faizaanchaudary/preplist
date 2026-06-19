import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, getDb, isFirebaseConfigured } from "../config/firebase.js";
import { COLLECTIONS } from "../firestore/collections.js";

const SESSION_STORAGE_KEY = "vpl_backend_session_v1";

let cachedAuthUid = null;

function readLocalSession() {
  if (typeof window === "undefined") {
    return { userId: null, activeKitchenId: null };
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    return {
      userId: typeof parsed?.userId === "string" ? parsed.userId : null,
      activeKitchenId:
        typeof parsed?.activeKitchenId === "string" ? parsed.activeKitchenId : null,
    };
  } catch {
    return { userId: null, activeKitchenId: null };
  }
}

function writeLocalSession(payload) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures in restricted browsers.
  }
}

export function getAuthUid() {
  if (cachedAuthUid) return cachedAuthUid;
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  return readLocalSession().userId;
}

export function setAuthUid(uid) {
  cachedAuthUid = typeof uid === "string" && uid.trim() ? uid.trim() : null;
}

export function getSession() {
  const local = readLocalSession();
  const userId = getAuthUid() ?? local.userId;

  return {
    userId,
    activeKitchenId: local.activeKitchenId,
  };
}

export function setSession(payload) {
  const next = {
    userId: typeof payload?.userId === "string" ? payload.userId : null,
    activeKitchenId:
      typeof payload?.activeKitchenId === "string" ? payload.activeKitchenId : null,
  };

  setAuthUid(next.userId);
  writeLocalSession(next);

  if (isFirebaseConfigured() && next.userId) {
    void setDoc(
      doc(getDb(), COLLECTIONS.SESSIONS, next.userId),
      { activeKitchenId: next.activeKitchenId },
      { merge: true }
    );
  }

  return next;
}

export function clearSession() {
  const userId = getAuthUid();
  cachedAuthUid = null;
  writeLocalSession({ userId: null, activeKitchenId: null });

  if (isFirebaseConfigured() && userId) {
    void deleteDoc(doc(getDb(), COLLECTIONS.SESSIONS, userId)).catch(() => {});
  }
}

export function waitForAuthReady() {
  if (!isFirebaseConfigured()) {
    return Promise.resolve(null);
  }

  if (auth.currentUser) {
    cachedAuthUid = auth.currentUser.uid;
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      cachedAuthUid = user?.uid ?? null;
      resolve(user);
    });
  });
}
