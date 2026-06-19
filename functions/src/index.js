import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { removeAuthUser, upsertAuthUser } from "./syncUserAuth.js";

initializeApp();

const db = getFirestore();

export const syncUserAuthCredentials = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const userId = String(request.data?.userId ?? "").trim();
  const email = String(request.data?.email ?? "").trim();
  const tempPin = String(request.data?.tempPin ?? "").trim();
  const name = String(request.data?.name ?? "").trim();
  const status = String(request.data?.status ?? "active").trim();

  return upsertAuthUser({ userId, email, tempPin, name, status });
});

export const deleteUserAuthCredentials = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const userId = String(request.data?.userId ?? "").trim();
  return removeAuthUser(userId);
});

/**
 * Keeps Firebase Auth in sync when users are written directly to Firestore (seed, admin SDK).
 */
export const syncUserAuthOnUserWrite = onDocumentWritten("users/{userId}", async (event) => {
  const userId = event.params.userId;
  const after = event.data?.after;

  if (!after?.exists) {
    await removeAuthUser(userId);
    return;
  }

  const data = after.data() ?? {};

  await upsertAuthUser({
    userId,
    email: data.email,
    tempPin: data.tempPin,
    name: data.name,
    status: data.status,
  });
});

/**
 * Privileged join-by-code handler (placeholder).
 */
export const joinByAccessCode = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const code = String(request.data?.code ?? "")
    .trim()
    .toUpperCase();

  if (!/^[A-Z0-9]{4,12}$/.test(code)) {
    throw new HttpsError("invalid-argument", "Access code format is invalid.");
  }

  const snapshot = await db
    .collection("accessCodes")
    .where("code", "==", code)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new HttpsError("not-found", "Access code is invalid.");
  }

  return { ok: true, code };
});
