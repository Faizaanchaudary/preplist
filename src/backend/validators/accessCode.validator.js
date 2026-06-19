import { createAppError } from "../core/errors.js";

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function validateAccessCode(code) {
  const normalized = String(code ?? "").trim().toUpperCase();

  if (!normalized) {
    throw createAppError(400, "Access code is required.");
  }

  if (!/^[A-Z0-9]{4,12}$/.test(normalized)) {
    throw createAppError(400, "Access code format is invalid.");
  }

  return normalized;
}

export function validateSiteCode(siteCode) {
  const normalized = String(siteCode ?? "").trim().toUpperCase().replace(/\s+/g, "");

  if (!normalized || !/^[A-Z0-9-]{2,12}$/.test(normalized)) {
    throw createAppError(400, "Site code is required (example: DT-01).");
  }

  return normalized;
}
