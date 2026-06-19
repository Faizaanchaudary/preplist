import { getAuth } from "firebase-admin/auth";
import { HttpsError } from "firebase-functions/v2/https";
import { deriveAuthPasswordFromPin, normalizePin } from "./pinAuthPassword.js";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export async function upsertAuthUser({ userId, email, tempPin, name, status }) {
  const normalizedUserId = String(userId ?? "").trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPin = normalizePin(tempPin);
  const displayName = String(name ?? "").trim();
  const disabled = String(status ?? "active") === "disabled";

  if (!normalizedUserId || !normalizedEmail) {
    throw new HttpsError("invalid-argument", "User id and email are required.");
  }

  const auth = getAuth();
  const updates = {
    email: normalizedEmail,
    displayName: displayName || undefined,
    disabled,
  };

  if (normalizedPin) {
    updates.password = deriveAuthPasswordFromPin(normalizedPin);
  }

  try {
    await auth.getUser(normalizedUserId);
    await auth.updateUser(normalizedUserId, updates);
    return { action: "updated" };
  } catch (error) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }

    if (!normalizedPin) {
      throw new HttpsError(
        "failed-precondition",
        "A temp PIN is required before this user can sign in."
      );
    }

    await auth.createUser({
      uid: normalizedUserId,
      email: normalizedEmail,
      password: deriveAuthPasswordFromPin(normalizedPin),
      displayName: displayName || undefined,
      emailVerified: true,
      disabled,
    });

    return { action: "created" };
  }
}

export async function removeAuthUser(userId) {
  const normalizedUserId = String(userId ?? "").trim();

  if (!normalizedUserId) {
    throw new HttpsError("invalid-argument", "User id is required.");
  }

  try {
    await getAuth().deleteUser(normalizedUserId);
    return { action: "deleted" };
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      return { action: "missing" };
    }

    throw error;
  }
}
