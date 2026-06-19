export const PIN_LENGTH = 5;

export function normalizePin(pin) {
  return String(pin ?? "").trim();
}

/**
 * Firebase Auth passwords must be 6+ characters. Staff PINs are 5 digits in the UI.
 * This mapping is shared with Cloud Functions (keep in sync).
 */
export function deriveAuthPasswordFromPin(pin) {
  const normalized = normalizePin(pin);

  if (!normalized) {
    return "";
  }

  return `PL${normalized}!`;
}

export function isValidStaffPin(pin) {
  const normalized = normalizePin(pin);
  return /^\d{4,6}$/.test(normalized);
}
