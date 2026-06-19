import { httpsCallable } from "firebase/functions";
import { getFunctionsInstance, isFirebaseConfigured } from "../config/firebase.js";
import { normalizePin } from "./pinAuthPassword.js";
import { createAppError } from "../core/errors.js";

async function callSyncUserAuth(payload) {
  const callable = httpsCallable(getFunctionsInstance(), "syncUserAuthCredentials");
  await callable(payload);
}

async function callDeleteUserAuth(userId) {
  const callable = httpsCallable(getFunctionsInstance(), "deleteUserAuthCredentials");
  await callable({ userId });
}

export async function syncUserAuthCredentials(user) {
  if (!isFirebaseConfigured() || !user?.id || !user?.email) {
    return;
  }

  const tempPin = normalizePin(user.tempPin);
  if (!tempPin) {
    return;
  }

  try {
    await callSyncUserAuth({
      userId: user.id,
      email: user.email,
      tempPin,
      name: user.name ?? "",
      status: user.status ?? "active",
    });
  } catch (error) {
    throw createAppError(
      503,
      error?.message ||
        "Could not sync login credentials. Deploy Cloud Functions (syncUserAuthCredentials) and try again."
    );
  }
}

export async function syncUserAuthProfile(user) {
  if (!isFirebaseConfigured() || !user?.id || !user?.email) {
    return;
  }

  try {
    await callSyncUserAuth({
      userId: user.id,
      email: user.email,
      tempPin: normalizePin(user.tempPin),
      name: user.name ?? "",
      status: user.status ?? "active",
    });
  } catch {
    // Profile-only sync is best-effort (e.g. disabled flag) when PIN is empty.
  }
}

export async function deleteUserAuthCredentials(userId) {
  if (!isFirebaseConfigured() || !userId) {
    return;
  }

  try {
    await callDeleteUserAuth(userId);
  } catch {
    // Firestore delete already succeeded; auth cleanup can be retried via console.
  }
}
